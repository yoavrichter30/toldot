# Toldot — Browser-Based DnD Educational Game with LLM Game Master

**Date:** 2026-08-07
**Status:** Design Spec (pre-implementation)
**Author:** Brainstorming → Design process

## Overview

Toldot becomes a browser-based DnD-like educational game where a local LLM (via Ollama) serves as the Dungeon Master, narrating real historical events and adjudicating player actions within a validated resource engine. The game is designed for history students (high school and above) to learn about the different eras in the timeline of the people of Israel.

The original Godot strategic simulation design (1904-1909, Second Aliyah) is the foundation; this spec converts it to a browser-based, LLM-DM-driven experience with pluggable eras.

## Core Design Decisions

| Decision | Choice |
|---|---|
| DM authority | LLM decides, engine verifies — LLM proposes structured JSON effects, validation engine checks resource bounds and era rules before applying |
| Player role | Coordinating Yishuv committee (resource manager, not individual character) |
| Round structure | Monthly turn with narrative vignette (~60-126 turns per era) |
| Frontend | React + TypeScript (Vite) |
| Backend | NestJS (TypeScript) |
| State persistence | SQLite via better-sqlite3 |
| LLM runtime | Ollama (local), model configurable per era |
| Educational approach | Narrative + optional historical notes toggles |
| Outcome grading | Bronze/silver/gold (graded, not pass/fail) |

## Architecture

### Layer diagram

```
Browser (React + TS) ←→ NestJS Server ←→ Ollama (local)
                          │
                       SQLite
                          │
                    eras/<era_id>/ (data)
```

### Pipeline per turn

1. Player submits action (free-text or suggested) → `POST /api/turn`
2. NestJS `DMOrchestrator` builds prompt: era system prompt + compressed game state + player action
3. Calls Ollama → receives structured JSON response
4. `ValidationEngine` checks each proposed effect:
   - Resource bounds (funds in [0, max], trust in [0, 100], etc.)
   - Reference validity (location/cohort IDs exist)
   - Historical plausibility (soft rules from era prompt)
   - No contradictions or duplicates
5. `StateManager` applies valid effects, clamps invalid ones, updates SQLite
6. Returns response to frontend: narration + applied changes + events + historical notes

### Error handling

| Error | Handling |
|---|---|
| Malformed JSON from LLM | Re-prompt once with parse error; fallback narration on second failure |
| Impossible effects (out of bounds) | Clamp to boundary, log rejection, continue |
| All effects rejected | Return neutral narration ("The season passes without incident.") |
| Ollama unavailable | Return error to user to check Ollama |

## Eras (Pluggable Content)

### Directory structure

```
eras/<era_id>/
  era.yaml              — metadata: date range, max_turns, model
  config.json           — locations, cohorts, resources, foundation tracks
  prompt_template.md    — system prompt for the LLM DM
  grounding_docs.md     — curated historical facts (the DM's textbook)
  events.json           — optional: date-triggered historical event templates
  win_loss.md           — optional: win/loss condition documentation
```

### Automatic discovery

The NestJS server scans `eras/` on startup. Each valid directory (contains `era.yaml` + `config.json` + `prompt_template.md`) appears in the player's era selector. No code changes needed to add a new era.

### Adding a new era (complete walkthrough)

1. `mkdir -p eras/<era-id>/`
2. Write `era.yaml` (id, title, date range, max_turns, model)
3. Write `config.json` (starting locations, resources, cohort templates, foundation tracks)
4. Write `grounding_docs.md` (2-5 pages of key historical facts)
5. Write `prompt_template.md` (system prompt with era-specific framing)
6. (Optional) Write `events.json` (date-triggered event templates)
7. (Optional) Write `win_loss.md` (documentation of win/loss conditions)
8. Era is auto-discovered on next server start.

## Data Model

### GameState (server-side, TypeScript)

```typescript
interface GameState {
  date: string;                          // ISO "1905-03-01"
  turn: number;
  resources: {
    funds: number;
    people: number;
    public_trust: number;               // 0-100
    ottoman_tolerance: number;          // 0-100
  };
  foundation_tracks: {
    settlement_viability: number;       // 0-100
    economic_independence: number;      // 0-100
    hebrew_public_life: number;         // 0-100
    self_organization: number;          // 0-100
  };
  locations: LocationState[];
  cohorts: CohortState[];
  projects: ProjectState[];
  events: EventState[];
  win_loss: WinLossState;
}
```

### LLM output schema (per turn)

```typescript
interface DMResponse {
  narration: string;
  proposed_effects: Effect[];
  spawned_events: Event[];
  historical_notes: string[];
  roll?: { reason: string; result: number; threshold: number };
  dm_questions: string[];
}

interface Effect {
  target: "funds" | "people" | "public_trust" | "ottoman_tolerance"
        | "location.housing" | "location.health" | "location.water"
        | "cohort.retention" | "cohort.health" | "project.progress";
  id?: string;
  delta: number;
  reason: string;
}
```

### SQLite schema

