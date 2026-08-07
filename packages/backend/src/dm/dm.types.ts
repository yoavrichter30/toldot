import { Effect, GameState } from '../session/session.types';
import { RejectedEffect } from '../validation/validation.types';

export interface DMResponse {
  narration: string;
  proposed_effects: Array<{
    target: string;
    id?: string;
    delta: number;
    reason: string;
  }>;
  spawned_events: Array<{
    id: string;
    title: string;
    description: string;
    choices?: Array<{ label: string; key: string }>;
  }>;
  historical_notes: string[];
  roll?: {
    reason: string;
    result: number;
    threshold: number;
  };
  dm_questions: string[];
}

export interface TurnResult {
  narration: string;
  effectsApplied: Effect[];
  effectsRejected: RejectedEffect[];
  spawnedEvents: SpawnedEvent[];
  historicalNotes: string[];
  newState: GameState;
  gameOver: boolean;
  outcome?: 'won' | 'lost';
  turnNumber: number;
}

export interface SpawnedEvent {
  id: string;
  title: string;
  description: string;
  choices?: Array<{ label: string; key: string }>;
}