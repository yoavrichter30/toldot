import { Module } from '@nestjs/common';
import { EraModule } from './era/era.module';
import { SessionModule } from './session/session.module';
import { OllamaModule } from './ollama/ollama.module';
import { ValidationModule } from './validation/validation.module';
import { DMModule } from './dm/dm.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [EraModule, SessionModule, OllamaModule, ValidationModule, DMModule, GameModule],
})
export class AppModule {}
