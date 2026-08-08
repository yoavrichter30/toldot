import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { EraService } from '../era/era.service';
import { Session, GameState, SessionMeta, TurnLog } from './session.types';

@Injectable()
export class SessionService {
  constructor(
    private db: DatabaseService,
    private eraService: EraService,
  ) {}

  createSession(eraId: string): Session {
    const era = this.eraService.loadEra(eraId);
    const now = new Date().toISOString();

    const state: GameState = {
      date: era.meta.startDate,
      turn: 0,
      resources: { ...era.config.resources },
      foundationTracks: { ...era.config.foundationTracks },
      locations: era.config.locations.map(l => ({
        id: l.id,
        housing: l.initialHousing,
        water: l.initialWater,
        health: l.initialHealth,
        populationCapacity: l.populationCapacity,
      })),
      cohorts: [],
      projects: (era.config.projects || []).map(p => ({
        id: p.id,
        locationId: '',
        name: p.name,
        description: p.description,
        progress: 0,
        requiredDays: p.requiredDays,
        status: 'available' as const,
      })),
      events: [],
      losses: {},
    };

    // Initialize first cohort from era templates
    if (era.config.cohortTemplates.length > 0) {
      const first = era.config.cohortTemplates[0];
      state.cohorts.push({
        id: 'coh_arrived_1',
        templateId: first.id,
        name: first.name,
        size: first.size,
        status: 'arrived',
        health: 80,
        retention: 70,
        skills: first.skills,
      });
    }

    const session: Session = {
      id: `sess_${randomUUID().slice(0, 8)}`,
      eraId,
      currentTurn: 0,
      date: era.meta.startDate,
      status: 'active',
      state,
      createdAt: now,
      updatedAt: now,
    };

    this.db.database
      .prepare(`INSERT INTO sessions (id, era_id, current_turn, date, status, state_json, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(session.id, session.eraId, session.currentTurn, session.date, session.status,
           JSON.stringify(session.state), session.createdAt, session.updatedAt);

    return session;
  }

  getSession(id: string): Session {
    const row = this.db.database.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new NotFoundException(`Session "${id}" not found`);
    return {
      id: row.id as string,
      eraId: row.era_id as string,
      currentTurn: row.current_turn as number,
      date: row.date as string,
      status: row.status as Session['status'],
      state: JSON.parse(row.state_json as string) as GameState,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      epilogue: row.epilogue as string | undefined,
    };
  }

  listSessions(): SessionMeta[] {
    const rows = this.db.database
      .prepare('SELECT id, era_id, status, current_turn, updated_at FROM sessions ORDER BY updated_at DESC')
      .all() as Array<Record<string, unknown>>;
    return rows.map(r => ({
      id: r.id as string,
      eraId: r.era_id as string,
      status: r.status as string,
      currentTurn: r.current_turn as number,
      updatedAt: r.updated_at as string,
    }));
  }

  updateSession(session: Session): void {
    session.updatedAt = new Date().toISOString();
    this.db.database
      .prepare(`UPDATE sessions SET current_turn = ?, date = ?, status = ?, state_json = ?, updated_at = ?, epilogue = ?
                 WHERE id = ?`)
      .run(session.currentTurn, session.date, session.status,
           JSON.stringify(session.state), session.updatedAt,
           session.epilogue ?? null, session.id);
  }

  logTurn(turn: TurnLog): void {
    this.db.database
      .prepare(`INSERT INTO turn_log (session_id, turn_number, player_action, dm_narration, state_snapshot, effects_applied, effects_rejected, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(turn.sessionId, turn.turnNumber, turn.playerAction, turn.dmNarration,
           JSON.stringify(turn.stateSnapshot), JSON.stringify(turn.effectsApplied),
           JSON.stringify(turn.effectsRejected), turn.createdAt);
  }
}
