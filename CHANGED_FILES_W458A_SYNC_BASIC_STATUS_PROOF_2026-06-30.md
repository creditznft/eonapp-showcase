# W458.1 — Sync Basic status-proof: changed files

## Added

- `scripts/w458a-sync-basic-status-proof.mjs`
  - HTTPS-only, opt-in public status probe for `/api/sync/status`.
  - Dry by default; omits cookies, bodies and credentials.
  - Creates no record/tombstone mutation and never stores a response body.
- `config/w458a-sync-basic-status-proof-contract.mjs`
  - Explicit read-only/manual-proof contract.
- `scripts/w458a-sync-basic-status-proof-gate.mjs`
  - Static checks for endpoint, dry-run, no-write/no-credential behavior and D1/manual-proof exclusions.
- `tests/unit/w458a-sync-basic-status-proof.test.mjs`
  - Dry-run, transparent status, CLI opt-in and external-proof coverage.
- `EONAPP_W458A_SOURCE_IMPLEMENTATION_AND_VALIDATION_2026-06-30.md`
  - Scope, validation and non-claim boundary.

## Updated

- `scripts/run-current-unit-suite.mjs` — includes W458.1 tests.
- `package.json` — adds `qa:w458a-sync-basic-status-proof` and W449–W458.1 foundation verification.
- `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md` — records W458.1 while leaving D1/device proof blocked.
- `BUNDLE_CONTENTS.md` — records the W458.1 checkpoint.
