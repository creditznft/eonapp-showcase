# EONAPP W624B — City Runtime Consolidation

Date: 2026-07-11  
Status: source-complete; focused certification and production build required before packaging  
Canonical route: `/eoncity`

## Purpose

W624B converts the accumulated EON City prototype boot paths into one protected, deterministic runtime owned by one module. It does not claim final Command District art, final rigs, flagship visual approval, or physical-device performance.

## Frozen architecture

1. `/eoncity` is the only production HTML route that can reach the protected heavy Babylon runtime.
2. `/api/city/access` remains the server-authoritative access preflight.
3. `assets/js/city/eon-city-runtime-owner.js` is the only production owner allowed to mount or dispose the heavy station.
4. `assets/js/eon-city-play-station.js` no longer self-mounts.
5. `eoncity-play.html`, `eoncity-3d.html`, and `eoncity-lite.html` are static compatibility redirects and contain no renderer module entry.
6. Guest, query-string, LocalStorage, and compatibility-document paths cannot boot the heavy renderer.
7. The canonical City document does not mount the generic app sidebar over the 3D shell.

## Runtime state machine

The runtime exposes exactly eleven explicit states:

1. `idle`
2. `checking-access`
3. `preview`
4. `loading-shell`
5. `loading-core`
6. `core-ready`
7. `streaming-detail`
8. `ready`
9. `degraded`
10. `recoverable-error`
11. `disposed`

Progress is computed from completed named stages. No timer can advance a fake percentage.

Core movement and useful-work navigation can become available at `core-ready` while optional detail continues. Failure of optional detail enters `degraded` rather than blocking the entire City.

## Recovery contract

W624B defines and gates these twelve cases:

- cold boot;
- warm boot;
- refresh during load;
- logout;
- session expiry;
- failed optional asset;
- failed required asset;
- WebGL context loss;
- low-memory downgrade;
- background/foreground resume;
- clean disposal;
- re-entry.

Session expiry and logout fail closed, dispose the renderer and local workload lease, and present a normal sign-in path. No project, provider, billing, referral, or Vault data is changed by renderer recovery.

## Asset and cache manifest

The versioned manifest is `eon.city.runtime-assets.w624b.v1` with cache version:

`eon-city-w624b-productive-nocturne-1`

It separates:

- five required local core assets with build-controlled SHA-256 metadata;
- five optional streamed detail assets;
- four procedural or silent fallbacks;
- three W624A target frames marked reference-only;
- audio groups that remain off until explicit user action.

No remote art, private data, user prompt, provider credential, or generated media is required by the manifest.

## Ownership and disposal

The runtime owner:

- disposes a superseded owner before remounting;
- records runtime state and stage progress on the City root;
- owns page-exit, logout and session-expiry listeners;
- owns retry and explicit disposal;
- releases engine, scene, events, asset references and workload lease;
- creates a fresh boot token and owner on re-entry.

## Evidence boundary

W624B does not prove:

- visual parity with the W624A target frames;
- final Command District art;
- final player, EONBOT or NPC rigs;
- sustained FPS, memory or thermal performance on physical devices;
- mobile touch/controller quality;
- live authenticated production boot;
- WebGL-loss recovery on a real browser/GPU;
- owner visual approval.

Those remain W624C–W624L and the final Codex live-certification backlog.
