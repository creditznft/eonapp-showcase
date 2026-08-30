# EONAPP R4-COMM-01 Start Here — 2026-06-26

## Snapshot

This source snapshot continues R4/W376 with a **Graphite-default appearance
migration** and a deliberately inactive, entitlement-first commercial plan.

## Implemented source work

- **Graphite** is the default theme for new and previously implicit local
  profiles. Explicit Graphite, Classic EON and System choices are preserved.
- The Apps deck now uses the shared theme tokens instead of a fixed Classic EON
  palette, so the flagship Apps surface follows the calm neutral dark shell.
- `R4-COMM-01` adds a versioned source contract and gate for theme migration,
  commercial inactivity, referral boundaries and planned catalogue truth.
- The current Apps decision record is clarified: **Razorpay is the primary
  India-first merchant candidate; Cashfree is the fallback benchmark.** PayU is
  not selected for this roadmap.
- `EON Invite` remains share-only. There is no subscription percentage,
  commission, payout, affiliate income, cash/crypto/points value or
  multi-level reward.
- The planned catalogue is documented but **not displayed, sold or activated**:
  Free core, future Plus/Studio memberships, future one-time official outcome
  packs, and later Business/Enterprise only after their real deliverables
  exist.

## Read in this order

1. `docs/R4_COMM01_GRAPHITE_THEME_AND_MONETISATION_DECISION_2026-06-26.md`
2. `config/r4-comm01-graphite-commerce-contract.mjs`
3. `CURRENT_HANDOFF_2026-06-26/R4_W376_START_HERE.md`
4. `program/R4_PROGRAM_LEDGER_2026-06-26.json`
5. `release-evidence/W276_DATA_SURVIVAL_REAUDIT_2026-06-26/README.md`

## Local validation completed

```bash
npm run qa:r4-comm01-graphite-commerce
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run security:secret-scan
```

Observed in this snapshot:

- R4-COMM-01 gate: passed
- current-product unit suite: **319 passed, 0 failed**
- ESLint: **0 errors, 0 warnings**
- production build, smoke check, static site audit and launch-readiness: passed
- workspace secret scan: passed

## Next approved order

1. **A-03:** evolve the Blueprint schema and add the next 12 free institutional
   systems plus ten matching local workflow templates.
2. **A-04:** specify the first 24 maintained Pro Pack deliverables; build the
   first six completely before any paid catalogue is shown.
3. **M-00:** merchant/KYC, tax/legal, refund/cancellation, billing and support
   operations design.
4. **M-01:** one Razorpay test-mode one-time official Pack proof with a hosted
   checkout, server-verified webhook, idempotent personal licence,
   refund/chargeback reversal and support receipt. Select Cashfree only if
   Razorpay is not approved or lifecycle proof fails.

## Release honesty

This is source-ready, **not commercial-launch-ready**. Do not claim:

- live price pages, checkout, subscriptions, packs, entitlements, merchant
  approval, refunds or payment-provider activation;
- referral income/commission/discount/payout;
- Preview/production, browser/device, PWA install or update/rollback proof;
- live OAuth, external workflow connections, licensed market data or financial
  advice approval.

The W276 NO-GO evidence board remains a hard blocker until real external
upgrade/rollback/restore evidence exists.
