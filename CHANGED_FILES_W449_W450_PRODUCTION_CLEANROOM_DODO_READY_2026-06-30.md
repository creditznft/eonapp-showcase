# W449–W450 changed files

## W449 — production cleanroom

- `vite.config.mjs` — replaces repository HTML discovery with an explicit route-contract + system-document allowlist.
- `config/w449-production-cleanroom-contract.mjs` — defines active/legacy build boundaries.
- `scripts/w449-production-cleanroom-gate.mjs` — validates route-only Vite input, active import fence and optional `dist/` quarantine.
- `tests/unit/w449-production-cleanroom.test.mjs` — regression coverage.

## W450 — Dodo approval-readiness

- `config/w450-dodo-approval-readiness-contract.mjs` — records the approval-pending Dodo decision, 7-day planned trial rules, fail-closed entitlement semantics and external proof matrix.
- `assets/js/commerce/dodo-approval-readiness.js` — public-safe non-network status and fail-closed checkout request boundary.
- `assets/js/product/eonapp-product-scope.js` — identifies Dodo as approval-pending while checkout and entitlement remain inactive.
- `assets/js/commerce/billing-commercial-status.js`, `billing.html` — truthfully show that Dodo review is in progress and no checkout/trial exists.
- `scripts/w450-dodo-approval-readiness-gate.mjs`, `tests/unit/w450-dodo-approval-readiness.test.mjs` — regression coverage.
- `scripts/run-current-unit-suite.mjs`, `package.json` — include W449/W450 in current certification and source-foundation verification.

## W451 — legacy inventory

- `config/w451-legacy-source-inventory-contract.mjs`, `scripts/w451-legacy-source-inventory.mjs`, `tests/unit/w451-legacy-source-inventory.test.mjs` — full-file classification, active-import proof and review-only candidate list; no deletion is performed.

## Documentation

- `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md` — locked remaining-work, deployment, trial and Codex-handoff program.
