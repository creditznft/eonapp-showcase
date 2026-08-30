# EONAPP R4 / W376 Start Here — 2026-06-26

## Snapshot

This source snapshot continues W375 Market Intelligence with the first R4 portfolio-program implementation.

**Implemented source lanes**

- **R4-00** — W276 data-survival evidence record restored as an explicit **NO-GO** board. It does not claim upgrade, rollback, PWA, browser, or device recovery proof.
- **R4-01** — canonical R4 Program Ledger for product, release, commercial, and evidence decisions.
- **R4-02** — information architecture shifts to four primary surfaces: EONBOT, Workspace, Apps, and EON City. `/trade` remains as a compatibility deep route under Apps.
- **A-00 / A-01 / A-02** — Apps expanded from a four-collection deck to five collections, 20 free official versioned Blueprints, and 10 official local-only approval-first workflow templates.
- **I-01** — `Insights & Forecasts` becomes an Apps collection with five desks: Market Intelligence, Business Intelligence, Forecast Studio, Research Journal, and Local Data Lab.

## Product decisions locked in source

- There is **no top-level EON Signal Lab brand**. Insights & Forecasts belongs inside Apps.
- `/trade` keeps the established `Market Intelligence` route and heading for compatibility but is discovered through Apps.
- Forecasts remain private, local, non-monetary, non-tradable, non-public, and non-economic.
- No broker/exchange connection, orders, custody, copy trading, live price feed, personalised trade advice, or prediction market.
- All new Blueprints and Workflows are free, local-first, approval-first, and do not contact external providers.
- Razorpay is the future primary India-first merchant candidate and Cashfree the fallback benchmark. The detailed R4-COMM-01 decision supersedes earlier PayU fallback wording. No payment code, checkout, entitlement, subscription, wallet, payout, reward, or merchant configuration is enabled.

## Read in this order

1. `docs/R4_APPS_BLUEPRINTS_COMMERCE_DECISION_2026-06-26.md`
2. `program/R4_PROGRAM_LEDGER_2026-06-26.json`
3. `docs/W376_APPS_INSIGHTS_IMPLEMENTATION_2026-06-26.md`
4. `release-evidence/W276_DATA_SURVIVAL_REAUDIT_2026-06-26/README.md`
5. `CURRENT_HANDOFF_2026-06-26/BUILD_TEST_DEPLOY_RUNBOOK_W359_W374B.md`

## Validation run for this source snapshot

```bash
npm ci
npm run qa:r4-apps-foundation
npm run test:unit
npm run lint
npm run build
npm run smoke:build
npm run audit:site
```

Observed locally before packaging:

- `qa:r4-apps-foundation`: passed
- current product unit suite: 315 passed, 0 failed
- ESLint: 0 errors, 0 warnings
- Vite production build: passed
- build smoke test: passed
- static site audit: passed

## Release honesty

This is source-ready, **not release-certified**. Do not claim:

- Cloudflare Preview or production deployment proof
- browser, Android, iPhone, PWA install, upgrade, rollback, IndexedDB, cache, or recovery proof
- live OAuth proof
- live payment processing, subscriptions, entitlements, refunds, or merchant approval
- licensed market data, live market claims, or financial-advice compliance approval

The W276 NO-GO board must remain in place until real external recovery evidence is collected.
