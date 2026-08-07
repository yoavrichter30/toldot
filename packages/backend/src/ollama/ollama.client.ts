import { Injectable, Logger } from '@nestjs/common';
import { OllamaChatRequest, OllamaResponse, ModelInfo } from './ollama.types';

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
  }

  async chat(request: OllamaChatRequest): Promise<OllamaResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        format: request.format,
        stream: false,
        options: request.options || { temperature: 0.7 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Ollama error: ${response.status} ${text}`);
      throw new Error(`Ollama returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data as OllamaResponse;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models || [];
  }
}