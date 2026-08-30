# W536 — Google Drive Encrypted Capsule: Owner and Codex Runbook

## Scope and truth

W536 adds a browser-only Google Drive **encrypted snapshot** connector to the existing Portable Workspace Capsule flow.

It is not automatic sync. It is not a hosted recovery service. It does not reuse ordinary Google Login consent. It does not persist Drive access or refresh tokens. It does not upload raw Vault, browser, AI-provider, account, wallet, payment, OAuth-session, media, model, cache, or unknown-storage values.

Current source state: **implemented and locally source-verified, not externally enabled or proven.**

## What users get after the approved activation

1. On `/capsule`, the user enters and confirms a Capsule passphrase.
2. The browser collects every eligible allowlisted local workspace record into one Capsule.
3. The browser gzip-compresses it only when the platform supports gzip and doing so makes the plaintext smaller.
4. The browser encrypts the Capsule before contacting Google Drive.
5. The user separately approves the limited Google Drive permission.
6. The browser uploads one encrypted `.eoncapsule` snapshot only after that explicit action.
7. On another device, the user separately approves Drive access, lists app-created snapshots, chooses one, enters its passphrase, inspects a no-values restore plan, and explicitly selects which local changes to apply.

No step starts background upload, polling, scheduled backup, auto restore, or automatic multi-device sync.

## Owner actions in Google Cloud Console

These actions require the owner or a person authorized for the Google Cloud project. Codex cannot accept the consent screen, create trusted Google-console credentials, or sign in as the owner.

1. Create a dedicated production Google Cloud project for the Drive snapshot feature, or document why an existing production project is safely separated.
2. Enable **Google Drive API** for that project.
3. Configure OAuth app branding:
   - app name: EONAPP;
   - support email controlled by the owner;
   - authorized domain: `eonapp.ch`;
   - homepage and privacy-policy links on `https://eonapp.ch`;
   - external audience/test users while testing, then complete the appropriate Google publication/verification work before broad availability.
4. Add only this Google Drive scope to the Drive snapshot authorization flow:
   ```text
   https://www.googleapis.com/auth/drive.file
   ```
   Do not add `drive`, `drive.readonly`, Gmail, Calendar, Contacts, YouTube, offline access, or a refresh-token flow for this feature.
5. Create a new OAuth **Web application** client for the Drive snapshot feature.
6. In **Authorized JavaScript origins**, add exactly:
   ```text
   https://eonapp.ch
   ```
   Do not add `eon.hub`, IPFS gateways, random preview origins, wildcard origins, or `http` production origins.
7. Save the **client ID** only. Do not copy a client secret into EONAPP, Cloudflare Pages, GitHub, source, a Capsule, or chat.

The OAuth web-client origin must be a scheme + fully qualified hostname, and Google requires secure origins for OAuth web apps. The selected `drive.file` scope is deliberately limited to files users choose/share with the app and files the app creates. See the official Google sources at the end of this runbook.

## Owner action in Cloudflare Pages

After the real Git/CI review branch is accepted, add exactly one production Pages variable:

```text
EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID=<the public Web OAuth client ID>
```

- Production only. Keep Preview **unset** until a separate approved preview/test client and exact preview origin exist.
- This variable is public configuration, but it stays in Pages configuration so it is not hard-coded into source.
- Do not set `EON_GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` anywhere. W536 does not accept or use it.
- Do not put any Drive value on `eon.hub`, IPFS, a gateway, the static Trust Hub, or a referral/share surface.

The deployed Pages Function `/api/public/google-drive` only returns a validated public client ID, `drive.file` scope, configuration status, and `Cache-Control: no-store`.

## Codex work after owner configuration

Codex should only proceed after it has the W536 source package and the owner confirms the Google client ID has been added to **Production** Pages variables.

