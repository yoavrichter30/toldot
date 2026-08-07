import { Injectable } from '@nestjs/common';
import { EraMeta, EraConfig } from './era.types';

@Injectable()
export class EraValidatorService {
  validateMeta(meta: EraMeta): string[] {
    const errors: string[] = [];
    if (!meta.id) errors.push('era.id is required');
    if (!meta.title) errors.push('era.title is required');
    if (!meta.startDate) errors.push('era.startDate is required');
    if (!meta.endDate) errors.push('era.endDate is required');
    if (meta.maxTurns < 1) errors.push('era.maxTurns must be >= 1');
    if (!meta.model) errors.push('era.model is required');
    return errors;
  }

  validateConfig(config: EraConfig): string[] {
    const errors: string[] = [];
    if (!Array.isArray(config.locations)) errors.push('config.locations must be an array');
    if (!config.resources) errors.push('config.resources is required');
    if (!config.foundationTracks) errors.push('config.foundationTracks is required');
    return errors;
  }
}