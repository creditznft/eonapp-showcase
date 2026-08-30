# W603 Command Horizon Original Art Asset Provenance

## Scope

W603 ships three **original, source-controlled, same-origin GLB environment candidates** for the Command Horizon vertical slice:

1. `command-horizon-arrival-gate`
2. `command-horizon-command-deck`
3. `command-horizon-wayfinding`

They are generated deterministically by `scripts/build-w603-command-horizon-art-assets.mjs` from EONAPP-authored geometry and PBR material definitions. No remote URL, marketplace asset, user content, account data, telemetry, microphone input, or third-party binary is included.

## Current art state — do not overclaim

These are **textureless PBR prototype-to-production candidates**, not final texture-authored assets and not a completed AAA art pack. They establish shipped local environment silhouettes, material separation, neon readability anchors, LODs, and runtime loading. KTX2/Basis texture authoring, material paint-over, final collision review, and owner visual approval remain required.

## Asset variants and SHA-256

| Asset | Lite | Balanced | Cinematic |
|---|---|---|---|
| Arrival Gate | `e65650d3cc34ce11687741b53917c0c634eec3034b0246d2b11e861065d8c7d0` | `f5214572b5d806c6d3d6f1b60f3fdb77782915e834d1660af37364a02fa49b27` | `361b3ae93f974f0a09c24b707a11f80ca02b92e0dfe71535d30788a60264101e` |
| Command Deck exterior | `0e071d4447949822c869cf97f8dad4b301dd6e117d9ab9bd09fc1ae4f8186b3b` | `aabdade088eb54fe4a0701ecce7aa5df36bde2c8e383de474a58eece888e3bb4` | `9737dc4ddf6fce8430756f700c118b404c0e29f753e96f0ab22cbc3b64c1e3d5` |
| Wayfinding system | `9a503a10afd4662b2c5f0829ebe818af923b6a01dd818f658c4ae8f06739cd93` | `2fe189b896747c8fe42707b948a16be9b08f3570d6a3757829ed4cf92cc8c904` | `27f669911a3d3947a70616f5327e8ac2fdbba477c3a2b4317c2e2802edb9cdcb` |

## Quality and safety contract

- **Origin:** EONAPP original in-house work.
- **License:** EONAPP controlled original work.
- **Local path only:** `/assets/city/models/*.glb`.
- **No external network:** catalog/runtime reject non-local paths.
- **No personal data:** assets contain neither player data nor private-work content.
- **Fallback:** source-controlled procedural City geometry remains visible when a GLB fails to load.
- **Review:** engineering integrity is checked by W603 gates; owner visual approval, real-device proof, and final art direction approval are still pending.

## Regeneration

```bash
node scripts/build-w603-command-horizon-art-assets.mjs
node scripts/sync-public-assets.mjs
node scripts/w603-city-art-quality-gate.mjs
```
