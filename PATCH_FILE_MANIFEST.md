# Patch File Manifest

## Changed existing files

- `package.json`
  - Adds `gpt55:cloudflare-prod-readiness`
  - Adds `gpt55:short-link-test`
- `_redirects`
  - Removes legacy `/r` RareRank conflict
  - Ensures `/r/*` and `/m/*` resolve to `referral.html`
- `assets/js/utils/signed-share-link.js`
  - Adds compact short-code generation
  - Attempts browser-side short-link registration
  - Keeps canonical long signed token fallback
- `assets/js/referral-landing-page.js`
  - Resolves `/r/<code>` and `/m/<code>` through worker API
  - Verifies signed token before attribution/redirect
- `tests/unit/w63-signed-share-link.test.mjs`
  - Adds compact-code/fallback checks
- `scripts/gpt55-link-entropy-audit.mjs`
  - Updates recommendation to implemented short resolver

## New files

- `functions/api/share-links/_verify.js`
- `functions/api/share-links/register.js`
- `functions/api/share-links/resolve.js`
- `tests/unit/gpt55-short-share-link-resolver.test.mjs`
- `scripts/gpt55-cloudflare-prod-readiness.mjs`
- `LAUNCH/FINAL_100_LAUNCH_GATE_LIST_2026-06-15.md`
- `LAUNCH/CLOUDFLARE_NOWPAYMENTS_AND_KV_NOTE_2026-06-15.md`
- `LAUNCH/CRYPTO_TEST_FUNDS_NOTE_2026-06-15.md`
- `LAUNCH/SANDBOX_TEST_RESULTS_2026-06-15.md`
