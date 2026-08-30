# EONAPP W421 — Final City Art and Composition Handover

Use this W421 source package as the **only** baseline. Do not merge older handovers over it.

## What is newly complete in source

- **W419:** 18 original, source-authored SVG City art assets, same-origin runtime texture loading, quality tiers, hashes and build-copy verification.
- **W420:** local PBR color, fog, ACES/standard tone-mapping, vignette and dithering profiles for Lite, Balanced and Cinematic modes; cinematic-only bounded soft shadows remain opt-in.
- **W421:** a visible local **Art review** panel in City Controls, the actual art inventory, and six curated local cinematic compositions: Arrival Gate, Command Deck, Creator Atrium, Forge Bay, Signal Tower and Archive Gardens.

## What the package does not claim

The City is now a polished original **procedural/vector flagship fallback**, but it is **not a human-approved final institutional-grade 3D art release**. This source contains no final reviewed GLB/KTX2 asset set, no final original sound/animation pack, and no real device screenshot/video evidence. W417 remains the mandatory binary-art release lane.

## First commands

```bash
npm ci
npm run verify:w421-city-art-review
```

The combined command may exceed a restricted runner time limit while repeating its build stage. The detailed receipt documents the separately passed build, smoke, audit and readiness commands.

Read next:

1. `01_CITY_ART_INVENTORY_AND_COMPOSITION.md`
2. `02_SOURCE_STATUS_AND_REMAINING_ROADMAP.md`
3. `03_CODEX_EXECUTION_DEPLOY_AND_PROOF.md`
4. `04_MANUAL_CITY_ART_DEVICE_OAUTH_SYNC_PROOF.md`

## Fixed boundaries

- Babylon at `/eoncity` is the one public City engine.
- City art is same-origin and local; no remote art URL, user data, auto-posting, reward, wallet or provider execution is introduced.
- Google identity is not Sync.
- W412 Sync Basic stays fail-closed until dedicated Cloudflare D1, OAuth and real two-device proof exist.
- Local user work is not silently deleted, replaced or uploaded.
