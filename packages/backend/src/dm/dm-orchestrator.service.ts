import { Injectable, Logger } from '@nestjs/common';
import { OllamaClient } from '../ollama/ollama.client';
import { EraService } from '../era/era.service';
import { ValidationEngineService } from '../validation/validation-engine.service';
import { Session, GameState, Grade } from '../session/session.types';
import { DMResponse, TurnResult, SpawnedEvent } from './dm.types';
import { ValidationResult, ValidatedEffect } from '@/validation/validation.types';
import { Era } from '@/era/era.types';

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

    if (process.env.MOCK_OLLAMA === 'true') {
      dmResponse = this.mockDMResponse(action, session.state);
    } else {
      try {
        dmResponse = await this.callDM(prompt, era.meta.model);
      } catch (err) {
        this.logger.error(`DM call failed: ${err}`);
        // Fallback: neutral turn
        dmResponse = {
          narration: "The season passes without incident. The committee continues its work.",
          proposed_effects: [],
          spawned_events: [],
          historical_notes: [],
          dm_questions: ["What would you like to do next?"],
        };
      }
    }

    // Validate effects
    const validation: ValidationResult = this.validationEngine.validateEffects(
      (dmResponse.proposed_effects || []).map(e => ({
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

    // Spawn events — enrich with template data when available
    const eventTemplates = era.events || [];
    const spawnedEvents: SpawnedEvent[] = (dmResponse.spawned_events || []).map(e => {
      const template = eventTemplates.find(t => t.id === e.id);
      if (template) {
        // Rich version from template with full description, choices, and effects
        return {
          id: template.id,
          title: template.title,
          description: template.description,
          choices: template.choices.map(c => ({
            label: c.label,
            key: c.key,
            effects: c.effects,
          })),
        };
      }
      // Fall through to LLM's version (no template match)
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        choices: e.choices,
      };
    });

    // Check win/loss
    const { gameOver, grade } = this.checkWinLoss(newState, session, era);

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
      grade,
      turnNumber: newState.turn,
    };
  }

  private buildPrompt(era: Era, state: GameState, action: string): string {
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

  private applyEffects(state: GameState, accepted: ValidatedEffect[]): GameState {
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
          if (project) {
            project.progress = item.newValue;
            if (project.status === 'available' && project.progress > 0) {
              project.status = 'active';
            }
            if (project.progress >= project.requiredDays) {
              project.progress = project.requiredDays;
              project.status = 'completed';
            }
          }
          break;
        }
      }
    }
    return newState;
  }

  private checkWinLoss(state: GameState, session: Session, era: Era): { gameOver: boolean; grade?: Grade } {
    // Automatic loss conditions
    if (state.resources.funds <= 0) {
      state.losses['funds_exhausted'] = (state.losses['funds_exhausted'] || 0) + 1;
    } else {
      state.losses['funds_exhausted'] = 0;
    }

    if (state.losses['funds_exhausted'] >= 6) {
      return { gameOver: true, grade: 'loss' };
    }

    // Loss if fewer than 2 viable locations for 6 consecutive turns
    const viableLocations = state.locations.filter(
      l => l.housing > 0 && l.health > 0 && l.water > 0,
    ).length;
    if (viableLocations < 2) {
      state.losses['locations_depleted'] = (state.losses['locations_depleted'] || 0) + 1;
    } else {
      state.losses['locations_depleted'] = 0;
    }

    if (state.losses['locations_depleted'] >= 6) {
      return { gameOver: true, grade: 'loss' };
    }

    // Check if turn limit reached
    if (state.turn >= era.meta.maxTurns) {
      return { gameOver: true, grade: this.evaluateGrade(state, era) };
    }

    return { gameOver: false };
  }

  private evaluateGrade(state: GameState, era: Era): Grade {
    const tracks = state.foundationTracks;
    const resources = state.resources;
    const majorProjects = state.projects.filter(p => p.status === 'completed' && p.id.startsWith('major'));

    // Gold: strong foundation
    if (tracks.settlementViability >= 50 && tracks.economicIndependence >= 50 &&
        tracks.hebrewPublicLife >= 40 && resources.funds >= 100 && resources.publicTrust >= 60) {
      return 'gold';
    }

    // Silver: solid progress
    if (tracks.settlementViability >= 40 && tracks.economicIndependence >= 30 &&
        resources.funds >= 0 && resources.publicTrust >= 30) {
      return 'silver';
    }

    // Bronze: survived but struggled
    return 'bronze';
  }

  private advanceDate(currentDate: string): string {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }

  private mockDMResponse(action: string, state: GameState): DMResponse {
    // Check if the player is starting a project
    const projectMatch = action.match(/^Start the (.+) project$/i);
    const projectEffects: Array<{ target: string; id?: string; delta: number; reason: string }> = [];
    let narration = '';

    if (projectMatch) {
      const projectName = projectMatch[1];
      const project = state.projects.find(
        p => p.name.toLowerCase() === projectName.toLowerCase() || p.id.toLowerCase() === projectName.toLowerCase(),
      );
      if (project && project.status === 'available') {
        // Advance the project: set active and add progress
        const dailyProgress = Math.min(30, project.requiredDays);
        projectEffects.push(
          { target: 'project.progress', id: project.id, delta: dailyProgress, reason: `Work continues on ${project.name}` },
        );
        narration = `The committee allocates resources to begin ${project.name}. Preliminary work has started — the settlement board reports ${Math.min(100, Math.round(dailyProgress / project.requiredDays * 100))}% complete after the first month of effort.`;
      } else if (project && project.status === 'active') {
        const dailyProgress = Math.min(30, project.requiredDays - project.progress);
        projectEffects.push(
          { target: 'project.progress', id: project.id, delta: dailyProgress, reason: `Continued work on ${project.name}` },
        );
        narration = `Work on ${project.name} continues. The engineers report steady progress.`;
      } else {
        narration = `The committee discusses ${projectName} but no such project is currently feasible.`;
      }
    }

    return {
      narration: narration || 'The committee reviews the situation. Winter has passed, and the settlements are holding steady. The malaria season is approaching, and additional funds for drainage would be wise.',
      proposed_effects: projectEffects.length > 0 ? projectEffects : [
        { target: 'funds', delta: -20, reason: 'Regular operating expenses' },
        { target: 'public_trust', delta: 2, reason: 'Steady leadership' },
        { target: 'location.health', id: 'petah_tikva', delta: -3, reason: 'Seasonal malaria risk' },
      ],
      spawned_events: [],
      historical_notes: projectMatch ? [`${state.projects.find(p => p.name.toLowerCase() === projectMatch[1].toLowerCase())?.name || 'The project'} is underway — a significant undertaking for the Yishuv.`] : ['Malaria was a persistent threat in the swampy areas of Petah Tikva and Hadera during the early 1900s. Drainage projects were a major focus of the pre-WWI Yishuv.'],
      dm_questions: projectEffects.length > 0 ? [
        'What other work should the committee prioritize this month?',
        'Allocate additional funds to speed up the project.',
        'Send a delegation to request Ottoman permits for new construction.',
      ] : [
        'Allocate funds to malaria drainage in the affected settlements',
        'Send a delegation to request Ottoman permits for new construction',
        'Focus on expanding the existing housing stock',
      ],
    };
  }
}