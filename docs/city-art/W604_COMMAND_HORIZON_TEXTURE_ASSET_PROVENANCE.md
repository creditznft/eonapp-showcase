# W604 — Command Horizon Original PBR Texture Asset Provenance

## Scope

W604 ships a **source-generated PBR texture candidate layer** for the three W603 Command Horizon local environment kits:

- `command-horizon-arrival-gate-textured`
- `command-horizon-command-deck-textured`
- `command-horizon-wayfinding-textured`

Each asset is emitted as a same-origin `.glb` with four embedded, deterministic 128 × 128 PNG texture payloads:

1. wet graphite / brushed metal base colour;
2. metallic-roughness response;
3. tangent-space normal variation;
4. cyan emissive panel-grid response.

The source builder is `scripts/build-w604-command-horizon-texture-assets.mjs`. It begins with the W603 original models, derives deterministic UVs from mesh position where needed, and embeds the generated texture payloads directly into each GLB. No download, account data, microphone data, analytics data, remote URI, third-party image, marketplace asset, or user content is introduced.

## Asset truth

| Asset | Lite selection | Balanced selection | Cinematic selection |
|---|---|---|---|
| Arrival Gate | W603 textureless fallback | W604 embedded PNG PBR | W604 embedded PNG PBR |
| Command Deck | W603 textureless fallback | W604 embedded PNG PBR | W604 embedded PNG PBR |
| Wayfinding | W603 textureless fallback | W604 embedded PNG PBR | W604 embedded PNG PBR |

W604’s textured variants are source-shipped engineering candidates. They are **not** a claim of finished AAA texture authoring, owner visual approval, KTX2/Basis compression, browser/device visual acceptance, or authenticated production closure.

## Deliberate quality and safety boundaries

- The texture resolution is capped at 128 × 128 in this first local PBR layer.
- Textures are embedded as PNG inside GLB to make the binary self-contained and auditable.
- KTX2/Basis is **not** shipped. A verified KTX2/Basis compression/DCC lane remains mandatory before calling the cinematic profile release-ready.
- `Lite` keeps W603’s textureless local PBR fallback to preserve a low-memory intentional profile.
- `Balanced` and `Cinematic` select W604’s embedded-PNG candidates only through the source-controlled City asset catalog.
- The original procedural City meshes remain only safe fallbacks if an asset fails to load; this is not a remotely fetched asset strategy.
- Texture visual quality must be reviewed in a real browser, on actual desktop/mobile devices, after the W599 authenticated interaction closeout.

## Original-work statement

These texture formulas, binary assembly logic, and resulting images are generated in-house from source code for EONAPP. They are not derivative of a third-party model, image, texture set, asset pack, game, or brand. Their controlled-original-work status requires continuing provenance, visual, and release review.

## Required next quality gates

1. W604 source integrity gate: exact source/public hash parity, embedded image count, local-only URI policy, UV availability, and PBR material bindings.
2. Real Babylon browser run: verify textures visibly load on the Arrival Gate, Command Deck, and Wayfinding kits.
3. Device profile run: Lite keeps fallback; Balanced and Cinematic preserve coherent material readability without unacceptable frame/memory degradation.
4. Human art review: judge silhouette, material scale, emissive restraint, sign readability, wet-surface response, and camera composition.
5. KTX2/Basis gate: only after an audited compressor/DCC toolchain generates the compressed derivatives and records reproducible hashes.
