# W575 — Command Horizon Live Gameplay Proof Change Record

## Scope

Adds a source-controlled review inventory and Codex-ready live gameplay evidence contract for the existing Command Horizon vertical slice. This is testability, proof planning, and safety hardening only; it does not add a district, public access bypass, identity implementation, content action, remote service, or commercial feature.

## Source changes

- `config/w575-command-horizon-live-gameplay-contract.mjs` — exact access lanes, required evidence, no-bypass and no-automatic-approval contract.
- `assets/js/city/eon-city-command-horizon-proof-manifest.js` — pure four-region and control-group review manifest.
- `e2e/w575-command-horizon-live-gameplay.spec.js` — opt-in Codex preview template that requires an approved URL and an external, human-created authenticated storage state.
- `scripts/w575-command-horizon-live-gameplay-gate.mjs` — prevents OAuth/CAPTCHA automation, client-side test unlocks, credentials, telemetry, auto-confirmation and automatic certification claims.
- `tests/unit/w575-command-horizon-live-gameplay.test.mjs` — access, review inventory, boundary and truth coverage.
- `docs/W575_COMMAND_HORIZON_VERTICAL_SLICE_AND_LIVE_GAMEPLAY_PROOF_BOARD_2026-07-03.md` — approved W575 scope board.
- `docs/CODEX_W575_COMMAND_HORIZON_DEEP_GAMEPLAY_RUNBOOK_2026-07-03.md` — Codex preview/evidence runbook.
- `scripts/run-current-unit-suite.mjs` and `package.json` — W575 certification registration.

## Explicit non-goals

No Google/OAuth bypass, CAPTCHA automation, credentials in source, preview/prod deployment, real gameplay pass claim, physical-device claim, test telemetry, screenshot/video upload, account access, storage session creation, new district, AI task, mission, reward, payment, subscription, entitlement, social/multiplayer, remote assets or remote services.
