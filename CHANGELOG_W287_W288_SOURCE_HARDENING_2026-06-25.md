# Changelog — W287/W288 Source Hardening

**Date:** 2026-06-25  
**Scope:** source-only EONBOT consent/language/voice boundaries and Creator handoff inspection integrity.  
**Release state:** W260 remains **NO-GO**. This batch does not deploy, activate referrals, alter Cloudflare/D1, enable wallet/chain runtime, add external tool access, or approve beta/launch.

## W287-A0 — EONBOT language, voice and personalization boundaries

- Added a local interaction-preference record with explicit, default-off controls for voice output, continuous voice, and name-based greeting.
- Kept microphone input outside Profile and voice controls off until a visitor chooses them on the device.
- Added a Profile card for reply language, voice output, local name-based greeting, and reset.
- Kept language selection local and user-controlled; unsupported/unknown language behavior remains the existing typed fallback rather than a capability claim.
- Added a fail-closed source gate and regression tests that reject a voice-default-on change.
- Stored no transcript, recording, provider key, contact, fingerprint, or remote identifier in the new preference record.

## W288-A0 — Creator ordinary-work handoff integrity preflight

- Added a local, review-only JSON handoff inspector to Projects.
- The inspector accepts only the canonical ordinary-work handoff schema and reports a finite summary before any person manually uses the file elsewhere.
- It rejects direct-import flags, Vault/payment/wallet/identity/automation fields, oversized payloads, unknown project fields, and secret-like values.
- It never writes project state, does not overwrite existing work, and does not call a network service.
- Added a fail-closed source gate and regression tests that reject a mutation-capable inspector.

## Evidence and known limits

- These are source/static controls only. They do not prove microphone permissions, speech quality, language quality, accessibility conformance, device behavior, recovery success, legal ownership, export compatibility, publishing, support operation, or public launch readiness.
- Local Lighthouse scoring remains environment-blocked in this sandbox (`chrome-error://chromewebdata/`, `NO_NAVSTART`); no score is claimed.
- W286 City district expansion remains unstarted because W265 still lacks its required first-district task, budget, art, and performance decision.
