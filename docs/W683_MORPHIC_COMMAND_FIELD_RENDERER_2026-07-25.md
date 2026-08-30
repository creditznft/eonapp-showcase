# W683 — Full NEXUS Morphic Command Field Renderer

Date: 2026-07-25
Branch: `local/w671-n3-c3-rebuild`

## Completed scope

- Replaced the W672 fixed-position vertical slice with a bounded spatial command-field projection.
- Preserved the W672 privacy projection as the source of truth for real project, task, approval, result, conversation, route and tool objects.
- Added state-specific field architecture, spatial lanes, depth, elevation, shape and meaningful relationship links.
- Integrated the same projected field into the DOM fallback and the existing lazy Babylon Living Core.
- Increased the bounded visible object budget from five primary nodes to ten real work objects without creating a second assistant or state store.

## Architecture and truth boundaries

- One EONBOT and one selected-project/task/approval/result authority.
- One lazy Living Core engine, scene, canvas and render loop.
- No synthetic project records, hidden work, auto-navigation, auto-approval or private-content read.
- Decorative geometry is subordinate to object purpose and real state.
- Reduced-motion and non-WebGL fallbacks remain functional.
