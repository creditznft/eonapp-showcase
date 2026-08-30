# W378 — Cloudflare Google Auth and Codex Deployment Handover

## Purpose

W378 closes a source-release gap: every CI, Preview and Production deployment
now runs the current R4 program gates before it can build or deploy. It also
provides one exact operator handover for the optional Google identity flow.

This is **source-only**. It does not create a Cloudflare D1 database, set a
secret, enable Google Login, deploy a Preview, promote Production, or activate
payments.

## Product truth that must survive every setup action

- EONAPP is **guest-first**. Guest use remains available at all times.
- Google Login is optional identity-only access. It is **not a backup** and it
  must not silently upload or restore local work.
- The only requested Google scopes are `openid email profile`.
- The identity database stores only the minimal account/session metadata
  described in `identity/migrations/0001_eon_identity.sql`.
- Local Chat, Vault, Projects, files, Realm, City progress, provider settings
  and backups remain on the device until a user explicitly manages them.
- No payment, checkout, subscription, entitlement, referral benefit, provider connection, ad, CPA or payout code was activated.

## What Codex receives

Give Codex the **latest W378 source ZIP**, not an older W359–W377 package. Ask
Codex to unpack it into a clean branch, preserve the existing `functions/`
directory at repository root, and run the commands in
`docs/CODEX_W378_MERGE_PREVIEW_PRODUCTION_HANDOFF_2026-06-26.md`.

Codex must not create any `.env`, `.dev.vars`, secret file, credential commit,
D1 row, payment integration, checkout, provider account, referral promotion or
production deploy.

## Cloudflare operator actions — manual and separate from Codex

The existing Pages project is `eonapp-ch` with the production domain
`https://eonapp.ch`.

### 1. Create dedicated D1 databases

In the Cloudflare dashboard, create these two separate databases:

- `eonapp-identity-prod`
- `eonapp-identity-preview`

They must never share data.

### 2. Bind production D1

Dashboard path:

`Workers & Pages > eonapp-ch > Settings > Bindings > Add > D1 database bindings`

Create exactly this Production binding:

```text
EON_IDENTITY_DB -> eonapp-identity-prod
```

### 3. Bind preview D1

Use the same dashboard path in the Preview environment:

```text
EON_IDENTITY_DB -> eonapp-identity-preview
```

Do not bind Preview to `eonapp-identity-prod`.

### 4. Apply the one identity migration

Apply only this file to each of the two new databases:

```text
identity/migrations/0001_eon_identity.sql
```

Do not apply archived referral, wallet, reward, marketplace, platform-backend,
payment or token migrations to either identity database.

### 5. Configure Production variables

Dashboard path:

`Workers & Pages > eonapp-ch > Settings > Variables and Secrets > Add`

Add these **plain-text Production variables**:

```text
APP_ORIGIN=https://eonapp.ch
GOOGLE_REDIRECT_URI=https://eonapp.ch/api/auth/google/callback
EON_AUTH_ROLLOUT=testing
GOOGLE_OAUTH_CLIENT_ID=<your existing Google OAuth web-client ID>
```

Add these as **encrypted Production secrets**, manually in the Cloudflare
Dashboard. Never paste them into Codex, Cloudflare AI, ChatGPT, source files,
GitHub Actions, issue trackers, screenshots, terminal history or this document:

```text
GOOGLE_OAUTH_CLIENT_SECRET
EON_AUTH_SUBJECT_PEPPER
EON_SESSION_SIGNING_KEY
EON_OAUTH_FLOW_SIGNING_KEY
```

Each non-Google EON secret must be a separate new high-entropy value. Do not
reuse a payment, Telegram, wallet, IPNS, GitHub, Cloudflare or Google secret.

### 6. Preview stays disabled

For Preview, bind `EON_IDENTITY_DB` only to `eonapp-identity-preview` and set:

```text
EON_AUTH_ROLLOUT=disabled
```

Do not set `APP_ORIGIN`, `GOOGLE_REDIRECT_URI`, `GOOGLE_OAUTH_CLIENT_ID` or any
identity secret in Preview. Do not add a Preview callback to Google until a
separate Google OAuth web client has a stable exact Preview origin and callback.

### 7. Redeploy is required

Cloudflare Pages bindings and variables apply after a redeploy. Run only the
Preview deployment path first. Do not promote Production simply because the
binding and secrets exist.

## Controlled identity test sequence

1. Verify `/api/auth/session` on Preview or the controlled Production Testing
   configuration returns guest-safe availability without a raw email, account
   ID, token or local data.
2. In Profile, create/verify a local backup if desired, acknowledge that Google
   Login is not a backup, then choose Continue with Google.
3. Use only the approved Google OAuth Testing user.
4. Confirm the callback returns only to an allowlisted EONAPP surface.
5. Confirm logout clears the opaque session while local work remains present.
6. With a throwaway test account, use Delete cloud account and confirm only the
   minimal D1 identity/session record is removed. Local work must remain local.
7. Capture redacted proof only. Never capture cookies, authorization code, ID
   token, database content, browser storage, secrets or headers containing a
   secret/cookie.

## Non-identity blockers that remain

- W276 needs real **update-and-rollback** browser/device restoration proof.
- Apps/Blueprint W378 visual proof needs real desktop and mobile walkthroughs.
- EON Invite is not active. It requires future provider approval and
  server-backed reversal controls.
- Dodo, Lemon Squeezy, Razorpay and Cashfree remain provider candidates only;
  no provider is selected in source.
- Payments, subscriptions, official Pack sales, Team/Scale and Enterprise are
  not activated.

## Done condition for W378

W378 is done when source gates and CI wiring are green. Cloudflare configuration
and Google sign-in remain operator tasks with their own redacted evidence.

**Do not paste any secret into Cloudflare AI, Codex, ChatGPT, Git, source files, screenshots or terminal history.**
