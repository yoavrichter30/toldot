import { Test, TestingModule } from '@nestjs/testing';
import { EraService } from './era.service';
import { NotFoundException } from '@nestjs/common';

describe('EraService', () => {
  let service: EraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EraService],
    }).compile();
    service = module.get<EraService>(EraService);
  });

  it('should list available eras', () => {
    const eras = service.listEras();
    expect(Array.isArray(eras)).toBe(true);
    const found = eras.find((e) => e.id === '1904-second-aliyah');
    expect(found).toBeDefined();
    expect(found!.title).toContain('Second Aliyah');
  });

  it('should load an era by id', () => {
    const era = service.loadEra('1904-second-aliyah');
    expect(era.meta.id).toBe('1904-second-aliyah');
    expect(era.config.locations.length).toBeGreaterThan(0);
    expect(era.promptTemplate).toContain('Dungeon Master');
    expect(era.groundingDocs).toContain('Second Aliyah');
  });

  it('should throw for unknown era', () => {
    expect(() => service.loadEra('nonexistent')).toThrow(NotFoundException);
  });
});