# W536 — Google Drive Capsule: Codex Merge and External Evidence Handoff

## Decision and current boundary

W536 is the first approved cloud-continuity implementation for EONAPP:

- `eonapp.ch` remains the only daily app origin.
- Google Login remains identity-only.
- Google Drive uses a **separate** explicit `drive.file` consent action from `/capsule`.
- Each backup is one user-confirmed encrypted Portable Workspace Capsule snapshot.
- Capsule v2 may gzip-compress locally before encryption only when doing so reduces the file.
- There is no background upload, scheduled backup, token persistence, refresh-token flow, automatic restore, or multi-device sync.
- `eon.hub`, IPFS gateways, referrals, rewards, and share pages have no Drive path.

This source package is locally verified only. Do not call the Drive connector active until owner configuration and controlled external evidence are complete.

## What Codex should merge

Apply the full W536 source package over the real Git worktree. Preserve all W519 quarantine boundaries and all existing local-first storage migrations.

Primary W536 files:

- `config/w536-google-drive-snapshot-contract.mjs`
- `assets/js/local-first/eon-google-drive-snapshot-connector.js`
- `functions/api/public/google-drive.js`
- `assets/js/local-first/eon-workspace-capsule.js`
- `assets/js/local-first/eon-workspace-capsule-page.js`
- `capsule.html`
- `vault.html`
- `profile.html`
- `_headers` and `public/_headers`
- `scripts/w536-google-drive-snapshot-gate.mjs`
- `tests/unit/w536-google-drive-snapshot.test.mjs`
- updated W518/W525B/W528/W530/W535 gates and tests

## Required source verification before any push

Run from a clean real Git worktree, with no `.env*`, browser profile, local model, `dist/`, `node_modules/`, private trace, or user data included:

```bash
npm ci --include=dev --no-audit --no-fund
npm run routes:sync
npm run docs:w534-index
npm run qa:w518-workspace-capsule
npm run qa:w525b-account-vault-ux
npm run qa:w536-google-drive-snapshot
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm audit --omit=dev
npm run verify:clean-checkout
```

Then run `npm run release:verify:canonical`. In constrained environments the aggregate runner may exceed a command watchdog after its individual gates finish. Do not infer a pass from that timeout alone; preserve the independent receipts above and rerun the aggregate command in a normal CI environment.

## Owner-only Google Cloud / Cloudflare work

The owner or an authorized project administrator must complete this; Codex must not impersonate the owner or create broad permissions.

1. Enable Google Drive API in the dedicated production Google Cloud project.
2. Configure the OAuth consent screen for `eonapp.ch`.
3. Create a Web OAuth client with exactly this production JavaScript origin:
   ```text
   https://eonapp.ch
   ```
4. Use only this Drive scope for the W536 flow:
   ```text
   https://www.googleapis.com/auth/drive.file
   ```
5. Add exactly one Cloudflare Pages **Production** variable:
   ```text
   EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID=<public web OAuth client ID>
   ```
6. Do not set a Google client secret. Do not add eon.hub, gateway, preview wildcard, HTTP production, or unrelated Google service scopes.

Detailed owner protocol: `HANDOVER/W536_GOOGLE_DRIVE_CAPSULE_OWNER_CODEX_RUNBOOK_2026-07-03.md`.

## Controlled external evidence to return

Codex must return a compact evidence pack, not a claim:

1. Git commit SHA, diff summary, and CI job table.
2. Redacted Google Console proof: Drive API enabled, Web client type, exact production origin, and `drive.file` consent only.
3. Redacted Pages configuration proof: variable name only; no secret exists for this feature.
4. `/api/public/google-drive` headers/body proving `configured:true`, `drive.file`, `Cache-Control:no-store`, and no secret/token field.
5. Disposable-fixture Drive proof: prepare, explicit consent, upload encrypted `.eoncapsule`, list, selected inspect, selected trash, session disconnect/revoke, and wrong-passphrase failure.
6. Separate Android, iPhone/iPad, and tablet proof of manual backup/restore behavior and no automatic sync on reopen.
7. Final truth board: `READY_FOR_OWNER_REVIEW`, `LIMITED_PREVIEW_ONLY`, or `BLOCKED` with all remaining blockers.

## EON.HUB is a separate handoff

The first owner-published Trust Hub CID is:

```text
Qmdaka87K9LdrHmsEFCSDLRttTWTtBiitpeAbVZSA33LLK
```

It proves the initial static folder was accepted and served. The W531.1 publication-copy update is a separate static package and will yield a new CID when the owner uploads its generated `PUBLISH/` tree. Do not add Drive configuration, OAuth, storage, tracking, referral data, or gateway automation to EON.HUB.

Share links remain:

```text
https://eonapp.ch/r/#eon2.<payload>.<signature>
https://<approved-gateway>/ipfs/<cid>/r/#eon2.<payload>.<signature>
```

The gateway form is a manual, public static alternative only after a provider-specific route and privacy review. Do not generate unverified `eon.hub.<provider>` aliases and do not enable tracking or rewards.
