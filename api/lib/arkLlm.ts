interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * 单词释义（完整版本）
 */
export interface WordExplanation {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

/**
 * 意图理解结果
 */
export interface IntentResult {
  intent: 'query_word' | 'confirm_yes' | 'confirm_no' | 'add_to_vocabulary' | 'answer_add_yes' | 'answer_add_no' | 'chat' | 'unclear';
  word?: string;
  spelling?: string;
  needs_confirmation?: boolean;
  response: string;
}

/**
 * 对话历史（前端传来的格式）
 */
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * LLM Chat 响应
 */
export interface LLMChatResponse {
  action: 'confirm_word' | 'explain_word' | 'ask_spell' | 'ask_save' | 'save_word' | 'skip_save' | 'chat';
  word?: string;
  speech: string;
}

/**
 * 意图理解的 System Prompt
 */
const INTENT_SYSTEM_PROMPT = `你是一个儿童英语词典的意图理解助手。
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
  "intent": "query_word",
  "word": "camping",
  "spelling": "CAMPING",
  "needs_confirmation": true,
  "response": "好的，我确认一下，你是想说 camping 吗？"
}

注意：
- 如果用户直接说单词或拼写，且意图明确，needs_confirmation 设为 true
- 如果用户是在回答之前的问题，根据上下文判断 intent
- 如果用户的话和查词无关，intent 设为 chat，response 回应两句然后把主题拉回查词`;

/**
 * 单词释义的 System Prompt（完整版本）
 */
const EXPLANATION_SYSTEM_PROMPT = `你是一个儿童英语词典助手，用户是一个7岁的中国孩子。
请用简洁、口语化的中文解释英语单词含义。

返回格式（JSON）：
{
  "word": "camping",
  "pronunciation": " camping",
  "partOfSpeech": "名词",
  "meaning": "露营，就是在野外搭帐篷睡觉、玩耍的活动",
  "example": "我们周末去公园露营吧。"
}

要求：
- 读音：用简单的方式标注，让孩子能读出来
- 词性：用中文，如"名词"、"动词"、"形容词"
- 含义：简洁、口语化，2-3句话以内
- 举例：简短、贴近孩子生活的例句`;

export class ArkLLM {
  private apiKey: string;
  private baseUrl: string;
  private endpointId: string;

  constructor(apiKey: string, baseUrl: string, endpointId: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.endpointId = endpointId;
  }

  /**
   * 理解用户意图
   */
  async understandIntent(history: HistoryMessage[], currentInput: string): Promise<IntentResult> {
    console.log(`ArkLLM: understandIntent called`);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: INTENT_SYSTEM_PROMPT },
    ];

    history.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    messages.push({ role: 'user', content: currentInput });

    const response = await this.chat(messages, 1000);
    console.log(`[LLM Intent] Raw response:`, response.substring(0, 500));

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'unclear',
          word: parsed.word,
          spelling: parsed.spelling,
          needs_confirmation: parsed.needs_confirmation,
          response: parsed.response || '我有点迷糊了，请再说一遍',
        };
      }
    } catch (error) {
      console.log('Failed to parse LLM intent response as JSON');
    }
    
    return {
      intent: 'unclear',
      response: '我有点迷糊了，请再说一遍',
    };
  }

  /**
   * 获取单词释义（完整版本）
   */
  async explain(word: string): Promise<WordExplanation> {
    console.log(`ArkLLM: explain called for word: ${word}`);
    
    const messages = [
      { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
      { role: 'user', content: `请解释单词：${word}` },
    ];

    const response = await this.chat(messages, 800);
    console.log(`[LLM Explanation] Raw response:`, response.substring(0, 500));

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          word,
          pronunciation: parsed.pronunciation || word,
          partOfSpeech: parsed.partOfSpeech || '未知',
          meaning: parsed.meaning || response,
          example: parsed.example || '',
        };
      }
    } catch (error) {
      console.log('Failed to parse LLM explanation response as JSON');
    }
    
    return {
      word,
      pronunciation: word,
      partOfSpeech: '未知',
      meaning: response,
      example: '',
    };
  }

  /**
   * 对话交互（新架构）
   * @param systemPrompt 系统提示词
   * @param history 对话历史
   * @param currentInput 当前用户输入
   */
  async chat(systemPrompt: string, history: HistoryMessage[], currentInput: string): Promise<LLMChatResponse> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    const MAX_HISTORY = 15;
    const trimmedHistory = history.slice(-MAX_HISTORY);
    
    trimmedHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    messages.push({ role: 'user', content: currentInput });

    const response = await this.callChatAPI(messages, 1000);
    console.log(`[LLM Chat] Raw response: ${response.substring(0, 500)}`);

    const cleaned = this.cleanAndParseLLMResponse(response);
    return cleaned;
  }

  /**
   * 清洗和解析 LLM 响应
   */
  private cleanAndParseLLMResponse(rawText: string): LLMChatResponse {
    let cleaned = rawText
      .replace(/^```json\s*/, '')
      .replace(/```$/, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        action: parsed.action || 'chat',
        word: parsed.word,
        speech: parsed.speech || cleaned,
      };
    } catch (error) {
      return {
        action: 'chat',
        speech: cleaned,
      };
    }
  }

  /**
   * 调用 Chat API（重命名原有的私有方法）
   */
  private async callChatAPI(messages: ChatMessage[], maxTokens: number = 500): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const requestBody: ChatCompletionRequest = {
      model: this.endpointId,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM] API error: ${response.status}`, errorText);
      throw new Error(`LLM API failed: ${response.status} - ${errorText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    const content = data.choices[0].message.content;
    
    return content;
  }
}
