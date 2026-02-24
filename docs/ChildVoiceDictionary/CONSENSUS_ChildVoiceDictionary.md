# CONSENSUS - 儿童语音英语查词应用（意图驱动架构）

---

## 明确的需求描述

### 项目概述
这是一个面向7岁中国儿童的英语查词 Web 应用，采用**意图驱动架构（Intent-Driven）**，以语音交互为主，尽量减少屏幕操作。不再使用传统的状态机，改为 LLM 理解用户意图，实现灵活的交互体验。

### 核心功能（意图驱动）

#### 交互理念
- **不再使用死板的状态机**
- **LLM 负责理解用户每一句话的意图**
- **用户可以以任何方式表达意图**
- **支持随时打断播报**

#### 用户可能的输入类型
1. **直接说单词**：如 "camping"
2. **直接说拼写**：如 "C A M P I N G"
3. **带上下文的话语**：如 "我有一个单词不认识，你可以告诉我是什么意思么？这个词是 camping"
4. **直接要求加词**：如 "我想往生词表里加一个词，可以么？这个词是 XXX"
5. **回答问题**：如 "要"、"不要"、"好的"、"可以"
6. **无关的聊天**：如 "你好"、"今天天气真好"

#### 系统响应逻辑
1. **识别到单词（无论读或拼写）**：提取单词，找用户确认
2. **识别到回答问题**：顺着之前的逻辑继续
3. **确认单词后**：给出释义（读音、词性、含义、举例），询问是否加入生词表
4. **识别到无关内容**：回应两句，然后把主题拉回查词

#### 打断机制
- 用户按住说话按钮时，立即停止当前播报
- 逻辑上视为播报已完成
- 用户可以随时打断

#### 释义内容（完整）
包含以下要素：
1. **读音**：单词的标准发音
2. **词性**：如名词、动词等
3. **含义**：简洁的中文解释
4. **举例**：一个简短、利于孩子理解的例句

#### 生词表功能
- 存储方式：localStorage（前端）
- 功能：查看单词列表（第一版）
- 入口：右上角小按钮

#### 后端功能
- 阿里云 ASR 对接（HTTP RESTful API）
- 火山引擎 TTS 对接（HTTP）
- 火山方舟 LLM 对接（HTTP）- 用于意图理解和单词释义

#### LLM 双重用途
1. **意图理解**：理解用户每一句话的意图，提取关键信息
2. **单词释义**：生成单词的详细解释

---

## 验收标准

### 功能验收
- [ ] 前端能够正常录音
- [ ] 用户按住按钮时能够立即停止播报
- [ ] 后端能够调用阿里云 ASR 识别语音
- [ ] 后端能够调用火山 TTS 合成语音
- [ ] 后端能够调用火山方舟 LLM 理解意图
- [ ] 后端能够调用火山方舟 LLM 获取单词释义
- [ ] 完整的意图驱动交互流程能够正常运行
- [ ] 生词表能够正确存储和读取（localStorage）
- [ ] 页面路由能够正常切换

### 技术验收
- [ ] 前端使用 React + Vite 构建
- [ ] 后端使用 Vercel Serverless Functions（Node.js）
- [ ] API Key 通过环境变量注入
- [ ] 可以正常部署到 Vercel

---

## 技术实现方案

### 技术栈
- **前端**：React 18+ + Vite
- **后端**：Vercel Serverless Functions（Node.js）
- **路由**：React Router v6
- **样式**：原生 CSS
- **部署**：Vercel
- **数据存储**：localStorage（生词表）
- **LLM**：火山方舟豆包大模型（意图理解 + 单词释义）

### 服务配置

#### ASR（语音识别）
- 服务：阿里云智能语音交互
- 模式：一句话识别
- 接口：RESTful API（HTTPS POST）
- 音频时长：≤ 60 秒
- 服务地址：https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr
- 需要获取：AppKey、Token

