import { Module } from '@nestjs/common';
import { EraService } from './era.service';
import { EraValidatorService } from './era-validator.service';

@Module({
  providers: [EraService, EraValidatorService],
  exports: [EraService, EraValidatorService],
})
export class EraModule {}