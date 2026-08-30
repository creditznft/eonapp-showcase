# EONAPP Optional Google Identity + Cloudflare Setup Plan

## CEO decision

EONAPP adopts **guest-first, optional Google identity**.

A person may explore EONAPP, EON City, Apps, local AI, Chat and local Realm
features without an account. Google sign-in provides an optional account anchor
for recovery and purchase entitlement management. It is not an automatic
backup or cross-device-sync feature. It does not grant Gmail, Drive, Calendar, Contacts or any other
Google service permission.

Initial Google scopes are identity only:

```text
openid email profile
```

Google identity is not a connection. Future Calendar, Drive or Gmail actions
must use separate, explicit connection flows with their own scopes and policy
reviews.

## What Cloudflare may store

Use a small dedicated D1 database only for account and commerce-control
metadata:

- random EON account id;
- HMAC/peppered hash of Google `issuer + subject`;
- verified-email flag without retaining raw email by default;
- account-created, last-login and consent timestamps;
- opaque session hashes and expiry/revocation timestamps;
- payment customer mapping and entitlement records later, after merchant proof.

Do **not** store by default:

- Chat text, prompts or raw AI outputs;
- Vault contents, API keys or recovery material;
- local projects, Realm layouts, City progression, files, assets, or device activity;
- raw email, Google access tokens, or refresh tokens for the identity-only flow;
- card data or card numbers.

Local-first browser state remains local. Account linking must never silently
upload, merge, inspect, or restore it. Encrypted backup is an explicit user
action, created on the device and independently recoverable by the user.

## Target Cloudflare topology

Use a new minimal identity surface. Do not reuse any retired legacy backend.

```text
Cloudflare Pages / static EONAPP
  └─ /api/auth/* handled by Pages Functions or a small Worker route
        ├─ Google OAuth code callback
        ├─ opaque session creation and logout
        └─ safe /api/session display response

Cloudflare D1
  ├─ eonapp-identity-prod
  └─ eonapp-identity-preview (separate binding and data)
```

Only API paths are dynamic. City, Chat, Apps and static routes continue to be
served as static assets.

## Minimum API surface

```text
GET  /api/auth/google/start
GET  /api/auth/google/callback
GET  /api/auth/session
POST /api/auth/logout
POST /api/account/delete-request
```

Later, separately:

```text
POST /api/payments/payu/create-session
POST /api/webhooks/payu
GET  /api/entitlements
```

No client-side token storage. Sessions are opaque random ids stored only as
server-side hashes and delivered using a `Secure`, `HttpOnly`, `SameSite=Lax`
cookie. Mutating endpoints require origin checks and CSRF protection.

## Required security controls

1. Authorization Code flow with PKCE, `state`, and `nonce`.
2. Exact redirect URI checks.
3. Validate Google issuer, audience, expiry, nonce and verified email claim.
4. HMAC/pepper the Google subject before D1 storage.
5. Rotate session ids at login; short session lifetime; server-side logout and
   revocation.
6. Rate-limit auth endpoints and log only redacted security events.
7. Never put `GOOGLE_OAUTH_CLIENT_SECRET`, HMAC pepper or session keys in
   frontend JavaScript, `.env` archives, source snapshots, screenshots or logs.
8. Keep production and Preview credentials/database bindings separate.

## Cloudflare secrets and public variables

Public variables:

```text
GOOGLE_OAUTH_CLIENT_ID
APP_ORIGIN=https://eonapp.ch
GOOGLE_REDIRECT_URI=https://eonapp.ch/api/auth/google/callback
```

Cloudflare Secrets:

```text
GOOGLE_OAUTH_CLIENT_SECRET
EON_AUTH_SUBJECT_PEPPER
EON_SESSION_SIGNING_KEY
EON_OAUTH_FLOW_SIGNING_KEY
```

Later merchant secrets:

