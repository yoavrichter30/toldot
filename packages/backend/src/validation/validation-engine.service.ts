import { Injectable } from '@nestjs/common';
import { Effect, GameState } from '../session/session.types';
import { Era } from '../era/era.types';
import { ValidationResult, ValidatedEffect, RejectedEffect } from './validation.types';

@Injectable()
export class ValidationEngineService {
  validateEffects(effects: Effect[], state: GameState, era: Era): ValidationResult {
    const accepted: ValidatedEffect[] = [];
    const rejected: RejectedEffect[] = [];

    for (const effect of effects) {
      const result = this.validateSingleEffect(effect, state, era);
      if (result.valid) {
        accepted.push(result.validated!);
      } else {
        rejected.push({ effect, reason: result.reason! });
      }
    }

    return { accepted, rejected };
  }

  private validateSingleEffect(
    effect: Effect,
    state: GameState,
    era: Era,
  ): { valid: true; validated: ValidatedEffect } | { valid: false; reason: string } {
    // Check target type
    const validTargets = [
      'funds', 'people', 'public_trust', 'ottoman_tolerance',
      'location.housing', 'location.health', 'location.water',
      'cohort.retention', 'cohort.health', 'project.progress',
    ];
    if (!validTargets.includes(effect.target)) {
      return { valid: false, reason: `Unknown target: ${effect.target}` };
    }

    // Check reference existence for location targets
    if (effect.target.startsWith('location.') && effect.id) {
      const loc = state.locations.find(l => l.id === effect.id);
      if (!loc) return { valid: false, reason: `Location not found: ${effect.id}` };
    }

    // Check reference existence for cohort targets
    if (effect.target.startsWith('cohort.') && effect.id) {
      const cohort = state.cohorts.find(c => c.id === effect.id);
      if (!cohort) return { valid: false, reason: `Cohort not found: ${effect.id}` };
    }

    // Get current value and apply bounds
    const current = this.getCurrentValue(effect, state);
    if (current === null) {
      return { valid: false, reason: `Cannot read current value for ${effect.target}${effect.id ? ':' + effect.id : ''}` };
    }

    let newValue = current + effect.delta;
    let clamped = false;

    // Apply bounds
    if (effect.target === 'public_trust' || effect.target === 'ottoman_tolerance' || effect.target === 'cohort.retention' || effect.target === 'cohort.health') {
      if (newValue < 0) { newValue = 0; clamped = true; }
      if (newValue > 100) { newValue = 100; clamped = true; }
    } else if (effect.target === 'funds' || effect.target === 'people') {
      if (newValue < 0) { newValue = 0; clamped = true; }
    } else if (effect.target.startsWith('location.')) {
      if (newValue < 0) { newValue = 0; clamped = true; }
      if (newValue > 100) { newValue = 100; clamped = true; }
    }

    // Check project existence
    if (effect.target === 'project.progress' && effect.id) {
      const project = state.projects.find(p => p.id === effect.id);
      if (!project) return { valid: false, reason: `Project not found: ${effect.id}` };
      if (project.status === 'completed') {
        return { valid: false, reason: `Project ${effect.id} is already completed` };
      }
    }

    return {
      valid: true,
      validated: { effect, clamped, oldValue: current, newValue },
    };
  }

  private getCurrentValue(effect: Effect, state: GameState): number | null {
    switch (effect.target) {
      case 'funds': return state.resources.funds;
      case 'people': return state.resources.people;
      case 'public_trust': return state.resources.publicTrust;
      case 'ottoman_tolerance': return state.resources.ottomanTolerance;
      case 'location.housing': {
        const loc = state.locations.find(l => l.id === effect.id);
        return loc ? loc.housing : null;
      }
      case 'location.health': {
        const loc = state.locations.find(l => l.id === effect.id);
        return loc ? loc.health : null;
      }
      case 'location.water': {
        const loc = state.locations.find(l => l.id === effect.id);
        return loc ? loc.water : null;
      }
      case 'cohort.retention':
      case 'cohort.health': {
        const cohort = state.cohorts.find(c => c.id === effect.id);
        return cohort ? cohort[effect.target === 'cohort.retention' ? 'retention' : 'health'] : null;
      }
      case 'project.progress': {
        const project = state.projects.find(p => p.id === effect.id);
        return project ? project.progress : null;
      }
      default: return null;
    }
  }
}