# W478 — Accessibility, identity and real-device proof

## Why this wave exists

EONAPP already has source-level controls for accessibility, language, EONBOT voice preferences, optional Google identity, local-only device evidence, update recovery and encrypted portable backup. Source wiring is useful, but it is not the same as a user completing an accessible task on a real device.

This wave keeps the release claim honest: **source-ready, external evidence required**.

## Evidence lanes

1. Desktop keyboard and screen-reader review across canonical routes.
2. Human locale review including RTL and fallback copy.
3. Voice/microphone opt-in and failure behavior on actual devices.
4. Optional Google OAuth preview proof only when the reviewed test configuration exists.
5. Android/iOS PWA, safe-area, touch, keyboard, offline and slow-network review.
6. Disposable-data install/update/rollback/backup/restore recovery rehearsal.
7. Sync Basic two-device evidence only if the product owner explicitly enables Sync.

## Required behavior

- EONBOT voice and microphone start off. A user action is required before any microphone request.
- Guest/local work remains usable without sign-in.
- Google identity uses only identity scopes and must not upload local work.
- Portable backup is explicit, encrypted and excludes API keys, tokens, wallets, recovery material and provider credentials.
- Sync Basic is not inferred from backup. It remains separately enabled and separately proven.

## Exit rule

No release or marketing copy may claim accessibility certification, real-device compatibility, live Google sign-in, update-safe recovery, or two-device Sync until the matching reviewed evidence is recorded outside the source archive.
