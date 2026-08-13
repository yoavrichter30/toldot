const BASE = '/api';

export interface EraMeta {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  maxTurns: number;
  model: string;
  goal?: string;
  objectives?: string[];
}

export interface SessionMeta {
  id: string;
  eraId: string;
  status: string;
  currentTurn: number;
  updatedAt: string;
}

export interface EventChoice {
  label: string;
  key: string;
}

export interface SpawnedEvent {
  id: string;
  title: string;
  description: string;
  choices?: EventChoice[];
}

export interface GameResources {
  funds: number;
  people: number;
  publicTrust: number;
  ottomanTolerance: number;
}

export interface FoundationTracks {
  settlementViability: number;
  economicIndependence: number;
  hebrewPublicLife: number;
  selfOrganization: number;
}

export interface CohortStateView {
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

export interface ProjectStateView {
  id: string;
  locationId: string;
  name: string;
  description: string;
  progress: number;
  requiredDays: number;
  status: 'available' | 'active' | 'completed';
}

export interface LocationStateView {
  id: string;
  housing: number;
  water: number;
  health: number;
  populationCapacity: number;
}

export interface GameStateView {
  resources: GameResources;
  foundationTracks: FoundationTracks;
  locations: LocationStateView[];
  cohorts: CohortStateView[];
  projects: ProjectStateView[];
}



export type Grade = 'gold' | 'silver' | 'bronze' | 'loss';

export interface TurnResponse {
  turn: number;
  date: string;
  narration: string;
  effectsApplied: unknown[];
  effectsRejected: unknown[];
  events: SpawnedEvent[];
  historicalNotes: string[];
  state: GameStateView;
  gameOver: boolean;
  grade?: Grade;
  maxTurns: number;
  goal?: string;
  objectives?: string[];
}

export interface SessionData {
  id: string;
  eraId: string;
  currentTurn: number;
  date: string;
  status: string;
  state: GameStateView;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  const data: unknown = await res.json();
  return data as unknown as T;
}

export function listEras(): Promise<EraMeta[]> {
  return request<EraMeta[]>(`${BASE}/eras`);
}

export function createSession(eraId: string): Promise<{ session: { id: string }; goal?: string; objectives?: string[] }> {
  return request<{ session: { id: string }; goal?: string; objectives?: string[] }>(`${BASE}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eraId }),
  });
}

export function listSessions(): Promise<SessionMeta[]> {
  return request<SessionMeta[]>(`${BASE}/sessions`);
}

export function getSession(id: string): Promise<{ session: SessionData }> {
  return request<{ session: SessionData }>(`${BASE}/session/${id}`);
}

export function processTurn(sessionId: string, action: string): Promise<TurnResponse> {
  return request<TurnResponse>(`${BASE}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, action }),
  });
}