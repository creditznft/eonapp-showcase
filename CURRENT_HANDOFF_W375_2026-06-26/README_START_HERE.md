# EONAPP W375 continuation handover — Market Intelligence

## What changed

W375 converts the canonical `/trade` route to **Market Intelligence**, a local-first manual/CSV research workspace. Historical live-trading, connector, relay, sandbox and signal modules have been quarantined under `archive/retired-trade-legacy/`.

Start with:

1. `AUDIT/MARKET_INTELLIGENCE_CEO_EXECUTION_PLAN_W375_2026-06-26.md`
2. `scripts/w375-market-intelligence-safety-gate.mjs`
3. `tests/unit/w375-market-intelligence.test.mjs`
4. `AUDIT/W375_IMPLEMENTATION_AND_VALIDATION_REPORT_2026-06-26.md`
5. `AUDIT/W375_CEO_CONTINUATION_DECISIONS_2026-06-26.md`
6. `CURRENT_HANDOFF_W375_2026-06-26/BUILD_TEST_DEPLOY_RUNBOOK.md`

## Non-negotiable product boundary

- No broker/exchange connection, account credential, order, custody or copy-trading path.
- No personalised investment advice or profit/accuracy claim.
- Forecast Oracle has no stake, prize, reward, token, payout, cash-out, transfer, tradable contract, public market or automatic resolution.
- External/real-time/licensed data remains disabled until W380 decision gate passes.

## Validation snapshot

- 315 current-product unit tests passed; ESLint is clean (zero warnings/errors).
- W375 passed 37/37 safety checks; W242 passed after a fresh build.
- This is source-ready only: no Preview/production deployment, live data feed, browser/device evidence, or live OAuth configuration is asserted.
