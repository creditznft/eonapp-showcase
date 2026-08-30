# EONAPP W747 — Local Spatial Foundation Report

**Date:** 29 July 2026
**Status:** **W747 BLOCKED — SOURCE, ASSET OR BROWSER EVIDENCE INCOMPLETE**
**Deployment:** none
**Preview:** none
**Merge:** none

## Authority

- Branch: `w747-spatial-foundation-local`
- Corrected uploaded starting commit: `ff17b66d9b81b04268b956338c99890185f50256`
- Corrected uploaded starting tree: `cdb624ccd76b1f7fb2793c482e98053b2b0724c9`
- Implementation commit: `a658fcd53002f697aa757b8c47777d3dd1680252`
- Implementation tree: `84ab57470810b8b1a2a4a2001cb5684e4f431252`

The W747 brief named `88c836b` / tree `745b96d`, but the uploaded W745 source archive and uploaded Git history bundle matched each other byte-for-byte across 4,876 tracked files and resolve to `ff17b66` / tree `cdb624c`. The grounded uploaded authority was used; no older runtime overlay was applied.

## Spatial changes

- Added Babylon-free spatial authority: `assets/js/city/w747/eon-city-w747-spatial-foundation.js`.
- Reserved one protected central Nexus socket at `(0, 0, 0)` with a 6 m radius / 12 m diameter.
- Defined five wings: Creator, Operations, Knowledge, Systems and Personal/Transit.
- Moved the safe player spawn from `(0, 0, 10.5)` to `(0, 0, 16.2)` and reserved a 5.3 m-wide arrival reveal corridor.
- Replaced the former oblique arrival camera with deterministic arrival, return, Nexus-focus and follow poses.
- Added bounded station-focus framing and exact camera capture/restore around shared work surfaces.
- Retired only the duplicate central `command-centre-shell` use of the Orientation Hall GLB.
- Preserved the outside `archive-garden-world` Orientation Hall use.
- Moved the procedural command table from `(0, 0.46, 1.2)` to `(0, 0.46, -8.05)`.
- Moved the command seat from `(-2.2, 0, 1.15)` to `(-2.55, 0, -8.45)`.
- Moved the district hologram from `(2.2, 0, 1.15)` to `(2.65, 0, -8.35)`.
- Raised and widened the canopy; rotated column placement by `π/8` so the certified arrival corridor is not centred on a column.
- Added actual post-transform loaded-GLB AABB registration and checks for arrival-ray occlusion, Hero Zone intersection, primary overlap, duplicate primary roles and below-floor bounds.
- Added an advanced-only diagnostics overlay; it is not owner-visible by default.
- Preserved one Babylon engine, one scene, one render loop, City Menu, Pathfinder, EONBOT and shared work-surface routing.

The complete old/new station coordinate table, camera definitions and wing anchors are in `artifacts/w747-spatial-foundation/source-receipt.json`.

## Tests

- Focused W747 source gate: **42 passed, 0 failed**.
- Maintained W745 regression gate: **60 passed, 0 failed**.
- Maintained W659N asset-count contract alignment: **10 passed, 0 failed** after updating the stale assertion to count all active manifest groups (`stationProps` and `ambientAssets` included). The untouched `ff17b66` authority failed the old assertion identically, so this was a pre-existing test-contract defect rather than a W747 runtime regression.
- Asset binary integrity: **41 entries, 82 variants, 79,149,292 bytes checked; PASS**.
- Site audit: **49 HTML files; PASS**.
- Page invariants: **0 blockers, 2 pre-existing trust-copy warnings**.
- Identity surface: **0 blockers, 0 warnings**.
- Build: **BLOCKED**. `node_modules` is absent; the configured npm mirror returns 404 for `ws@7.5.11`; a public-registry retry fails with `EAI_AGAIN`.
- Headed browser/device matrix: **BLOCKED** because Vite and Node Playwright dependencies could not be installed or resolved.

## Evidence

- Focused log: `artifacts/w747-spatial-foundation/focused-source-gate.txt`
- Maintained regression log: `artifacts/w747-spatial-foundation/maintained-w745-regression-gate.txt`
- Maintained contract-alignment log: `artifacts/w747-spatial-foundation/w659n-maintained-contract-alignment.txt`
- Source receipt: `artifacts/w747-spatial-foundation/source-receipt.json`
- Dependency blocker: `artifacts/w747-spatial-foundation/dependency-browser-blocker.txt`
- Static design map: `artifacts/w747-spatial-foundation/spatial-map.svg` — not a headed browser screenshot.
- Screenshots: not produced.
- Video: not produced.
- Browser console/network summary: not produced.

## Status

`W747 BLOCKED — SOURCE, ASSET OR BROWSER EVIDENCE INCOMPLETE`

The source and asset portion is passing. W747 must not be promoted to W748 until a dependency-capable local environment runs the production build and captures the required headed desktop, ultrawide, mobile, return-camera, Nexus-focus and diagnostics evidence.
