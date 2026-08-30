This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W149 - CEO Launch Prep + Simple Verification Handoff

Date: 2026-06-13
Source of truth: the uploaded/patched source zip, not GitHub.

## Executive status

This bundle is ready for Codex merge/deploy prep after W149. The purpose of W149 is to make the Telegram + Monetag + Market launch path easier to verify without relying on Playwright/browser downloads.

## What changed in W149

1. Added `scripts/w149-launch-verification.mjs`.
   - Static proof: Cloudflare headers/redirects, Telegram routes, Monetag SDK call shape, Market first impression, Cloudflare secret names, postback/session security.
   - Optional local HTTP proof: runs after `npm run build` with `--server=1` and checks `/`, `/telegram`, `/telegram.html`, `/reward-access.html?mode=telegram`, `/market`, `/market.html`, `/vault.html`.
2. Added npm scripts:
   - `qa:w149-ceo-launch-verification`
   - `qa:w149-ceo-launch-verification:server`
   - `qa:codex-deploy-prep`
3. Synced `public/_headers` with root `_headers`.
4. Synced `public/_redirects` with root `_redirects` so old `/game -> /market.html` and stale Telegram comments cannot return later.
5. Removed duplicate short `/reward-access.html` header block so the full Telegram/Monetag-compatible header block is unambiguous.
6. Updated stale Telegram Mini App URL references from `https://eonapp.ch/telegram.html` to `https://eonapp.ch/telegram` in:
   - `assets/js/utils/telegram-growth-rewards.js`
   - `scripts/telegram-miniapp-readiness.mjs`
7. Updated the live integration registry to include both `/telegram` and `/telegram.html` for Telegram Mini App coverage.

## CEO launch decision

Proceed to Codex deployment prep. Keep the production browser proof as the only remaining live-only gate after deploy.

Do not block launch on extra EON City graphics/NPC polish. Those are important, but they are not blockers for fixing the actual Telegram reward launch path.

## Must not change

- Do not paste secrets into code.
- Do not switch BotFather back to `/telegram.html`.
- Do not use Monetag In-App Interstitial for reward credits.
- Do not auto-open rewarded ads.
- Do not grant account-wide subscription credits without Cloudflare postback/status confirmation.
- Do not remove Vault/localStorage/IndexedDB migration and backup proof.

## Cloudflare secrets/bindings expected by name only

- `AD_REWARD_POSTBACK_SECRET`
- `MONETAG_REWARDED_SCRIPT_URL`
- `MONETAG_REWARDED_SDK_FUNCTION`
- `MONETAG_REWARDED_ZONE_ID`
- `NOWPAYMENTS_IPN_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHANNEL_USERNAME`

## BotFather state

Correct Mini App URL:

```text
https://eonapp.ch/telegram
```

Current user-reported state is good:

```text
Mini App is currently enabled for EonBot @EonAppsBot.
Current URL: https://eonapp.ch/telegram
Mode: Fullsize
```

## Codex first commands

```bash
npm ci --include=dev --no-audit --no-fund
npm run qa:codex-deploy-prep
npm run qa:w149-ceo-launch-verification:server
npm run lint -- --max-warnings=50
npm run test:unit
npm run launch:readiness
```

## After deployment

Run:

```bash
npm run qa:w136-live-browser:production
```

Then manually open @EonAppsBot in Telegram and verify:

1. Open App loads `https://eonapp.ch/telegram` without redirect loop.
2. Browser preview clearly says to open Telegram for verified rewards.
3. Inside Telegram, session verification runs.
4. Channel membership gate is visible.
5. Reward button opens `/reward-access.html?mode=telegram` only after membership.
6. Monetag calls `show_11111741()` first and `show_11111741('pop')` only as fallback.
7. Account-wide subscription credit waits for postback/status proof.

## W149 local proof files

- `scripts/w149-launch-verification.mjs`
- `artifacts/W149_CEO_LAUNCH_VERIFICATION_STATS_2026-06-13.json`
- `tmp/w149-simple-launch-proof.json`
- `reports/w149/CEO_LAUNCH_VERIFICATION_2026-06-13.md`
