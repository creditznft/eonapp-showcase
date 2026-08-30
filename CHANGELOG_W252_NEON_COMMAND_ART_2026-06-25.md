# W252 — Neon Command District original art foundation

## Decision

**PASS for local-static source/output proof only.** The City gains original
procedural art direction without importing remote assets, copied art, value
mechanics or another renderer.

## Implemented

- Source-controlled palette, art bible, provenance ledger and quality budgets.
- Procedural architectural detail: façade fins, entries, pedestals, plaza rings,
  command crown/pylons, skyline, lamps and restrained fog.
- Local dynamic-texture signs for functional landmarks.
- Improved procedural NPC readability through visor/chest accents.
- User-facing Play copy updated from an outdated “W249 proof scene” label to a
  truthful original flagship preview with explicit remaining device/human proof.
- W252 provenance/budget gate and three focused tests.

## Verification

- `npm run qa:w252-city-art-provenance` — passed.
- `npm run qa:w249-babylon-play-proof-spike:dist` — passed; one deferred City
  Play chunk at 1,237,676 bytes, below the 1.5 MB cap.
- `npm run test:unit` — 174/174 passed at the recorded W252 checkpoint.
- Lint and production build — passed.

## Explicitly not done

- No claim of final art, no source-image generation, no third-party texture/model,
  no mobile FPS guarantee and no browser visual screenshot proof in this sandbox.
- No chain, wallet, token, reward, loot, marketplace, payment, telemetry or
  automatic action path.

## Next

W253 input/orientation/accessibility hardening, then W254 physical-device
performance and re-entry proof before visual density expands.
