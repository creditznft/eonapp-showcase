# W416 — City Renderer Hardening

## What changed

The canonical Babylon City procedural fallback now uses `PBRMetallicRoughnessMaterial` for world geometry. This makes the original graphite, glass, wet-pavement, steel and neon surfaces honour their metallic/roughness direction rather than carrying inactive legacy values.

Local `DynamicTexture` command displays intentionally retain `StandardMaterial`. They are UI panels, not world geometry, and are explicitly isolated through `makeDisplayMaterial`.

Cinematic quality now adds local PCF soft shadows from the directional key light. Lite and Balanced quality never construct a shadow generator. The shadow caster list is capped at 144 meshes and excludes rain, display, beacon and other transient/effect meshes.

## Truth boundary

- This is original procedural City rendering, not final licensed art.
- No GLB, KTX2 texture, audio binary, remote asset, telemetry or user data is added.
- PBR and local shadows do not prove quality or performance on real hardware.
- Real-device desktop, Android and iOS evidence remains mandatory before any visual-certification claim.

## Validation

Run:

```bash
npm run qa:w416-city-renderer-hardening
npm run test:unit
npm run build
```
