# W433 — EON Sync Basic merge and recovery source foundation

## What is implemented

W433 adds a review-first in-memory merge planner for the safe Sync Basic record types established by W411/W412. Every candidate record is reconstructed and hash-checked before planning. The planner produces explicit decisions for remote imports, reviewed low-risk replacement, text conflict copies, newer tombstones, identical records, and local-only retention.

A separate staging function requires an explicit action plus the relevant import, deletion, and conflict-copy consents. It returns a reversible replica proposal only. It does **not** read or write browser storage, upload anything, contact a Sync endpoint, register a device, or claim that Google identity enables Sync.

## What this closes at source level

- Integrity-checked merge input validation.
- Deterministic review decisions for low-risk metadata, text conflicts, and tombstones.
- Explicit consent checks for imports, destructive deletion, and conflict copies.
- A stage-only proposal with rollback snapshot; no app-owned data is mutated by the planner.
- Local two-record-set scenario coverage for replacement, conflict preservation, tombstone review, and source immutability.

## What remains externally required

W433 is **not** production Sync Basic. The following must be independently completed before any “Sync” activation or marketing claim:

1. A real account/session and two-device browser test on supported platforms.
2. A user-facing review UI with application-specific commit adapters and verified rollback.
3. Offline, reconnect, merge, deletion, browser-clear, and recovery proof.
4. W145-coupled update/rollback proof using real protected state.
5. Endpoint/D1 identity-index, consent, privacy, security, and support review.
6. Separate end-to-end encrypted Vault Sync design and proof. Vault/keys/recovery data remain excluded.

## Truth boundary

The W433 module is deliberately local and stage-only. It contains no `fetch`, `localStorage`, `sessionStorage`, IndexedDB, device registration, auto-merge, background upload, or external commit. It cannot certify physical devices, account identity, transport, persistence, or production recovery.
