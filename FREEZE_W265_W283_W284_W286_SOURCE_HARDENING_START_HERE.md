This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# W265/W283/W284/W286 Source Hardening Freeze — Start Here

## What this freeze is

This is a cumulative source-only continuation freeze built on the verified W287/W288 and retained W263–W285 controls. It adds:

- **W265-A0:** an approved first City district decision for a local, procedural, non-actionable Orientation Hall.
- **W286-A0:** Orientation Hall implementation in City Lite and Visual Tour, with legacy City-state preservation and no Babylon City Play expansion.
- **W283-A0:** owner-only, read-only Cloudflare Pages/D1 inventory and Preview rollback evidence packet.
- **W284-A0:** referral/milestone activation decision packet that remains **not authorised** and fail-closed.
- **W261/W262 decision tree:** future EON Lite/wallet planning boundaries only; no wallet/coin feature is implemented.

It does **not** make EONAPP launch-ready, beta-ready, Cloudflare-ready, referral-ready, wallet-ready, chain-ready, or Lighthouse-verified. W260 remains **NO-GO**.

## Read first

1. `PACKAGE_VALIDATION_W265_W283_W284_W286_SOURCE_HARDENING_2026-06-25.md`
2. `CHANGELOG_W265_W283_W284_W286_SOURCE_HARDENING_2026-06-25.md`
3. `docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md`
4. `docs/W265_FIRST_CITY_DISTRICT_DECISION_2026-06-25.md`
5. `docs/W286_ORIENTATION_HALL_SOURCE_READINESS_2026-06-25.md`
6. `HANDOFF/W283_W284_CLOUDFLARE_D1_EVIDENCE_2026-06-25/CODEX_READONLY_CLOUDFLARE_AND_D1_PROMPT.md`
7. `docs/W261_W262_EON_LITE_WALLET_SAFE_DECISION_TREE_2026-06-25.md`
8. `CODEX_W265_W283_W284_W286_SAFE_MERGE_HANDOVER_2026-06-25.md`

## Reproduce locally

```bash
npm ci
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w265-w286-city-district-expansion
npm run qa:w283-cloudflare-rollback-evidence
npm run qa:w284-referral-activation-decision
npm run qa:current-static-certification:tail
```

## Verified local receipts

- **266/266** approved current-product tests pass.
- ESLint passes with zero warnings.
- Fresh production build reports **194** output files.
- W265/W286 City decision + expansion, W283 read-only evidence, W284 activation decision, retained source/PWA/privacy/support/security/operations gates, static audit/smoke/invariants, secret scan and production dependency audit pass.
- `npm audit --omit=dev` reports **0 known production vulnerabilities**.

The long core wrapper reaches the environment’s five-minute ceiling after completing route synchronization, the full 266-test suite, W216, W228 and W234–W238 stages. Every remaining post-build core gate and the full static tail were replayed separately and passed. A truncated wrapper run is not treated as a green certificate.

## Lighthouse truth

Do not use this sandbox for Lighthouse scores. Managed Chromium reaches the local server but returns `chrome-error://chromewebdata/` and `NO_NAVSTART`. No route has a valid score. W282 must run on a normal desktop/mobile browser-capable environment with raw reports saved outside Git.

## Cloudflare/D1 and referral rule

The existing `REFERRALS_DB`, if one exists, may be inventoried **read-only** by an authenticated owner. The packet permits only deployment metadata, database names, schema metadata, redacted evidence and a Preview rollback rehearsal. It prohibits D1 writes/migrations, Worker bindings, secrets, click/open tracking, short-link records, reward activation, wallet/value ledgers, and production deployment.

## Stop conditions

Do not enable referral/milestone behavior, mutate Cloudflare/D1, deploy a deferred backend/migration, add a wallet/chain/signing runtime, introduce an EON Lite coin/token/balance/transfer/referral-value surface, start beta, or claim launch readiness from this freeze.
