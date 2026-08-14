# Toldot — an educational DnD game through the history of the Land of Israel

**Toldot** (Hebrew for "generations") is a browser-based educational game where a large language model plays the role of a **Dungeon Master**, narrating real historical events and adjudicating your decisions. You lead the coordinating committee of the **New Yishuv** during the Second Aliyah (1904–1914) — the generation that built the first Hebrew settlements, revived Hebrew as a spoken language, and laid the foundations for the future state.

It is built for history students and anyone who wants to *experience* an era instead of reading about it.

## What it is

- A living map of the Land of Israel with real settlements (Jaffa, Petah Tikva, Rishon LeZion, Degania, …).
- A chat interface where the Dungeon Master narrates each month and you answer in your own words — the model handles anything you write, advancing or pushing back on the story as it should.
- Every turn is grounded in real history: each DM message carries a **"What really happened"** note with the actual facts.
- A pluggable **era system**: each era is a self-contained folder of content (locations, events, objectives, and the DM's knowledge). Adding a new starting point is pure data, no code.

## Features

- LLM Dungeon Master via [OpenRouter](https://openrouter.ai) (DeepSeek V4 Flash)
- Interactive SVG map with color-coded settlement viability
- Resources (funds, people, trust, Ottoman tolerance) and four foundation tracks
- Historical events with decisions, suggested actions, and free-form input
- Graded outcomes (gold / silver / bronze / loss)
- Missions and objectives panel, historical journal, and session persistence (SQLite)

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** NestJS + TypeScript
- **Storage:** SQLite (better-sqlite3)
- **LLM:** OpenRouter (OpenAI-compatible API)

## Getting started

### Prerequisites

- Node.js 22+
- An [OpenRouter](https://openrouter.ai) API key

### Run it

```bash
# 1. Install dependencies
npm install

# 2. Set your API key
cp .env.example .env
# edit .env and set OPENROUTER_API_KEY=sk-or-...

# 3. Start backend and frontend together
npm run dev
```

Then open http://localhost:5173.

### Run tests

```bash
npm test -w packages/backend
```

## Project structure

```
eras/                   # Pluggable era content (one folder per starting point)
  1904-second-aliyah/   #   era.yaml, config.json, events.json, grounding docs, prompt
packages/
  frontend/             # React SPA (map, chat, panels)
  backend/              # NestJS API (session, DM orchestration, validation, LLM client)
docs/                   # Design spec and implementation plan
```

## Adding a new era

Create a folder under `eras/<era-id>/` with:

- `era.yaml` — metadata: date range, turn count, model, goal, objectives
- `config.json` — locations, starting resources, foundation tracks, cohort/project templates
- `prompt_template.md` — the Dungeon Master's system prompt
- `grounding_docs.md` — the historical facts the DM draws from
- `events.json` (optional) — scripted historical events with choices

The server discovers eras automatically on startup. No code changes required.

## License

MIT
