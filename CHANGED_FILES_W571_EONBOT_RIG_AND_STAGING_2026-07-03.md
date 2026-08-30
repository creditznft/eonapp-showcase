# W571 Changed Files — EONBOT Procedural Rig, Visual Skins and Staging

## Baseline correction before W571

- `docs/W534_HISTORICAL_DOCUMENT_INDEX.md` — regenerated with the repository's deterministic W534 writer. The supplied W570 package had omitted its own W570 change record from this generated historical index; this prevented the W534 and W535 checks from agreeing with the rest of the W570 receipt. No runtime behavior changed in this correction.

## W571 implementation

- `assets/js/city/eon-city-eonbot-rig.js` — deterministic local-only rig/staging plan, quality limits, strict validator and read-only plan accessor.
- `assets/js/city/eon-city-play-babylon.js` — renders the bounded source-controlled EONBOT rig and exposes an honest local-only runtime summary. Motion stops when City is paused or reduced effects are active.
- `assets/js/eon-city-play-station.js` — extends the existing captions-first companion panel with an accurate local rig/staging summary; no new destination, action or entitlement control is introduced.
- `scripts/w571-eonbot-rig-and-staging-gate.mjs` — fail-closed source gate for procedural-only assets, real Lite fallback, same safe panel, and privacy/commercial boundaries.
- `tests/unit/w571-eonbot-rig-and-staging.test.mjs` — deterministic quality, staging and safety assertions.
- `scripts/run-current-unit-suite.mjs` / `package.json` — W571 test and cumulative verifier registration.

## W571 boundaries retained

W571 adds no binary asset loader, remote art delivery, asset proxy, microphone or speech session, AI/provider action, account/project/private-data read, route opening, background work, payment/checkout, subscription entitlement, reward, ownership, transfer, email, push notification, social messaging, or production deployment claim. It is source-only visual staging; browser/device review and deployment proof remain separate work.
