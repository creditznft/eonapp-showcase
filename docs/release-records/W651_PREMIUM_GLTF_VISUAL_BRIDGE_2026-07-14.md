# W651 — Premium GLTF and Classic EONCITY Visual Bridge

## Purpose

The existing procedural EONCITY shell already provides the authored EON Noir districts, PBR lighting, ACES tone mapping, fog, glow, navigation, collision primitives and cinematic shadow system. W651 keeps that proven world and adds a bounded integration bridge so the premium W649 GLBs look native rather than pasted into a lower-quality scene.

## Implemented bridge

- Authored GLB materials, textures, metallic values and roughness values are preserved.
- Imported visual meshes cannot steal City pointer interactions and do not become collision geometry.
- Imported meshes receive cinematic shadows where supported.
- Only the explicit controllable player may become the premium dynamic shadow caster.
- District NPCs, landmarks and props never expand the dynamic shadow-caster set.
- Light budgets remain bounded by device profile: Lite 2, Balanced 4 and Cinematic 6.
- The bridge is disposed with the owning core/district container.
- The procedural city remains available as a safe visual fallback.

## Acceptance evidence

The permanent W649 asset acceptance gate loaded all 76 GLBs through Babylon, including 38 Meshopt primaries and 38 decoder-free fallbacks. Primary/fallback rigs and animation lists matched. Eight district transitions completed through the real runtime, one-district residency held, animation transitions executed and disposal left no W649 assets behind.

## Remaining external proof

Headed visual review is still required for:

- model scale and exact placement;
- skin deformation, foot sliding and clipping;
- Pathfinder Prime versus Pathfinder A owner preference;
- mobile-landscape composition;
- real-device frame rate, memory and context-loss recovery;
- final district art-direction approval.
