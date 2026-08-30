# W224 Optional 3D City Parity Contract

## Product truth

`/eoncity` remains EONAPP's canonical 2D City. `/eoncity/3d` is an explicitly chosen, device-gated WebGL renderer of the **same local CityWorldState**. It is not a separate game or a replacement for the low-device path.

## Data boundary

The 3D renderer receives only `buildCity3dSceneModel(state)`, derived from the public City summary:

- world ID and visual seed;
- avatar display data and position;
- Realm palette/landmark;
- district graph, discoveries, visits, active objective;
- deterministic visual layout data.

It does **not** receive Vault data, credentials, wallet data, recovery material, chat content, Market previews, safe inventory references, private Realm showcase data, payout state, or commercial attribution.

## Capability and fallback rules

The station remains on 2D when WebGL is unavailable, Reduced Motion or Data Saver is enabled, hardware is known to be below the local guardrails, or the viewport is too small. After explicit entry, the renderer manages frame time: High → Balanced → Low → safe 2D fallback. Context loss also triggers safe fallback.

The local preference record stores only quality and automatic-fallback choice under `eon:city:3d:preferences:v1`. It is allowlisted for encrypted portable backups. City world state is normalized during backup/export and restore so unknown fields are removed.

## Native navigation

The 3D directory is derived from the 2D `CITY_DISTRICTS` contract. Selecting a district opens its native route; no separate 3D-only destinations or state are created.

## Required browser proof outside this sandbox

```bash
npm ci
npx playwright install chromium
npm run qa:w224-cityworldstate-3d:browser
```

Verify capable desktop entry, low-power/no-WebGL fallback, quality changes, context-loss fallback, keyboard district activation, mobile portrait/landscape 2D fallback, persisted quality preference, and return to the unchanged 2D City state.
