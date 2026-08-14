import { Module } from '@nestjs/common';
import { LLMClient } from './llm.client';

@Module({
  providers: [LLMClient],
  exports: [LLMClient],
})
export class LLMModule {}
