# W422 — Deep Original EON City Art Polish

**Date:** 2026-06-28  
**Status:** source-complete, locally validated; external visual/art proof remains required  
**Baseline:** W421 only

## Purpose

W422 deepens the original, source-controlled visual system for the canonical Babylon EON City. It expands the reusable local art kit from 18 foundation SVGs to **58 original local SVG assets**, then maps those assets into five authored City chapters, bounded quality tiers, and ten manual-review compositions.

This is a real runtime art layer. It is not a folder of unused concept files: the Babylon scene applies locally generated surfaces, facade/backdrop layers, floor decals, and compact props through the City renderer. The Art Review panel exposes the shipped inventory, chapter map, filters, and camera compositions for human review.

## What shipped in source

- 58 self-contained same-origin SVG assets: 18 W419 foundation assets plus 40 W422 deep-art extensions.
- Taxonomy: 12 material surfaces, 8 backdrops, 30 decals, and 8 props.
- Five authored chapters: Arrival/Command, Creator/Forge, Signal/Automation, Archive Gardens, and Signal Expeditions.
- 33 bounded authored placements in Cinematic; lower quality tiers select fewer placements.
- Local art dressing in the Babylon renderer: textured surfaces, distant backdrop planes, bounded floor decals, and compact billboard props.
- Art Review filters, chapter cards, and ten curated local views.
- Hash validation, no remote/data/image imports, no telemetry, no user-data use, and no media capture/upload.

## Quality and performance rules

- **Lite:** smallest local art selection and no cinematic-only effects.
- **Balanced:** constrained primary district dressing.
- **Cinematic:** full 58-piece local vector inventory and all 33 bounded placements; still no automatic external loading.
- Renderer remains PBR-based, with cinematic shadows bounded to cinematic mode.
- Every SVG is source-controlled and hash-checked. External GLB/KTX2 art must separately clear the W417 provenance, checksum, LOD, and human-review intake.

## Truth boundary

W422 is an original vector/procedural art release, **not final binary art**. It does not prove a reviewed final GLB/KTX2 art release, final institutional visual certification, desktop/mobile performance, art rights approval, or production deployment quality. **Real-device visual proof** and human art/rights review are mandatory before stronger public visual claims.
