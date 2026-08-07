import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { EraModule } from '../era/era.module';
import { SessionModule } from '../session/session.module';
import { DMModule } from '../dm/dm.module';

@Module({
  imports: [EraModule, SessionModule, DMModule],
  controllers: [GameController],
})
export class GameModule {}