1. Apply the W536 source changes to the real Git worktree on a review branch.
2. Run the current canonical source verification before pushing.
3. Push a review branch and return the commit SHA plus complete GitHub Actions results.
4. Confirm the deployed review/production origin exposes no Drive configuration until the Pages variable exists.
5. After owner enables the Pages variable, confirm the endpoint returns:
   - `configured: true`;
   - the expected public client ID only;
   - the exact `drive.file` scope;
   - no secret/token fields;
   - `Cache-Control: no-store`.
6. Do not create a production activation or enable broad user access until the controlled evidence below is complete.

## Required controlled evidence

Use one disposable, non-sensitive fixture workspace and a dedicated test Google account first.

### Browser / Drive proof

- The Capsule page starts with no Drive account request.
- Clicking **Prepare Google Drive backup** loads consent preparation only; no workspace file uploads.
- Clicking **Connect & back up encrypted Capsule** presents separate Drive consent; ordinary Google Login alone must not satisfy it.
- The consent screen requests exactly `drive.file` for the snapshot action.
- Capture a screenshot with the browser address bar visible and redact email/address where needed.
- Confirm the Drive file is an encrypted `.eoncapsule` snapshot, with neutral name only; no raw fixture values in the filename or Drive metadata.
- List snapshots; select one; download it only after explicit selection; inspect the restore plan; do not apply records for the first pass.
- Test selected trash: it moves only that Drive copy to Drive trash and changes no local records.
- Test browser-session disconnect/revoke: it clears the in-memory permission and does not delete Drive snapshots.
- Test second-device/manual restore with a separate browser profile or phone after separate consent and passphrase entry.

### Device / PWA proof

- Android Chrome/PWA: backup, list, inspect, no automatic sync after reopen.
- iPhone Safari/PWA: same path, including popup/consent behavior.
- Tablet: same path.
- PWA update rehearsal: existing local Capsule/import remains available after update.

### Privacy / failure proof

- Declined consent leaves all local workspace records unchanged.
- Expired permission prompts for a new explicit Drive action; it is not silently renewed.
- Offline/Drive API failure changes no local workspace record.
- Wrong passphrase fails locally; no raw data is sent to Drive.
- Verify DevTools/Application storage contains no Drive access or refresh token after use.

## Exact evidence Codex must return

1. Git commit SHA, diff summary, and CI job table.
2. Redacted screenshot of Google Cloud setup: Drive API enabled; Web client type; exact authorized JavaScript origin; selected scope.
3. Redacted Pages variable proof showing variable name only, not any secret (there is no secret for this feature).
4. Endpoint response headers/body with client ID redacted except suffix if needed, showing `configured`, scope, and `no-store`.
5. Controlled Drive upload/list/inspect/trash/revoke receipts/screenshots.
6. Android, iPhone, and tablet evidence labeled by real device and browser/PWA mode.
7. A concise truth board: `READY_FOR_OWNER_REVIEW`, `LIMITED_PREVIEW_ONLY`, or `BLOCKED`, with exact outstanding blockers.

## Prohibited shortcuts

- Reusing Google Login identity consent for Drive.
- Adding `drive.readonly`, broad `drive`, refresh tokens, or a hidden server token store to bypass explicit consent.
- Adding a Google client secret to source, Pages variables, GitHub, or browser code.
- Enabling scheduled/automatic snapshotting, auto restore, silent sync, background polling, or cross-device reconciliation.
- Sending a Capsule unencrypted or sending raw Vault/API-key values.
- Adding a Drive connector to EON.HUB, IPFS, gateway, referral, or share routes.

## Source references

- Google Drive scope selection: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Google OAuth consent configuration: https://developers.google.com/workspace/guides/configure-oauth-consent
- Google web OAuth client / authorized JavaScript origins: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- Google JavaScript authorization API reference: https://developers.google.com/identity/oauth2/web/reference/js-reference
- Google Drive uploads: https://developers.google.com/workspace/drive/api/guides/manage-uploads
