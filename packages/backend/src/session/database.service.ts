import { Injectable, OnModuleInit, Inject, Optional } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export const DB_PATH_TOKEN = 'DATABASE_PATH';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db!: Database.Database;
  private readonly dbPath: string;

  constructor(@Optional() @Inject(DB_PATH_TOKEN) dbPath?: string) {
    this.dbPath = dbPath ?? this.resolveDefaultDbPath();
  }

  private resolveDefaultDbPath(): string {
    const repoRoot = this.findRepoRoot();
    return path.join(repoRoot, 'data', 'toldot.db');
  }

  /** Walk up from __dirname to find the repo root (where `eras/` lives). */
  private findRepoRoot(): string {
    let dir = path.resolve(__dirname);
    while (dir !== path.parse(dir).root) {
      const candidate = path.join(dir, 'era.yaml');
      // eras/ contains era.yaml, so checking for eras/ presence is symmetric
      if (fs.existsSync(path.join(dir, 'eras'))) return dir;
      dir = path.dirname(dir);
    }
    return dir;
  }

  onModuleInit() {
    if (this.dbPath !== ':memory:') {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        era_id TEXT NOT NULL,
        current_turn INTEGER NOT NULL DEFAULT 0,
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        state_json TEXT NOT NULL,
        epilogue TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS turn_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        turn_number INTEGER NOT NULL,
        player_action TEXT NOT NULL,
        dm_narration TEXT NOT NULL,
        state_snapshot TEXT NOT NULL,
        effects_applied TEXT,
        effects_rejected TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS events_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        turn_number INTEGER NOT NULL,
        event_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `);
  }

  get database(): Database.Database {
    return this.db;
  }
}
