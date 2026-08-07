import { Injectable, Logger } from '@nestjs/common';
import { OllamaClient } from '../ollama/ollama.client';
import { EraService } from '../era/era.service';
import { ValidationEngineService } from '../validation/validation-engine.service';
import { Session, GameState } from '../session/session.types';
import { DMResponse, TurnResult, SpawnedEvent } from './dm.types';
import { ValidationResult } from '../validation/validation.types';

@Injectable()
export class DMOrchestratorService {
  private readonly logger = new Logger(DMOrchestratorService.name);

  constructor(
    private ollama: OllamaClient,
    private eraService: EraService,
    private validationEngine: ValidationEngineService,
  ) {}

  async processTurn(action: string, session: Session): Promise<TurnResult> {
    const era = this.eraService.loadEra(session.eraId);
    const prompt = this.buildPrompt(era, session.state, action);
    let dmResponse: DMResponse;

    try {
      dmResponse = await this.callDM(prompt, era.meta.model);
    } catch (err) {
      this.logger.error(`DM call failed: ${err}`);
      // Fallback: neutral turn
      dmResponse = {
        narration: 'The season passes without incident. The committee continues its work.',
        proposed_effects: [],
        spawned_events: [],
        historical_notes: [],
        dm_questions: ['What would you like to do next?'],
      };
    }

    // Validate effects
    const validation: ValidationResult = this.validationEngine.validateEffects(
      dmResponse.proposed_effects.map(e => ({
        target: e.target,
        id: e.id,
        delta: e.delta,
        reason: e.reason,
      })),
      session.state,
      era,
    );

    // Apply accepted effects
    const newState = this.applyEffects(session.state, validation.accepted);

    // Spawn events
    const spawnedEvents: SpawnedEvent[] = (dmResponse.spawned_events || []).map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      choices: e.choices,
    }));

    // Check win/loss
    const { gameOver, outcome } = this.checkWinLoss(newState, session);

    // Advance turn
    newState.turn = session.currentTurn + 1;
    newState.date = this.advanceDate(session.date);

    return {
      narration: dmResponse.narration,
      effectsApplied: validation.accepted.map(v => v.effect),
      effectsRejected: validation.rejected,
      spawnedEvents,
      historicalNotes: dmResponse.historical_notes || [],
      newState,
      gameOver,
      outcome,
      turnNumber: newState.turn,
    };
  }

  private buildPrompt(era: any, state: GameState, action: string): string {
    const stateSummary = JSON.stringify({
      date: state.date,
      turn: state.turn,
      resources: state.resources,
      tracks: state.foundationTracks,
      locationCount: state.locations.length,
      cohortCount: state.cohorts.length,
      projectCount: state.projects.length,
    }, null, 2);

    const prompt = era.promptTemplate
      .replace('{{grounding_docs}}', era.groundingDocs)
      + `\n\n## Current game state\n\`\`\`json\n${stateSummary}\n\`\`\`\n\n## Player action\n${action}\n\nRespond with valid JSON only.`;

    return prompt;
  }

  private async callDM(prompt: string, model: string): Promise<DMResponse> {
    const response = await this.ollama.chat({
      model,
      messages: [
        { role: 'system', content: 'You are a Dungeon Master for an educational history game. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      format: 'json',
    });

    // Parse JSON from response
    try {
      return JSON.parse(response.message.content) as DMResponse;
    } catch {
      // Retry once with error feedback
      const retryResponse = await this.ollama.chat({
        model,
        messages: [
          { role: 'system', content: 'You are a Dungeon Master for an educational history game. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
          { role: 'assistant', content: response.message.content },
          { role: 'user', content: `Your response was not valid JSON. Error: ${response.message.content.slice(0, 100)}... Please respond with valid JSON only.` },
        ],
        format: 'json',
      });
      return JSON.parse(retryResponse.message.content) as DMResponse;
    }
  }

  private applyEffects(state: GameState, accepted: any[]): GameState {
    const newState = JSON.parse(JSON.stringify(state)) as GameState;
    for (const item of accepted) {
      const eff = item.effect;
      switch (eff.target) {
        case 'funds': newState.resources.funds = item.newValue; break;
        case 'people': newState.resources.people = item.newValue; break;
        case 'public_trust': newState.resources.publicTrust = item.newValue; break;
        case 'ottoman_tolerance': newState.resources.ottomanTolerance = item.newValue; break;
        case 'location.housing': {
          const loc = newState.locations.find(l => l.id === eff.id);
          if (loc) loc.housing = item.newValue;
          break;
        }
        case 'location.health': {
          const loc = newState.locations.find(l => l.id === eff.id);
          if (loc) loc.health = item.newValue;
          break;
        }
        case 'location.water': {
          const loc = newState.locations.find(l => l.id === eff.id);
          if (loc) loc.water = item.newValue;
          break;
        }
        case 'cohort.retention': {
          const cohort = newState.cohorts.find(c => c.id === eff.id);
          if (cohort) cohort.retention = item.newValue;
          break;
        }
        case 'cohort.health': {
          const cohort = newState.cohorts.find(c => c.id === eff.id);
          if (cohort) cohort.health = item.newValue;
          break;
        }
        case 'project.progress': {
          const project = newState.projects.find(p => p.id === eff.id);
          if (project) project.progress = item.newValue;
          break;
        }
      }
    }
    return newState;
  }

  private checkWinLoss(state: GameState, session: Session): { gameOver: boolean; outcome?: 'won' | 'lost' } {
    // Automatic loss conditions
    if (state.resources.funds <= 0) {
      state.losses['funds_exhausted'] = (state.losses['funds_exhausted'] || 0) + 1;
    } else {
      state.losses['funds_exhausted'] = 0;
    }

    if (state.losses['funds_exhausted'] >= 6) {
      return { gameOver: true, outcome: 'lost' };
    }

    // Check if turn limit reached
    const era = this.eraService.loadEra(session.eraId);
    if (state.turn >= era.meta.maxTurns) {
      return { gameOver: true, outcome: 'won' }; // graded by epilogue
    }

    return { gameOver: false };
  }

  private advanceDate(currentDate: string): string {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }
}