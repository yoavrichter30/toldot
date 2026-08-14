import { Module } from '@nestjs/common';
import { DMOrchestratorService } from './dm-orchestrator.service';
import { LLMModule } from '../llm/llm.module';
import { EraModule } from '../era/era.module';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [LLMModule, EraModule, ValidationModule],
  providers: [DMOrchestratorService],
  exports: [DMOrchestratorService],
})
export class DMModule {}