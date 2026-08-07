import { Module } from '@nestjs/common';
import { OllamaClient } from './ollama.client';

@Module({
  providers: [OllamaClient],
  exports: [OllamaClient],
})
export class OllamaModule {}