This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex execution — EONAPP W466/W467 production evidence and deployment handoff

Work from this source checkpoint only after reading:

1. `EONAPP_W466_W467_SOURCE_CHECKPOINT_STATUS_2026-07-01.md`
2. `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md`
3. `CODEX_START_HERE_W448_W458A_W452B_2026-06-30.md`
4. `NEXT_CHAT_CONTINUATION_W467_EXTERNAL_PROOF_AND_CODEX_DEPLOY_2026-07-01.md`

## Preserve the product boundary

- Canonical routes: `/` (Chat), `/eoncity` (City), `/insights` (Research Lab).
- Keep legacy Chat, Trade/Research, Realm/City/map/tour/game/Three.js routes inbound-only.
- Do not restore ads, rewards, offerwalls, Telegram rewards, social auto-posting, trading execution/advice, crypto/wallets/tokens, marketplace/resale, referral payouts, browser push, autonomous external actions or cloud Vault custody.
- Dodo remains approval-pending. Do not add a provider SDK, public prices, checkout, trial marketing, webhooks, entitlement service, portal, localStorage trial or client-side access grant.

## Local source validation

Run exactly:

```bash
npm ci
npm run verify:w449-w467-source-foundations
npm run security:secret-scan:ci -- --allow-no-history
```

Do not call a missing browser, Cloudflare credential, real device, D1 binding, merchant account or test user a passing result.

## Deployment and read-only proof

After the clean branch is reviewed and local source validation is green, deploy only through the existing Cloudflare Pages/Workers release path. Do not deploy copied `dist` output.

Then run:

```bash
node scripts/w453a-production-city-edge-proof.mjs \
  --base-url https://eonapp.ch \
  --confirm-network \
  --out artifacts/w453a-production-city-edge-proof.json

node scripts/w458a-sync-basic-status-proof.mjs \
  --origin=https://eonapp.ch \
  --allow-network

node scripts/w461-telegram-research-production-proof.mjs \
  --origin=https://eonapp.ch \
  --allow-network \
  --out artifacts/w461-telegram-research-production-proof.json
```

These are metadata-only/read-only evidence tools. They do not replace manual browser/device testing, Sync two-device proof, PWA recovery, Telegram deep-link testing, or merchant lifecycle proof.

## Mandatory manual evidence

1. Desktop, Android and iOS City visual/performance/rotation/safe-area/console evidence.
2. PWA install, update, service-worker adoption, rollback and protected local-data survival evidence.
3. Current EONBOT Activity Center happy/error/cancel/retry evidence; verify historical receipts never replay as fresh alerts.
4. Keyboard/focus/contrast/screen-reader/reduced-motion, 11-language/RTL layout, text fallback and explicit microphone-permission evidence.
5. Google identity sign-in/sign-out/delete lifecycle evidence.
6. Dedicated D1 Sync Basic Device A/B upload/merge/tombstone/browser-clear/restore/rollback proof.
7. First legacy quarantine proof, full revalidation, and a second proof before any deletion.
8. Dodo underwriting, approved product/policy/tax/support, hosted checkout/webhook/entitlement and full trial/renewal/refund/dispute recovery proof before commercial activation.

## Reporting format

Report each evidence row separately:

| Row | Status | Evidence or blocker |
|---|---|---|
| Source validation |  |  |
| Cloudflare deployment |  |  |
| City edge proof |  |  |
| Telegram/Research edge proof |  |  |
| Sync Basic proof |  |  |
| Browser and device proof |  |  |
| Legacy quarantine proof |  |  |
| Merchant/commercial status |  |  |
| Human GO/NO-GO |  |  |

Do not inspect or print secret values, API keys, Cloudflare tokens, cookies, sessions, Google codes, D1 rows, customer data, provider payloads, browser profiles, raw device data or private local work. Do not merge the rows into a single “launch passed” claim.