```text
PAYU_MERCHANT_KEY
PAYU_MERCHANT_SALT
PAYU_WEBHOOK_SIGNATURE_SECRET
```

Use Cloudflare Pages/Workers **Secrets** for sensitive values. Do not place
secret values in `wrangler.toml`, `package.json`, public variables, browser
storage or the repository.

## Google Cloud Console setup — operator checklist

1. Sign in to the Google account that will own EONAPP identity.
2. Create a dedicated Google Cloud project, for example `EONAPP Identity`.
3. Configure the OAuth consent screen as External for public users.
4. Set app name, support email, developer contact, authorised domain
   `eonapp.ch`, live Privacy Policy URL and live Terms URL.
5. Add only identity scopes: `openid`, `email`, `profile`.
6. Create **OAuth Client ID → Web application** named `EONAPP Web Production`.
7. Add exact authorised JavaScript origin:
   `https://eonapp.ch`
8. Add exact authorised redirect URI:
   `https://eonapp.ch/api/auth/google/callback`
9. Use a separate OAuth client for local development and, if needed, a stable
   Preview domain. Do not add arbitrary dynamic preview URLs to production.
10. Copy Client ID and Client Secret directly into Cloudflare Pages/Workers
    variables and secrets. Do not send them in chat or commit them.
11. Keep the Google app in testing until preview manual tests are complete.
12. Complete production publishing/verification only after the live privacy,
    terms, support and deletion flows are accurate.

## Google account UX

- Main navigation: no forced login wall.
- Profile/account menu: `Continue with Google`.
- Checkout: `Sign in to manage this purchase across devices`.
- Before redirect: `Google Login does not back up this device. Create an encrypted backup for work you cannot lose.` with a Backup now route.
- After login: `This device remains local. Google Login did not upload your Chat, Vault, projects, Realm data, City progress, files, or provider keys.` Show **Backup now** and **Not now**. The acknowledgement is not backup proof.
- Logout ends the cloud session but never deletes device-local projects,
  Chat history or Vault data.
- Account deletion shows what is deleted from D1 and what remains only on the
  user device.

## Payment decision boundary

Start merchant applications in parallel, but do not activate checkout yet.

- Preferred first evaluation: **PayU India**, using processor-hosted checkout
  so EONAPP never handles card data directly.
- Keep Cashfree as an onboarding/coverage fallback.
- Product description must remain ordinary digital software membership /
  digital outcome packs. Do not present tokens, wallets, rewards, securities,
  investment products, payouts or stored value.
- Create entitlements only after a server-side verified payment webhook. Never
  trust a browser success redirect.

## Coding sequence

- W364A: data-custody disclosure, pre-auth identity contract, guest-first UI and source gate — complete locally.
- W373: D1 migration, deletion model, session-retention rules, Profile acknowledgement, and account-operation contract — **source complete; Cloudflare binding/migration evidence pending**.
- W374: Google OAuth Pages Functions (PKCE, state, nonce, server-side code exchange and token validation, opaque session, logout and deletion) — **source complete; Cloudflare variables/secrets, D1 binding, Testing-mode sign-in and deployment evidence pending**.
- W375: guest/account UX, local-device claim language, privacy/deletion proof — **implemented as part of W373–W374 source; external browser and production proof pending**.
- W376: merchant boundary and hosted-checkout contract, still disabled.
- W377: PayU integration and verified webhook entitlement proof, only after
  PayU approval, KYC and legal/support pages are reviewed.

No identity or payment route is claimed live until Cloudflare configuration, controlled Testing-mode sign-in, Preview/production route proof, and independent review are complete.


## W374B onboarding coverage

Profile remains the only OAuth initiation point because it requires the visible
no-cloud-backup acknowledgement. Chat/onboarding, Apps, City, My Realm and
Billing now link users to that Account & Backup panel and provide encrypted
backup links. Do not add a direct Google OAuth button elsewhere unless the same
explicit acknowledgement is presented first.
