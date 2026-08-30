# W360 — EON City Portal and production-truth runbook

## Status

**Source implementation is complete.** This document is not evidence that a Cloudflare Preview or production deployment has occurred.

W360 changes the City front door:

| Route | Public role | Source document |
|---|---|---|
| `/eoncity` | EON City Portal | `eoncity.html` |
| `/eoncity/lite` | City Overview | `eoncity-lite.html` |
| `/eoncity/tour` | Spatial Command Space | `eoncity-3d.html` |
| `/eoncity/3d` | temporary compatibility route | `eoncity-3d.html` |
| `/eoncity/play` | Immersive Work Mode | `eoncity-play.html` |

The Portal is an original, light 2D-canvas arrival scene. It does not launch Babylon or Three.js, go fullscreen, send data, make a provider request, start background work, render private Chat/Vault data, or expose provider credentials. The visitor explicitly chooses the next mode.

## Source verification

Run from a clean source root after applying W359 and W360:

```bash
npm run qa:w359-eon-city-agent-director
npm run qa:w360-eon-city-portal-route
node --test tests/unit/w197-w201-sync-city-device.test.mjs tests/unit/w213-calm-city-trade.test.mjs tests/unit/w216-local-finalization.test.mjs tests/unit/w217-route-contract.test.mjs tests/unit/w224-cityworldstate-3d-parity.test.mjs tests/unit/w230-eonbot-command-hub.test.mjs tests/unit/w248-city-mode-contract.test.mjs tests/unit/w249-babylon-play-proof-spike.test.mjs
node scripts/w249-babylon-play-proof-spike-gate.mjs
```

Then, in the authoritative development workspace with dependencies installed:

```bash
npm ci
npm run lint
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

Do not substitute an old `dist` folder or an old Preview screenshot for this build evidence.

## Preview deployment proof

1. Build from the intended Git commit only.
2. Confirm the output directory is `dist`.
3. Confirm all of these clean route folders exist before upload:

```text
 dist/eoncity/index.html
 dist/eoncity/lite/index.html
 dist/eoncity/tour/index.html
 dist/eoncity/3d/index.html
 dist/eoncity/play/index.html
 dist/automations/index.html
```

4. Confirm both generated redirect files are byte-for-byte equal to the route contract output:

```bash
node -e "import('./config/route-contract.mjs').then(({renderCloudflareRedirects})=>{const fs=require('fs'); const e=renderCloudflareRedirects(); if(fs.readFileSync('_redirects','utf8')!==e||fs.readFileSync('public/_redirects','utf8')!==e) process.exit(1); console.log('redirect contract matches')})"
```

5. Deploy to a new Cloudflare Pages Preview. Do not overwrite production to discover basic routing faults.
6. Use the Preview URL first:

```bash
npm run qa:w360-production-route-probe -- --confirm-network --base-url https://YOUR-PREVIEW.pages.dev --out evidence/w360-preview-route-probe.json
```

A PASS requires status `200`, no redirect loop, and the expected marker on every route. The probe stores only redirect chain/status/headers/body length/hash/marker result. It never stores response bodies, cookies, browser storage, prompts, provider output, API keys or HAR data.

## Production deployment proof

Production is **blocked** until Preview is green.

After an approved deployment, run:

```bash
npm run qa:w360-production-route-probe -- --confirm-network --base-url https://eonapp.ch --out evidence/w360-production-route-probe.json
```

The production operator must visually confirm, on a cache-cleared desktop browser and one mobile device:

- `/automations` has no redirect loop.
- `/eoncity` opens the Portal, not the City Overview map.
- **ENTER EON CITY** starts a user-selected mode only.
- `/eoncity/lite` opens the fast overview.
- `/eoncity/tour` opens Spatial Command Space with a clean fallback.
- `/eoncity/3d` continues to work while compatibility is retained.
- `/eoncity/play` labels Babylon as Immersive Work Mode and does not auto-start fullscreen.
- Chat, Workspace, Local AI, Vault, Realm Studio, and return paths work from every City mode.

Capture screenshots only in the external evidence bundle, never in the ≤20 MB code snapshot.

## Failure handling

| Symptom | Treat as | Action |
|---|---|---|
| `/automations` loops | deployment/redirect incident | stop the promotion, identify Pages commit/output directory, compare generated `_redirects` and clean route folders |
| Old “Private Workstation” copy appears | stale production artifact | do not patch by hand; rebuild and deploy a verified commit |
| Portal shows City Overview first | build/input mismatch | verify `eoncity.html` is the W360 Portal source and clean route copy is current |
| Tour fails to start | device capability or WebGL fault | show City Overview fallback; collect local device proof; do not lower the privacy boundary |
| Babylon fails to start | device/runtime fault | show City Overview fallback; do not auto-fallback through a provider or hidden task |

## Explicit non-goals

W360 does not claim final game art, shipped GLB assets, combat, multiplayer, real-time cloud agents, provider execution inside the City, commerce, wallets, rewards, referrals, public Realm hosting, or performance certification.
