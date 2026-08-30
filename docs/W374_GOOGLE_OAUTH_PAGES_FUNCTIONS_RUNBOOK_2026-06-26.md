# W374 — Google OAuth Pages Functions Runbook

## Implemented API surface

```text
GET  /api/auth/google/start
GET  /api/auth/google/callback
GET  /api/auth/session
POST /api/auth/logout
POST /api/account/delete-request
```

All responses use `no-store`. The session endpoint never returns an email,
Google subject, account ID, access token, refresh token, local project, Vault
record, Chat text, provider key, file, or City state.

## Required Pages configuration

### Production variables

```text
APP_ORIGIN=https://eonapp.ch
GOOGLE_REDIRECT_URI=https://eonapp.ch/api/auth/google/callback
EON_AUTH_ROLLOUT=testing
GOOGLE_OAUTH_CLIENT_ID=<set manually in Cloudflare>
```

`EON_AUTH_ROLLOUT` accepts only `testing` or `public`. Any other value, missing
binding, missing secret, origin mismatch or redirect mismatch fails closed and
leaves guest mode available.

### Production Secrets

```text
GOOGLE_OAUTH_CLIENT_SECRET=<set manually; never commit or paste into chat>
EON_AUTH_SUBJECT_PEPPER=<unique high-entropy random secret>
EON_SESSION_SIGNING_KEY=<unique high-entropy random secret>
EON_OAUTH_FLOW_SIGNING_KEY=<unique high-entropy random secret>
```

### D1 binding

```text
EON_IDENTITY_DB -> eonapp-identity-prod
```

Preview uses a separate `eonapp-identity-preview` D1 database. Keep Preview
rollout disabled until a separate Preview Google OAuth client has an exact,
stable Preview origin and callback URI registered in Google Cloud.

## Migration

Apply only this migration to the dedicated identity database:

```text
identity/migrations/0001_eon_identity.sql
```

Never apply `migrations/0001_referral_storage.sql`, `platform-backend/`, or
archived migration sets to the identity database.

## Testing sequence

1. Deploy to a controlled environment with `EON_AUTH_ROLLOUT=testing`.
2. Confirm `GET /api/auth/session` returns `available: true`, `signedIn: false`,
   guest-first and no-cloud-backup fields.
3. Go to Profile, create a backup if needed, tick the data-custody
   acknowledgement, and choose Continue with Google.
4. Sign in only with the Google OAuth test user registered in Google Cloud.
5. Confirm Profile shows signed-in status without showing email, account ID or
   local-data transfer claims.
6. Confirm logout ends the session while local work remains intact.
7. Use a throwaway test account session to confirm Delete cloud account removes
   only minimal D1 account/session metadata and leaves local work untouched.
8. Capture redacted proof. Never capture cookies, secrets, authorization code,
   ID token, headers containing cookies, D1 row contents, or browser storage.

## Before public Google publication

- Deploy current Privacy, Terms, Support and Profile disclosures.
- Confirm the Google OAuth consent screen links to those deployed public pages.
- Run source, build, Preview and production route proof.
- Confirm no user other than approved test users can access before Google app
  publication.
- Change `EON_AUTH_ROLLOUT` to `public` only after publishing the Google OAuth
  consent configuration and completing the above proof.
