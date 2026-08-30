# W525 — Data Continuity, Vault & Profile CEO Audit

**Date:** 2026-07-03  
**Scope:** Current portable W525 source only. This is not deployment, real OAuth, provider connection, physical-device, PWA-install, IPFS, payment, Web3, or launch evidence.

## Board decision

**Keep the local-first model.**

1. **Live now:** encrypted, user-confirmed local Capsule and Vault export/import.
2. **Not live:** automatic multi-device sync, automatic cloud upload, managed recovery cloud, provider-connected backup, automatic restore, or any IPFS/Arweave/Pinata transport.
3. **First future automatic connectors:** Google Drive first, OneDrive second, each only after a dedicated opt-in storage-consent and recovery-proof wave.
4. **IPFS / Pinata:** do not add to EONAPP runtime today. Treat it only as a later **advanced user-owned encrypted mirror** design. It must never be sync, a public backup, an unencrypted Vault store, or a place for OAuth/provider tokens.
5. **EON.HUB:** remains a public Trust & Rescue Layer. It is not a browser-storage mirror, Capsule host, auth origin, or recovery-sync service.

## What the source actually does today

### 1. User data continuity

- The current browser profile remains the primary local workspace.
- The Portable Workspace Capsule creates an encrypted file and restores only after inspection, explicit record selection, explicit overwrite decisions, confirmation, drift checks, an encrypted journal, and rollback protection.
- The Vault export is separately encrypted and bounded to allowlisted EONAPP-owned records. It excludes unrelated same-origin data and credential containers.
- A backup file can be manually stored in user-controlled storage. EONAPP does not connect the account, upload, verify a successful upload, or synchronize the file.
- A current local test suite proves source-level Cloudflare-update survival for protected EONAPP records. It is not a real device or cross-device recovery claim.

### 2. Identity versus storage

Google Login remains identity-only. It is not a cloud backup, Drive connection, data transfer, or cross-device restore mechanism. A future Drive connector must use a separate storage-specific consent journey and must not reuse identity consent as proof of storage permission.

### 3. Vault boundary

The active Vault page renders provider names/status only and does not render raw secret values. It explicitly states that cross-device sync is not active. Provider keys, recovery secrets, sessions/tokens, wallets, payment data, commercial entitlements, rewards/referrals, local models, browser caches, and unknown browser storage are excluded from portable continuity.

### 4. Vault Reveals

Vault Reveals are retained as **visual-only planned progression**. The source does not create grants, money, tokens, NFTs, chance mechanics, trading, transfers, ownership claims, marketplace activity, account entitlements, or City unlocks. The styling has reduced-motion protection.

## Remediation completed in this wave

1. Added one reusable data-continuity truth model used by Vault, Profile, and manual-storage guidance.
2. Removed the dormant active Vault remote-hook API and the misleading optional remote-mirror list.
3. Changed the retired `publishToP2P` option into an explicit fail-closed error for old callers.
4. Corrected the manual-storage UI so local handoff activity can never appear as a connected provider, verified upload, cloud backup, or sync.
5. Made Profile and Vault agree: manual encrypted Capsule/Vault transfer is live; automatic multi-device sync is not active.
6. Added a dedicated W525 source test covering continuity truth, provider-hand-off truth, retired remote publish surface, aligned UI copy, and non-sensitive Vault Reveals.
7. Moved the obsolete W21 runnable test that imported removed referral/IPFS-era code into the existing W519 historical quarantine. It remains preserved as archaeology but is no longer a live test contract.

## Future architecture: approved direction, not implemented

### Google Drive — first

Use a dedicated backup consent, separate from Google Login. Upload **only client-encrypted, versioned snapshot files**. Start with a user-visible backup slot and restore preview; never background-merge browser records. Implement explicit revoke/disconnect, delete-location guidance, encrypted manifest validation, device/change identifiers, and a human recovery drill.

### OneDrive — second

