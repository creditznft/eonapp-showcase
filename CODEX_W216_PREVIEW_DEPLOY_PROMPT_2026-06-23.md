This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex prompt — W216 Cloudflare Preview and real-device release evidence

## Goal
Validate the W180–W215 cumulative branch on a real Cloudflare Preview deployment. This is evidence collection, not another feature wave.

## First: local gate
Run every command in `CODEX_START_HERE_W215.md`. Stop on any failure.

## Preview route proof
Capture URL, timestamp, screenshot, console result, and route status for:
- `/chat`
- `/projects`
- `/library`
- `/workspace`
- `/automations`
- `/market`
- `/vault`
- `/trade`
- `/eoncity`
- `/eoncity/3d`
- `/rewards`
- `/telegram`
- `/reward-access`
- `/r/#eon2.<valid-token>`
- `/r/#eon3.<valid-token>` then `/u/<handle>` in the same browser
- tampered and expired signed link cases

## Device/PWA evidence
- Desktop Chrome/Edge: normal and reduced motion.
- Android Chrome: normal, low-end/low-memory fallback, QR open, install prompt where available.
- iPhone Safari: home-screen install instructions and post-update persistence.
- No-WebGL or forced low-capability profile: confirm calm 2D fallback.
- Verify update-safe user data with an export/restore scenario, not an assertion.

## Security/network evidence
- Save response headers for `/`, `/chat`, `/r/`, `/eoncity`, and a Worker/API route.
- Confirm CSP does not block the app.
- Confirm CSP report payload strips query/fragment/token data.
- Record a network trace showing no ad, offerwall, SmartLink, MyLead, CPAgrip, Monetag, or provider campaign request.
- Confirm issue/open of a signed share link does not call a D1/KV short-link resolver.
- Confirm only a deliberate qualified referral confirmation attempts the existing referral-tree API.

## Acceptance
W216 passes only when every required evidence row is filled with real proof. Do not call production ready from source inspection alone.
