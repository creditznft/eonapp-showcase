# W364A — Optional Google Identity, Local Data Custody, and Backup Truth

## Binding product decision

EONAPP is **guest-first and local-first**. A person may use City, Chat,
Workrooms, Apps, local AI, projects, Vault, Realm Studio, and local City
progress without an account.

Optional Google identity is an account-access feature, not a cloud-workspace
feature and not a backup product.

Before the first live Google sign-in, the Profile surface must make this clear:

> **Google Login helps with account access, purchases, and future recovery. It
> does not back up this device. Create an encrypted backup for work you cannot
> lose.**

## What stays on the device by default

- Chat text, prompts, and raw AI outputs;
- Vault contents, API keys, provider tokens, passwords, recovery material;
- projects, files, assets, Workroom state, Realm layouts, and City progress;
- local profile, preferences, local device evidence, and private diagnostics.

A Google Login must not silently upload, merge, inspect, or restore any of
those records. Signing out must not delete them either.

## Minimal Cloudflare account record after activation

Only after the user deliberately selects Google sign-in and the secure OAuth
implementation has passed Preview proof, Cloudflare D1 may hold:

1. random EON account id;
2. HMAC-protected Google issuer + subject reference;
3. verified-email boolean, not raw email by default;
4. created, last-login, consent, session-expiry, and revocation timestamps;
5. opaque session hashes;
6. later, a verified merchant-customer reference and entitlement state.

The raw Google subject, raw access/refresh tokens, local content, raw card
numbers, browser-storage copies, and prompts are not valid D1 fields.

## User experience requirements

1. Guest entry is always available.
2. Before the Google consent redirect: show the data-custody warning and an
   obvious encrypted backup route.
3. After successful sign-in: repeat that this device stays local and show
   Backup now / Not now. Do not treat this acknowledgement as backup proof.
4. Before checkout: say sign-in supports purchase access and receipts; it does
   not transfer or back up local work.
5. Account deletion explains the difference between deleting minimal account
   metadata and clearing device-local data.
6. No raw `email`, local alias, City state, Chat, or Vault content is rendered
   in server receipts or analytical logs.

## Technical boundary

- Google scopes at launch: `openid email profile` only.
- No Google Drive, Gmail, Calendar, Contacts, YouTube, or social scopes.
- OAuth uses Authorization Code + PKCE, state, nonce, exact redirect URI,
  backend token validation, opaque HttpOnly session cookie, CSRF/origin checks,
  rate limits, and separate Preview/Production configuration.
- Secrets are Cloudflare Secrets only, never browser storage, source snapshots,
  screenshots, or logs.
- Cloudflare storage is account/session/entitlement metadata only. It is not a
  workspace database, asset store, prompt relay, telemetry store, or sync
  service.

## Non-go until W374

No Google sign-in button may initiate OAuth until the operator has created the
Google Cloud OAuth client, configured Cloudflare secrets and D1 bindings,
reviewed Privacy/Terms/Support/Deletion copy, and passed Preview plus production
manual proof.
