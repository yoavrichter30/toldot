import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { EraModule } from '../era/era.module';
import { SessionModule } from '../session/session.module';
import { DatabaseService } from '../session/database.service';
import { DMModule } from '../dm/dm.module';
import { LLMClient } from '../llm/llm.client';

describe('GameController', () => {
  let controller: GameController;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EraModule, SessionModule, DMModule],
      controllers: [GameController],
    })
      .overrideProvider(LLMClient)
      .useValue({
        chat: jest.fn().mockResolvedValue({
          content: JSON.stringify({ narration: 'Test', proposed_effects: [], spawned_events: [], historical_notes: [], dm_questions: [] }),
        }),
      })
      .overrideProvider(DatabaseService)
      .useFactory({
        factory: () => new DatabaseService(':memory:'),
      })
      .compile();
    await module.init();
    controller = module.get<GameController>(GameController);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(() => {
    dbService.database.close();
  });

  it('should list eras', () => {
    const result = controller.listEras();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('1904-second-aliyah');
  });

  it('should create a session', () => {
    const result = controller.createSession({ eraId: '1904-second-aliyah' });
    expect(result.session.id).toMatch(/^sess_/);
  });
});
