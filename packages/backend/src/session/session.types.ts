import { RejectedEffect } from '../validation/validation.types';

export type Grade = 'gold' | 'silver' | 'bronze' | 'loss';

export interface GameState {
  date: string;
  turn: number;
  resources: {
    funds: number;
    people: number;
    publicTrust: number;
    ottomanTolerance: number;
  };
  foundationTracks: {
    settlementViability: number;
    economicIndependence: number;
    hebrewPublicLife: number;
    selfOrganization: number;
  };
  locations: LocationState[];
  cohorts: CohortState[];
  projects: ProjectState[];
  events: EventState[];
  losses: { [key: string]: number };
}

export interface LocationState {
  id: string;
  housing: number;
  water: number;
  health: number;
  populationCapacity: number;
}

export interface CohortState {
  id: string;
  templateId: string;
  name: string;
  size: number;
  status: 'queued' | 'arrived' | 'assigned' | 'departed';
  assignedLocationId?: string;
  health: number;
  retention: number;
  skills: string[];
}

export interface ProjectState {
  id: string;
  locationId: string;
  name: string;
  description: string;
  progress: number;
  requiredDays: number;
  status: 'available' | 'active' | 'completed';
}

export interface EventState {
  id: string;
  title: string;
  description: string;
  turnTriggered: number;
  resolved: boolean;
  choices?: EventChoice[];
}

export interface EventChoice {
  label: string;
  key: string;
  effects?: Record<string, number>;
}

export interface Session {
  id: string;
  eraId: string;
  currentTurn: number;
  date: string;
  status: 'active' | Grade;
  state: GameState;
  createdAt: string;
  updatedAt: string;
  epilogue?: string;
}

export interface SessionMeta {
  id: string;
  eraId: string;
  status: string;
  currentTurn: number;
  updatedAt: string;
}

export interface TurnLog {
  sessionId: string;
  turnNumber: number;
  playerAction: string;
  dmNarration: string;
  stateSnapshot: GameState;
  effectsApplied: Effect[];
  effectsRejected: RejectedEffect[];
  createdAt: string;
}

export interface Effect {
  target: string;
  id?: string;
  delta: number;
  reason: string;
}
