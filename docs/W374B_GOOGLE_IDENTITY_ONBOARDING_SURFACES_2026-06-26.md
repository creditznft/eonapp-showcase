# W374B — Optional Google Login onboarding and surface integration

## Decision locked

EONAPP remains **guest-first**. Optional Google Login is not a requirement to
enter Chat, Apps, EON City, My Realm, local AI, the Vault, or any local tool.
It exists only for minimal account access, future verified purchase entitlement
management, and recovery of the minimal cloud account record.

Google Login is **not a backup**. It does not upload or synchronize browser
local Chat, Vault, projects, files, Realm setup, City progress, provider keys,
settings, or encrypted exports. Users must create and retain their own encrypted
backup for work they cannot lose.

## Where the message now appears

- **Chat** — the active onboarding destination includes a clear Getting Started
  panel linking to Account & Backup and Vault Backup.
- **Every app-shell route** — sidebar and mobile account entry point to Profile
  account/backup controls.
- **App Deck** — hero action and local-truth footer mention optional identity
  and encrypted backups.
- **EON City Portal** — utility navigation and footer explain guest entry and
  no City-data backup.
- **Spatial Command Space** — Account & Backup entry is present in the City
  utility actions.
- **Immersive Work Mode** — entry gate, fallback and HUD provide Account &
  Backup access without interrupting City use.
- **My Realm Studio** — visible local-data custody panel plus encrypted backup
  link.
- **Billing** — future purchase context explains that Google Login does not
  recover browser-local data.
- **Profile** — remains the only place where the user can acknowledge the
  no-backup warning, initiate Google OAuth, log out, or request minimal cloud
  account deletion.
- **Privacy, Terms and Support** — already contain the same data-custody
  policy and safe support boundaries.

## Return-to and acknowledgement rule

A surface can only route a user to Profile Account & Backup. It cannot begin
Google OAuth itself. Profile requires an explicit acknowledgement before it
requests `/api/auth/google/start`.

The OAuth callback can return only to a hardcoded allowlist of EONAPP routes:
Profile, Chat, Apps, Workspace, EON City modes, My Realm Studio and Billing.
External origins, malformed values and unrecognised routes fall back to Profile.

## Security boundary

No browser source contains the OAuth client secret, server signing keys, subject
pepper, session cookie value, authorization code, ID token, access token, refresh
token, raw email persistence or Google service scopes. The only requested scopes
remain `openid email profile`.

No Cloudflare configuration, D1 migration, live OAuth test, build, Preview
deploy or production deploy was performed in this source wave.
