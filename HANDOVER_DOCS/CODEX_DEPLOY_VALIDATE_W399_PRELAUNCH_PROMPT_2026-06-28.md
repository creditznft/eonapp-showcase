# Codex Prompt — Deploy and Validate EONAPP W399 Pre-launch Candidate

Continue from this source package. This is a W399 pre-launch candidate, not a request to activate referrals, social posting, payments, marketplace features or cloud sync.

## Hard boundaries

- Do not place any secret in source, `.env.local`, Git, tests, screenshots, terminal output, or a handover.
- Do not inspect/print Cloudflare secret values, cookies, D1 rows, OAuth codes, tokens or user data.
- Do not modify legacy referral/payment/reward databases or bindings.
- Do not change Google OAuth from `testing` to `public`.
- Do not activate Collection, Relay, social connectors, GitHub/Cloudflare user deploy, external Action Gateway or remote creator analytics.

## 1. Validate the source exactly

```bash
npm ci
npm run verify:w399-prelaunch-candidate
```

Expected: strict lint, 327/327 current runnable tests, all W393A–W399 gates, build, smoke, audit and readiness pass.

## 2. Rotate the Google OAuth client secret first

The old client secret was disclosed during AI setup. In Google Cloud, rotate the secret for the existing EONAPP production OAuth client. Update only the masked **Production** Cloudflare secret named `GOOGLE_OAUTH_CLIENT_SECRET`. Do not reveal the new value anywhere.

## 3. Validate external configuration by name only

Expected Production:

- `EON_IDENTITY_DB` bound to dedicated `eonapp-identity-prod`.
- `APP_ORIGIN=https://eonapp.ch`.
- `GOOGLE_REDIRECT_URI=https://eonapp.ch/api/auth/google/callback`.
- `EON_AUTH_ROLLOUT=testing`.
- client ID plaintext variable present.
- four encrypted identity secrets present by name.

Expected Preview:

- `EON_IDENTITY_DB` bound to dedicated `eonapp-identity-preview`.
- `EON_AUTH_ROLLOUT=disabled`.
- no active Preview OAuth configuration.

Never touch `EONAPP_REFERRALS_DB`, `REFERRALS_DB`, payment/reward or legacy data stores.

## 4. Apply the only permitted migration

Use an authenticated Cloudflare CLI/Codex environment. Preview first:

```bash
npx wrangler d1 execute eonapp-identity-preview --remote --file=identity/migrations/0001_eon_identity.sql
npx wrangler d1 execute eonapp-identity-preview --remote --file=identity/verify-identity-migration.sql
```

Then Production:

```bash
npx wrangler d1 execute eonapp-identity-prod --remote --file=identity/migrations/0001_eon_identity.sql
npx wrangler d1 execute eonapp-identity-prod --remote --file=identity/verify-identity-migration.sql
```

Expected verification output: names only for `eon_identity_accounts` and `eon_identity_sessions`. Do not dump rows.

## 5. Deploy source and prove Google Login carefully

Use the project’s established Cloudflare Pages deployment method. Ensure repository-root `functions/` is included in the Pages build root. Keep Preview OAuth off.

On Production only, using the approved Google OAuth test user:

1. `GET /api/auth/session` returns safe availability/session state only.
2. `/profile` requires the no-backup acknowledgement before Google Login.
3. Login completes through Google and returns to Profile without showing email, account ID, cookie or token.
4. Logout returns to guest mode and does not change local work.
5. With a disposable test identity, account deletion removes only minimal cloud identity/session metadata.

Redact the proof. Do not publish the app or enable public Google Login.

## 6. Return proof and blockers

Return source checksum, deployment ID, migration table names, redacted status/login/logout/delete proof, W396 recovery drill evidence, real-device City evidence, dependency update decision, and every unproven claim.
