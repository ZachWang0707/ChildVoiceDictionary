# CONSENSUS - 对话交互逻辑重构

## 需求描述

### 核心目标
将现有的两次 LLM 调用架构简化为单次 LLM 调用，使用 `sys_prompt.txt` 作为统一的系统提示词，通过 LLM 返回的 `action` 字段驱动 UI 行为。

### 关键变更点

1. **LLM 调用简化**
   - 从：先调用 `/api/llm/understand` 做意图识别，再调用 `/api/llm/explain` 做释义生成
   - 到：单次调用 `/api/llm/chat` 统一处理

2. **系统提示词**
   - 文件位置：`api/prompts/sys_prompt_v1.txt`
   - 使用方式：作为 `system` 角色传入，不混入对话历史
   - 版本管理：文件名带 `_v1` 后缀，方便回滚

3. **对话历史管理**
   - 存储位置：前端 `localStorage`
   - 裁剪策略：保留最近 15 轮，更早的裁剪
   - 传递方式：每次调用时前端将完整历史传给后端

4. **LLM 返回格式**
   ```json
   {
     "action": "confirm_word | explain_word | ask_spell | ask_save | save_word | skip_save | chat",
     "word": "当前处理的单词（如有）",
     "speech": "朗读给孩子听的文字"
   }
   ```

5. **action 处理逻辑**
   - **作用 1**：日志留存，用于 debug 大模型对对话的理解
   - **作用 2**：指示系统除了播报 `speech` 外还需要做什么
   - **当前仅需处理**：`save_word` → 把 `word` 存入生词表
   - **执行顺序**：先判断 action 是否需要处理 → 然后播报 `speech`

6. **健壮性处理**
   - JSON 清洗：解析前先清洗 markdown 代码块标记
   - 兜底策略：解析失败时：
     - `action` 置为 `chat`
     - 将返回内容直接作为 `speech` 播报
     - 不崩溃

7. **当前单词跟踪**
   - 完全依赖 LLM 每次返回的 `word` 字段
   - 前端不需要单独维护 `currentWord` 状态

---

## 技术实现方案

### 后端改动

1. **新增 `/api/llm/chat` 接口**
   - 读取 `api/prompts/sys_prompt_v1.txt`
   - 接收：`history`（对话历史数组）、`currentInput`（当前用户输入）
   - 调用 LLM：
     - system：`sys_prompt_v1.txt` 内容
     - messages：完整对话历史 + 当前用户输入
   - 返回：`{ action, word, speech }`

2. **修改 `arkLlm.ts`**
   - 新增 `chat` 方法
   - 实现对话历史裁剪（保留最近 15 轮）
   - 实现 JSON 清洗和健壮解析

3. **读取系统提示词**
   - 从 `api/prompts/sys_prompt_v1.txt` 读取

### 前端改动

1. **修改 `api.ts`**
   - 新增 `llmService.chat(history, currentInput)` 方法
   - 移除/废弃 `understandIntent` 和 `explain` 方法

2. **修改 `useChatHistory.ts`**
   - 支持 localStorage 持久化
   - 限制历史长度（可选，前端也可以只负责存储）

3. **重写 `HomePage.tsx` 逻辑**
   - 移除复杂的状态机和 intent 判断
   - 简化为：
     1. 用户语音输入 → ASR 转文字
     2. 调用 `llmService.chat(history, text)`
     3. 拿到响应：
        - 先判断 action：`action === 'save_word'` 则加入生词表
        - 然后播报 `speech`
        - 更新对话历史

4. **打断机制保持不变**
   - 用户按住说话按钮时，立即停止播报
   - 继续执行后续逻辑

5. **实现新的 UI 布局**
   - 右上角：生词表按钮（线框图标）
   - 页面中间靠上："语音英汉词典"标题
   - 页面中间：大大的圆形发言按钮（麦克风图标）
   - 按钮下方：debug 信息区域（可选显示）

6. **实现按钮颜色状态机**
   定义按钮状态：
   - `idle`: 蓝色
   - `preparing`: 灰色（按住后 + 准备好前 0.5 秒）
   - `recording`: 绿色（准备好后 + 0.5 秒）
   - `processing`: 灰色（松手后、处理中、播报前 0.5 秒）
   - `interruptible`: 蓝色（播报 0.5 秒后，可打断）

   状态切换逻辑：
   - 用户按住按钮 → 立即切换到 `preparing`，开始 0.5 秒定时器
   - 0.5 秒后 → 切换到 `recording`
   - 用户松手 → 切换到 `processing`
   - 开始播报后 → 0.5 秒定时器，到时切换到 `interruptible`
   - 在 `interruptible` 状态下按住按钮 → 立即停止播报，回到 `preparing`

7. **LLM action 与按钮状态解耦**
   - LLM 返回的 action 只处理业务逻辑（如 save_word）
   - 不影响按钮颜色状态

---

## 验收标准

### 功能验收
1. ✅ 单次 LLM 调用即可完成完整交互
2. ✅ `sys_prompt_v1.txt` 正确加载为 system 提示词
3. ✅ 对话历史正确传递和裁剪（最近 15 轮）
4. ✅ JSON 解析健壮，失败时有兜底
5. ✅ `action=save_word` 时正确存入生词表
6. ✅ `speech` 正常播报，可被打断
7. ✅ 对话历史持久化到 localStorage，刷新不丢失

### UI 验收
1. ✅ 页面布局符合要求（右上角生词表按钮、中间标题、中间大按钮、下方 debug 区域）
2. ✅ 按钮颜色状态正确：
   - idle：蓝色
   - preparing：灰色
   - recording：绿色
   - processing：灰色
   - interruptible：蓝色
3. ✅ 定时器逻辑正确：
   - preparing → recording：0.5 秒
   - 开始播报 → interruptible：0.5 秒
4. ✅ 打断逻辑正确：在 interruptible 状态下按住按钮，立即停止播报并回到 preparing
5. ✅ LLM action 与按钮状态完全解耦

---

## 边界限制

1. 不修改现有 ASR、TTS 接口
2. 不修改生词表存储逻辑（localStorage）
3. 不接入数据库
