# W395 — Google Identity + D1 Deployment Readiness

**Status:** source and operator readiness only. This file does **not** prove
that Google Login, D1, Preview, Production, account restoration, referrals,
Collection, social connectors or any cloud backup capability is live.

## What source is ready for

The current Pages Functions provide an identity-only optional Google sign-in
flow with PKCE, state, nonce, exact callback checks, server-side code exchange,
opaque HttpOnly session cookies, logout, and narrowly scoped cloud-account
removal. The D1 migration stores only a random account identifier, a
HMAC-protected issuer/subject reference, a verified-email flag, consent and
session metadata. It does not store raw email by default, Chat, prompts,
Vault data, local projects, files, City state, provider keys, Google access or
refresh tokens, or payment data.

Guest use remains available. Google Login must not be described as backup,
sync, recovery of local work, referral validation, or a social connector.

## Inputs that must be prepared outside this repository

- A Production D1 database named `eonapp-identity-prod`.
- A separate Preview D1 database named `eonapp-identity-preview`.
- Exact Production origin `https://eonapp.ch` and callback
  `https://eonapp.ch/api/auth/google/callback` configured in the Google OAuth
  client.
- Google OAuth client ID as a Pages non-secret variable.
- Google client secret, subject pepper, session signing key and OAuth flow
  signing key added manually as encrypted Cloudflare secrets.
- Profile, Privacy, Terms, Support and deletion disclosures deployed before
  making a public Google rollout.

Never paste a client secret, signing key, HMAC pepper, cookie, authorization
code, token, raw D1 row or browser export into Chat, a source file, a ticket or
a screenshot.

## Exact identity route surface

```text
GET  /api/auth/google/start
GET  /api/auth/google/callback
GET  /api/auth/session
POST /api/auth/logout
POST /api/account/delete-request
```

Only these identity paths are dynamic. They remain identity-only and must not
be repurposed for local-work sync, referrals, Collection grants, creator media
processing, social publishing, provider keys, or payments.

## Required Pages configuration

### Production

```text
APP_ORIGIN=https://eonapp.ch
GOOGLE_REDIRECT_URI=https://eonapp.ch/api/auth/google/callback
EON_AUTH_ROLLOUT=testing
GOOGLE_OAUTH_CLIENT_ID=<set manually as a non-secret Pages variable>
EON_IDENTITY_DB -> eonapp-identity-prod
```

Set these only as encrypted Cloudflare Secrets:

```text
GOOGLE_OAUTH_CLIENT_SECRET
EON_AUTH_SUBJECT_PEPPER
EON_SESSION_SIGNING_KEY
EON_OAUTH_FLOW_SIGNING_KEY
```

### Preview

```text
EON_AUTH_ROLLOUT=disabled
EON_IDENTITY_DB -> eonapp-identity-preview
```

Do not bind Preview to Production. Do not configure a Preview Google callback,
origin, client ID or secrets until a separate Google OAuth client has a stable,
exact Preview callback and is explicitly approved.

`identity/wrangler.identity.example.toml` is a non-deployable configuration
reference. It contains placeholders only and never supplies secret values.

## Migration discipline

Apply only `identity/migrations/0001_eon_identity.sql` to each new identity
database. Do not apply referral, payment, wallet, reward, marketplace,
platform-backend or legacy migrations to this database. Keep the Production and
Preview databases separate.

Before applying any migration remotely, take the provider-provided backup and
capture a redacted record of the database name, migration filename and result.
Do not capture rows or secret values.

## Manual proof sequence — still required

1. Keep `EON_AUTH_ROLLOUT=testing` and restrict the Google app to approved OAuth
   test users.
2. Deploy source with the Production binding and no Preview OAuth activation.
3. Confirm `GET /api/auth/session` returns only safe availability/session state.
4. From Profile, create an encrypted local backup, acknowledge the no-backup
   notice, then sign in with an approved test user.
5. Confirm profile status does not display email, account ID, token, cookie or
   local-work transfer claims.
6. Confirm logout ends only the opaque cloud session and leaves local work.
7. Using a throwaway test account, confirm cloud-account deletion removes only
   minimal D1 account/session metadata and leaves local work unchanged.
8. Capture redacted Preview and Production route proof. No cookies, headers,
   codes, tokens, storage dumps, D1 rows, secrets or real user data in proof.
9. Keep public rollout blocked until privacy, terms, support, account deletion,
   consent material and a human release review are correct and deployed.

## Explicit blockers after this source gate

- Live Google/Cloudflare configuration and controlled browser proof.
- Account-backed restore or cross-device sync proof.
- Collection persistence and EON Relay referral grants.
- Social OAuth, provider token storage, scheduling or direct publishing.
- Payment or entitlement operations.

