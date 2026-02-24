export interface WordExplanation {
  word: string;
  partOfSpeech: string;
  meaning: string;
  pronunciation: string;
}

export interface ASRRequest {
  audio: string;
}

export interface ASRResponse {
  text: string;
}

export interface TTSRequest {
  text: string;
  voice_type?: string;
}

export interface TTSResponse {
  audio: string;
}

export interface LLMExplainRequest {
  word: string;
}

export interface LLMExplainResponse {
  explanation: WordExplanation;
}
