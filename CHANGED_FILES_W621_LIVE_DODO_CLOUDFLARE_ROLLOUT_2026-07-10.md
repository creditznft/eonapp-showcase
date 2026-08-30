# Changed files — W621 Live Dodo / Cloudflare Rollout

## Added

```text
assets/js/billing/eon-dodo-live-runtime.js
config/w621-live-dodo-cloudflare-rollout-contract.mjs
scripts/w621-live-dodo-cloudflare-rollout-gate.mjs
tests/unit/w621-live-dodo-cloudflare-rollout.test.mjs
README_START_HERE_W621.md
CODEX_W621_LIVE_ROLLOUT_PROMPT_2026-07-10.md
```

## Modified

```text
package.json
functions/api/billing/status.js
functions/api/billing/checkout.js
functions/api/billing/webhooks/dodo.js
functions/api/billing/referral-status.js
scripts/launch-readiness.mjs
```

## Why

W619/W620 deliberately left checkout/webhook routes fail-closed. The owner has now created Dodo products, a live API key, webhook endpoint, Cloudflare secrets, product ID variables, `EON_BILLING_ROLLOUT=production`, and D1 binding. W621 turns the billing route contract into a live server runtime while preserving the no-browser-unlock and no-cash-reward boundaries.
