# Codex Execution Runbook

## 1. Establish a clean baseline

```bash
npm ci
npm run verify:w418-final-flagship-source
```

The combined verifier is intentionally comprehensive. When a constrained runner times out, rerun these independently and record each actual result:

```bash
npm run lint -- --max-warnings=0
npm run qa:w415-final-source-readiness
npm run qa:w416-city-renderer-hardening
npm run qa:w417-city-asset-release-preflight
npm run qa:w418-final-flagship-audit
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run security:secret-scan -- --allow-no-history
npm audit --omit=dev
```

## 2. Deploy preview, then production

- Ensure no `.env`, Cloudflare token, OAuth secret, D1 export, browser profile, `node_modules`, `dist`, report cache or customer data is staged.
- Keep preview OAuth disabled.
- Deploy from the normal CI/Cloudflare path only after source checks are clean.
- Purge/refresh the EON City service-worker cache only through the approved deployment routine. Do not bypass the cache by adding a second public City route.

## 3. Do not activate locked capabilities

Do not activate without their separate evidence packages:

- public EON Sync Basic;
- Secure Vault Sync;
- social OAuth/posting or token storage;
- rewards, payouts, payments, referral rewards or grants;
- action execution/deployment for user projects;
- final City binary art.

## 4. Art intake only after source deployment is stable

Follow `03_FLAGSHIP_ASSET_PRODUCTION_BRIEF.md`, then run the W417 hash/provenance preflight. A binary must not be marked `shipped` until all local integrity and manual evidence conditions pass.
