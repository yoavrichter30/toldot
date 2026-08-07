# Toldot — Browser-Based DnD Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based DnD-like educational game where a local LLM (via Ollama) serves as the Dungeon Master, guiding players through the New Yishuv era (1904-1914) with pluggable eras.

**Architecture:** Single NestJS server with React SPA frontend. The LLM (Ollama) proposes turn outcomes in structured JSON; a validation engine checks resource bounds and era rules before applying. State lives in SQLite. Eras are self-contained directories auto-discovered at startup.

**Tech Stack:** Node.js 26, NestJS, React + Vite + TypeScript, SQLite (better-sqlite3), Ollama (qwen3.5:9b), Jest, Testing Library

## Global Constraints

- Node.js 26.5.0+ (as installed)
- No auth, no user accounts, no multiplayer
- All LLM calls via Ollama HTTP API at `http://localhost:11434`
- Era content is loaded from `eras/<era_id>/` directories — no code changes for new eras
- Validation engine must clamp resource bounds, never crash
- Every turn is fully logged for replay
- Use `better-sqlite3` for SQLite (synchronous, zero-config)
- NestJS modules: EraModule, SessionModule, DMOrchestrator, ValidationEngine, StateManager
- React: no routing library (simple state-based routing), no Redux (useReducer + context)
- Tests: Jest for NestJS, Vitest + Testing Library for React

---

### Task 1: Initialize NestJS + React monorepo

**Files:**
- Create: `package.json` (root — workspace config)
- Create: `packages/backend/package.json`
- Create: `packages/backend/tsconfig.json`
- Create: `packages/backend/nest-cli.json`
- Create: `packages/backend/src/main.ts`
- Create: `packages/backend/src/app.module.ts`
- Create: `packages/frontend/package.json`
- Create: `packages/frontend/vite.config.ts`
- Create: `packages/frontend/tsconfig.json`
- Create: `packages/frontend/index.html`
- Create: `packages/frontend/src/main.tsx`
- Create: `packages/frontend/src/App.tsx`
- Create: `.gitignore` (update with node_modules, dist, *.db)

**Interfaces:**
- Consumes: nothing
- Produces: root workspace with `packages/backend/` (NestJS) and `packages/frontend/` (Vite + React + TS)

- [ ] **Step 1: Create root package.json with workspace config**

```json
{
  "name": "toldot",
  "private": true,
  "workspaces": ["packages/backend", "packages/frontend"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w packages/backend\" \"npm run dev -w packages/frontend\"",
    "build": "npm run build -w packages/backend && npm run build -w packages/frontend",
    "test": "npm run test -w packages/backend && npm run test -w packages/frontend"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

- [ ] **Step 2: Create package.json for backend**

```bash
cd packages/backend
npm init -y
```

Then edit to:

```json
{
  "name": "@toldot/backend",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@nestjs/core": "^11.0.0",
    "@nestjs/common": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "better-sqlite3": "^11.0.0",
    "js-yaml": "^4.1.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/node": "^22.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/js-yaml": "^4.0.0",
    "typescript": "^5.6.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.0.0"
  }
}
```

- [ ] **Step 3: Create backend tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 4: Create nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "tsConfigPath": "tsconfig.json"
  }
}
```

- [ ] **Step 5: Create main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:5173' });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Toldot backend running on http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 6: Create app.module.ts (empty, modules added in later tasks)**

```typescript
import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}
```

- [ ] **Step 7: Create Jest config for backend**

```typescript
// packages/backend/jest.config.ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
```

- [ ] **Step 8: Create frontend with Vite**

```bash
cd packages/frontend && npm create vite@latest . -- --template react-ts
```

Then remove default files: `src/App.css`, `src/index.css`, `src/assets/`.

- [ ] **Step 9: Add frontend dev dependencies**

```bash
cd packages/frontend && npm install vitest @testing-library/react @testing-library/jest-dom jsdom --save-dev
```

- [ ] **Step 10: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
```

- [ ] **Step 11: Create minimal App.tsx**

```tsx
function App() {
  return <div>Hello Toldot</div>;
}
export default App;
```

- [ ] **Step 12: Update .gitignore**

```
node_modules/
dist/
*.db
*.sqlite
.env
```

- [ ] **Step 13: Install all dependencies and verify**

Run: `npm install` from root
Run: `npm run build -w packages/backend` — expected: compiles
Run: `npm run build -w packages/frontend` — expected: Vite builds
Run: both `npm run dev` starts without errors

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: scaffold NestJS + React monorepo"
```

---

### Task 2: Create EraModule — load era data from disk

**Files:**
- Create: `packages/backend/src/era/era.module.ts`
- Create: `packages/backend/src/era/era.service.ts`
- Create: `packages/backend/src/era/era.types.ts`
- Create: `packages/backend/src/era/era-validator.service.ts`
- Create: `packages/backend/src/era/era.service.spec.ts`
- Create: `eras/1904-second-aliyah/era.yaml`
- Create: `eras/1904-second-aliyah/config.json`
- Create: `eras/1904-second-aliyah/prompt_template.md`
- Create: `eras/1904-second-aliyah/grounding_docs.md`

**Interfaces:**
- Consumes: nothing
- Produces: `EraService` with `loadEra(id: string): Era`, `listEras(): EraMeta[]`, `getEraDir(id: string): string`, `getPromptTemplate(id: string): string`, `getGroundingDocs(id: string): string`

- [ ] **Step 1: Define era types**

```typescript
// packages/backend/src/era/era.types.ts
export interface EraMeta {
  id: string;
  title: string;
  startDate: string;   // ISO "1904-01-01"
  endDate: string;     // ISO "1914-07-01"
  maxTurns: number;
  model: string;       // "qwen3.5:9b"
}

export interface EraConfig {
  locations: LocationConfig[];
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
  cohortTemplates: CohortTemplate[];
}

export interface LocationConfig {
  id: string;
  name: string;
  type: string;
  founded: number;
  initialHousing: number;
  initialWater: number;
  initialHealth: number;
  populationCapacity: number;
}

export interface CohortTemplate {
  id: string;
  name: string;
  size: number;
  skills: string[];
  preferredWork: string;
}

export interface Era {
  meta: EraMeta;
  config: EraConfig;
  promptTemplate: string;
  groundingDocs: string;
}
```

- [ ] **Step 2: Write EraService — discover and load eras**

```typescript
// packages/backend/src/era/era.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Era, EraMeta, EraConfig } from './era.types';

@Injectable()
export class EraService {
  private readonly erasDir: string;

  constructor() {
    this.erasDir = path.resolve(process.cwd(), '..', '..', 'eras');
  }

  listEras(): EraMeta[] {
    if (!fs.existsSync(this.erasDir)) {
      fs.mkdirSync(this.erasDir, { recursive: true });
      return [];
    }
    const entries = fs.readdirSync(this.erasDir, { withFileTypes: true });
    const eras: EraMeta[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const eraPath = path.join(this.erasDir, entry.name);
      const yamlPath = path.join(eraPath, 'era.yaml');
      if (!fs.existsSync(yamlPath)) continue;
      try {
        const meta = yaml.load(fs.readFileSync(yamlPath, 'utf-8')) as EraMeta;
        if (meta && meta.id) eras.push(meta);
      } catch { /* skip invalid era dirs */ }
    }
    return eras;
  }

  getEraDir(id: string): string {
    return path.join(this.erasDir, id);
  }

  loadEra(id: string): Era {
    const dir = this.getEraDir(id);
    if (!fs.existsSync(dir)) throw new NotFoundException(`Era "${id}" not found`);

    const meta = yaml.load(fs.readFileSync(path.join(dir, 'era.yaml'), 'utf-8')) as EraMeta;
    const config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf-8')) as EraConfig;
    const promptTemplate = fs.readFileSync(path.join(dir, 'prompt_template.md'), 'utf-8');
    const groundingDocs = fs.readFileSync(path.join(dir, 'grounding_docs.md'), 'utf-8');

    return { meta, config, promptTemplate, groundingDocs };
  }

  getPromptTemplate(id: string): string {
    return fs.readFileSync(path.join(this.getEraDir(id), 'prompt_template.md'), 'utf-8');
  }

  getGroundingDocs(id: string): string {
    return fs.readFileSync(path.join(this.getEraDir(id), 'grounding_docs.md'), 'utf-8');
  }
}
```