#### TTS（语音合成）
- 服务：豆包语音服务
- 接口：HTTP 接口
- App ID：7846007555
- Access Token：L79pzr-Lftlsvuy81L-WKBxLMI8xVdgs
- 音色：待确认（推荐大模型音色，使用 V3 接口）

#### LLM（大语言模型）- 意图理解
- 服务：火山方舟
- 接口：HTTP（OpenAI 兼容）
- Base URL：https://ark.cn-beijing.volces.com/api/v3
- API Key：4784dfcc-6452-487d-9c6e-d6cca17a11d1
- Model ID：doubao-1-5-pro-32k-250115
- Endpoint ID：ep-m-20260222212428-82f4t
- System Prompt（意图理解）：
```
你是一个儿童英语词典的意图理解助手。
你的任务是理解用户的语音输入，识别用户的意图，并提取关键信息。

用户可能的意图包括：
1. query_word - 用户想查询某个单词
2. confirm_yes - 用户确认（回答"是"、"对"、"是的"等）
3. confirm_no - 用户否认（回答"不是"、"不对"、"no"等）
4. add_to_vocabulary - 用户想把某个词加入生词表
5. answer_add_yes - 用户同意加入生词表
6. answer_add_no - 用户不同意加入生词表
7. chat - 用户说的话和查词无关，是闲聊
8. unclear - 意图不明确

请以 JSON 格式返回结果，格式如下：
{
  "intent": "query_word" | "confirm_yes" | "confirm_no" | "add_to_vocabulary" | "answer_add_yes" | "answer_add_no" | "chat" | "unclear",
  "word": "camping", // 提取到的单词（如果有）
  "spelling": "CAMPING", // 提取到的拼写（如果有）
  "needs_confirmation": true, // 是否需要向用户确认单词
  "response": "好的，我确认一下，你是想说 camping 吗？" // 系统要说的话
}

注意：
- 如果用户直接说单词或拼写，且意图明确，needs_confirmation 设为 true
- 如果用户是在回答之前的问题，根据上下文判断 intent
- 如果用户的话和查词无关，intent 设为 chat，response 回应两句然后把主题拉回查词
```

#### LLM（大语言模型）- 单词释义
- 服务：火山方舟
- 接口：HTTP（OpenAI 兼容）
- Base URL：https://ark.cn-beijing.volces.com/api/v3
- API Key：4784dfcc-6452-487d-9c6e-d6cca17a11d1
- Model ID：doubao-1-5-pro-32k-250115
- Endpoint ID：ep-m-20260222212428-82f4t
- System Prompt（单词释义）：
```
你是一个儿童英语词典助手，用户是一个7岁的中国孩子。
请用简洁、口语化的中文解释英语单词含义。

返回格式（JSON）：
{
  "word": "camping",
  "pronunciation": " camping", // 读音（用中文或拼音标注）
  "partOfSpeech": "名词",
  "meaning": "露营，就是在野外搭帐篷睡觉、玩耍的活动",
  "example": "我们周末去公园露营吧。"
}

要求：
- 读音：用简单的方式标注，让孩子能读出来
- 词性：用中文，如"名词"、"动词"、"形容词"
- 含义：简洁、口语化，2-3句话以内
- 举例：简短、贴近孩子生活的例句
```

### 项目结构
```
ChildVoiceDictionary/
├── src/                          # 前端代码
│   ├── components/               # React 组件
│   ├── pages/                    # 页面组件
│   ├── hooks/                    # 自定义 Hooks
│   ├── utils/                    # 工具函数
│   ├── services/                 # 后端 API 调用
│   ├── App.tsx
│   └── main.tsx
├── api/                          # 后端代码（Vercel Serverless Functions）
│   ├── asr.ts                    # ASR 接口
│   ├── tts.ts                    # TTS 接口
│   ├── llm/
│   │   ├── understand.ts         # 意图理解接口
│   │   └── explain.ts            # 单词释义接口
│   └── lib/
│       ├── aliyun-asr.ts         # 阿里云 ASR 封装
│       ├── volcengine-tts.ts    # 豆包 TTS 封装
│       └── ark-llm.ts            # 火山方舟封装
├── .env.local                    # 本地环境变量（不提交）
├── .env.example                  # 环境变量模板
├── vercel.json                   # Vercel 配置
└── package.json
```

