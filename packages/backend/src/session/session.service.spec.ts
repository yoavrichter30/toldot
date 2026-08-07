import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { DatabaseService } from './database.service';
import { EraModule } from '../era/era.module';
import { TurnLog } from './session.types';

describe('SessionService', () => {
  let service: SessionService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EraModule],
      providers: [SessionService, DatabaseService],
    }).compile();
    await module.init();
    service = module.get<SessionService>(SessionService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(() => {
    dbService.database.close();
  });

  it('should create a session for an existing era', () => {
    const session = service.createSession('1904-second-aliyah');
    expect(session.id).toMatch(/^sess_/);
    expect(session.eraId).toBe('1904-second-aliyah');
    expect(session.state.resources.funds).toBe(500);
    expect(session.state.locations.length).toBeGreaterThan(0);
  });

  it('should retrieve a session by id', () => {
    const created = service.createSession('1904-second-aliyah');
    const loaded = service.getSession(created.id);
    expect(loaded.id).toBe(created.id);
    expect(loaded.state.resources.funds).toBe(500);
  });

  it('should list sessions', () => {
    service.createSession('1904-second-aliyah');
    const list = service.listSessions();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBeDefined();
  });

  it('should log a turn', () => {
    const session = service.createSession('1904-second-aliyah');
    const turn: TurnLog = {
      sessionId: session.id,
      turnNumber: 1,
      playerAction: 'Build housing in Petah Tikva',
      dmNarration: 'The settlers begin building...',
      stateSnapshot: session.state,
      effectsApplied: [],
      effectsRejected: [],
      createdAt: new Date().toISOString(),
    };
    service.logTurn(turn);
    // verify no error
  });
});
