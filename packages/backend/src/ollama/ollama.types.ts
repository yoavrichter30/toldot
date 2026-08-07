export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  format?: 'json';
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
  };
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

export interface ModelInfo {
  name: string;
  size: number;
  modified: string;
}