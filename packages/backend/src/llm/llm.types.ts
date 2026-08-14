export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatRequest {
  model: string;
  messages: LLMMessage[];
  /** When set, the provider is instructed to return a JSON object. */
  format?: 'json';
  temperature?: number;
}

export interface LLMChatResponse {
  content: string;
}