Use the equivalent dedicated consent and an app-scoped storage location where the permitted account type and provider model allow it. Preserve the same encrypted snapshot, explicit restore, revocation, and recovery-proof rules. Do not request broad file access merely for convenience.

### User-owned IPFS / Pinata — later advanced option

Do not add a provider token, gateway URL, CID, pinning SDK, resolver, sync engine, or restore path to current EONAPP. A future option would need:

- client-side encrypted payload before upload;
- no secret/provider token inside the Capsule or exported data;
- separate explicit provider authorization on the user’s own account;
- private/provider-appropriate storage design and clear metadata/CID risk explanation;
- immutable mirror only, never automatic conflict resolution;
- no public link generation, social preview, referral, reward, or tracking coupling;
- mirror verification and a user-confirmed restore path;
- separate security, privacy, abuse, retention, cost, and recovery tests.

Until those gates pass, the safe user-owned IPFS action is **manual storage of an encrypted Capsule outside EONAPP**, with the user taking responsibility for their own provider account and retention.

## Required implementation gates before automatic cloud backup

1. Separate OAuth client/callback and explicit storage consent; no implicit use of identity sign-in.
2. Client-side encryption before provider upload, with opaque filenames and a versioned encrypted manifest.
3. No provider access/refresh token inside the backup file or shareable URL.
4. Snapshot integrity, authenticated encryption, key/passphrase recovery guidance, and size limits.
5. Explicit new-device restore preview; no silent restore and no background merge.
6. Device identity, generation number, hash, timestamp, and conflict UI; retain older verified snapshots until the user removes them.
7. Disconnect/revoke flow and clear local connector state; provider deletion remains user-confirmed.
8. Provider outage, deleted file, wrong account, corrupted ciphertext, expired consent, rollback, and browser-private-mode tests.
9. Physical Android, iPhone, tablet, and desktop recovery proof before the feature is described as multi-device backup.

## Evidence executed after remediation

- `npm ci --include=dev --ignore-scripts --no-audit --no-fund` — pass (424 packages).
- `npm run release:verify:canonical` — pass.
  - current product tests: **575/575 pass**;
  - lint: pass with `--max-warnings=0`;
  - build, source syntax, smoke build, site audit, launch-readiness source checks: pass;
  - W518 Capsule gate: pass;
  - W519 source and built-output quarantine: pass;
  - W520/W521/W522 source/build gates: pass;
  - production dependency audit (`npm audit --omit=dev`): pass;
  - portable clean-checkout verifier before and after: pass.
- The final portable source identity and source-file count are recorded in the package-root final verification record so this source document does not create a self-referential manifest loop.

## Verification limits

Nothing in this audit proves:

- a cloud provider connection, upload, or restore;
- Google/OneDrive OAuth completion;
- Pinata/IPFS/Arweave use;
- PWA install/update/rollback on a physical device;
- real cross-device recovery;
- a Git commit/push, CI run, preview, or production deployment;
- a launch decision.

## Changed active files

- `assets/js/local-first/eon-data-continuity.js` — new no-network continuity truth model.
- `assets/js/utils/cloud-backup-connectors.js` — manual handoff wording/state correction.
- `assets/js/utils/vault.js` — remove dormant remote hook/mirror policy; fail closed for retired option.
- `assets/js/vault/eon-vault-page.js` and `vault.html` — continuity card.
- `assets/js/profile-page.js` — aligned identity and continuity truth.
- `assets/css/eon-vault-v2.css` — continuity-card styling.
- `tests/unit/w525-data-continuity-vault-profile.test.mjs` — new current-source coverage.
- `scripts/run-current-unit-suite.mjs` — includes W525 test.
- `archive/w519-legacy-transport-control/tests/unit/w21-vault-referral-backup.archived.mjs` — historical contract quarantine.

## Next recommended wave

Proceed with **W526 CI / preview evidence reconciliation only after an owner-reviewed commit**. Keep provider backups, OAuth storage connectors, IPFS/Pinata, eon.hub CID publication, and deployment out of scope until their dedicated evidence gates are approved.
