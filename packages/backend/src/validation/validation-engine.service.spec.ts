import { Test, TestingModule } from '@nestjs/testing';
import { ValidationEngineService } from './validation-engine.service';
import { GameState, Effect } from '../session/session.types';
import { Era } from '../era/era.types';

describe('ValidationEngineService', () => {
  let service: ValidationEngineService;
  let mockState: GameState;
  let mockEra: Era;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationEngineService],
    }).compile();

    service = module.get<ValidationEngineService>(ValidationEngineService);

    mockState = {
      date: '1904-01-01',
      turn: 0,
      resources: { funds: 500, people: 150, publicTrust: 55, ottomanTolerance: 50 },
      foundationTracks: { settlementViability: 15, economicIndependence: 10, hebrewPublicLife: 10, selfOrganization: 10 },
      locations: [{ id: 'petah_tikva', housing: 50, water: 30, health: 35, populationCapacity: 800 }],
      cohorts: [{ id: 'coh_1', templateId: 'russian_pioneers', name: 'Pioneers', size: 25, status: 'arrived', health: 80, retention: 80, skills: ['farming'] }],
      projects: [],
      events: [],
      losses: {},
    };
    mockEra = {
      meta: { id: 'test', title: 'Test', startDate: '1904-01-01', endDate: '1905-01-01', maxTurns: 12, model: 'qwen3.5:9b' },
      config: {
        locations: [],
        resources: { funds: 500, people: 150, publicTrust: 55, ottomanTolerance: 50 },
        foundationTracks: { settlementViability: 15, economicIndependence: 10, hebrewPublicLife: 10, selfOrganization: 10 },
        cohortTemplates: [],
      },
      promptTemplate: '',
      groundingDocs: '',
    };
  });

  it('should accept valid fund changes', () => {
    const effects: Effect[] = [{ target: 'funds', delta: -50, reason: 'Building materials' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].newValue).toBe(450);
    expect(result.rejected).toHaveLength(0);
  });

  it('should clamp funds to zero', () => {
    const effects: Effect[] = [{ target: 'funds', delta: -600, reason: 'Overspend' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].newValue).toBe(0);
    expect(result.accepted[0].clamped).toBe(true);
  });

  it('should clamp public_trust to 0-100', () => {
    const effects: Effect[] = [
      { target: 'public_trust', delta: -200, reason: 'Crisis' },
      { target: 'public_trust', delta: 200, reason: 'Miracle' },
    ];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.accepted[0].newValue).toBe(0);
    expect(result.accepted[1].newValue).toBe(100);
  });

  it('should reject unknown target', () => {
    const effects: Effect[] = [{ target: 'invalid_field', delta: 10, reason: 'test' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('Unknown target');
  });

  it('should reject missing location reference', () => {
    const effects: Effect[] = [{ target: 'location.housing', id: 'nonexistent', delta: 10, reason: 'test' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('Location not found');
  });
});