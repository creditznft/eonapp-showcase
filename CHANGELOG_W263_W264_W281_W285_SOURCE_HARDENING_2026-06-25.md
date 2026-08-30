# Changelog — W263/W264/W281/W285 Source Hardening

**Date:** 2026-06-25  
**Scope:** source-only capability, export/recovery, provider-lifecycle, and Local AI/device-support hardening.  
**Release state:** W260 remains **NO-GO**. This change does not deploy, activate referrals, alter Cloudflare/D1, enable a wallet/chain runtime, create external tool access, or approve beta/launch.

## W263-A0 — EONBOT capability execution contract

- Canonicalized the internal capability registry to exact action ID, route, and action-type pairs.
- Bound every capability to an explicit user tap and `externalEffect: false`.
- Required local approved proposals before guarded Vault, microphone, or 3D receipt creation.
- Rejected forged, route-mismatched, type-mismatched, and unapproved guarded receipts.
- Added a fail-closed source gate and regression tests for all 22 finite local capabilities.

## W264-A0 — Creator/Build ordinary-work handoff

- Added a user-triggered local JSON handoff for ordinary project data only.
- Excluded automation IDs, Vault data, API keys, financial/value state, payment data, identities, and publication/delivery claims.
- Marked ownership as locally asserted and unverified.
- Documented that the export is not a direct restore/import, cloud sync, publication, delivery, ownership certificate, or recovery proof.
- Directed full-profile recovery to the existing Vault encrypted-backup path.

## W281-A0 — AI provider lifecycle source contract

- Converted the active hosted provider registry into a finite lifecycle snapshot.
- Enforced HTTPS and BYOK-only provider contracts, user-initiated model-list verification, controlled review records, and no URL-only hotfix policy.
- Added static evidence lanes for official provider review, user-owned non-production verification, and owner rollback/disposition.
- Made no network call and did not infer provider account, billing, model, or inference readiness.

## W285-A0 — Local AI/device-support baseline

- Added explicit local guidance for storage, heat, battery, and responsiveness stop conditions.
- Kept thermal, battery-health, and storage-headroom telemetry unavailable rather than inferred.
- Improved non-browser safety of the device profiler so explicit input can be tested without a browser DOM.
- Kept Local AI conservative: no automatic model installation/download, mobile/low-memory guidance remains Guide Mode or a connected provider first, and physical-device proof remains open.

## Evidence and known limits

- Source/static tests prove only checked-in behavior.
- Real device/download/open/save, provider, support, accessibility, legal, independent security, Cloudflare, restore, PWA, Lighthouse/Web Vitals, beta, and launch evidence remain outside this source package.
- Local Lighthouse score collection remains environment-blocked in this sandbox (`chrome-error://chromewebdata/`, `NO_NAVSTART`); no score is claimed.