### 后端 API 接口
```
POST /api/asr                    # 语音识别
POST /api/tts                    # 语音合成
POST /api/llm/understand         # 意图理解
POST /api/llm/explain            # 获取单词释义
```

### 环境变量
```env
# 前端
VITE_API_BASE_URL=/api

# 后端
ALIYUN_NLS_APP_KEY=
ALIYUN_NLS_TOKEN=

DOUBAO_VOICE_APP_ID=7846007555
DOUBAO_VOICE_ACCESS_TOKEN=L79pzr-Lftlsvuy81L-WKBxLMI8xVdgs
DOUBAO_VOICE_SECRET_KEY=RGmTMkXhfEryox9BwwaHs-U43ZatQPrd
DOUBAO_TTS_VOICE_TYPE=zh_female_qingxin

ARK_API_KEY=4784dfcc-6452-487d-9c6e-d6cca17a11d1
ARK_MODEL_ID=doubao-1-5-pro-32k-250115
ARK_ENDPOINT_ID=ep-m-20260222212428-82f4t
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

---

## 技术约束和集成方案

### 约束条件
1. **API Key 安全**：必须通过环境变量注入
2. **Vercel Serverless Functions**：后端代码必须符合 Vercel 规范
3. **CORS**：需要配置 Vercel 允许跨域
4. **第一版不使用数据库**：生词表用 localStorage
5. **LLM 必须返回 JSON**：便于前端解析

### 集成方案
- 前端通过 `/api/*` 调用后端 Serverless Functions
- 后端封装所有 API 调用（ASR、TTS、LLM 意图理解、LLM 释义）
- 前端维护对话历史，传给 LLM 用于上下文理解
- 生词表存储到 localStorage
- 打断机制：前端检测用户按下按钮时立即停止音频播放

---

## 任务边界限制

### 包含
- 前端初始化（React + Vite）
- 后端初始化（Vercel Serverless Functions）
- 后端对接阿里云 ASR（HTTP RESTful API）
- 后端对接火山 TTS
- 后端对接火山方舟 LLM（意图理解 + 释义）
- **意图驱动的交互架构**（新）
- **用户打断机制**（新）
- **完整释义（读音+词性+含义+举例）**（新）
- 前端语音交互流程
- 前端基础 UI
- 环境变量配置
- React Router 路由
- 生词表功能（localStorage）

### 不包含（第一版）
- 数据库（Turso/SQLite 等）
- 完整的交互数据记录
- 用户登录/注册
- 单词复习功能
- 生词表编辑、删除
- 国际音标显示
- 复杂动画
- 单元测试

---

## 关键决策点确认

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 后端技术栈 | Node.js + Vercel Serverless Functions | 无需运维，Vercel 原生支持 |
| 数据库 | 第一版不使用 | 简化 MVP，快速验证 |
| 生词表存储 | localStorage | 第一版简化，第二版再加数据库 |
| 部署方式 | Vercel 前端 + Vercel Serverless Functions | 统一部署管理 |
| 架构模式 | 意图驱动（Intent-Driven） | LLM 理解用户意图，不再使用状态机 |
| LLM 用途 | 意图理解 + 单词释义 | 双重用途 |
| 打断机制 | 前端实现（按下按钮即停止） | 用户体验优先 |
| 释义内容 | 读音+词性+含义+举例 | 完整的单词解释 |
| ASR 方案 | 阿里云 HTTP RESTful API | 简单可靠 |

---

## 风险与应对

| 风险 | 应对方案 |
|------|----------|
| LLM 返回格式不正确 | 加入容错机制，失败时重试或提示用户 |
| Vercel Serverless Functions 冷启动 | 合理设置函数配置，后续可考虑付费方案 |
| 用户打断频繁导致体验不佳 | 优化音频停止逻辑，确保响应及时 |
