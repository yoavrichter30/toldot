import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { DatabaseService } from './database.service';
import { EraModule } from '../era/era.module';

@Module({
  imports: [EraModule],
  providers: [SessionService, DatabaseService],
  exports: [SessionService],
})
export class SessionModule {}
