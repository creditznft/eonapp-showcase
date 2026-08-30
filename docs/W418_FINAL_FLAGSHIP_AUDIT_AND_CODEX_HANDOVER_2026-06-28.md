# W418 — Final Flagship Source Audit and Codex Handover

## Source-complete scope

The source package includes the complete approved coding scope through:

- guest-first identity shell, account/settings shell, language matrix and honest voice fallback;
- Share/Remix handoff for Creator, Forge and City outcomes;
- EON Sync Basic foundation and fail-closed transport, without public release or Vault Sync;
- Living Creator Metropolis Option A: Arrival, Creator, Forge, Signal, Automation and Archive surfaces;
- Signal Expeditions Option B: four finite local authored-template sessions;
- City validation lab, procedural PBR renderer, cinematic-only bounded shadows and strict future art-release preflight.

## What this certification means

This is a source/build certification. It is **not an institutional-grade final visual-art certification**. No final City binary art is shipped; no real-device capture, live Google OAuth proof, D1 two-device Sync proof or production access proof is claimed.

The professional operational package is in `FINAL_HANDOVER_W418/`.

## Required checks

```bash
npm ci
npm run qa:w416-city-renderer-hardening
npm run qa:w417-city-asset-release-preflight
npm run qa:w418-final-flagship-audit
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```
