# EONAPP Session 10 — Live Proof Capture Protocol

Use this after Codex applies the cumulative Session 1–10 package and Cloudflare deploy succeeds.

## Required environment

- Node 22.x.
- `npm ci` with devDependencies.
- Playwright browsers installed: `npx playwright install chromium`.
- Cloudflare Pages production URL: `https://eonapp.ch`.
- Telegram Bot: `@EonAppsBot`.
- Telegram Channel: `@EonApps`.
- Cloudflare secrets present without printing values.

## Pre-deploy gates

```bash
npm ci
npm run gpt55:final-ceo-launch-signoff
npm run gpt55:eoncity-gameplay-certification-gate
npm run gpt55:payment-reward-server-truth-gate
npm run gpt55:vault-account-survival-gate
npm run gpt55:market-nft-lootbox-visual-gate
npm run gpt55:code-os-gate
npm run gpt55:eonbot-emotion-voice-gate
npm run gpt55:route-truth-device-audit
npm run launch:page-gate
npm run gpt55:static-launch-audit
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run i18n:coverage
npm run i18n:screen-complete
npm run launch:readiness
npm run qa:w132-telegram-monetag-proof
npm run qa:w138-market-nft-generation-proof
npm run qa:w145-update-safe-user-data-survival
npm run qa:w156-w165-eoncity-visuals
```

## Post-deploy proof commands

Use the repo's existing live/browser proof scripts if present. If any exact script name differs in the current repo, Codex should map the intent to the closest existing proof script and save outputs under `reports/session10/live/`.

```bash
npx playwright install chromium
npm run qa:w136-live-browser:production || true
npm run gpt55:telegram-cdp-proof || true
npm run gpt55:http-proof || true
npm run qa:w175-real-payment-proof || true
```

Manual/assisted production proof is still required for Telegram Mini App and payment provider callbacks because they depend on real external systems.

## Screenshots to capture

Save PNG + JSON proof for:

- `/` desktop and mobile.
- `/chat.html` with EONBOT status strip and usable input.
- `/code-maker.html` with EON Code OS panels.
- `/market.html` first-load starter cards and NFT QA strip.
- `/vault.html` and `/vault-backup.html#vault-survival-drill`.
- `/reward-access.html?mode=telegram` server-truth pending/verified panel.
- `/telegram` inside Telegram Mini App.
- `/realmworld.html#rw-gameplay-certification` portrait, landscape, desktop.
- `/subscription.html` payment status panel.
- `/support.html` public support route.

## Evidence naming

Use this folder structure:

```text
reports/session10/live/
  browser-matrix/
  telegram-miniapp/
  monetag-postback/
  nowpayments-low-value/
  vault-restore-drill/
  eoncity-devices/
  final-ceo-signoff.json
```
