import { Test, TestingModule } from '@nestjs/testing';
import { EraValidatorService } from './era-validator.service';
import { EraMeta, EraConfig } from './era.types';

describe('EraValidatorService', () => {
  let service: EraValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EraValidatorService],
    }).compile();
    service = module.get<EraValidatorService>(EraValidatorService);
  });

  describe('validateMeta', () => {
    it('should return empty for valid meta', () => {
      const meta: EraMeta = {
        id: '1904-second-aliyah',
        title: 'From Moshavot to Yishuv',
        startDate: '1904-01-01',
        endDate: '1914-07-01',
        maxTurns: 126,
        model: 'qwen3.5:9b',
      };
      expect(service.validateMeta(meta)).toEqual([]);
    });

    it('should report missing fields', () => {
      const meta = {} as EraMeta;
      const errors = service.validateMeta(meta);
      expect(errors).toContain('era.id is required');
      expect(errors).toContain('era.title is required');
      expect(errors).toContain('era.startDate is required');
      expect(errors).toContain('era.endDate is required');
      expect(errors).toContain('era.model is required');
    });

    it('should report invalid maxTurns', () => {
      const meta: EraMeta = {
        id: 'test',
        title: 'Test',
        startDate: '1900-01-01',
        endDate: '1901-01-01',
        maxTurns: 0,
        model: 'qwen3.5:9b',
      };
      const errors = service.validateMeta(meta);
      expect(errors).toContain('era.maxTurns must be >= 1');
    });
  });

  describe('validateConfig', () => {
    it('should return empty for valid config', () => {
      const config: EraConfig = {
        locations: [],
        resources: { funds: 100, people: 10, publicTrust: 50, ottomanTolerance: 50 },
        foundationTracks: {
          settlementViability: 10,
          economicIndependence: 10,
          hebrewPublicLife: 10,
          selfOrganization: 10,
        },
        cohortTemplates: [],
      };
      expect(service.validateConfig(config)).toEqual([]);
    });

    it('should report missing locations', () => {
      const config = {} as EraConfig;
      const errors = service.validateConfig(config);
      expect(errors).toContain('config.locations must be an array');
      expect(errors).toContain('config.resources is required');
      expect(errors).toContain('config.foundationTracks is required');
    });
  });
});