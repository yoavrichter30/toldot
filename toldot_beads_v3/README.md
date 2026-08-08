# Toldot Beads task bundle

This bundle converts the Toldot Yishuv 1904 microtask plan into current Beads JSONL interchange records.

## Contents

- `beads/all_tasks.jsonl` — 242 Beads records: 5 gate epics and 237 tasks.
- `beads/g0_g1_starter.jsonl` — recommended initial import for proving the Qwen workflow before importing UI/content work.
- `beads/import/00_g0.jsonl` through `04_g4.jsonl` — incremental gate imports.
- `task_packets/` — one detailed YAML execution packet per task.
- `human/human_worklist.md` and `.yaml` — tasks that require human judgment, visual work, licensing, research approval, or playtesting.
- `scripts/import_beads.sh` — initializes Beads without overwriting the planned AGENTS.md and imports tasks.
- `scripts/validate_beads_jsonl.py` — validates IDs and references in a complete JSONL file.

## Ownership counts

- Qwen tasks: 210
- Human-required tasks: 10
- Strong-model draft + human approval tasks: 13
- Total executable tasks: 237

## Recommended start

Copy this bundle into the root of the Toldot repository, preserving the folders, then run:

```bash
brew install beads
./scripts/import_beads.sh starter
```

The script uses `bd init --prefix toldot --skip-agents --non-interactive`. `--skip-agents` is intentional because task T001 creates the project's strict AGENTS.md.

Inspect ready work:

```bash
bd ready --json
bd list --label human:required --json
bd list --label executor:qwen --json
bd show toldot-t001-q01
```

Use a local UI such as `beads-ui`, Pearl, or Foolery after import. Beads/Dolt remains the authoritative state; the JSONL files are import/interchange files.

## Labels

- `executor:qwen` — safe to assign to the constrained Qwen agent.
- `executor:strong_model` — use a stronger model; a human must approve.
- `executor:human` — requires human judgment or action.
- `human:required` — do not close based only on Qwen output.
- `human:review-required` — a strong model can draft, but a human approval is required.
- `placeholder:allowed` — this asset can wait while a placeholder is used.
- `work:visual_asset`, `human-type:asset_generation` — image or asset work.

## Import scope

Do not import `human_worklist.yaml` into Beads; it is a filtered planning view. Import the JSONL files under `beads/`.
