# W662B Camera-Relative Controls Implementation Receipt

**Date:** 23 July 2026  
**Repository:** `creditznft/EONAPP`  
**Working branch:** `agent/w662-nexus-city-reconciliation`  
**Draft PR:** #42 — remains draft and unmerged  
**Production source:** `063552ccc72b21cb1b8c73512039d29d4dff58cf` — unchanged  
**Production deployment:** `57758b16-f1a9-476c-855b-5d3de8f1444c` — unchanged

## Result

The fixed-world-axis movement defect is removed from the canonical EONCITY first-frame runtime in source. W662B is **implemented and covered by deterministic automated tests**, but it is deliberately **not marked complete** because authenticated browser, mobile and controller proof is still pending.

## Governed implementation

### Canonical resolver

`assets/js/city/eon-city-camera-relative-movement.js`

- derives camera-forward from the actual camera position and target projected onto the ground plane;
- falls back deterministically to Babylon `ArcRotateCamera.alpha` when a horizontal pose is unavailable;
- derives camera-right orthogonally so screen-right remains intuitive;
- normalizes digital, analogue and diagonal intent so diagonal movement cannot increase speed;
- keeps guided destinations world-relative rather than rotating them with the camera;
- returns an inactive result inside the movement dead zone or guided arrival radius.

### Canonical core integration

Commit `af169e19d5d520be06b770f7bbb9f5d3e3cc4018` updates only `assets/js/city/eon-city-play-core.js`:

- W/A/S/D, arrows, D-pad state and analogue/controller vectors now share the camera-relative resolver;
- movement remains collision- and bounds-aware through the existing third-person and product-layer resolvers;
- avatar heading now follows the resolved world direction;
- guided movement remains an explicit world target;
- movement is blocked while a visible dialog/overlay owns interaction;
- editable controls, buttons and links no longer leak directional keys into City movement;
- held keyboard movement is released on key-up, window blur and document visibility loss;
- listener cleanup is preserved on runtime destroy.

## W661E invariants preserved

The W662B patch does not rewrite `assets/js/city/eon-city-input-contract.js` and does not alter the protected short-tap frame-consumption lifecycle. The controlled patch job ran all four W661E regression tests before committing the canonical core:

- `tests/unit/w661e-frame-aware-browser-proof.test.mjs`
- `tests/unit/w661e-frame-safe-pulse.test.mjs`
- `tests/unit/w661e-pointer-completion-click-suppression.test.mjs`
- `tests/unit/w661e-pointer-event-timestamp-release.test.mjs`

## Deterministic W662B proof

`tests/unit/w662-camera-relative-movement.test.mjs` verifies:

1. W and D at south, east, north and west camera positions;
2. deterministic `ArcRotateCamera.alpha` fallback at 0°, 90°, 180° and 270° equivalents;
3. normalized diagonal/mixed input speed;
4. dead-zone behavior;
5. world-relative guided targets and arrival radius;
6. active core import and usage of the canonical resolver;
7. focus/overlay and blur/visibility release guards;
8. absence of the old fixed-axis direction and heading expressions.

The implementation ledger was then updated by commit `c0c4b63f2d33bd340f9b09a672c63f8018eb1902`:

- `camera-relative-controls.status = human-proof-required`
- `functionalInteractionProven = true`
- `automatedTestProven = true`
- `authenticatedHumanProof = false`

This prevents source success from being mislabeled final product acceptance.

## Still required before W662B acceptance

A governed authenticated browser matrix must prove all of the following in one coherent source state:

- Chrome, Edge and Firefox desktop;
- camera rotations equivalent to 0°, 90°, 180° and 270°;
- W/A/S/D and arrows;
- on-screen D-pad;
- touch/analogue joystick;
- controller/gamepad;
- no movement while dialogs, forms, buttons or links own focus;
- no held-key drift after key-up, blur, tab switch, district transfer, Expanse entry, Realm entry/exit or reset;
- collision and world-bound behavior in Core, districts, Expanse and Realms;
- W661E short taps remain stable under 300 ms, 500 ms and 700 ms render starvation.

## Release boundary

No Preview was created, no production deployment was changed, PR #42 remains draft, and PR #39 remains untouched. W662B cannot be called complete until the authenticated parity matrix is captured and reviewed.
