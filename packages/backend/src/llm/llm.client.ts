import { Injectable, Logger } from '@nestjs/common';
import { LLMChatRequest, LLMChatResponse } from './llm.types';

/**
 * Thin client for OpenRouter's OpenAI-compatible chat completions endpoint.
 * Requires OPENROUTER_API_KEY in the environment.
 */
@Injectable()
export class LLMClient {
  private readonly logger = new Logger(LLMClient.name);
  private readonly baseUrl = 'https://openrouter.ai/api/v1';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set. Add it to your environment before starting the server.');
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
    };
    if (request.format === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`OpenRouter error: ${response.status} ${text.slice(0, 400)}`);
      throw new Error(`OpenRouter returned ${response.status}: ${text.slice(0, 400)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      this.logger.error('OpenRouter returned no message content');
      throw new Error('OpenRouter returned no message content');
    }
    return { content };
  }
}
