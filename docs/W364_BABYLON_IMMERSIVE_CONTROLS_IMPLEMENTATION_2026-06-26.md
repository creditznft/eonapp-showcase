# W364 — Babylon Immersive Work Mode Controls

## Delivered locally

W364 upgrades the Neon Command District input layer from a proof D-pad into a bounded, game-grade control foundation:

- analogue touch joystick with pointer capture and release cleanup;
- retained accessible directional buttons for visitors who prefer discrete touch controls;
- keyboard movement with `WASD`/arrows, `E` to request the visible interaction review, `M` to toggle minimap, and `Escape` to pause;
- opt-in mouse click-to-move with a local destination marker;
- optional gamepad movement plus an action button that can request the visible interaction review;
- a compact local minimap that draws only public landmark coordinates, current player position, and an optional local movement target;
- lifecycle cleanup for input listeners, joystick capture, minimap timer, Babylon scene, canvas, fullscreen and orientation best-effort.

## Hard boundaries

- No action opens a native route automatically.
- Gamepad, keyboard and touch can request a route review only; destination confirmation remains a separate visible user choice.
- No prompts, provider output, Vault content, account identifiers, task detail, movement telemetry, or gamepad state is sent or retained.
- This wave does not introduce combat, rewards, wallets, commerce, OAuth, cloud scheduling or background automation.
- Click-to-move starts off and is a local assist feature, not pathfinding or a claim of accessibility certification.

## Design decision

The main mobile control is now an analogue joystick. The retained direction pad is deliberately an accessibility alternative rather than the flagship mobile mechanic. The minimap is informational and never exposes private work state.

## Manual device proof still required

Static/unit proof is not a substitute for real-device validation. Before any production promotion, test:

1. Android Chrome: joystick, safe area, long press cancellation, portrait and landscape.
2. iPhone Safari: joystick, touch scrolling suppression, fullscreen/orientation fallbacks.
3. Desktop: WASD, mouse look, click-to-move toggle, `M`, `E`, `Escape`.
4. Gamepad: left stick/D-pad movement, action button opens a review only, never confirms a route.
5. Pause/resume, tab backgrounding, WebGL loss, return to City Overview and cleanup.

## Next waves

- W365 / C-06: source-controlled asset pipeline, character/EONBOT/prop kit, LOD and provenance ledger.
- W366 / C-07: authored Neon Command District vertical slice and first Command Room interior.
- W367 / C-08: Three.js Spatial Command Space visual rebuild.
