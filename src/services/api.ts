const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntentResult {
  intent: 'query_word' | 'confirm_yes' | 'confirm_no' | 'add_to_vocabulary' | 'answer_add_yes' | 'answer_add_no' | 'chat' | 'unclear';
  word?: string;
  spelling?: string;
  needs_confirmation?: boolean;
  response: string;
}

export interface LLMChatResponse {
  action: 'confirm_word' | 'explain_word' | 'ask_spell' | 'ask_save' | 'save_word' | 'skip_save' | 'chat';
  word?: string;
  speech: string;
}

export interface WordExplanation {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

export interface ASRResponse {
  text: string;
}

export interface TTSResponse {
  audio: string;
}

export const asrService = {
  async recognize(audioBlob: Blob): Promise<string> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const response = await fetch(`${API_BASE_URL}/asr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ASR error response:', errorText);
      throw new Error('ASR failed');
    }

    const data: ASRResponse = await response.json();
    return data.text;
  },
};

export const ttsService = {
  async synthesize(text: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('TTS failed');
    }

    const data: TTSResponse = await response.json();
    const audioBytes = atob(data.audio);
    const byteArray = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      byteArray[i] = audioBytes.charCodeAt(i);
    }
    return new Blob([byteArray], { type: 'audio/mpeg' });
  },
};

export const llmService = {
  async understandIntent(history: HistoryMessage[], currentInput: string): Promise<IntentResult> {
    const response = await fetch(`${API_BASE_URL}/llm/understand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history, currentInput }),
    });

    if (!response.ok) {
      throw new Error('LLM understand failed');
    }

    const data = await response.json();
    return data;
  },

  async explain(word: string): Promise<WordExplanation> {
    const response = await fetch(`${API_BASE_URL}/llm/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      throw new Error('LLM explain failed');
    }

    const data = await response.json();
    return data.explanation;
  },

  async chat(history: HistoryMessage[], currentInput: string): Promise<LLMChatResponse> {
    const response = await fetch(`${API_BASE_URL}/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history, currentInput }),
    });

    if (!response.ok) {
      throw new Error('LLM chat failed');
    }

    const data = await response.json();
    return data;
  },
};
