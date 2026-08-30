# W525A — Google Drive Foundation & Vault/Profile Clarity Audit

**Date:** 2026-07-03  
**Scope:** Local source only. This wave does not authorize or prove Google OAuth storage consent, Drive upload, remote restore, background sync, physical-device recovery, preview, deployment, or launch.

## CEO decision

EONAPP keeps a single plain-language continuity model:

1. **Live now — local recovery:** create an encrypted Capsule or encrypted Vault export, keep the passphrase separate, inspect the restore plan, then choose record-level changes manually.
2. **Live now — manual storage:** the user may manually place the encrypted file in private storage they control, including Google Drive. EONAPP does not connect the account, upload a file, confirm a successful upload, or synchronize devices.
3. **Approved first cloud lane — Google Drive:** planned as a separate, explicit **encrypted snapshot** connector. It is deliberately disabled in this source checkpoint.
4. **Approved second lane — OneDrive:** only after the Google Drive lane is proven with the same security and recovery evidence.
5. **Not part of this lane:** automatic multi-device sync, background upload, automatic restore, managed recovery storage, provider token storage, IPFS/Pinata, eon.hub storage, wallet/payment/reward state, raw media, browser cache, local-model files, or unknown browser storage.

## Identity and storage are different consents

Existing Google Login remains **identity-only**. It cannot be treated as Drive permission, backup approval, cross-device recovery, or an upload right.

The eventual Google Drive connector is constrained to an explicit user action initiated from the Backup surface. Its intended permission is `https://www.googleapis.com/auth/drive.file`, requested only at that time. The product must use it only for EONAPP-created encrypted backups or a file the user explicitly selects. It must not request Gmail, Calendar, Contacts, YouTube, or broad Drive-content access.

## What W525A coded

### Google Drive foundation — no network

Added `assets/js/local-first/eon-google-drive-backup-foundation.js`.

It provides safe, renderable product truth only:

- `approved-foundation-not-enabled` state;
- no connected account, token, upload, background upload, sync, or automatic restore;
- separate Google Drive consent rule;
- `drive.file` as the intended least-privilege scope when the future connector is approved;
- explicit encrypted snapshot and restore-preview requirements;
- a consent preview that says exactly what the future connector would and would not do.

The module has no OAuth request, Google API call, upload, provider-file read, token, scheduler, or background job.

### Vault information architecture

The user-facing Vault now separates four concepts that were previously easy to confuse:

| Surface | User-facing purpose | Truth now |
|---|---|---|
| **Recovery** | Create/restore a Capsule and rehearse recovery | Live, manual, encrypted |
| **Google Drive** | First approved future backup connector | Planned, not connected |
| **Manual storage** | Place an encrypted file in storage the user controls | Live manual action; never verified as an upload |
| **AI provider keys** | Optional advanced AI-provider setup | Separate from recovery and Drive; raw key values are never rendered |
| **Vault Reveals** | Visual progression gallery | Separate, visual-only; no money, NFTs, rewards, trading, entitlement, or unlock state |

The Profile page now mirrors the same truth: PWA installation does not share browser storage; Google Login is not Google Drive; Capsule transfer remains the current cross-device path; and Drive backup is planned but disconnected.

### Data-survival refinement

The manual-storage activity key now migrates locally from `eon:cloud-backup-handoff:v2` to `eon:manual-encrypted-backup-status:v3`. This preserves a lightweight local UI receipt without claiming that a provider account, file upload, or cloud backup exists.

### Legacy cleanup

`assets/js/utils/cloud-backup-handoff.js` contained stale legacy language around wallets, utility NFTs, lootboxes, Arweave, and mainnet recovery. It was not an active importer, but leaving it in active utilities could mislead future work.

It is now physically preserved inside the W519 historical quarantine. The active Trust Showcase points at the current local-first continuity source instead. W519 inventory and import-fence proof now protect this boundary.

## Required implementation gates before a real Google Drive connector

A future implementation wave must not skip any of these:

1. **Owner-authorized Google Cloud/OAuth design:** exact client registration, redirect URLs, production/test separation, consent text, and privacy review.
2. **Separate storage consent:** ordinary Google Login must never silently escalate. Ask only after the user taps a clear Drive-backup action.
3. **Client-side encryption:** encrypt an allowlisted, versioned snapshot before upload. No API keys, recovery secrets, OAuth/provider tokens, payment/wallet/reward/referral state, raw media, models, or browser cache in the snapshot.
4. **Explicit upload confirmation:** show snapshot label, size, time, encrypted status, and recovery guidance before each upload.
5. **Restore-preview flow:** user selects a snapshot, sees a no-values plan, chooses conflicts per record, and confirms before any local change. No background merge.
6. **Version/conflict policy:** keep older verified snapshots until user removal; validate integrity, generation, device/change metadata, wrong-account cases, deletion, corruption, revocation, and outage behavior.
7. **Disconnect and deletion:** local connector state can be cleared; remote deletion and provider revocation are visible, user-confirmed actions.
8. **Human proof:** Android, iPhone, tablet, desktop, offline/reconnect, PWA-update, real Drive upload, restore, revoked consent, and recovery drills must pass before describing this as a cloud backup or multi-device feature.

## Deliberate no-go boundaries

- No OAuth or Drive API calls exist in W525A.
- No provider access/refresh token is stored in localStorage, Capsules, Vault exports, logs, analytics, or share URLs.
- No Google Drive connection is created by Google Login.
- No provider backup is labelled connected, verified, uploaded, synchronized, or restored.
- No IPFS/Pinata integration is reintroduced. That remains a later opt-in encrypted-mirror architecture, separate from cloud backup and Trust Hub.
- No production, preview, CI, device, or launch proof is implied.

## Local verification completed

- Offline dependency installation: pass (`424` packages; lifecycle scripts disabled).
- `qa:w525a-google-drive-vault-profile`: pass — source gate plus five targeted tests.
- Current runnable-product suite: **580/580 pass**.
- Lint: pass with `--max-warnings=0`.
- Production build, smoke build, site audit, public-output quarantine, launch-readiness source checks, and production dependency audit: pass.
- W518 Capsule gate: pass.
- W519 source and built-output quarantine: pass, now covering the newly archived stale helper.
- W520/W521/W522 source and built-output gates: pass.
- W517 canonical source verification and portable clean-checkout: pass before and after the full canonical run.

The final package-root verification record carries the final portable source identity so this source document does not create a self-referential manifest loop.

## Next recommended order

1. Run the full local suite, lint, build, W518/W519 built-output gates, and canonical portable verifier for W525A.
2. Keep W526 reserved for its approved CI/preview evidence-reconciliation role; do not reuse it to activate Drive.
3. After owner review and dedicated OAuth/security design, schedule a separate **Google Drive connector implementation** wave with a real test account and physical-device evidence.
4. Only after that lane is proven should OneDrive be considered.
