const BASE = '/api';

export interface EraMeta {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  maxTurns: number;
  model: string;
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

export interface GameStateView {
  resources: GameResources;
  foundationTracks: FoundationTracks;
  locations: unknown[];
  cohorts: unknown[];
  projects: unknown[];
}

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
  outcome?: string;
  maxTurns: number;
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

export function isSessionData(value: unknown): value is SessionData {
  if (typeof value !== 'object' || value === null) return false;
  if (!('id' in value) || typeof value.id !== 'string') return false;
  if (!('eraId' in value) || typeof value.eraId !== 'string') return false;
  if (!('currentTurn' in value) || typeof value.currentTurn !== 'number') return false;
  if (!('date' in value) || typeof value.date !== 'string') return false;
  if (!('status' in value) || typeof value.status !== 'string') return false;
  if (!('state' in value) || typeof value.state !== 'object' || value.state === null) return false;
  return true;
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

export function createSession(eraId: string): Promise<{ session: { id: string } }> {
  return request<{ session: { id: string } }>(`${BASE}/session`, {
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