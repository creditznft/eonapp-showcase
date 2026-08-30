# UX-1 Simple Guest-to-Google Sign-in — Implementation Handover

**Date:** 2026-06-28  
**Baseline:** `EONAPP_NEXT_CHAT_W405_FLAGSHIP_CITY_SYNC_2026-06-28.zip` only  
**Status:** source implementation and source/build validation complete; production/manual evidence still required.

## What changed

UX-1 replaces the former authentication detour with one compact, reusable sign-in modal on every app-shell route.

A guest now sees **Guest** / **Guest · Sign in**, then chooses:

1. **Continue with Google** — user-tapped only; routes to the existing identity-only OAuth start endpoint when configured.
2. **Continue as guest** — closes the modal and leaves the user in local guest use.

The modal contains the required privacy statement:

> Your current work stays on this device. Sync is optional and comes later.

The sign-in path no longer requires a backup acknowledgement checkbox and does not send the user into Profile, Vault, Backup, or Sync before OAuth. Google Login remains identity/session access only. It does not activate EON Sync, browser-work upload, Vault/API-key sync, payments, referrals, social posting, or any other locked feature.

## Accessibility and responsive behavior

- Escape closes the dialog.
- Backdrop click closes the dialog.
- Focus returns to the triggering control after close.
- Tab focus is contained in the dialog.
- A mobile safe-area layout is included under 640 px.
- When Google Login is not configured, the modal shows an honest unavailable state and keeps the guest path usable.

## Compatibility repair included

The original W405 archive did not contain two static, design-only contract files needed by the current unit suite. They were restored verbatim as inactive contracts:

- `platform-backend/contracts/eon-account-commerce-foundations.v1.json`
- `platform-backend/contracts/eon-commercial-decision-gate.v1.json`

They explicitly keep commerce, rewards, checkout, payment providers, referral attribution, payouts, marketplace, token settlement, automatic backup, and cross-device Sync disabled. This repair does not activate any product capability.

## Older contract alignment

W373 previously required an obsolete Profile checkbox before sign-in. Its contract, gate, and tests now preserve the same local-data safety boundary while explicitly rejecting that auth gate. This aligns W373 with UX-1 instead of weakening the identity boundary.

## What is not proven

This source package does **not** prove:

- a real Google account chooser / consent flow;
- production callback, cookie/session persistence, logout, deletion, or deployment configuration;
- cross-device EON Sync, merge/conflict behavior, restore, or Vault secret sync;
- real-device EON City controls or authored City art quality.

A local Chromium proof attempt was blocked before navigation by the execution environment (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). No browser success is claimed from that attempt.
