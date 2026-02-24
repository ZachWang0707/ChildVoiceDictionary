# DESIGN - 对话交互逻辑重构

## 整体架构图

```mermaid
graph TD
    User[用户] -->|按住说话| HomePage[HomePage]
    HomePage -->|录音| useAudioRecorder[useAudioRecorder]
    useAudioRecorder -->|audioBlob| HomePage
    HomePage -->|调用| ASR[asrService.recognize]
    ASR -->|text| HomePage
    HomePage -->|获取| useChatHistory[useChatHistory]
    useChatHistory -->|history| HomePage
    HomePage -->|调用| LLM[llmService.chat]
    LLM -->|{action, word, speech}| HomePage
    HomePage -->|action=save_word| useVocabulary[useVocabulary.addWord]
    HomePage -->|speech| useAudioPlayer[useAudioPlayer.playAudio]
    HomePage -->|更新| useChatHistory
    HomePage -->|渲染| UI[UI 组件]
    UI -->|按钮颜色| ButtonStateMachine[按钮状态机]
```

---

## 分层设计和核心组件

### 后端分层

```mermaid
graph LR
    API[api/llm/chat.ts] -->|调用| ArkLLM[api/lib/arkLlm.ts]
    ArkLLM -->|读取| SysPrompt[api/prompts/sys_prompt_v1.txt]
    ArkLLM -->|调用| VolcanoAPI[火山方舟 API]
    ArkLLM -->|返回| CleanedResponse[清洗后的 JSON]
```

**核心后端组件**：
1. `api/llm/chat.ts`：新的 Serverless Function
2. `api/lib/arkLlm.ts`：更新后的 LLM 库，新增 `chat` 方法
3. `api/prompts/sys_prompt_v1.txt`：系统提示词文件

### 前端分层

```mermaid
graph LR
    HomePage[HomePage.tsx] -->|使用| Hooks[自定义 Hooks]
    Hooks -->|useChatHistory| ChatHistoryHook[useChatHistory.ts]
    Hooks -->|useAudioRecorder| AudioRecorderHook[useAudioRecorder.ts]
    Hooks -->|useAudioPlayer| AudioPlayerHook[useAudioPlayer.ts]
    Hooks -->|useVocabulary| VocabularyHook[useVocabulary.ts]
    HomePage -->|调用| APIService[api.ts]
    HomePage -->|渲染| Components[组件]
    Components -->|RecordButton| RecordButton[RecordButton.tsx]
    Components -->|StatusDisplay| StatusDisplay[StatusDisplay.tsx]
```

**核心前端组件**：
1. `HomePage.tsx`：重写的主页面
2. `api.ts`：更新的 API 服务
3. `useChatHistory.ts`：支持 localStorage 持久化
4. `RecordButton.tsx`：更新的按钮组件，支持新的颜色状态
5. 按钮状态机：在 HomePage 内部实现

---

## 模块依赖关系图

```mermaid
graph LR
    A[api/llm/chat.ts] --> B[api/lib/arkLlm.ts]
    B --> C[api/prompts/sys_prompt_v1.txt]
    D[src/services/api.ts] -->|调用| A
    E[src/pages/HomePage.tsx] -->|使用| D
    E -->|使用| F[src/hooks/useChatHistory.ts]
    E -->|使用| G[src/hooks/useAudioRecorder.ts]
    E -->|使用| H[src/hooks/useAudioPlayer.ts]
    E -->|使用| I[src/hooks/useVocabulary.ts]
    E -->|渲染| J[src/components/RecordButton.tsx]
```

---

## 接口契约定义

### 后端接口：POST /api/llm/chat

**请求**：
```typescript
{
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  currentInput: string;
}
```

**响应**：
```typescript
{
  action: 'confirm_word' | 'explain_word' | 'ask_spell' | 'ask_save' | 'save_word' | 'skip_save' | 'chat';
  word?: string;
  speech: string;
}
```

---

## 数据流向图

### 完整交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant HP as HomePage
    participant AR as useAudioRecorder
    participant ASR as asrService
    participant CH as useChatHistory
    participant LLM as llmService
    participant AP as useAudioPlayer
    participant VC as useVocabulary

    User->>HP: 按住按钮
    HP->>HP: 切换到 preparing 状态
    Note over HP: 0.5秒定时器
    HP->>HP: 切换到 recording 状态
    HP->>AR: startRecording()
    AR->>HP: 开始录音

    User->>HP: 松开按钮
    HP->>AR: stopRecording()
    AR->>HP: audioBlob
    HP->>HP: 切换到 processing 状态

    HP->>ASR: recognize(audioBlob)
    ASR->>HP: text

    HP->>CH: getHistory()
    CH->>HP: history

    HP->>LLM: chat(history, text)
    LLM->>HP: {action, word, speech}

    alt action=save_word
        HP->>VC: addWord(word)
    end

    HP->>AP: playAudio(speech)
    HP->>HP: 开始播放 0.5秒后<br>切换到 interruptible

    alt User在interruptible状态下按住按钮
        HP->>AP: stopAudio()
        HP->>HP: 回到 preparing 状态
    end

    AP->>HP: 播放完成
    HP->>HP: 切换到 idle 状态
    HP->>CH: addUserMessage(text)
    HP->>CH: addAssistantMessage(speech)
```

---

## 按钮状态机

### 状态定义

| 状态 | 颜色 | 说明 |
|------|------|------|
| `idle` | 蓝色 | 空闲，等待用户输入 |
| `preparing` | 灰色 | 按住后，准备录音中（0.5秒） |
| `recording` | 绿色 | 正在录音 |
| `processing` | 灰色 | 松手后，处理中、等待响应、播报前 |
| `interruptible` | 蓝色 | 播报中，可打断 |

### 状态转换图

```mermaid
stateDiagram-v2
    [*] --> idle: 初始化

    idle --> preparing: 用户按住按钮
    preparing --> recording: 0.5秒定时器
    recording --> processing: 用户松开按钮
    processing --> interruptible: 开始播报 + 0.5秒

    interruptible --> idle: 播放完成
    interruptible --> preparing: 用户按住按钮<br>(立即停止播报)

    idle: 蓝色按钮
    preparing: 灰色按钮
    recording: 绿色按钮
    processing: 灰色按钮
    interruptible: 蓝色按钮(可打断)
```

---

## 异常处理策略

### LLM JSON 解析异常

```typescript
function cleanAndParseLLMResponse(rawText: string): LLMChatResponse {
  // 1. 清洗 markdown 代码块标记
  let cleaned = rawText
    .replace(/^```json\s*/, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 2. 兜底策略
    return {
      action: 'chat',
      speech: cleaned,
    };
  }
}
```

### 对话历史裁剪策略

```typescript
function trimHistory(history: HistoryMessage[]): HistoryMessage[] {
  const MAX_HISTORY = 15;
  if (history.length <= MAX_HISTORY) {
    return history;
  }
  // 保留最近 15 轮
  return history.slice(-MAX_HISTORY);
}
```