- [ ] **Step 3: Write EraValidatorService — validate era config**

```typescript
// packages/backend/src/era/era-validator.service.ts
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
```

- [ ] **Step 4: Write EraModule**

```typescript
// packages/backend/src/era/era.module.ts
import { Module } from '@nestjs/common';
import { EraService } from './era.service';
import { EraValidatorService } from './era-validator.service';

@Module({
  providers: [EraService, EraValidatorService],
  exports: [EraService, EraValidatorService],
})
export class EraModule {}
```

- [ ] **Step 5: Write tests for EraService**

```typescript
// packages/backend/src/era/era.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EraService } from './era.service';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { NotFoundException } from '@nestjs/common';

describe('EraService', () => {
  let service: EraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EraService],
    }).compile();
    service = module.get<EraService>(EraService);
  });

  it('should list available eras', () => {
    const eras = service.listEras();
    expect(Array.isArray(eras)).toBe(true);
    const found = eras.find(e => e.id === '1904-second-aliyah');
    expect(found).toBeDefined();
    expect(found!.title).toContain('Second Aliyah');
  });

  it('should load an era by id', () => {
    const era = service.loadEra('1904-second-aliyah');
    expect(era.meta.id).toBe('1904-second-aliyah');
    expect(era.config.locations.length).toBeGreaterThan(0);
    expect(era.promptTemplate).toContain('Dungeon Master');
    expect(era.groundingDocs).toContain('Second Aliyah');
  });

  it('should throw for unknown era', () => {
    expect(() => service.loadEra('nonexistent')).toThrow(NotFoundException);
  });
});
```

- [ ] **Step 6: Create the Second Aliyah era content**

```yaml
# eras/1904-second-aliyah/era.yaml
id: 1904-second-aliyah
title: "From Moshavot to Yishuv — the Second Aliyah"
start_date: "1904-01-01"
end_date: "1914-07-01"
max_turns: 126
model: "qwen3.5:9b"
```

```json
// eras/1904-second-aliyah/config.json
{
  "locations": [
    {
      "id": "jaffa",
      "name": "Jaffa",
      "type": "port_city",
      "founded": 0,
      "initial_housing": 80,
      "initial_water": 80,
      "initial_health": 60,
      "population_capacity": 5000
    },
    {
      "id": "petah_tikva",
      "name": "Petah Tikva",
      "type": "moshava",
      "founded": 1878,
      "initial_housing": 50,
      "initial_water": 30,
      "initial_health": 35,
      "population_capacity": 800
    },
    {
      "id": "rishon_lezion",
      "name": "Rishon LeZion",
      "type": "moshava",
      "founded": 1882,
      "initial_housing": 55,
      "initial_water": 40,
      "initial_health": 40,
      "population_capacity": 700
    },
    {
      "id": "rehovot",
      "name": "Rehovot",
      "type": "moshava",
      "founded": 1890,
      "initial_housing": 45,
      "initial_water": 35,
      "initial_health": 40,
      "population_capacity": 600
    },
    {
      "id": "zikhron_yaakov",
      "name": "Zikhron Ya'akov",
      "type": "moshava",
      "founded": 1882,
      "initial_housing": 50,
      "initial_water": 35,
      "initial_health": 40,
      "population_capacity": 600
    },
    {
      "id": "hadera",
      "name": "Hadera",
      "type": "moshava",
      "founded": 1891,
      "initial_housing": 30,
      "initial_water": 15,
      "initial_health": 20,
      "population_capacity": 400
    },
    {
      "id": "sejera",
      "name": "Sejera (Ilaniya)",
      "type": "training_farm",
      "founded": 1899,
      "initial_housing": 25,
      "initial_water": 30,
      "initial_health": 35,
      "population_capacity": 200
    },
    {
      "id": "metulla",
      "name": "Metulla",
      "type": "moshava",
      "founded": 1896,
      "initial_housing": 25,
      "initial_water": 25,
      "initial_health": 30,
      "population_capacity": 300
    },
    {
      "id": "kinneret_farm",
      "name": "Kinneret Farm",
      "type": "training_farm",
      "founded": 1908,
      "initial_housing": 5,
      "initial_water": 10,
      "initial_health": 20,
      "population_capacity": 150
    },
    {
      "id": "degamia",
      "name": "Degania",
      "type": "training_farm",
      "founded": 1909,
      "initial_housing": 0,
      "initial_water": 0,
      "initial_health": 0,
      "population_capacity": 100
    }
  ],
  "resources": {
    "funds": 500,
    "people": 150,
    "public_trust": 55,
    "ottoman_tolerance": 50
  },
  "foundation_tracks": {
    "settlement_viability": 15,
    "economic_independence": 10,
    "hebrew_public_life": 10,
    "self_organization": 10
  },
  "cohort_templates": [
    {
      "id": "russian_pioneers",
      "name": "Russian Jewish pioneers",
      "size": 25,
      "skills": ["farming", "manual_labor", "ideology"],
      "preferred_work": "farming"
    },
    {
      "id": "yemenite_families",
      "name": "Yemenite Jewish families",
      "size": 30,
      "skills": ["manual_labor", "construction", "craftsmanship"],
      "preferred_work": "construction"
    },
    {
      "id": "urban_professionals",
      "name": "Urban professionals and artisans",
      "size": 15,
      "skills": ["teaching", "medicine", "craftsmanship"],
      "preferred_work": "teaching"
    },
    {
      "id": "poalei_zion_workers",
      "name": "Poalei Zion workers",
      "size": 20,
      "skills": ["manual_labor", "organization", "ideology"],
      "preferred_work": "farming"
    }
  ]
}
```

