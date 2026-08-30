# EONAPP W637 — Persistence, Migration, Backup and Recovery Execution Brief

## Goal

Freeze a source-level persistence and recovery contract that preserves local work across upgrades and restores without silent overwrite, partial success, hidden sync or inflated production claims.

## Required lanes

1. Inventory every EONAPP-owned LocalStorage and IndexedDB surface, version and object-store owner.
2. Keep unknown same-origin storage outside EONAPP migration, deletion and backup scope.
3. Require inspection and a digest-bound reviewed preview before any encrypted portable restore.
4. Apply new encrypted envelopes in one add-only IndexedDB transaction; any conflict aborts the whole batch.
5. Re-read every committed envelope and state honestly when committed bytes fail verification.
6. Retain Workspace Capsule staging, drift detection, exact confirmation, encrypted rollback journal and integrity receipt.
7. Keep raw Creator media, provider keys, OAuth/session material and payment/referral secrets outside generic Capsule portability.
8. Keep Google Drive as explicit `drive.file` encrypted snapshots with memory-only tokens, never background sync or automatic restore.
9. Reject unknown future backup/Capsule versions before staging.
10. Keep real browser update, corruption, quota, interruption, Drive and cross-device proof externally pending.

## Acceptance

- The machine inventory matches the source database names, versions and stores.
- Conflicts and stale previews produce zero writes.
- An injected atomic batch failure produces zero partial records.
- Successful restore is one add-only batch followed by per-envelope verification.
- A post-commit verification failure is labeled `committed-verification-failed` with recovery required; it is never mislabeled as an aborted no-write result.
- Ordinary backup and sync continue to exclude secret-bearing payloads.
- Permanent certification expands from W636 without archiving or weakening maintained assertions.
