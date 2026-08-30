# W476-B Changed Files — 2 July 2026

## Added

- `config/w476-b-production-proof-contract.mjs`
- `scripts/w476-b-production-proof.mjs`
- `scripts/w476-b-production-proof-gate.mjs`
- `tests/unit/w476-b-production-proof.test.mjs`
- `docs/W476_B_PRODUCTION_BROWSER_PROOF_PROTOCOL_2026-07-02.md`
- `docs/EONAPP_MASTER_WAVE_PLAN_W476_W480_2026-07-02.md`
- `EVIDENCE/W476_B/README.md`
- `README_W476_B_PRODUCTION_BROWSER_PROOF_2026-07-02.md`
- `W476_B_QUALITY_GATE_REPORT_2026-07-02.md`
- `W476_B_KNOWN_LIMITS_2026-07-02.md`
- `CODEX_W476_B_SAFE_MERGE_AND_PROOF_HANDOVER_2026-07-02.md`

## Updated

- `functions/csp-report.js` — preview-safe same-origin OPTIONS response; never reflects a caller-controlled Origin header.
- `tests/unit/w476-csp-reporting.test.mjs` — new preview-origin security test.
- `scripts/w476-release-verify.mjs` — W476-B source gate/tests/syntax checks.
- `scripts/run-current-unit-suite.mjs` — W476-B coverage is in the current certification suite.
- `package.json` — W476-B source and opt-in proof commands.

## Deliberately not changed

- No payment/Dodo/billing/checkout/trial/entitlement logic.
- No secret, `.env`, token, browser profile, account/customer data, generated public evidence or local model data.
- No Local AI image/video adapter or arbitrary LAN endpoint.
- No route retirement/deletion; W477 remains the controlled cleanup wave.