```markdown
# eras/1904-second-aliyah/prompt_template.md

You are the Dungeon Master for "Toldot" — an educational game set in the
New Yishuv (Land of Israel, 1904-1914, under Ottoman rule).

## Your role
You narrate the monthly turn of a coordinating Yishuv committee. The player
manages resources, assigns cohorts, and makes strategic decisions. You
bring the world to life through historical events, character interactions,
and the material reality of the era.

## Era context
This is the Second Aliyah period. Thousands of Jewish immigrants, mostly
from Eastern Europe, arrive in Ottoman Palestine. The existing moshavot
(agricultural settlements) from the First Aliyah are established but face
economic hardship, malaria, and Ottoman restrictions. The player coordinates
efforts to expand settlements, build new institutions, and develop a
self-sustaining Hebrew community.

## Key historical events (reference for narrative)
- 1904: Second Aliyah begins after the Kishinev pogrom
- 1905: Hapoel Hatza'ir (The Young Worker) party founded
- 1906: Poalei Zion party established in Jaffa
- 1907: Bar Giora (self-defense organization) founded in Sejera
- 1908: Kinneret Farm established; Ahuzat Bayit (future Tel Aviv) planned
- 1909: Degania (first kvutza/collective) founded; Hashomer established
- 1909: Tel Aviv (Ahuzat Bayit) founded on sand dunes near Jaffa
- 1910: First Hebrew high school (Gymnasia Herzliya) in Tel Aviv
- 1911: Hebrew-language newspaper Ha'aretz founded
- 1913: The "Language War" — conflict over Hebrew as the language of instruction
- 1914: World War I begins, Ottoman authorities crack down

## Grounding
{{grounding_docs}}

## Constraints
- The player must not exceed their resource bounds.
- Ottoman tolerance is a real constraint — permits are required for building.
- Donor funding may impose conditions on local autonomy.
- Arab towns and villages, Ottoman authorities, and religious communities
  are represented as actors with their own interests.
- Hebrew language and the Jewish calendar are part of everyday life.

## Output format
You MUST respond in valid JSON with the following structure:
{
  "narration": "string — the narrative text describing the turn's events",
  "proposed_effects": [
    {
      "target": "funds | people | public_trust | ottoman_tolerance | location.housing | location.health | location.water | cohort.retention | cohort.health | project.progress",
      "id": "string — location/cohort/project ID if applicable",
      "delta": "integer — signed change",
      "reason": "string — why this change is happening"
    }
  ],
  "spawned_events": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "choices": [
        { "label": "string", "key": "string" }
      ]
    }
  ],
  "historical_notes": ["string — optional historical facts for the player to learn"],
  "roll": {
    "reason": "string — why the roll was needed",
    "result": 0,
    "threshold": 0
  },
  "dm_questions": ["string — suggested actions the player can take next turn"]
}
```

```markdown
# eras/1904-second-aliyah/grounding_docs.md

## Ottoman Palestine (1904-1914)
The region was part of the Ottoman Empire, divided into the Vilayet of Beirut
and the Mutasarrifate of Jerusalem. The Ottoman government in Constantinople
was wary of Zionist immigration and land purchases, imposing restrictions
while generally tolerating the existing Jewish communities.

## The Second Aliyah (1904-1914)
Approximately 35,000-40,000 Jewish immigrants arrived, mostly from the
Russian Empire, fleeing pogroms and economic hardship. About half eventually
left. The Second Aliyah is considered the founding generation of the
organized Yishuv — they established the first kvutzot (collective farms),
founded Hashomer (the guard organization), and created the first political
parties of the labor movement.

## Key figures
- **Arthur Ruppin**: Head of the Palestine Office of the Zionist Organization
- **David Ben-Gurion**: Young worker, later first Prime Minister of Israel
- **Yitzhak Ben-Zvi**: Historian, later second President of Israel
- **Berl Katznelson**: Labor movement leader and intellectual
- **Yosef Trumpeldor**: One-armed veteran, founder of early labor groups
- **Rahel Yanait Ben-Zvi**: Educator and agricultural worker
- **Manya Shochat**: Founder of Hashomer, pioneer of collective settlement

## The settlements
The moshavot of the First Aliyah (Petah Tikva, Rishon LeZion, Rehovot,
Zikhron Ya'akov, Hadera, Rosh Pinna) were already established but struggling
under the patronage of Baron Rothschild. The Second Aliyah pioneers sought
to create a new type of settlement — the kvutza (collective) and the
training farm — based on Hebrew labor and self-sufficiency.

## The Arab population
The region had a majority Arab population, with major cities like Jaffa,
Haifa, and Jerusalem. Relations ranged from economic cooperation
(employment, trade) to tension over land purchases and labor. The
Arab national movement was in its early stages.

## Ottoman administration
Local Ottoman officials varied in their attitudes — some were pragmatic,
others hostile to Zionist activity. Bribery, permits, and connections
were essential for land purchases and construction. The Ottoman
Nationality Law of 1909 restricted immigration for some groups.
```

- [ ] **Step 7: Run tests**

Run: `npx jest packages/backend/src/era/era.service.spec.ts --no-cache`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: EraModule with era discovery and loading"
```

---

### Task 3: Create SessionModule — SQLite persistence

**Files:**
- Create: `packages/backend/src/session/session.module.ts`
- Create: `packages/backend/src/session/session.service.ts`
- Create: `packages/backend/src/session/session.types.ts`
- Create: `packages/backend/src/session/session.service.spec.ts`
- Create: `packages/backend/src/session/database.service.ts`

**Interfaces:**
- Consumes: `EraService` from EraModule
- Produces: `SessionService` with `createSession(eraId: string): Session`, `getSession(id: string): Session`, `saveTurn(sessionId: string, turn: TurnLog): void`, `listSessions(): SessionMeta[]`

- [ ] **Step 1: Define session types**

```typescript
// packages/backend/src/session/session.types.ts
import { EraConfig } from '../era/era.types';

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
  losses: { [key: string]: number };  // consecutive turn counters
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
}

export interface Session {
  id: string;
  eraId: string;
  currentTurn: number;
  date: string;
  status: 'active' | 'won' | 'lost';
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
  effectsRejected: Effect[];
  createdAt: string;
}

