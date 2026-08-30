# W660J EONCITY touch-route and provenance repair receipt

**Prepared:** 2026-07-20  
**Baseline authority:** W660I source commit `c21468df46209de1216ade5cc6ba5e5bfc9cfc28`  
**Production status while preparing this repair:** W660H remains restored and live.

## Observed production failure

The controlled W660I production acceptance reached a real playable Babylon/WebGL frame. Activating **Move forward** then navigated from `/eoncity` to `/`, so the candidate was rolled back immediately.

## Root cause proven in a headed browser

The authenticated progressive City used the app shell and a D-pad positioned at the lower-left of the City root. The shell's visually collapsed sidebar still retained a fixed 220 px hit-test box at z-index 210. Three movement controls were beneath `.eon-app-sidebar-scroll`; the right button alone extended beyond the hidden shell box. The loading overlay was also allowed to receive pointer events while the first frame was visible.

This was a DOM composition/hit-testing defect, not a failure of Babylon movement itself.

## W660J repair

- All movement buttons remain explicit `type="button"` controls.
- Capture-phase default navigation cancellation remains active.
- Button handlers stop normal and immediate propagation.
- The progressive City assigns deterministic inline HUD layers so CSS optimization cannot discard the safety boundary.
- The loading overlay is informational and has `pointer-events:none`.
- City-only sidebar hover expansion is disabled.
- The D-pad measures the fixed shell overlap and moves beyond that hit-test box on desktop.
- Mobile retains compact safe-area placement.
- Resize recalculates the shell clearance.
- One Babylon owner, canvas and render loop remain unchanged.

## Real-browser local proof

The maintained `scripts/w660j-touch-route-browser-proof.mjs` test uses headed Chromium, real WebGL, coordinate hit-testing, pointer press-and-hold and runtime position inspection.

Verified locally:

- all four movement buttons are the top coordinate hit target;
- forward, backward, left and right each move the player;
- the route remains `/eoncity` before and after every direction;
- programmatic accessible activation remains on `/eoncity` and produces the movement pulse;
- no application console errors, page errors or request failures were observed;
- this is local headed-browser evidence, not Preview, production or a physical-device pass.

## Release boundary

W660J must be packaged with the permanent Codex predeploy receipt and the W641 candidate provenance/manifest files. Codex must deploy the candidate `dist/` exactly without rebuilding it. Production promotion still requires one short authenticated headed acceptance on `eonapp.ch`, beginning with Move forward before spending credits on the wider matrix.
