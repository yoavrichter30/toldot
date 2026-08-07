import { Module } from '@nestjs/common';
import { ValidationEngineService } from './validation-engine.service';

@Module({
  providers: [ValidationEngineService],
  exports: [ValidationEngineService],
})
export class ValidationModule {}