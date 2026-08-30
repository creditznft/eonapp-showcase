# Flagship City Asset Production Brief

## Art standard

Create a midnight neon atelier: graphite/navy architecture, wet street reflections, glass/metal contrast, cyan/violet/mint accents, restrained bloom, readable wayfinding and skyline depth. Do not use copied game art, random stock-kit blending or generic cube-city composition.

## First asset batch

Prioritize the first frame and real creator meaning:

1. Arrival Gate exterior and wet street kit.
2. Command Centre exterior plus hero EONBOT companion.
3. Creator Atrium exterior and Forge Bay exterior.
4. Street furniture and skyline modules.
5. Signal Tower, Automation Observatory and Archive Gardens kits.
6. Readable companion/NPC variations only after the city landmarks are visually coherent.

## Technical delivery

- GLB only under `assets/city/`.
- KTX2/Basis Universal texture delivery; no external texture URL.
- lod0/lod1/lod2 for every hero asset.
- Fit the `CITY_ASSET_CATALOG` triangle, texture, material, draw-call and byte budgets.
- Maintain one local provenance document per asset under `docs/city-art/`.
- Record SHA-256 from the final shipped binary, not an authoring export.
- Use light baking/instancing only after visual review; do not add fake “AAA” claims.

## Approval sequence

Artist delivery → provenance/licence review → catalog approval → W417 manifest/hash preflight → desktop/Android/iOS visual and performance evidence → controlled release.
