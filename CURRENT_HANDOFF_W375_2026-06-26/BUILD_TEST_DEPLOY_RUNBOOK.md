# W375 build, test and deployment runbook

## 1. Prepare a fresh workspace

```bash
npm ci
```

Use Node 22. Do not copy `.env` files, OAuth secrets, Cloudflare Secrets, browser storage, or a previous `node_modules` directory into the handover.

## 2. Local source verification

```bash
npm run qa:w375-market-intelligence
npm run qa:w216-source-syntax
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run qa:w239-public-output-quarantine
npm run qa:w242-active-source-quarantine
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run launch:page-gate
npm run launch:identity-gate
npm run launch:quality-gate
node scripts/secret-scan.mjs
npm audit --omit=dev
```

## 3. Required manual checks before deployment

1. Open `/trade` in desktop and mobile layouts.
2. Add two manual reference observations; confirm the local chart updates.
3. Import a harmless CSV with time/value columns; confirm no network request is needed.
4. Create then manually resolve a Forecast Oracle item; confirm there is no reward, price, token, transfer or public market UI.
5. Export workspace and research receipt; confirm no API key, credential or browser-external data appears.
6. Check `/trade-sandbox`, `/signal` and any retired trade URLs redirect to `/trade` rather than exposing legacy pages.
7. Re-check `/eoncity` and `/eoncity/tour` basic access after the shared accessibility bootstrap change.

## 4. Deployment boundary

Deploy only after the local verification and manual checks are recorded. This handover does **not** authorize a licensed market-data feed, broker connection, personalised recommendation product, forecast market, payment/reward loop, or live OAuth claim.

Cloudflare Preview and production evidence must be independently collected for redirects, CSP, console, network requests, mobile behavior and rollback. OAuth remains fail-closed until its production configuration is present; guest mode must still work.
