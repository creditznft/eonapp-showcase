# W259 Changed Files

## Runtime and test boundary

- `assets/js/city/city-preview-evidence.js`
- `assets/js/eon-city-play-station.js`
- `assets/css/eon-city-play.css`
- `tests/unit/w259-city-preview-evidence.test.mjs`
- `scripts/w259-city-preview-evidence-gate.mjs`
- `scripts/run-current-unit-suite.mjs`
- `package.json`

## Evidence and handover

- `EVIDENCE/W259_CITY_PREVIEW_EVIDENCE_2026-06-25/`
- `HANDOFF/W259_CITY_PREVIEW_DEVICE_EVIDENCE_2026-06-25/`
- `CHANGELOG_W259_CITY_PREVIEW_EVIDENCE_KIT_2026-06-25.md`
- `SOURCE_ORIGIN_W259_CITY_PREVIEW_EVIDENCE_2026-06-25.md`
- `W259_CHANGED_FILES_2026-06-25.md`
- Root readme, continuation, bundle and R3 decision/status/roadmap documents.

## Closeout continuity repair

- Re-applied the binding R3-F1 archive boundary by removing five restored
  value-surface documents from the active root:
  `kpi-dashboard.html`, `kpi-token-dashboard.html`,
  `live-trading-dashboard.html`, `refund-policy.html`, and
  `wallet-risk.html`.
- Re-applied the binding R3-F2 Tier-3 boundary by removing eight restored
  redirect-only documents from the active root. Their immutable copies remain
  in `archive/retired-route-surfaces/` and Cloudflare redirect rules remain in
  the route contract.
- No W259 data key, City action, Chat/Vault, provider, wallet, chain, value or
  telemetry behavior was widened by this repair.
