This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W227 — Phase 10 Release-Certification Handover

**Date:** 24 June 2026  
**Baseline:** W226 commercial no-go source  
**Status:** Source-certified release candidate; **not production-approved**.

## What changed in W227

- One product-truth registry maps every public route to `Live`, `Local-only`, `Preview`, `Disabled`, `Future`, or `Retired`, with evidence for each active claim.
- Route contract v2 explicitly retires direct legacy admin, campaign-admin, legacy live-trading dashboard, tools, trust, wallet-risk, and document-index paths.
- The top-right **Invite & Share Center** remains signed-invite / safe Realm identity / local campaign-draft only. It does not share private chat or Vault data and creates no tracking, commission, reward, token, or payout state.
- Whole-tree secret scanning replaces the old diff-only/no-op behavior. CI requires reachable Git history and uses `fetch-depth: 0`.
- The CI unit gate now runs an explicit current-product suite. The old wildcard suite is retained as `test:unit:legacy-diagnostic` only because it asserts historical products that conflict with the W217 contract.
- Old Copilot guidance claiming live Polygon/mainnet status was replaced with the frozen EON Lite research/no-go policy.
- Stale browser tests for monetisation, referral leaderboards, and live-trading dashboards were moved into `archive/retired-tests/`.

## Verification run in this handover

Passed:

```bash
npm ci --include=dev --no-audit --no-fund --prefer-offline
npm run test:unit
npm run qa:w227-release-certification
npm run qa:w145-update-safe-user-data-survival
npm run qa:w209-vault-account-boundary
npm run qa:w216-release-candidate
```

The final release candidate also passed zero-warning lint, build/smoke, static site/PWA/quality gates, and `npm audit --omit=dev` (0 production vulnerabilities).

## Do not misread these results

The local Chromium binary launched but this environment blocks navigation to `http://localhost:4173` with `ERR_BLOCKED_BY_ADMINISTRATOR`. The W227 Playwright spec is discoverable, but it has **not** passed interaction/visual testing here.

The extracted source does not contain usable Git history. `npm run security:secret-scan:ci` correctly fails in this archive rather than falsely treating that as a history scan. In GitHub Actions, the `unit-tests` checkout uses `fetch-depth: 0` and must pass that command.

## Required actions in a real Git clone / Preview environment

```bash
npm ci
npm run security:secret-scan:ci
npm run test:unit
npm run qa:w216-release-candidate
npx playwright install chromium
PLAYWRIGHT_BASE_URL=https://<cloudflare-preview-domain> npm run qa:w227-shell-route:browser
```

Then complete desktop, mobile portrait, and mobile landscape proof for Chat, Share Center, Market, City 2D/3D fallback, Realm, Vault recovery, disabled commerce, PWA update/rollback/offline behavior, accessibility, Lighthouse, security headers, and no-console-error checks.

## Deployment and rollback

1. Commit this source from a protected branch and open a reviewed pull request.
2. Require CI, including the full-history secret scan, current unit suite, contract tests, lint, and Preview deployment.
3. Validate the Preview browser/device matrix before merging to `main`.
4. For rollback, revert the deployment/commit in Cloudflare Pages. **Do not clear client localStorage or IndexedDB.** W145/W209 prove the application preserves protected local records through update logic, but real-device backup/restore must be confirmed before public release.

## Permanent no-go boundary

Do not enable affiliate tracking, referral commissions, rewards, payouts, checkout, user storefronts, public account publication, token transfers, Pool Point conversion, or any “earn by sharing” claim. These require independently reviewed server truth, terms, support, anti-fraud, receipt/settlement proof, and any required legal/tax/compliance approval.
