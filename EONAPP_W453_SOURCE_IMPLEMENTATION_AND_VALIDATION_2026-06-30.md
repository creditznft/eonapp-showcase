# W453 City renderer-session evidence tooling — source implementation and validation

**Date:** 30 June 2026  
**Baseline:** W448–W452 production-cleanroom, legacy-retirement and app-shell checkpoint  
**Status:** source/test checkpoint; no device or production certification claimed

## Implemented

- Added `assets/js/city/eon-city-performance-observation.js`.
  - Measures a bounded foreground renderer session in memory only.
  - Records first meaningful frame, session duration, bounded frame sample count, average/p95/p99 frame time, estimated FPS, optional exposed-JS-heap slope, stage markers, performance protection and WebGL context loss.
  - Rejects invalid/negative frame values rather than mutating them into an apparent zero-millisecond frame.
  - Does not persist, identify a device, read user agent details, read private content, scrape browser console output, or issue telemetry.
- Wired the observer into the canonical Babylon `/eoncity` renderer.
  - Records entry, engine and scene creation, first frame, deferred-detail start, protection pass, context loss and renderer destruction.
  - Exposes the in-memory summary to the EON City station only.
- Extended Device Lab.
  - Shows the current renderer-session measures after City starts.
  - Allows a deliberate local JSON export.
  - Keeps manual checklist proof separate: console/WebGL warnings, GPU visual quality, thermal/battery behaviour and touch/rotation still require human review.
- Preserved W371 manual-observation semantics and added bounded first-frame/percentile/memory fields only when the person explicitly saves a manual record.
- Added W453 contract, source gate, unit suite entry, npm gate and launch-plan update.

## Validation completed locally

- W453 source gate: **9/9 passed**.
- W453 unit tests: **4/4 passed**.
- ESLint: **0 errors, 0 warnings**.
- Current runnable-product suite: **477/477 passed**.
- Production build: passed.
- W449 production cleanroom after build: passed.
- Build smoke: passed.
- Site audit: passed.
- Launch-readiness: **PASS**.

## Explicitly not claimed

- Browser visual test, real laptop/Android/iPhone timing, console/WebGL sweep, GPU trace, memory leak investigation, thermal/battery evidence, live service-worker update proof, deployed redirect proof or release certification.
- Final commissioned/licensed GLB/PBR art package. The City remains an original source-controlled procedural bridge pending W454 art production and visual sign-off.
