# W409 Implementation Handover — EON City Living Systems

**Baseline:** W408 Creator Atrium and Forge Bay source checkpoint.  
**Completed wave:** W409 — local City life cues, visual cycle, mission wayfinding and quality-governor integration.  
**Canonical public City:** Babylon at `/eoncity` only.

## Implemented

- Added `assets/js/city/eon-city-living-systems.js`.
  - Declares a bounded, local-only blueprint for NPC micro-patrol, landmark orientation, ambient light-pod motion, a visual midnight-to-dawn cycle and Mission Board intent.
  - Explicitly blocks fabricated user activity, user tracking, remote traffic, automatic route opening, rewards, commerce, cloud data and external requests.
  - Produces a reduced-effects profile that removes pods, pauses rain and holds the visual cycle at static night.
- Updated the canonical Babylon runtime (`assets/js/city/eon-city-play-babylon.js`).
  - Existing guide NPCs now make tiny decorative local patrol movements only.
  - Added a physical `living-mission-board`, `living-dawn-wash` light and bounded `living-ambient-light-pod` meshes.
  - Added a local virtual lighting cycle driven by `performance.now()`; it does not read a clock or claim real weather/time.
  - Connected the existing performance-protection route to disable optional W409 effects while preserving City wayfinding and controls.
  - Added a runtime summary for the local living-systems state.
- Added W409 contract, source gate, unit tests, npm commands, documentation and next-start material.

## Explicit boundaries preserved

- No GLB, KTX2, binary textures, remote assets, network requests, telemetry, account lookup, project content, media body, provider data, credential, Vault or Sync data.
- No auto-navigation, task execution, social presence simulation, publishing, deployment, payment, reward, referral, Relay or Sync activation.
- The Mission Board is visual wayfinding only. Native work destinations still follow the existing visible review and separate user click.
- No new public route and no Three.js City. W406B provenance, licensing, LOD, texture and mobile-fallback rules remain mandatory before binary art is shipped.

## Not proven

- Live deployment, desktop/mobile real-browser rendering, Android/iOS controls, reduced-motion behavior on hardware, GPU performance, final art quality, human art review, asset licensing release, weather realism, real-world time, OAuth, EON Sync or any posting/deployment workflow.
