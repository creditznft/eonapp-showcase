# W667 — Expanse streaming recovery

## CEO decision

The Expanse is no longer represented as a bounded 3×3 proof. It is one deterministic streamed world inside the existing Babylon scene:

- a **5×5 visible horizon** follows the player;
- the inner **3×3 neighbourhood is interactive**;
- the outer 16 cells are lightweight roads and skyline silhouettes;
- moving one cell recycles five exiting cells and creates five entering cells instead of rebuilding the whole world;
- road edges remain deterministic and connected;
- there is no visible wall at the residency edge;
- the safety coordinate bound is expanded to 2048 units while rendering remains bounded by local residency;
- no second canvas, render loop, assistant, project store, network request or private-data read is introduced.

## Interaction authority

Only interactive cells create collision, route markers and functional encounter signals. Expanse encounter meshes are now exact pick targets. Clicking the visible signal opens that exact encounter review; it cannot fall through to a Core Transit station.

## Performance authority

The runtime owns a `Map` keyed by deterministic cell id. On a cell transition it:

1. retains records whose tier and role remain valid;
2. disposes cells leaving the 5×5 horizon;
3. rebuilds only cells whose interaction tier or current-cell role changed;
4. creates only newly entering cells;
5. regenerates bounded ambience from the inner interaction neighbourhood.

Runtime diagnostics expose created, reused and disposed cell counts plus the last entered, exited and rebuilt cell ids.

## Local acceptance

The local W664–W667 recovery suite is authoritative during development. Full Babylon, build and browser certification remains a W669 gate and must run before production deployment.
