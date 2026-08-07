import { Module } from '@nestjs/common';
import { EraModule } from './era/era.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [EraModule, SessionModule],
})
export class AppModule {}
