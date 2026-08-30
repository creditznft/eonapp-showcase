# W255 changed files

## Runtime / contract

- `assets/js/city/city-landmark-registry.js` — new canonical seven-landmark registry.
- `assets/js/city/city-world-state.js` — stable persisted IDs imported from the registry.
- `assets/js/city/eon-city-2d-engine.js` — City Lite district projection derives from registry.
- `assets/js/eon-operator-map.js` — shared prepared-action flow in City Lite.
- `assets/js/eon-city-3d-station.js` — shared prepared-action flow in Visual Tour.
- `assets/js/city/eon-city-play-babylon.js` — Play landmark projection derives from registry.
- `assets/js/city/city-prepared-action.js` — generic mode-aware prepared City action.

## Tests and gates

- `tests/unit/w255-city-landmark-registry-parity.test.mjs`
- `scripts/w255-city-parity-registry-gate.mjs`
- `package.json` and `scripts/run-current-unit-suite.mjs`
- Updated W213/W216/W250 tests to assert the canonical registry rather than stale duplicated tables.

## Documentation and evidence

- `CHANGELOG_W255_CITY_PARITY_REGISTRY_2026-06-25.md`
- `HANDOFF/W255_CITY_PARITY_REGISTRY_2026-06-25/`
- `EVIDENCE/W255_CITY_PARITY_REGISTRY_2026-06-25/`
- R3 roadmap, decision log, status, root start and continuation documents.

## Explicitly unchanged product boundaries

No change to browser-local user-data schemas, provider credentials, wallet UX, Polygon runtime calls, token/reward/loot/referral value, payments, marketplace behavior, public publishing, multiplayer or automatic navigation.
