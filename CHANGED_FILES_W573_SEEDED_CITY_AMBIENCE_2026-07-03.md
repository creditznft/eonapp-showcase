# W573 — Seeded City Ambience Change Record

## Scope

Adds a deterministic, local-only Command Horizon ambience plan: capped decorative NPC cues, light-pod traffic, static wayfinding signs, and visual moments. No W573 capability leaves the browser or represents real activity.

## Source changes

- `assets/js/city/eon-city-seeded-ambience.js` — pure W573 plan, validation, and truth contract.
- `assets/js/city/eon-city-play-babylon.js` — local procedural integration for signs, traffic, visual moments, and W570 ambient-NPC cue motion.
- `tests/unit/w573-seeded-city-ambience.test.mjs` — deterministic, Lite fallback, pause/reduced, boundary, and gate tests.
- `scripts/w573-seeded-city-ambience-gate.mjs` — W573 source gate.
- `scripts/run-current-unit-suite.mjs` and `package.json` — certification registration.
- `docs/W573_SEEDED_CITY_AMBIENCE_SCOPE_BOARD_2026-07-03.md` — approved scope and limits.

## Explicit non-goals

No real-time calendar/events, notification, audio, voice, microphone, network, remote asset, binary loader, telemetry, persistence, account/private data, payment, entitlement, reward, ownership, route action, autonomous work, deployment, or device proof.
