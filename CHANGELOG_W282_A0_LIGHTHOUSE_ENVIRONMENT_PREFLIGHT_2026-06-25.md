# W282-A0 — Lighthouse environment-preflight hardening

**Date:** 2026-06-25  
**Scope:** source-only collection-harness hardening. This is not a performance wave completion and does not start W282 score collection.

## Why this change exists

A homepage-only local Lighthouse attempt reached the EONAPP static server but Chromium returned a Chrome error document before a usable navigation trace existed. The runner must preserve that distinction: an unusable browser trace is not a page score and must stop collection instead of proceeding through every route.

## Source changes

- `scripts/w107-main-lighthouse-direct.mjs`
  - captures the tail of Lighthouse CLI output;
  - classifies explicit `NO_NAVSTART` and administrator/policy markers as browser-environment blocked;
  - keeps all unknown missing-report outcomes fail-closed as `report-not-created-before-timeout`.
- `tests/unit/r3a2-lighthouse-static-server.test.mjs`
  - adds classification coverage for `NO_NAVSTART` and for an unknown missing report.
- `scripts/r3a2-lighthouse-route-contract-gate.mjs`
  - ensures the source contract retains the environment preflight classifier and explicit no-trace reason.

## Local preflight result

- Production build completed: 193 files.
- Local static server became ready.
- The direct runner reached only the homepage route, stopped early, and wrote a fail-closed summary with `finalUrl: chrome-error://chromewebdata/` and `NO_NAVSTART` in its command log.
- No usable Lighthouse report or score was accepted. The reported zero-like category values in the Chrome error document are invalid and must not be used as application scores.

## Explicit non-changes

- No Cloudflare, Worker, Pages, D1, deployment, remote provider, wallet, chain, reward, referral or milestone mutation.
- W260 remains **NO-GO**; W258 remains exit-blocked; W261 remains blocked.
- W269 beta and W281–W290 implementation remain planned/not started. W282 desktop/mobile scoring, remediation and Preview/live proof remain pending in a normal browser-capable environment.
