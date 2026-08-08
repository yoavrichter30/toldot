#!/usr/bin/env bash
set -eu

MODE="${1:-starter}"
if ! command -v bd >/dev/null 2>&1; then
  echo "bd is not installed. Install Beads first: brew install beads" >&2
  exit 1
fi

if [ ! -d .beads ]; then
  bd init --prefix toldot --skip-agents --non-interactive
fi

case "$MODE" in
  starter)
    FILE="beads/g0_g1_starter.jsonl"
    python3 scripts/validate_beads_jsonl.py "$FILE"
    bd import "$FILE" --dry-run --json
    bd import "$FILE" --json
    ;;
  all)
    FILE="beads/all_tasks.jsonl"
    python3 scripts/validate_beads_jsonl.py "$FILE"
    bd import "$FILE" --dry-run --json
    bd import "$FILE" --json
    ;;
  gates)
    for FILE in beads/import/*.jsonl; do
      echo "Importing $FILE"
      bd import "$FILE" --dry-run --json
      bd import "$FILE" --json
    done
    ;;
  *)
    echo "Usage: $0 [starter|all|gates]" >&2
    exit 2
    ;;
esac

bd ready --json
