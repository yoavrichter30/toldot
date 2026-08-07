import { Module } from '@nestjs/common';
import { EraModule } from './era/era.module';
import { SessionModule } from './session/session.module';
import { OllamaModule } from './ollama/ollama.module';

@Module({
  imports: [EraModule, SessionModule, OllamaModule],
})
export class AppModule {}