Three tables: `sessions` (game state), `turn_log` (full turn history, enables replay), `events_log` (triggered events per session).

## LLM Integration

### Ollama client

Single NestJS provider wrapping Ollama's HTTP API (`http://localhost:11434`). Supports `chat`, `listModels`, `ping`.

### Model choice

Alpha recommendation: `qwen3:8b` (or `qwen2.5:7b`/`qwen3:4b` fallback). Model configurable per era in `era.yaml`.

### JSON reliability

- Strict schema in prompt with examples
- One parse-retry on failure: feed error back to model
- `format: "json"` parameter in Ollama API call
- Clamp-tolerant engine — never crashes on invalid values

### Context budget

- Turn prompt: ~1.5-3K tokens (era prompt + compressed state + action)
- Response: ~400-800 tokens (narration + effects JSON)
- Full conversation history is NOT sent each turn — compressed previous-turn summary (2-3 sentences) instead

## Frontend

### Screens

| Route | Component | Purpose |
|---|---|---|
| `/` | HomeScreen | New game or load existing |
| `/new-game` | EraSelector | Pick an era (one per era directory) |
| `/game/:id` | GameScreen | Main game loop |
| `/game/:id/journal` | JournalView | Historical notes accumulated |

### GameScreen layout

- DM Narrative panel (markdown, collapsible historical notes)
- Resource panel (funds, people, trust, tolerance as bars)
- Foundation tracks (progress bars)
- Suggested actions (from DM's questions) + free-text input
- Event cards (pop in when events fire, with choice buttons)
- Turn counter ("Turn 12/126")

### State management

React context + `useReducer`. Server is source of truth; client caches last response.

## Win/Loss and Outcomes

### Graded outcomes (bronze/silver/gold)

Rather than binary pass/fail, the game evaluates at turn limit or when automatic conditions trigger:

- **Gold** — all major objectives met (foundation tracks strong, key projects completed, high retention)
- **Silver** — partial success (some objectives met, the community survived and grew)
- **Bronze** — the community survived but struggled (objectives mostly unmet, but the era continued)
- **Loss** — automatic loss conditions triggered (insolvency, collapse, depopulation)

### Automatic loss conditions

- Treasury insolvent for 6 consecutive turns
- Fewer than 2 viable locations for 6 consecutive turns
- Public trust below 10 for 4 consecutive turns

### DM epilogue

At game end (win, loss, or turn limit), the DM receives a final prompt to summarize what was accomplished, what failed, and what the era looks like. This is stored as the session's epilogue.

## NestJS Module Structure

```
src/
  modules/
    era/          — loads eras/<era_id>/ directory, validates config
    session/      — creates/loads/saves GameSession (SQLite)
    dm/           — DMOrchestrator: builds prompts, calls Ollama, parses JSON
    validation/   — ValidationEngine: checks proposed effects
    state/        — StateManager: applies deltas, advances turn, win/loss
  controllers/
    game.controller.ts  — POST /api/turn, GET /api/session/:id
  clients/
    ollama.client.ts    — Ollama HTTP API wrapper
```

## Testing Strategy

### Unit tests (Jest)

- DMOrchestrator: prompt construction, parse-retry logic, malformed handling
- ValidationEngine: each effect type, bounds, invalid IDs, contradictions, clamping
- StateManager: apply/rollback, turn advancement, win/loss evaluation
- EraModule: load era, validate config, error on missing files

### Integration tests

- Ollama integration with known model (against actual Ollama)
- Full turn pipeline with mocked Ollama
- SQLite persistence: create, save, load, replay

### Headless replay tests

- Fixture era with known config + scripted action sequence
- Mocked Ollama returns canned JSON
- Verify deterministic state changes

## Beads Refactoring

The existing 237 Godot-specific tasks will be replaced with browser-based tasks. The gate structure (G0-G4) and task-decomposition philosophy are preserved. The refactored tasks will be generated from this design spec during the implementation planning phase.

### Gate mapping

| Gate | Original (Godot) | New (Browser) |
|---|---|---|
| G0 | Godot project setup, test runner, CI | NestJS scaffold, React scaffold, test runner, CI |
| G1 | GDScript model classes | TypeScript models + era config + SQLite schema |
| G2 | Godot UI (map, panels) | React components (GameScreen, ResourcePanel, etc.) |
| G3 | Historical events, localization | Era content, grounding docs, prompt templates, events |
| G4 | Save/load, tutorial, polish | Export, journal, balance tuning, playtesting |

## Appendices

### A. Existing assets preserved

- The 12-location map concept (now data-driven, not rendered in Godot)
- The 4 foundation tracks
- The aliyah cohort system
- The historical research (will be adapted into grounding docs)
- The events.json concept
- The win/loss condition framework

### B. Explicit non-goals (alpha)

- No multiplayer or classroom backend
- No teacher dashboard
- No persistent user accounts
- No modding API
- No custom LLM training or fine-tuning
- No real-time multiplayer LLM sessions
- No audio or music
- No complex map rendering (text-based location list initially)