# W679 — EONBOT Curiosity, Scanning and Explicit Docking

Date: 2026-07-25
Base source authority: W678 checkpoint `c82b96291a7c6bb81b214462d97addc6e7679621`

## Delivered

- Added a bounded EONBOT curiosity controller with follow, curious hover, scan, circle, return, dock approach, docked and reduced-motion idle states.
- Wired the controller into the already-visible EONBOT mesh and existing camera-safe companion director.
- Added public-scene scan targets without private-data access or background AI work.
- Made the Orientation Hall dock directly inspectable in the Productive City layer.
- Added explicit `requestEonbotDock`, `releaseEonbotDock` and runtime-summary APIs.
- Preserved one Babylon scene, one canvas and one render loop.

## Truth boundary

Docking changes only local companion presentation. It does not move Pathfinder, open a route, start work, capture voice, contact a provider, write storage or make a network request. Docking requires an explicit visible user action.

## Targeted evidence

`tests/unit/w679-eonbot-curiosity.test.mjs` — 4 assertions groups.
