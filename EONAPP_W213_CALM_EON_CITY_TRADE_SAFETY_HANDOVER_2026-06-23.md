This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W213 — Calm EON City and Trade safety handover

## Decision
W213 makes **EON City 2D the default product route**. It is a calm navigation and orientation layer, not a fake city simulation. Optional 3D is a quiet, device-gated private workstation scene that links to real app modules.

## What is implemented
1. `/eoncity` is the canonical 2D Operator Map.
2. `/eoncity/3d` only renders the station when device capability is sufficient; otherwise it points back to the fast 2D map.
3. The optional 3D station exposes native routes for Chat, Projects, Automations, Market, Vault, Trade, and Workspace.
4. Local activity panels are driven only by real local product state. There is no fake motion, fake city crowd, fake financial activity, or fake agent execution.
5. Trade is manual/reference/paper-only. The code produces a safety receipt and rejects execution paths.

## Trust boundaries
- EON City does not imply a live multiplayer game, a public Realm registry, a trade market, or a revenue system.
- The 3D station is an optional navigation presentation, not a separate data model.
- Realm sharing still uses signed `eon3` links. It does not expose a raw local Realm snapshot, payout, sale, or public cloud record.

## Source gate
Run:

```bash
npm run qa:w213-calm-city-trade
```

This validates source contracts and unit behavior. It is not visual evidence.

## W216 still required
Cloudflare Preview, desktop/mobile screenshots, low-end/no-WebGL fallback, keyboard/touch navigation, actual route clicks, and network evidence remain mandatory before any production release claim.
