# W395 — Cloudflare + Google Controlled Test Proof Protocol

**Status:** deploy/operator protocol. This is not a source credential file and does not certify a live login.

## Operator configuration reported externally

The operator reported the following configuration as complete on 2026-06-28. Codex must validate names and bindings only; it must never request, print, screenshot, export or replace secret values.

- Dedicated Production and Preview identity D1 databases were created.
- `EON_IDENTITY_DB` was bound to the corresponding environment.
- Production has exact origin/callback, identity rollout `testing`, client ID and encrypted server secrets.
- Preview has rollout `disabled`; no Preview OAuth flow is permitted.
- The identity migration was correctly deferred because the old deployment did not contain this source file.

## Non-negotiable security step

The operator disclosed the Google OAuth client secret in AI conversations while configuring the project. Treat that secret as exposed. **Before any Google sign-in test or deployment that enables the callback, rotate the Google OAuth client secret in Google Cloud and immediately update only the Production `GOOGLE_OAUTH_CLIENT_SECRET` Cloudflare Secret.** Never place the replacement in Git, source, a shell history, a ticket, a screenshot, an AI chat or this document.

## Local source verification

```bash
npm ci
npm run verify:w399-prelaunch-candidate
```

Do not continue on a failed command. Review dependency-audit findings separately; do not use a blind `npm audit fix`.

## D1 migration — dedicated identity databases only

Use the currently authenticated Cloudflare account / Codex environment. Confirm database names first; do not use `EONAPP_REFERRALS_DB`, `REFERRALS_DB`, or any reward/payment database.

Run Preview first:

```bash
npx wrangler d1 execute eonapp-identity-preview --remote --file=identity/migrations/0001_eon_identity.sql
npx wrangler d1 execute eonapp-identity-preview --remote --file=identity/verify-identity-migration.sql
```

Then Production:

```bash
npx wrangler d1 execute eonapp-identity-prod --remote --file=identity/migrations/0001_eon_identity.sql
npx wrangler d1 execute eonapp-identity-prod --remote --file=identity/verify-identity-migration.sql
```

Expected read-only verification output contains only two table names: `eon_identity_accounts` and `eon_identity_sessions`. Do not display row values.

## Deploy discipline

Deploy the current source using the project’s established Cloudflare Pages delivery method. The deployment must include the repository-root `functions/` directory and build output. Keep:

- Production `EON_AUTH_ROLLOUT=testing`
- Preview `EON_AUTH_ROLLOUT=disabled`
- Guest mode fully available

Do not configure a Preview Google callback/client/secrets until a separate stable Preview OAuth client exists.

## Controlled Production test-user proof

1. On `https://eonapp.ch/api/auth/session`, verify safe JSON says the identity service is available and no email, account ID, token, cookie or local work data is returned.
2. Open `/profile`, verify the local-data acknowledgement is required before the Google button activates.
3. Use only an allowed Google OAuth **test user**.
4. Complete sign-in; verify return to Profile shows a minimal signed-in state and no personal identity data.
5. Sign out; verify guest mode remains available and browser-local work remains unchanged.
6. With a disposable test identity, run account deletion only after a fresh local backup. Verify only minimal cloud identity/session metadata is removed; do not query or capture user rows.
7. Capture redacted proof only: route status, UI state, migration table names, and deployment ID. Never capture cookies, headers, auth codes, secrets, D1 rows, browser storage or local projects.

## No-go boundaries after proof

A working identity-only login does not enable Collection grants, EON Relay, social token custody, direct publishing, paid entitlements, automated backup, cross-device restoration, GitHub access or Cloudflare project deployment. Those remain separately gated.
