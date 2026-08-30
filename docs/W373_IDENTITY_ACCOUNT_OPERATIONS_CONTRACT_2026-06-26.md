# W373 — EONAPP Identity Account Operations Contract

## Decision

EONAPP is **guest-first**. Optional Google Login is an identity-only account
anchor for account access, future verified purchase entitlements, and recovery
of that minimal account. It is not a cloud workspace, automatic backup,
cross-device sync, or Google-service connection.

## Dedicated database boundary

Create and bind a dedicated D1 database under the binding name
`EON_IDENTITY_DB`. Do not reuse the retired platform backend, referral database,
or any reward/payout database.

The W373 schema stores only:

- a random EON account ID;
- a HMAC-protected Google issuer + subject reference;
- a verified-email boolean, without a raw email column;
- consent version plus account-created and last-login timestamps;
- HMAC-protected opaque session identifiers plus issued/expiry timestamps.

It never stores Chat text, prompts, outputs, Vault data, API keys, files,
projects, local Realm data, City progress, browser snapshots, Google access or
refresh tokens, or card data.

## Session retention

- Session cookie: opaque random value, `Secure`, `HttpOnly`, `SameSite=Lax`,
  `Path=/`, seven-day maximum lifetime.
- D1 keeps only the HMAC of that cookie value, never the raw session value.
- Expired session rows are removed lazily whenever an identity operation occurs.
- Logging out deletes the current server-side session row immediately.
- No device fingerprint, IP address, user-agent profile, analytics record, or
  background activity record is created by the identity flow.

## Account deletion

The Profile page exposes **Delete cloud account** only after an active Google
identity session. A same-origin POST requires the literal confirmation value
`DELETE_EON_ACCOUNT`.

When confirmed, EONAPP immediately deletes the account row and all active
session rows from D1, then clears the session cookie. It cannot remotely delete
Chat, Vault, projects, files, Realm setup, City progress, settings, browser
storage, or user-created backups because those records were never uploaded.

## Pre-sign-in data-custody acknowledgement

The user must tick a visible acknowledgement before the Google redirect begins:

> I understand that Google Login is not a backup and that I must keep my own
> encrypted backup for local work I cannot lose.

The acknowledgement is carried only in the ten-minute signed OAuth flow cookie
and the consent timestamp/version stored for the account after a successful
sign-in. It is not treated as proof that a backup exists.

## Non-negotiable safety rules

- Use Google Authorization Code flow with PKCE, state and nonce.
- Exact redirect URI only: `/api/auth/google/callback` at the configured HTTPS
  origin.
- Validate Google ID-token signature, issuer, audience, expiry, issued-at,
  nonce, subject and verified-email claim on the server.
- No browser OAuth token storage. No Google SDK or client secret in frontend
  JavaScript.
- Mutating routes require POST plus an exact same-origin check.
- Preview and Production must have separate D1 databases. Preview must never
  bind to production identity data.
- Google Login does not grant Gmail, Drive, Calendar, Contacts or YouTube
  access. Those require later, separate connection flows and consent.
