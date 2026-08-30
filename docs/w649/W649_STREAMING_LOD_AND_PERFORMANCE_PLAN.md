# Streaming, LOD and Performance Plan

## Signed-out route

Zero Babylon and zero GLB requests.

## Signed-in load tiers

### Tier 1 — controllable core

- Pathfinder Prime: about 0.70 MiB
- EONBOT Orbit: about 0.92 MiB
- procedural arrival platform, existing HUD and collision spine

Target W649 GLB bytes before controllable movement: **under 1.8 MiB**.

### Tier 2 — Orientation after first frame

- Orientation Hall
- Nav Info Kiosk
- District Info
- one Street Lamp instance source

These stream after movement is available. Do not block first input on the full hall.

### Tier 3 — current district

Load one district's hero landmark, host NPC and nearby props. Other districts remain unloaded or use procedural silhouettes.

### Tier 4 — cinematic/optional

Pathfinder A, alternate Vault Steward, distant landmarks, higher LODs, extra citizens and rich effects.

## LOD work still required

The compact GLBs are transfer-optimized candidates, not a complete LOD set.

- characters: LOD0 current; LOD1 approximately 50%; LOD2 silhouette/low-bone model
- hero landmarks: LOD0 current; LOD1 40–60%; LOD2 10–20%
- repeated props: street lamp LOD1 around 3k triangles; LOD2 billboard/disable
- collisions: primitive boxes/capsules or dedicated low-poly proxies only

## Device policy

- Lite: procedural environment, Prime or lowest tested player LOD, EONBOT fallback, one NPC max, low DPR and minimal particles.
- Balanced: primary default after proof, one host NPC plus nearby props.
- Cinematic: explicit opt-in on capable desktop; richer landmarks and one bounded shadow owner.

## Lifecycle proof

Measure first input, first frame, bytes by tier, draw calls, visible triangles, FPS/frame-time percentiles, cache reuse, route exit memory and re-entry memory. Abort loaders and dispose assets when leaving City.
