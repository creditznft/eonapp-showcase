# W536 — Google Drive Encrypted Capsule Source Audit

## Decision

Google Drive is now the first implemented **browser-only encrypted-snapshot connector** for EONAPP continuity. It is deliberately separate from ordinary Google Login and stays user-initiated per snapshot.

## Current product truth

| Surface | Current behavior |
|---|---|
| Google Login | Identity-only; does not authorize Drive |
| Portable Workspace Capsule | One all-eligible local-workspace file; gzip before encryption only when supported and beneficial; v1 imports remain supported |
| Google Drive | W536 source connector exists; external client-ID configuration, OAuth consent, upload, restore, device proof, CI and deployment are not yet proven |
| Multi-device | Manual Capsule transfer/restore, optionally via a user-chosen encrypted Drive snapshot; never automatic sync |
| EON.HUB | No Drive authorization, storage, or recovery import path |

## Files introduced or materially changed

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
- `scripts/w518-workspace-capsule-gate.mjs`
- `tests/unit/w525b-account-vault-ux.test.mjs`
- `scripts/w525b-account-vault-ux-gate.mjs`
- `scripts/run-current-unit-suite.mjs`
- `scripts/w517-canonical-release-verify.mjs`

## Enforcement points

- `drive.file` is the sole Drive scope.
- Client ID is supplied from the public Pages configuration endpoint; no client secret is supported.
- GIS loads only after a user prepares the backup flow.
- A new token request occurs only after the user clicks the backup/list path.
- The browser creates the encrypted Capsule before a Drive request.
- Access credentials remain memory-only and are cleared/revoked on disconnect.
- Upload uses an explicit resumable session.
- Listing accepts app-created snapshots only; download, inspect, trash, and revoke are selected explicit actions.
- Capsule v2 compression occurs before AES-GCM encryption and only if it saves bytes; bounded decompression fails closed.
- Existing Capsule v1 import remains supported.
- The Capsule route alone has the GIS CSP/COOP exception needed for popup compatibility. The site-wide default stays unchanged.

## Local source evidence required before external work

```bash
npm run qa:w518-workspace-capsule
npm run qa:w525a-google-drive-vault-profile
npm run qa:w525b-account-vault-ux
npm run qa:w536-google-drive-snapshot
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run release:verify:canonical
```

A passing result is source-only evidence. It cannot prove a Google Cloud configuration, real consent, Drive data transfer, Pages environment variable, CI, preview, production deployment, PWA installation, or physical-device behavior.

## Follow-on human/Codex lane

Use `HANDOVER/W536_GOOGLE_DRIVE_CAPSULE_OWNER_CODEX_RUNBOOK_2026-07-03.md` for the exact Google Console, Cloudflare Pages, Codex, device, and evidence sequence.
