# Fresh Continuation Prompt — R4 W378

You are continuing EONAPP from the W378 source snapshot.

## Current truth

- Apps contains 32 local-first official Blueprints and 16 approval-first local
  Workflow templates. A user explicitly prepares a local workroom to create a
  local Project, Library template and Workflow draft.
- Insights & Forecasts lives inside Apps. `/trade` is a compatibility route.
- Google Login source is optional, identity-only, guest-first and fail-closed.
  It is not a backup and has no Google product scopes beyond `openid email profile`.
- Cloudflare D1 bindings and secrets are not set in this source snapshot.
- CI, Preview and Production deploy workflows now require
  `npm run qa:r4-current-program` before test/build/deploy.
- EON Invite, provider selection, checkout, subscriptions, paid Pack sales and
  entitlements are not active.
- W276 still needs real update-and-rollback restoration proof.

## First external work order

1. Give Codex the W378 source and `docs/CODEX_W378_MERGE_PREVIEW_PRODUCTION_HANDOFF_2026-06-26.md`.
2. The operator manually completes Cloudflare D1 bindings and variables/secrets
   using `docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`.
3. Deploy Preview first; preserve Preview OAuth disabled.
4. Collect redacted browser/device evidence for Apps workrooms and guest mode.
5. Test Google identity only with the approved Google Testing user after the
   Production Testing configuration is ready.
6. Do not activate payments or EON Invite while the provider and evidence gates
   remain incomplete.

## Mandatory commands

```text
npm run qa:r4-current-program
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run security:secret-scan
npm run launch:readiness
```
