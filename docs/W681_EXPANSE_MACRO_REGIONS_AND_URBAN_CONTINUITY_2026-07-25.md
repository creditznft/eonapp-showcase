# W681 — Expanse Macro-Regions, Roads and Urban Continuity

Date: 2026-07-25
Base source authority: W678 checkpoint `c82b96291a7c6bb81b214462d97addc6e7679621`

## Delivered

- Preserved the certified 5×5 detailed streaming window: 25 cells, with 9 interactive and 16 horizon cells.
- Added a deterministic 3×3 macro-region neighborhood around the detailed window.
- Added 12 cross-region arterials, two current-region approaches and eight quality-scaled horizon identities.
- Kept macro identities stable while moving inside a macro-region and rebuilt them only after a macro boundary is crossed.
- Rendered all W681 geometry beneath the existing Expanse root in the canonical Babylon scene.

## Truth boundary

Macro roads and skyline identities are local source-controlled procedural presentation. They do not navigate the player, generate runtime AI geometry, create another engine or canvas, or make network requests.

## Targeted evidence

`tests/unit/w681-expanse-macro-regions.test.mjs` — 4 assertion groups.