export interface Effect {
  target: string;
  id?: string;
  delta: number;
  reason: string;
}
```

- [ ] **Step 2: Write DatabaseService**

```typescript
// packages/backend/src/session/database.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database.Database;

  onModuleInit() {
    const dbDir = path.resolve(process.cwd(), '..', '..', 'data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    this.db = new Database(path.join(dbDir, 'toldot.db'));
    this.db.pragma('journal_mode = WAL');
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
```

- [ ] **Step 3: Write SessionService**

```typescript
// packages/backend/src/session/session.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { EraService } from '../era/era.service';
import { v4 as uuid } from 'uuid';
import { Session, GameState, SessionMeta, TurnLog, LocationState, CohortState } from './session.types';

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
      projects: [],
      events: [],
      losses: {},
    };

    const session: Session = {
      id: `sess_${uuid().slice(0, 8)}`,
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
    const row = this.db.database.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any;
    if (!row) throw new NotFoundException(`Session "${id}" not found`);
    return {
      id: row.id,
      eraId: row.era_id,
      currentTurn: row.current_turn,
      date: row.date,
      status: row.status,
      state: JSON.parse(row.state_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      epilogue: row.epilogue,
    };
  }

  updateSession(session: Session): void {
    this.db.database
      .prepare(`UPDATE sessions SET current_turn = ?, date = ?, status = ?, state_json = ?, epilogue = ?, updated_at = ? WHERE id = ?`)
      .run(session.currentTurn, session.date, session.status, JSON.stringify(session.state),
           session.epilogue || null, new Date().toISOString(), session.id);
  }

  logTurn(turn: TurnLog): void {
    this.db.database
      .prepare(`INSERT INTO turn_log (session_id, turn_number, player_action, dm_narration, state_snapshot, effects_applied, effects_rejected, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(turn.sessionId, turn.turnNumber, turn.playerAction, turn.dmNarration,
           JSON.stringify(turn.stateSnapshot), JSON.stringify(turn.effectsApplied),
           JSON.stringify(turn.effectsRejected), turn.createdAt);
  }

  listSessions(): SessionMeta[] {
    const rows = this.db.database
      .prepare('SELECT id, era_id, status, current_turn, updated_at FROM sessions ORDER BY updated_at DESC')
      .all() as any[];
    return rows.map(r => ({
      id: r.id,
      eraId: r.era_id,
      status: r.status,
      currentTurn: r.current_turn,
      updatedAt: r.updated_at,
    }));
  }
}
```

- [ ] **Step 4: Write SessionModule**

```typescript
// packages/backend/src/session/session.module.ts
import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { DatabaseService } from './database.service';
import { EraModule } from '../era/era.module';

@Module({
  imports: [EraModule],
  providers: [SessionService, DatabaseService],
  exports: [SessionService],
})
export class SessionModule {}
```

- [ ] **Step 5: Write tests for DatabaseService + SessionService**

```typescript
// packages/backend/src/session/session.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { DatabaseService } from './database.service';
import { EraModule } from '../era/era.module';

describe('SessionService', () => {
  let service: SessionService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EraModule],
      providers: [SessionService, DatabaseService],
    }).compile();
    service = module.get<SessionService>(SessionService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(() => {
    dbService.database.close();
  });

  it('should create a session for an existing era', () => {
    const session = service.createSession('1904-second-aliyah');
    expect(session.id).toMatch(/^sess_/);
    expect(session.eraId).toBe('1904-second-aliyah');
    expect(session.state.resources.funds).toBe(500);
    expect(session.state.locations.length).toBeGreaterThan(0);
  });

  it('should retrieve a session by id', () => {
    const created = service.createSession('1904-second-aliyah');
    const loaded = service.getSession(created.id);
    expect(loaded.id).toBe(created.id);
    expect(loaded.state.resources.funds).toBe(500);
  });

  it('should list sessions', () => {
    service.createSession('1904-second-aliyah');
    const list = service.listSessions();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBeDefined();
  });

  it('should log a turn', () => {
    const session = service.createSession('1904-second-aliyah');
    const turn: TurnLog = {
      sessionId: session.id,
      turnNumber: 1,
      playerAction: 'Build housing in Petah Tikva',
      dmNarration: 'The settlers begin building...',
      stateSnapshot: session.state,
      effectsApplied: [],
      effectsRejected: [],
      createdAt: new Date().toISOString(),
    };
    service.logTurn(turn);
    // verify no error
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npx jest packages/backend/src/session/session.service.spec.ts --no-cache`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: SessionModule with SQLite persistence"
```

---

### Task 4: Create Ollama client

**Files:**
- Create: `packages/backend/src/ollama/ollama.module.ts`
- Create: `packages/backend/src/ollama/ollama.client.ts`
- Create: `packages/backend/src/ollama/ollama.types.ts`
- Create: `packages/backend/src/ollama/ollama.client.spec.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `OllamaClient` with `chat(request: OllamaChatRequest): Promise<OllamaResponse>`, `ping(): Promise<boolean>`, `listModels(): Promise<ModelInfo[]>`

- [ ] **Step 1: Define Ollama types**

```typescript
// packages/backend/src/ollama/ollama.types.ts
export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  format?: 'json';
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
  };
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

export interface ModelInfo {
  name: string;
  size: number;
  modified: string;
}
```

- [ ] **Step 2: Write OllamaClient**

```typescript
// packages/backend/src/ollama/ollama.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { OllamaChatRequest, OllamaResponse, ModelInfo } from './ollama.types';

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
  }

  async chat(request: OllamaChatRequest): Promise<OllamaResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        format: request.format,
        stream: false,
        options: request.options || { temperature: 0.7 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Ollama error: ${response.status} ${text}`);
      throw new Error(`Ollama returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data as OllamaResponse;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models || [];
  }
}
```

- [ ] **Step 3: Write OllamaModule**

```typescript
// packages/backend/src/ollama/ollama.module.ts
import { Module } from '@nestjs/common';
import { OllamaClient } from './ollama.client';

@Module({
  providers: [OllamaClient],
  exports: [OllamaClient],
})
export class OllamaModule {}
```

- [ ] **Step 4: Write tests**

```typescript
// packages/backend/src/ollama/ollama.client.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OllamaClient } from './ollama.client';

describe('OllamaClient', () => {
  let client: OllamaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OllamaClient],
    }).compile();
    client = module.get<OllamaClient>(OllamaClient);
  });

  it('should ping Ollama', async () => {
    const result = await client.ping();
    // If Ollama is running, expect true; if not, expect false (no crash)
    expect(typeof result).toBe('boolean');
  });

  it('should list models', async () => {
    const models = await client.listModels();
    expect(Array.isArray(models)).toBe(true);
  });

  it('should return a chat response', async () => {
    const response = await client.chat({
      model: 'qwen3.5:9b',
      messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
      format: 'json',
    });
    expect(response.message).toBeDefined();
    expect(response.message.content).toBeDefined();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest packages/backend/src/ollama/ollama.client.spec.ts --no-cache`
Expected: PASS (requires Ollama running with qwen3.5:9b)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: OllamaClient module"
```

---

### Task 5: Create ValidationEngine — check proposed effects

**Files:**
- Create: `packages/backend/src/validation/validation.module.ts`
- Create: `packages/backend/src/validation/validation-engine.service.ts`
- Create: `packages/backend/src/validation/validation.types.ts`
- Create: `packages/backend/src/validation/validation-engine.service.spec.ts`

**Interfaces:**
- Consumes: nothing (pure functions, stateless)
- Produces: `ValidationEngine` with `validateEffects(effects: Effect[], state: GameState, era: Era): ValidationResult`

- [ ] **Step 1: Define validation types**

```typescript
// packages/backend/src/validation/validation.types.ts
import { Effect } from '../session/session.types';

export interface ValidationResult {
  accepted: ValidatedEffect[];
  rejected: RejectedEffect[];
}

export interface ValidatedEffect {
  effect: Effect;
  clamped?: boolean;   // true if the delta was clamped to a boundary
  oldValue: number;
  newValue: number;
}

export interface RejectedEffect {
  effect: Effect;
  reason: string;
}
```

- [ ] **Step 2: Write ValidationEngineService**

```typescript
// packages/backend/src/validation/validation-engine.service.ts
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
```

- [ ] **Step 3: Write ValidationModule**

```typescript
// packages/backend/src/validation/validation.module.ts
import { Module } from '@nestjs/common';
import { ValidationEngineService } from './validation-engine.service';

@Module({
  providers: [ValidationEngineService],
  exports: [ValidationEngineService],
})
export class ValidationModule {}
```

- [ ] **Step 4: Write tests for ValidationEngine**

```typescript
// packages/backend/src/validation/validation-engine.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationEngineService } from './validation-engine.service';
import { GameState, Effect } from '../session/session.types';
import { Era } from '../era/era.types';

describe('ValidationEngineService', () => {
  let service: ValidationEngineService;
  let mockState: GameState;
  let mockEra: Era;

  beforeEach(() => {
    mockState = {
      date: '1904-01-01',
      turn: 0,
      resources: { funds: 500, people: 150, publicTrust: 55, ottomanTolerance: 50 },
      foundationTracks: { settlementViability: 15, economicIndependence: 10, hebrewPublicLife: 10, selfOrganization: 10 },
      locations: [{ id: 'petah_tikva', housing: 50, water: 30, health: 35, populationCapacity: 800 }],
      cohorts: [{ id: 'coh_1', templateId: 'russian_pioneers', name: 'Pioneers', size: 25, status: 'arrived', health: 80, retention: 80, skills: ['farming'] }],
      projects: [],
      events: [],
      losses: {},
    };
    mockEra = { meta: { id: 'test', title: 'Test', startDate: '1904-01-01', endDate: '1905-01-01', maxTurns: 12, model: 'qwen3.5:9b' }, config: { locations: [], resources: { funds: 500, people: 150, publicTrust: 55, ottomanTolerance: 50 }, foundationTracks: { settlementViability: 15, economicIndependence: 10, hebrewPublicLife: 10, selfOrganization: 10 }, cohortTemplates: [] }, promptTemplate: '', groundingDocs: '' };
  });

  it('should accept valid fund changes', () => {
    const effects: Effect[] = [{ target: 'funds', delta: -50, reason: 'Building materials' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].newValue).toBe(450);
    expect(result.rejected).toHaveLength(0);
  });

  it('should clamp funds to zero', () => {
    const effects: Effect[] = [{ target: 'funds', delta: -600, reason: 'Overspend' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].newValue).toBe(0);
    expect(result.accepted[0].clamped).toBe(true);
  });

  it('should clamp public_trust to 0-100', () => {
    const effects: Effect[] = [
      { target: 'public_trust', delta: -200, reason: 'Crisis' },
      { target: 'public_trust', delta: 200, reason: 'Miracle' },
    ];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.accepted[0].newValue).toBe(0);
    expect(result.accepted[1].newValue).toBe(100);
  });

  it('should reject unknown target', () => {
    const effects: Effect[] = [{ target: 'invalid_field', delta: 10, reason: 'test' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('Unknown target');
  });

  it('should reject missing location reference', () => {
    const effects: Effect[] = [{ target: 'location.housing', id: 'nonexistent', delta: 10, reason: 'test' }];
    const result = service.validateEffects(effects, mockState, mockEra);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('Location not found');
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest packages/backend/src/validation/validation-engine.service.spec.ts --no-cache`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: ValidationEngine with effect bounds checking"
```

---

### Task 6: Create DMOrchestrator — build prompts and parse LLM output

**Files:**
- Create: `packages/backend/src/dm/dm.module.ts`
- Create: `packages/backend/src/dm/dm-orchestrator.service.ts`
- Create: `packages/backend/src/dm/dm-parser.service.ts`
- Create: `packages/backend/src/dm/dm.types.ts`
- Create: `packages/backend/src/dm/dm-orchestrator.service.spec.ts`

**Interfaces:**
- Consumes: `EraService`, `OllamaClient`, `ValidationEngineService`
- Produces: `DMOrchestrator` with `processTurn(action: string, session: Session): Promise<TurnResult>`

- [ ] **Step 1: Define DM types**

```typescript
// packages/backend/src/dm/dm.types.ts
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
```

- [ ] **Step 2: Write DMOrchestratorService**

```typescript
// packages/backend/src/dm/dm-orchestrator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OllamaClient } from '../ollama/ollama.client';
import { EraService } from '../era/era.service';
import { ValidationEngineService } from '../validation/validation-engine.service';
import { Session, GameState, Effect, ProjectState, CohortState, EventState } from '../session/session.types';
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
        narration: "The season passes without incident. The committee continues its work.",
        proposed_effects: [],
        spawned_events: [],
        historical_notes: [],
        dm_questions: ["What would you like to do next?"],
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
```

- [ ] **Step 3: Write DMModule**

```typescript
// packages/backend/src/dm/dm.module.ts
import { Module } from '@nestjs/common';
import { DMOrchestratorService } from './dm-orchestrator.service';
import { OllamaModule } from '../ollama/ollama.module';
import { EraModule } from '../era/era.module';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [OllamaModule, EraModule, ValidationModule],
  providers: [DMOrchestratorService],
  exports: [DMOrchestratorService],
})
export class DMModule {}
```

- [ ] **Step 4: Write tests for DMOrchestrator**

```typescript
// packages/backend/src/dm/dm-orchestrator.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DMOrchestratorService } from './dm-orchestrator.service';
import { OllamaClient } from '../ollama/ollama.client';
import { EraService } from '../era/era.service';
import { ValidationEngineService } from '../validation/validation-engine.service';
import { Session } from '../session/session.types';

describe('DMOrchestratorService', () => {
  let service: DMOrchestratorService;
  let mockSession: Session;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DMOrchestratorService,
        {
          provide: OllamaClient,
          useValue: {
            chat: jest.fn().mockResolvedValue({
              message: {
                content: JSON.stringify({
                  narration: 'Test narration',
                  proposed_effects: [{ target: 'funds', delta: -50, reason: 'test' }],
                  spawned_events: [],
                  historical_notes: ['Test note'],
                  dm_questions: ['What next?'],
                }),
              },
            }),
            ping: jest.fn().mockResolvedValue(true),
            listModels: jest.fn().mockResolvedValue([]),
          },
        },
        EraService,
        ValidationEngineService,
      ],
    }).compile();

    service = module.get<DMOrchestratorService>(DMOrchestratorService);

    // Create a real session via EraService
    const eraService = module.get<EraService>(EraService);
    const era = eraService.loadEra('1904-second-aliyah');
    mockSession = {
      id: 'test_session',
      eraId: '1904-second-aliyah',
      currentTurn: 0,
      date: '1904-01-01',
      status: 'active',
      state: {
        date: '1904-01-01',
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
        projects: [],
        events: [],
        losses: {},
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
  });

  it('should process a turn and return a result', async () => {
    const result = await service.processTurn('Build a school', mockSession);
    expect(result.narration).toBe('Test narration');
    expect(result.effectsApplied.length).toBeGreaterThanOrEqual(0);
    expect(result.newState.turn).toBe(1);
    expect(result.newState.date).toBe('1904-02-01');
  });

  it('should handle DM parse failure gracefully', async () => {
    // Override mock to return invalid JSON
    const ollama = module.get(OllamaClient);
    ollama.chat = jest.fn().mockResolvedValue({
      message: { content: 'not json at all' },
    });
    const result = await service.processTurn('Test', mockSession);
    expect(result.narration).toBeDefined();
    expect(result.narration.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest packages/backend/src/dm/dm-orchestrator.service.spec.ts --no-cache`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: DMOrchestrator with prompt building, LLM call, parse-retry"
```

---

### Task 7: Create GameController — API endpoints

**Files:**
- Create: `packages/backend/src/game/game.controller.ts`
- Create: `packages/backend/src/game/game.module.ts`
- Create: `packages/backend/src/game/game.controller.spec.ts`
- Modify: `packages/backend/src/app.module.ts` (import all modules)

**Interfaces:**
- Consumes: `EraService`, `SessionService`, `DMOrchestratorService`
- Produces: `POST /api/session` (create game), `GET /api/sessions` (list), `GET /api/session/:id` (load), `POST /api/turn` (process action), `GET /api/eras` (list)

- [ ] **Step 1: Write GameController**

```typescript
// packages/backend/src/game/game.controller.ts
import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { EraService } from '../era/era.service';
import { SessionService } from '../session/session.service';
import { DMOrchestratorService } from '../dm/dm-orchestrator.service';

@Controller('api')
export class GameController {
  constructor(
    private eraService: EraService,
    private sessionService: SessionService,
    private dmOrchestrator: DMOrchestratorService,
  ) {}

  @Get('eras')
  listEras() {
    return this.eraService.listEras();
  }

  @Post('session')
  createSession(@Body() body: { eraId: string }) {
    if (!body.eraId) throw new NotFoundException('eraId is required');
    const session = this.sessionService.createSession(body.eraId);
    return { session };
  }

  @Get('sessions')
  listSessions() {
    return this.sessionService.listSessions();
  }

  @Get('session/:id')
  getSession(@Param('id') id: string) {
    const session = this.sessionService.getSession(id);
    return { session };
  }

  @Post('turn')
  async processTurn(@Body() body: { sessionId: string; action: string }) {
    if (!body.sessionId || !body.action) {
      throw new NotFoundException('sessionId and action are required');
    }
    const session = this.sessionService.getSession(body.sessionId);
    if (session.status !== 'active') {
      throw new Error('Game is over');
    }

    const result = await this.dmOrchestrator.processTurn(body.action, session);

    // Update session
    session.state = result.newState;
    session.currentTurn = result.turnNumber;
    session.date = result.newState.date;
    if (result.gameOver) {
      session.status = result.outcome || 'won';
    }

    this.sessionService.updateSession(session);

    // Log turn
    this.sessionService.logTurn({
      sessionId: session.id,
      turnNumber: result.turnNumber,
      playerAction: body.action,
      dmNarration: result.narration,
      stateSnapshot: result.newState,
      effectsApplied: result.effectsApplied,
      effectsRejected: result.effectsRejected,
      createdAt: new Date().toISOString(),
    });

    return {
      turn: result.turnNumber,
      date: result.newState.date,
      narration: result.narration,
      effectsApplied: result.effectsApplied,
      effectsRejected: result.effectsRejected,
      events: result.spawnedEvents,
      historicalNotes: result.historicalNotes,
      state: {
        resources: result.newState.resources,
        foundationTracks: result.newState.foundationTracks,
        locations: result.newState.locations,
        cohorts: result.newState.cohorts,
        projects: result.newState.projects,
      },
      gameOver: result.gameOver,
      outcome: result.outcome,
      maxTurns: this.eraService.loadEra(session.eraId).meta.maxTurns,
    };
  }
}
```

- [ ] **Step 2: Write GameModule**

```typescript
// packages/backend/src/game/game.module.ts
import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { EraModule } from '../era/era.module';
import { SessionModule } from '../session/session.module';
import { DMModule } from '../dm/dm.module';

@Module({
  imports: [EraModule, SessionModule, DMModule],
  controllers: [GameController],
})
export class GameModule {}
```

- [ ] **Step 3: Update AppModule**

```typescript
// packages/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { EraModule } from './era/era.module';
import { SessionModule } from './session/session.module';
import { OllamaModule } from './ollama/ollama.module';
import { ValidationModule } from './validation/validation.module';
import { DMModule } from './dm/dm.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [EraModule, SessionModule, OllamaModule, ValidationModule, DMModule, GameModule],
})
export class AppModule {}
```

- [ ] **Step 4: Write controller tests**

```typescript
// packages/backend/src/game/game.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { EraModule } from '../era/era.module';
import { SessionModule } from '../session/session.module';
import { DMModule } from '../dm/dm.module';
import { OllamaClient } from '../ollama/ollama.client';

describe('GameController', () => {
  let controller: GameController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EraModule, SessionModule, DMModule],
      controllers: [GameController],
    })
      .overrideProvider(OllamaClient)
      .useValue({
        chat: jest.fn().mockResolvedValue({
          message: { content: JSON.stringify({ narration: 'Test', proposed_effects: [], spawned_events: [], historical_notes: [], dm_questions: [] }) },
        }),
        ping: jest.fn().mockResolvedValue(true),
        listModels: jest.fn().mockResolvedValue([]),
      })
      .compile();
    controller = module.get<GameController>(GameController);
  });

  it('should list eras', () => {
    const result = controller.listEras();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('1904-second-aliyah');
  });

  it('should create a session', () => {
    const result = controller.createSession({ eraId: '1904-second-aliyah' });
    expect(result.session.id).toMatch(/^sess_/);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest packages/backend/src/game/game.controller.spec.ts --no-cache`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: GameController with API endpoints"
```

---

### Task 8: Create React frontend — GameScreen and components

**Files:**
- Create: `packages/frontend/src/api/game.ts`
- Create: `packages/frontend/src/context/GameContext.tsx`
- Create: `packages/frontend/src/components/HomeScreen.tsx`
- Create: `packages/frontend/src/components/EraSelector.tsx`
- Create: `packages/frontend/src/components/GameScreen.tsx`
- Create: `packages/frontend/src/components/DMNarrative.tsx`
- Create: `packages/frontend/src/components/ResourcePanel.tsx`
- Create: `packages/frontend/src/components/ActionInput.tsx`
- Create: `packages/frontend/src/components/EventCard.tsx`
- Create: `packages/frontend/src/components/JournalView.tsx`
- Create: `packages/frontend/src/components/GameOverScreen.tsx`
- Modify: `packages/frontend/src/App.tsx`

**Interfaces:**
- Consumes: API endpoints from Task 7
- Produces: Full game UI

- [ ] **Step 1: Create API client**

```typescript
// packages/frontend/src/api/game.ts
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

export interface TurnResponse {
  turn: number;
  date: string;
  narration: string;
  effectsApplied: any[];
  effectsRejected: any[];
  events: any[];
  historicalNotes: string[];
  state: {
    resources: { funds: number; people: number; publicTrust: number; ottomanTolerance: number };
    foundationTracks: { settlementViability: number; economicIndependence: number; hebrewPublicLife: number; selfOrganization: number };
    locations: any[];
    cohorts: any[];
    projects: any[];
  };
  gameOver: boolean;
  outcome?: string;
  maxTurns: number;
}

export async function listEras(): Promise<EraMeta[]> {
  const res = await fetch(`${BASE}/eras`);
  return res.json();
}

export async function createSession(eraId: string): Promise<{ session: { id: string } }> {
  const res = await fetch(`${BASE}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eraId }),
  });
  return res.json();
}

export async function listSessions(): Promise<SessionMeta[]> {
  const res = await fetch(`${BASE}/sessions`);
  return res.json();
}

export async function getSession(id: string): Promise<{ session: any }> {
  const res = await fetch(`${BASE}/session/${id}`);
  return res.json();
}

export async function processTurn(sessionId: string, action: string): Promise<TurnResponse> {
  const res = await fetch(`${BASE}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, action }),
  });
  return res.json();
}
```

- [ ] **Step 2: Create GameContext**

```tsx
// packages/frontend/src/context/GameContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TurnResponse } from '../api/game';

interface GameState {
  screen: 'home' | 'new-game' | 'playing' | 'game-over';
  sessionId: string | null;
  eraId: string | null;
  turn: number;
  maxTurns: number;
  date: string;
  narration: string;
  historicalNotes: string[];
  events: any[];
  state: TurnResponse['state'] | null;
  gameOver: boolean;
  outcome: string | undefined;
  loading: boolean;
  error: string | null;
}

type GameAction =
  | { type: 'SET_SCREEN'; screen: GameState['screen'] }
  | { type: 'NEW_SESSION'; sessionId: string; eraId: string }
  | { type: 'SET_TURN'; data: TurnResponse }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'LOAD_SESSION'; sessionId: string; eraId: string; state: TurnResponse }
  | { type: 'SET_ERA'; eraId: string };

const initialState: GameState = {
  screen: 'home',
  sessionId: null,
  eraId: null,
  turn: 0,
  maxTurns: 126,
  date: '',
  narration: '',
  historicalNotes: [],
  events: [],
  state: null,
  gameOver: false,
  outcome: undefined,
  loading: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen, error: null };
    case 'NEW_SESSION':
      return { ...state, sessionId: action.sessionId, eraId: action.eraId, screen: 'playing', turn: 0, gameOver: false, outcome: undefined };
    case 'SET_TURN':
      return {
        ...state,
        turn: action.data.turn,
        maxTurns: action.data.maxTurns,
        date: action.data.date,
        narration: action.data.narration,
        historicalNotes: action.data.historicalNotes,
        events: action.data.events,
        state: action.data.state,
        gameOver: action.data.gameOver,
        outcome: action.data.outcome,
        screen: action.data.gameOver ? 'game-over' : 'playing',
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

const GameContext = createContext<{ state: GameState; dispatch: React.Dispatch<GameAction> }>({
  state: initialState,
  dispatch: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
```

- [ ] **Step 3: Create HomeScreen**

```tsx
// packages/frontend/src/components/HomeScreen.tsx
import { useGame } from '../context/GameContext';
import { useEffect, useState } from 'react';
import { listSessions, SessionMeta } from '../api/game';

export function HomeScreen() {
  const { dispatch } = useGame();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <h1>Toldot</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        An educational game through the eras of the Yishuv
      </p>
      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'new-game' })}
        style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', cursor: 'pointer' }}
      >
        New Game
      </button>
      {sessions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Continue Game</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sessions.map(s => (
              <li key={s.id} style={{ margin: '0.5rem 0' }}>
                <button
                  onClick={() => {
                    dispatch({ type: 'LOAD_SESSION', sessionId: s.id, eraId: s.eraId, state: {} as any });
                    dispatch({ type: 'SET_SCREEN', screen: 'playing' });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {s.eraId} — Turn {s.currentTurn} ({s.status})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create EraSelector**

```tsx
// packages/frontend/src/components/EraSelector.tsx
import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { listEras, createSession, EraMeta } from '../api/game';

export function EraSelector() {
  const { dispatch } = useGame();
  const [eras, setEras] = useState<EraMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEras()
      .then(setEras)
      .catch(() => setEras([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (era: EraMeta) => {
    setLoading(true);
    try {
      const result = await createSession(era.id);
      dispatch({ type: 'NEW_SESSION', sessionId: result.session.id, eraId: era.id });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  };

  if (loading) return <div>Loading eras...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Choose an Era</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {eras.map(era => (
          <button
            key={era.id}
            onClick={() => handleSelect(era)}
            style={{
              padding: '1rem',
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid #ccc',
              borderRadius: 8,
              background: '#f9f9f9',
            }}
          >
            <strong>{era.title}</strong>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              {era.startDate} — {era.endDate} | {era.maxTurns} turns
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create DMNarrative component**

```tsx
// packages/frontend/src/components/DMNarrative.tsx
interface Props {
  narration: string;
  historicalNotes: string[];
}

export function DMNarrative({ narration, historicalNotes }: Props) {
  return (
    <div style={{ background: '#f5f0e8', padding: '1.5rem', borderRadius: 8, marginBottom: '1rem' }}>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{narration}</div>
      {historicalNotes.length > 0 && (
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#666', fontWeight: 'bold' }}>Historical Notes</summary>
          <ul style={{ marginTop: '0.5rem' }}>
            {historicalNotes.map((note, i) => (
              <li key={i} style={{ marginBottom: '0.3rem', color: '#555' }}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create ResourcePanel**

```tsx
// packages/frontend/src/components/ResourcePanel.tsx
interface Props {
  resources: { funds: number; people: number; publicTrust: number; ottomanTolerance: number };
  foundationTracks: { settlementViability: number; economicIndependence: number; hebrewPublicLife: number; selfOrganization: number };
}

function Bar({ label, value, max = 100, color = '#4caf50' }: { label: string; value: number; max?: number; color?: string }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ background: '#eee', height: 8, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export function ResourcePanel({ resources, foundationTracks }: Props) {
  return (
    <div style={{ padding: '1rem', background: '#fff', borderRadius: 8, border: '1px solid #ddd' }}>
      <h4 style={{ margin: '0 0 0.75rem' }}>Resources</h4>
      <Bar label="Funds" value={resources.funds} max={1000} color="#2196f3" />
      <Bar label="People" value={resources.people} max={500} color="#4caf50" />
      <Bar label="Public Trust" value={resources.publicTrust} color="#ff9800" />
      <Bar label="Ottoman Tolerance" value={resources.ottomanTolerance} color="#f44336" />
      <h4 style={{ margin: '1rem 0 0.75rem' }}>Foundation Tracks</h4>
      <Bar label="Settlement Viability" value={foundationTracks.settlementViability} color="#9c27b0" />
      <Bar label="Economic Independence" value={foundationTracks.economicIndependence} color="#3f51b5" />
      <Bar label="Hebrew Public Life" value={foundationTracks.hebrewPublicLife} color="#009688" />
      <Bar label="Self-Organization" value={foundationTracks.selfOrganization} color="#795548" />
    </div>
  );
}
```

- [ ] **Step 7: Create ActionInput**

```tsx
// packages/frontend/src/components/ActionInput.tsx
import { useState } from 'react';

interface Props {
  suggestions: string[];
  onSend: (action: string) => void;
  disabled: boolean;
}

export function ActionInput({ suggestions, onSend, disabled }: Props) {
  const [action, setAction] = useState('');

  const handleSubmit = () => {
    if (!action.trim() || disabled) return;
    onSend(action.trim());
    setAction('');
  };

  return (
    <div>
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Suggested actions:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setAction(s)}
                disabled={disabled}
                style={{
                  padding: '0.3rem 0.6rem', fontSize: '0.85rem', cursor: 'pointer',
                  background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: 4,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={action}
          onChange={e => setAction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={disabled}
          placeholder="Type your action..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !action.trim()}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          {disabled ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create EventCard**

```tsx
// packages/frontend/src/components/EventCard.tsx
interface EventChoice {
  label: string;
  key: string;
}

interface Props {
  event: {
    id: string;
    title: string;
    description: string;
    choices?: EventChoice[];
  };
  onChoice?: (eventId: string, choiceKey: string) => void;
}

export function EventCard({ event, onChoice }: Props) {
  return (
    <div style={{
      padding: '1rem', margin: '1rem 0', background: '#fffde7',
      border: '1px solid #ffe082', borderRadius: 8, animation: 'slideIn 0.3s',
    }}>
      <h4 style={{ margin: '0 0 0.5rem' }}>{event.title}</h4>
      <p style={{ margin: '0 0 0.75rem', color: '#555' }}>{event.description}</p>
      {event.choices && onChoice && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {event.choices.map(c => (
            <button
              key={c.key}
              onClick={() => onChoice(event.id, c.key)}
              style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Create GameOverScreen**

```tsx
// packages/frontend/src/components/GameOverScreen.tsx
import { useGame } from '../context/GameContext';

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const outcomeLabels: Record<string, { label: string; color: string }> = {
    won: { label: 'Victory', color: '#4caf50' },
    lost: { label: 'Defeat', color: '#f44336' },
  };
  const info = outcomeLabels[state.outcome || ''] || { label: 'Game Over', color: '#666' };

  return (
    <div style={{ padding: '2rem', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: info.color }}>{info.label}</h1>
      <p style={{ color: '#666', margin: '1rem 0' }}>
        {state.outcome === 'won'
          ? 'The Yishuv continues to grow and develop. Your committee has laid the foundations for the future.'
          : 'The community has collapsed. The challenges of the era proved too great.'}
      </p>
      <p>Turn {state.turn} of {state.maxTurns} completed</p>
      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}
        style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', marginTop: '1rem' }}
      >
        Back to Menu
      </button>
    </div>
  );
}
```

- [ ] **Step 10: Create GameScreen (main game loop)**

```tsx
// packages/frontend/src/components/GameScreen.tsx
import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { processTurn, getSession } from '../api/game';
import { DMNarrative } from './DMNarrative';
import { ResourcePanel } from './ResourcePanel';
import { ActionInput } from './ActionInput';
import { EventCard } from './EventCard';
import { GameOverScreen } from './GameOverScreen';

export function GameScreen() {
  const { state, dispatch } = useGame();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (state.sessionId && state.turn === 0) {
      getSession(state.sessionId).then(data => {
        if (data.session) {
          // Generate initial DM vignette
          handleSend('The committee begins its work.');
        }
      });
    }
  }, [state.sessionId]);

  const handleSend = async (action: string) => {
    if (!state.sessionId) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await processTurn(state.sessionId, action);
      dispatch({ type: 'SET_TURN', data: result });
      setSuggestions(result.historicalNotes.length > 0 ? ['What would you like to know more about?'] : []);
      setEvents(result.events || []);
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  };

  if (state.gameOver) return <GameOverScreen />;

  return (
    <div style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Toldot</h2>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          Turn {state.turn}/{state.maxTurns} | {state.date}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Left: narrative + actions */}
        <div>
          <DMNarrative narration={state.narration} historicalNotes={state.historicalNotes} />
          {events.map((ev, i) => (
            <EventCard key={ev.id || i} event={ev} />
          ))}
          <div style={{ marginTop: '1rem' }}>
            <ActionInput suggestions={suggestions} onSend={handleSend} disabled={state.loading} />
          </div>
          {state.loading && <div style={{ marginTop: '0.5rem', color: '#666' }}>The DM is thinking...</div>}
          {state.error && <div style={{ marginTop: '0.5rem', color: '#f44336' }}>{state.error}</div>}
        </div>

        {/* Right: resources */}
        {state.state && (
          <div>
            <ResourcePanel
              resources={state.state.resources}
              foundationTracks={state.state.foundationTracks}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Update App.tsx**

```tsx
// packages/frontend/src/App.tsx
import { GameProvider, useGame } from './context/GameContext';
import { HomeScreen } from './components/HomeScreen';
import { EraSelector } from './components/EraSelector';
import { GameScreen } from './components/GameScreen';

function AppContent() {
  const { state } = useGame();
  switch (state.screen) {
    case 'home': return <HomeScreen />;
    case 'new-game': return <EraSelector />;
    case 'playing':
    case 'game-over':
      return <GameScreen />;
    default: return <HomeScreen />;
  }
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
```

- [ ] **Step 12: Update main.tsx**

```tsx
// packages/frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 13: Build and verify**

Run: `npm run build -w packages/frontend`
Expected: Vite compiles without errors

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: React frontend with game screen, resource panel, action input"
```

---

### Task 9: End-to-end integration test

**Files:**
- Modify: `packages/backend/src/app.module.ts` (already done in Task 7)
- No new files — test the full pipeline

- [ ] **Step 1: Start the server**

```bash
cd packages/backend
npx nest start &
```

- [ ] **Step 2: Test API endpoints**

Run: `curl http://localhost:3001/api/eras`
Expected: JSON array with `1904-second-aliyah`

Run: `curl -X POST http://localhost:3001/api/session -H "Content-Type: application/json" -d '{"eraId":"1904-second-aliyah"}'`
Expected: JSON with `session.id`

- [ ] **Step 3: Test a full turn**

```bash
SESSION_ID=$(curl -s -X POST http://localhost:3001/api/session -H "Content-Type: application/json" -d '{"eraId":"1904-second-aliyah"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).session.id))")
curl -X POST http://localhost:3001/api/turn -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION_ID\",\"action\":\"Allocate 100 funds to build housing in Petah Tikva\"}"
```

Expected: JSON with `narration`, `turn: 1`, updated `state.resources`

- [ ] **Step 4: Start frontend and verify**

```bash
cd packages/frontend && npx vite --port 5173
```

Open `http://localhost:5173` — expected: game loads, eras list, new game creates session, turn flow works

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: end-to-end integration working"
```

---

### Task 10: Create JournalView and session export

**Files:**
- Create: `packages/frontend/src/components/JournalView.tsx`
- Modify: `packages/frontend/src/components/GameScreen.tsx` (add journal toggle)

- [ ] **Step 1: Create JournalView component**

```tsx
// packages/frontend/src/components/JournalView.tsx
import { useEffect, useState } from 'react';
import { getSession } from '../api/game';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export function JournalView({ sessionId, onClose }: Props) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    getSession(sessionId).then(data => setSession(data.session)).catch(() => {});
  }, [sessionId]);

  if (!session) return <div>Loading...</div>;

  return (
    <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Journal</h2>
        <button onClick={onClose} style={{ cursor: 'pointer' }}>Close</button>
      </div>
      <p style={{ color: '#666' }}>Era: {session.eraId} | Turns: {session.currentTurn}</p>
      <p>Historical notes and session summary will appear here as the game progresses.</p>
    </div>
  );
}
```

- [ ] **Step 2: Add journal toggle to GameScreen**

```tsx
// Add state to GameScreen.tsx
const [showJournal, setShowJournal] = useState(false);
if (showJournal) return <JournalView sessionId={state.sessionId!} onClose={() => setShowJournal(false)} />;
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: JournalView and session export"
```

---

### Task 11: Polish, error states, and loading UX

**Files:**
- Modify: `packages/frontend/src/components/GameScreen.tsx` (improve loading states)
- Modify: `packages/frontend/src/components/HomeScreen.tsx` (error state for failed session load)
- Create: `packages/frontend/src/index.html` (update title)

- [ ] **Step 1: Update index.html title**

```html
<title>Toldot — Educational Game</title>
```

- [ ] **Step 2: Add CSS reset and basic styling**

```css
/* Add to main.tsx or a style tag */
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafafa; }
```

- [ ] **Step 3: Test loading, error, and empty states**

- Ollama is down → turn should show error and allow retry
- Invalid session ID → error message
- Empty eras directory → empty list (handled by EraService)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "polish: error states, loading UX, title"
```

---

### Task 12: Beads import and task refactoring

**Files:**
- Create: `.beads/` (already exists — use existing `bd init`)
- Run: `bd import` to import refactored tasks from the plan

- [ ] **Step 1: Verify beads is initialized**

```bash
bd list
```

Expected: empty list (existing tasks are Godot-specific, not imported)

- [ ] **Step 2: Create beads import JSONL for the new tasks**

The 11 tasks above map to beads issues. Create a JSONL file with the task structure.

- [ ] **Step 3: Import into beads**

```bash
bd import beads/toldot-tasks.jsonl
```

- [ ] **Step 4: Verify tasks are ready**

```bash
bd ready --json
```

Expected: 12 tasks listed

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: import refactored beads tasks"
```