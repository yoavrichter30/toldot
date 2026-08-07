import { Test, TestingModule } from '@nestjs/testing';
import { OllamaClient } from './ollama.client';

describe('OllamaClient', () => {
  let client: OllamaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OllamaClient],
    }).compile();
    client = module.get<OllamaClient>(OllamaClient);
  });

  it('should ping Ollama', async () => {
    const result = await client.ping();
    // If Ollama is running, expect true; if not, expect false (no crash)
    expect(typeof result).toBe('boolean');
  });

  it('should list models', async () => {
    const models = await client.listModels();
    expect(Array.isArray(models)).toBe(true);
  });

  it('should return a chat response', async () => {
    const response = await client.chat({
      model: 'qwen3.5:9b',
      messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
      format: 'json',
    });
    expect(response.message).toBeDefined();
    expect(response.message.content).toBeDefined();
  }, 120000);
});