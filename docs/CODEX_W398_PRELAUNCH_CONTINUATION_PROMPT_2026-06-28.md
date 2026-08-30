# Codex Prompt — Continue EONAPP From W398 Pre-launch Foundations

Use the latest continuation package as the source of truth. Do not merge stale handovers over it.

## First: validate current source

```bash
npm ci
npm run verify:w399-prelaunch-candidate
```

Do not deploy if any command fails. Do not claim production proof from local source results.

## Cloudflare / Google state reported by founder

Configuration report says:

- Production D1 binding `EON_IDENTITY_DB` points to `eonapp-identity-prod`.
- Preview D1 binding `EON_IDENTITY_DB` points to `eonapp-identity-preview`.
- Production variables include `APP_ORIGIN=https://eonapp.ch`, exact Google callback, `EON_AUTH_ROLLOUT=testing` and client ID.
- Production secrets are configured in Cloudflare for Google OAuth and identity HMAC/session keys.
- Preview rollout is `disabled`.
- The identity migration was not applied because the previous deployment did not contain the source migration.

Treat that report as unverified configuration evidence. Verify through the dashboard or Cloudflare CLI without printing secrets, D1 rows, cookies, OAuth codes, tokens, environment-file contents or account IDs.

## Required identity deployment procedure

1. Confirm the deployed source contains `identity/migrations/0001_eon_identity.sql`.
2. Run it only against the dedicated production identity D1 and separately against preview identity D1. Never apply it to `EONAPP_REFERRALS_DB`, `REFERRALS_DB`, Relay, action or connector databases.
3. Deploy Preview with `EON_AUTH_ROLLOUT=disabled`; do not configure Preview Google OAuth.
4. Deploy Production while Google is still in Testing mode.
5. Test only the approved Google test user:
   - `/api/auth/session` reports available guest-first state;
   - Profile requires the local-data acknowledgement before sign-in;
   - Google callback returns to the safe route;
   - signed-in state contains no email/account ID in browser UI;
   - logout clears only server session;
   - delete request removes only minimal account/session metadata;
   - local work remains local.
6. Capture redacted evidence only.

## Source work completed in this package

- W390A/B: locked deterministic Collection/Vault Reveal foundation.
- W391A/B/C: disabled EON Relay foundation plus a deferred dedicated Relay migration.
- W406/W407: disabled Action Gateway foundation plus deferred dedicated action migration.
- W388B: disabled global social connector registry and no token/OAuth/direct posting implementation.
- W389: local Forge deployment preflight only; no GitHub or Cloudflare user deployment.
- W398/W399: local opt-in, count-only pilot measurement foundation.

## Must remain inactive

- Collection grants, access passes, referral links/grants and Vault Reveal activation.
- Social OAuth, platform token storage, direct post, scheduling, analytics, automated outreach or mass DM.
- GitHub App/Cloudflare user deployments.
- Cloud media jobs, automatic backup/sync, account restore of local work.

## Next implementation sequence after live proof

1. W390 activation decision: bind Collection only to server-reviewed deterministic ledger entries.
2. W391 tiny Relay pilot: max three verified direct activations, review/reversal and kill switch first.
3. W406/W407 one Action Gateway type at a time.
4. W388C/D one platform connector at a time, starting with platform official-app review.
5. W389 user-owned GitHub/Cloudflare flow only after source owner/repository/project selection and action receipt work is proven.
6. W398/W399 privacy-reviewed creator/remix pilot reporting.

Never paste a real Google OAuth secret into source, Codex, a test file, a screenshot or a handover. Rotate the current client secret before public Google OAuth publication because it was previously pasted into chat.
