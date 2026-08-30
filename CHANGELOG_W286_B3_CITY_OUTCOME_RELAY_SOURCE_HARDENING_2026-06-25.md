# Changelog — W286-B3 City Outcome Relay

**Date:** 2026-06-25  
**Scope:** source-safe EON City work-visualisation closure on top of W286-B1 Agent Presence and W286-B2 Work Huddles.

## Product decision

EON City is an optional visual command layer for real work, not a second automation engine, fake social simulation, wallet, referral system, or results console.

W286-B3 closes the truthful visual-work loop:

- queued/focused/parallel/handoff/review lifecycle remains visible through B1/B2;
- only the latest locally recorded `waiting`, `complete`, or `failed` state can create a finite City outcome relay;
- City displays status only: **Review needed**, **Result ready**, or **Attention needed**;
- the user explicitly taps **Review in Chat** or **Manage in Chat** to reach the native control/result surface.

## Implemented

- Added `getAgentPresenceOutcome()` to the shared local presence bridge.
- Added status-only result/review/attention beacons to City Lite, Three.js Visual Tour, and Babylon City Play.
- Added native Chat review links that remain normal user-tap links and record only a bounded local choice receipt.
- Added responsive styling so the review link remains usable beside existing City controls on narrow devices.
- Added a W286-B3 contract, source gate, negative tests, and approved-suite registration.

## Boundaries preserved

The relay never includes or derives:

- a prompt, response, transcript, tool output, work reference, provider/model identity, account detail, key, Vault data, wallet, payment, referral, token/coin, or personal data;
- an autonomous workflow, remote call, provider call, City-side task creation, approval, cancellation, publishing, result storage, automatic navigation, or telemetry transport.

Chat/EONBOT and native work routes remain the only control, approval, data, and results surfaces.

## Local verification

- `npm ci --offline --ignore-scripts --no-audit --no-fund` completed with 432 packages installed; lockfile remained unchanged.
- `npm run test:unit` — **275/275** approved tests passed.
- `npm run lint -- --max-warnings=0` — passed with zero warnings.
- `npm run build` — passed; 194 generated distribution files plus final count receipt (195 files in `dist`).
- City B1/B2/B3, W249–W255, W259, W265/W286, W260, W263/W264, W281/W285, W287/W288, W267/W268, W271–W277, W280, W283/W284, W289/W290, smoke, static audit, PWA, launch invariants, secret scan, and production dependency audit passed in bounded runs.
- `npm audit --omit=dev` — 0 known production vulnerabilities.

## Truthful remaining status

This is not Lighthouse, device, Cloudflare, D1, legal, independent-security, beta, deployment, or final-certification evidence. W260 remains **NO-GO**.
