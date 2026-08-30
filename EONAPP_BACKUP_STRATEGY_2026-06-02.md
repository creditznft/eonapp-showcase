# EONAPP Backup Strategy — 2026-06-02

Use two backup types:

## Lean code backup — preferred for Codex/local apply

Includes app code, functions, smart contracts, tests, scripts, public assets, current docs, `AUDIT/`, and `CodexDocs/`.

Excludes only bulky historical evidence/proof folders such as:

- `docs/qa/`

This is the best backup to apply to the local repo and continue coding.

## Full archival backup — use occasionally

Includes everything, including `docs/qa/` proof/evidence artifacts. It is much larger and useful for historical preservation, not day-to-day code handoff.

## Current decision

For remaining waves, create lean code backups by default. Create a full archival backup only on request or before final handoff.
