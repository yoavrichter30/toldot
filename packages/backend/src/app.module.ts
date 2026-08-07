import { Module } from '@nestjs/common';
import { EraModule } from './era/era.module';

@Module({
  imports: [EraModule],
})
export class AppModule {}
