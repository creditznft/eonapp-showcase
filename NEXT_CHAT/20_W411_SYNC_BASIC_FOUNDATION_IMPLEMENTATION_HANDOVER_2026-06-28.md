# W411 EON Sync Basic Foundation — Implementation Handover

**Date:** 2026-06-28  
**Baseline:** supplied W405 continuation bundle, then validated UX-1, UX-2 and UX-3 checkpoints  
**Status:** source-only local schema and migration-preview foundation complete; EON Sync remains inactive.

## Decision preserved

Google login is **identity/session access only**. It is not a backup, password manager, cloud workspace, or proof that browser data is synced. W411 prepares an auditable local record model without connecting it to any transport, database, bucket, device registration, background task or public Sync switch.

## What W411 adds

### Safe record envelope

`assets/js/eon-sync/eon-sync-basic-foundation.js` defines the versioned `eonapp.sync-basic-record.v1` envelope with:

- `id`
- `type`
- `updatedAt`
- `version`
- `originDeviceId`
- `deletedAt`
- deterministic SHA-256 `contentHash`
- safe local `content` for preparation/review only

The permitted Layer-1 types are exactly:

1. `preferences`
2. `chat-metadata`
3. `chat-text`
4. `project-metadata`
5. `project-text`
6. `share-remix-metadata`

### Explicit local migration preview

The foundation can inspect a deliberately small, fixed candidate-key inventory for language/theme preferences, active chat metadata, selected chat/project text and Share/Remix metadata. It does not enumerate browser storage, alter it, or infer consent.

A record is prepared only when all of the following are present:

- the user has explicitly opted in;
- the record type was explicitly selected;
- a valid locally generated device ID is supplied;
- text-bearing candidates also satisfy the explicit text-consent rule;
- content is below the safety size cap and contains no detected secret-shaped field/value.

The resulting output is a `review-only-not-uploadable` preview. It does not write to `localStorage`, IndexedDB, D1, R2 or any other store.

### Safety exclusions

W411 explicitly excludes Vault entries/envelopes, API/provider credentials, recovery material, raw media, downloads, local-model binaries, render/browser/service-worker caches, wallet/payment data, Relay/reward state and unknown storage. Sensitive field names and common secret-shaped values are screened before a record can be prepared.

### Conflict and deletion preparation

- Low-risk metadata/preference conflicts select a newer candidate as a review strategy, but the source still marks `automaticOverwrite: false`.
- Chat/project text conflicts create a deterministic conflict-copy candidate; they are never silently overwritten.
- Deletion is modeled as a tombstone for a later controlled propagation design.

## What is intentionally not implemented

- no EON Sync UI opt-in flow or post-login banner;
- no cloud endpoint, authentication binding, D1 table, R2 bucket, queue, background sync or device registration;
- no import/merge execution, remote conflict resolution, deletion propagation, restore or rollback;
- no cross-device behavior;
- no Secure Vault Sync, client-side E2EE, passphrase/recovery kit or Vault/API-key upload;
- no claim that Google identity makes any local work available on another device.

The existing Settings copy now truthfully says that EON Sync is coming soon and spells out that it does not upload Chat, Vault, projects, files, API keys or browser caches.

## Source checks added

- `qa:w411-sync-basic-foundation` — static boundary gate plus four focused unit tests.
- `verify:w411-sync-basic-foundation` — full lint/source/build certificate command for an operator-run session.
- `platform-backend/contracts/eon-sync-basic-foundation.v1.json` — inactive storage and release-gate contract; it provisions no handler or endpoint.

## Required before W412 or any public Sync claim

1. Implement authenticated, idempotent Basic Sync endpoints and schema only after the data-retention/deletion rules are finalized.
2. Add the explicit opt-in, data-selection and import/merge review UI; no silent guest migration.
3. Prove sign-in and session behavior in a controlled production test before binding Sync to identity.
4. Run two-device proof for guest migration, merge choice, offline conflicts, tombstone propagation, sign-out/in retention and empty-device restore.
5. Keep Secure Vault Sync as a separately designed, client-side E2EE release with recovery, revocation and threat-model evidence.
