# W363 — City Lite Illustrated 2.5D Art Implementation

## Decision

`/eoncity/lite` is the fast **City Overview**, not the flagship Babylon scene.
It is a rich deterministic 2.5D map for orientation, route selection, local
work-state visibility, and safe handoff into Immersive Work Mode.

## Delivered in this source wave

- Versioned art metadata for all eight canonical City districts.
- Deterministic skyline layers, transit circuit, atmospheric detail, landmark
  callouts, hover response, and stronger district silhouettes.
- Local display preference: **Auto**, **High**, and **Conserve**.
- Accessibility protections win over visual preference:
  - reduced motion forces Conserve;
  - data saver forces Conserve;
  - device-memory hint of 2 GB or lower forces Conserve.
- No downloaded art, provider request, account connection, City action,
  telemetry, payment, private prompt, AI output, key, Vault data, or hidden
  agent state is introduced by the renderer.

## Quality boundary

The renderer is intentionally code-drawn in this wave. It improves hierarchy,
city density, atmosphere, landmark identity and device adaptation, but it is
not a replacement for W365 authored asset kits or W366 Babylon Command District.

The next steps remain:

1. W364 — immersive controller and accessibility system.
2. W365 — original authored GLB, PBR material and provenance pipeline.
3. W366 — one fully authored Neon Command District vertical slice.

## Verification

Run:

```bash
npm run qa:w363-city-lite-art
```

The source gate verifies routes, art metadata, visual modes, local-only
boundaries, device/accessibility overrides, renderer wiring and redirect sync.
It does not claim browser rendering, GPU performance, live deployment or
production proof.
