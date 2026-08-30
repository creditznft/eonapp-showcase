# Google Identity operator status — 26 June 2026

## Google Cloud configuration: staged for test-only identity flow

The Google Cloud OAuth client has been configured for EONAPP as an external
application in **Testing** mode with the production origin and exact callback
registered. The scope boundary is identity-only:

```text
openid email profile
```

The configured consent material links to the EONAPP domain, Privacy and Terms
pages. Public Google publication remains blocked until those updated public
pages are deployed and the test flow has been evidenced.

This document intentionally does not include a Google Client ID, user email,
client secret, secret fragment, authorization code, session cookie, database
row, or any credential.

## Cloudflare status: operator configuration pending

Before live test, create a dedicated production and Preview D1 identity database
and bind them separately as `EON_IDENTITY_DB`. Set only the documented
non-secret values and encrypted secrets using the Cloudflare dashboard. Keep:

```text
EON_AUTH_ROLLOUT=testing
```

Do not set a Preview Google callback or enable Preview OAuth until a separate
exact Preview OAuth client exists in Google Cloud.

## Test acceptance criteria

1. `/api/auth/session` reports identity availability but no email/account ID/token.
2. Guest use remains available before, during and after an OAuth attempt.
3. Profile acknowledgement is required before Google Login begins.
4. The approved OAuth test user can sign in and return only to an allowlisted
   EONAPP surface.
5. Logout clears the opaque session without changing local work.
6. Cloud account deletion removes only minimal account/session metadata.
7. Local Chat, Vault, files, projects, Realm state, City progress and provider
   settings remain local; a user must make an encrypted backup explicitly.
