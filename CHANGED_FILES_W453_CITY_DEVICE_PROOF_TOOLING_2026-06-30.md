# W453 — City renderer-session evidence tooling

**Date:** 30 June 2026  
**Status:** source/test checkpoint only

## Implemented

- A bounded, **memory-only** EON City renderer-session observer:
  - first meaningful frame timing;
  - frame-count, average, p95 and p99 frame timing;
  - estimated FPS;
  - optional Chrome heap sample slope when the browser exposes `performance.memory`;
  - scene-stage, performance-protection and context-loss markers.
- Babylon now starts the observer at direct City entry, records engine/scene creation, first frame, deferred-detail start, performance protection and context loss, and exposes the summary to the foreground City station.
- Device Lab now displays the current local renderer-session summary and allows an explicit user export. It keeps manual test cases separate: console/WebGL warnings, GPU visuals, thermal/battery behaviour and touch/rotation still need human evidence.
- Manual Device Lab records retain bounded renderer metrics when a tester deliberately saves an observation.
- A W453 source gate and deterministic unit tests protect the privacy and fail-closed evidence boundary.

## Explicit limits

W453 does **not** run a browser test, inspect a console, create a screenshot, identify a device, read user agent data, send telemetry, persist a device profile, mark a device passed, certify EON City or approve release. Real laptop/Android/iOS testing remains W453 external evidence.
