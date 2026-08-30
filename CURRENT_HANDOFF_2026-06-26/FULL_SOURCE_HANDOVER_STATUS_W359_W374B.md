# Full source handover status — W359–W374B

## Snapshot identity

- Snapshot type: runnable source handover, no Git metadata.
- Date: 2026-06-26.
- Baseline: the W301–W358 return-source snapshot, then cumulative source work
  W359 through W374B.
- Purpose: continue safely in a fresh ChatGPT/Codex window with build/test
  files and the full current implementation context.

## Current completed source lanes

### EON City and Apps — W359–W372

- City Portal, City Lite, Babylon Immersive Work Mode controls and Three.js
  Spatial Command Space.
- Shared bounded CityWorldState and review-first City-to-work handoffs.
- App Deck: Workrooms, AI Crew, Connections and Blueprints.
- Asset provenance/load lifecycle contract, procedural Neon Command District,
  EONBOT work loop, local opt-in soundscape, My Realm visual profile and
  performance/certification readiness contracts.

### Identity — W364A, W373, W374 and W374B

- Guest-first data custody wording and portable-backup reminders.
- Minimal identity database schema and Cloudflare Pages Functions for optional
  Google OAuth authorization-code flow with PKCE, state, nonce, server-side
  validation and opaque secure sessions.
- Surface integration: Chat onboarding, app shell, Apps, City Portal, City
  Lite, Spatial Command Space, Immersive Work Mode, My Realm, Billing and
  Profile make account access discoverable without blocking guest use.
- The only OAuth launcher remains Profile / Account & Backup, after a user
  acknowledges that Google Login is not a backup.

## Source verification completed in this workspace

- `npm run qa:w374b-google-identity-onboarding-surfaces` — passed.
- Workspace secret scan — passed; no potential secrets detected.
- `npm run audit:site` — passed.
- `npm run launch:readiness` — passed with expected warning that `dist/` is
  absent until a local build is run.
- Earlier W359–W374 focused gates were recorded as passed in their source-wave
  handovers. Re-run them in the fresh environment after `npm ci`.

No full dependency install, complete lint/build, browser proof, real device
proof, Cloudflare deployment, D1 migration, live OAuth test, or production
route repair was performed in this final packaging pass.

## Required external/operator work

1. Complete C-00: reconcile Cloudflare production with this source, repair
   `/automations`, deploy Preview first and prove direct routes.
2. Configure the two D1 databases/bindings and Cloudflare variables/Secrets
   described in the Google identity runbooks. Do not place values in source.
3. Merge/deploy Preview and test Google OAuth only with the approved Google
   test user while the consent screen remains in Testing.
4. Capture redacted evidence for login, logout, minimal cloud-account deletion
   and preservation of local data on the same device.
5. Add approved original art/media through W365 provenance before presenting
   City graphics as final.
6. Run W372 real desktop/mobile/controller/accessibility/visual proof.
7. Only then consider Google consent publishing, payment onboarding or public
   execution claims.

## Known inherited blockers

The historical full unit suite has 17 known archive-integrity / missing
historic-evidence failures. They predate W359–W374B. Do not remove archive
checks, invent evidence, or report them as fixed without recovering the
authoritative Git/evidence material.

## Security rules

- Never commit any `.env*`, Google OAuth value, Cloudflare secret, D1 export,
  token, cookie, raw provider response, browser data or payment credential.
- Do not request Google Gmail, Drive, Calendar, Contacts or other service
  scopes under the identity login. Future connected services require separate
  consent and approval work.
- Cloudflare identity D1 stores only minimal account/session/entitlement
  metadata by contract. It does not store chats, projects, files, Vault data,
  provider keys, Realm data, City progress or encrypted local exports.
