import { Module } from '@nestjs/common';
import { DMOrchestratorService } from './dm-orchestrator.service';
import { OllamaModule } from '../ollama/ollama.module';
import { EraModule } from '../era/era.module';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [OllamaModule, EraModule, ValidationModule],
  providers: [DMOrchestratorService],
  exports: [DMOrchestratorService],
})
export class DMModule {}