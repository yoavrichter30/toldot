import { Test, TestingModule } from '@nestjs/testing';
import { DMOrchestratorService } from './dm-orchestrator.service';
import { OllamaClient } from '../ollama/ollama.client';
import { EraService } from '../era/era.service';
import { EraValidatorService } from '../era/era-validator.service';
import { ValidationEngineService } from '../validation/validation-engine.service';
import { Session } from '../session/session.types';

describe('DMOrchestratorService', () => {
  let service: DMOrchestratorService;
  let module: TestingModule;
  let mockSession: Session;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DMOrchestratorService,
        {
          provide: OllamaClient,
          useValue: {
            chat: jest.fn().mockResolvedValue({
              message: {
                content: JSON.stringify({
                  narration: 'Test narration',
                  proposed_effects: [{ target: 'funds', delta: -50, reason: 'test' }],
                  spawned_events: [],
                  historical_notes: ['Test note'],
                  dm_questions: ['What next?'],
                }),
              },
            }),
            ping: jest.fn().mockResolvedValue(true),
            listModels: jest.fn().mockResolvedValue([]),
          },
        },
        EraService,
        EraValidatorService,
        ValidationEngineService,
      ],
    }).compile();

    service = module.get<DMOrchestratorService>(DMOrchestratorService);

    // Create a real session via EraService
    const eraService = module.get<EraService>(EraService);
    const era = eraService.loadEra('1904-second-aliyah');
    mockSession = {
      id: 'test_session',
      eraId: '1904-second-aliyah',
      currentTurn: 0,
      date: '1904-01-01',
      status: 'active',
      state: {
        date: '1904-01-01',
        turn: 0,
        resources: { ...era.config.resources },
        foundationTracks: { ...era.config.foundationTracks },
        locations: era.config.locations.map(l => ({
          id: l.id,
          housing: l.initialHousing,
          water: l.initialWater,
          health: l.initialHealth,
          populationCapacity: l.populationCapacity,
        })),
        cohorts: [],
        projects: [],
        events: [],
        losses: {},
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
  });

  it('should process a turn and return a result', async () => {
    const result = await service.processTurn('Build a school', mockSession);
    expect(result.narration).toBe('Test narration');
    expect(result.effectsApplied.length).toBeGreaterThanOrEqual(0);
    expect(result.newState.turn).toBe(1);
    expect(result.newState.date).toBe('1904-02-01');
  });

  it('should handle DM parse failure gracefully', async () => {
    // Override mock to return invalid JSON
    const ollama = module.get<OllamaClient>(OllamaClient);
    ollama.chat = jest.fn().mockResolvedValue({
      message: { content: 'not json at all' },
    });
    const result = await service.processTurn('Test', mockSession);
    expect(result.narration).toBeDefined();
    expect(result.narration.length).toBeGreaterThan(0);
  });

  it('should enrich spawned events from era event templates', async () => {
    const ollama = module.get<OllamaClient>(OllamaClient);
    ollama.chat = jest.fn().mockResolvedValue({
      message: {
        content: JSON.stringify({
          narration: 'Test narration',
          proposed_effects: [],
          spawned_events: [
            {
              id: 'hapoel_hatzair_founded',
              title: 'LLM title',
              description: 'LLM description',
              choices: [{ label: 'LLM label', key: 'llm_key' }],
            },
          ],
          historical_notes: [],
          dm_questions: [],
        }),
      },
    });

    const result = await service.processTurn('Test', mockSession);
    expect(result.spawnedEvents).toHaveLength(1);
    const event = result.spawnedEvents[0];
    // Template data replaces the LLM version
    expect(event.title).toBe("Hapoel Hatza'ir Founded");
    expect(event.description).toContain('Hapoel Hatza');
    expect(event.choices).toHaveLength(2);
    expect(event.choices![0]).toMatchObject({ label: 'Support the labor movement with funds and resources', key: 'support_labor', effects: { funds: -50, public_trust: 10 } });
  });

  it('should keep the LLM version of a spawned event with no template match', async () => {
    const ollama = module.get<OllamaClient>(OllamaClient);
    ollama.chat = jest.fn().mockResolvedValue({
      message: {
        content: JSON.stringify({
          narration: 'Test narration',
          proposed_effects: [],
          spawned_events: [
            {
              id: 'unknown_event',
              title: 'LLM original title',
              description: 'LLM original description',
              choices: [{ label: 'LLM label', key: 'llm_key' }],
            },
          ],
          historical_notes: [],
          dm_questions: [],
        }),
      },
    });

    const result = await service.processTurn('Test', mockSession);
    expect(result.spawnedEvents).toHaveLength(1);
    expect(result.spawnedEvents[0].title).toBe('LLM original title');
    expect(result.spawnedEvents[0].choices).toEqual([{ label: 'LLM label', key: 'llm_key' }]);
  });
});