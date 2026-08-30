# W365 — EON City Asset Foundation

## Decision

EON City is moving from a procedural proof toward authored original art, but no binary art is included or added in this wave. W365 establishes the only accepted route for future character, companion, environment, prop and texture assets.

## What W365 adds

- A source-controlled asset catalog with planned entries for the Operator, EONBOT, role guides, command-centre architecture, command-room interior, street-furniture, terminal, drone and ambient crowd kits.
- Quality profiles for Lite, Balanced and Cinematic devices.
- Every catalog entry has a procedural local fallback so W365 does not make a new device depend on unshipped art.
- A lifecycle adapter for Babylon and Three.js. It loads only catalog entries marked `shipped` after a caller supplies an engine loader adapter, propagates a local abort signal/progress callback/cache key, then disposes their GPU resources on exit.
- Provenance checks: same-origin local file path, SHA-256, evidence document, human review, no third-party derivative, no user data and no remote network.
- A PBR material policy: bounded emissive intensity, colour semantics for review/verified states, and no remote textures or user data.

## What W365 does not claim

- It does not ship a GLB, GLTF, texture, audio file or copied game asset.
- It does not declare placeholders to be final art.
- It does not load CDN, marketplace, stock, generated-at-runtime or user-provided assets.
- It does not prove final art quality, a real device frame rate, mobile memory use, animation quality or a production build.

## Future asset handoff rule

A binary asset can move from `planned` to `shipped` only when all of the following exist:

1. An approved catalog entry with an `/assets/city/...` local path.
2. SHA-256 for the exact binary.
3. A provenance evidence document under `docs/` with the artist/commission/licence decision and rights review.
4. Human visual review for readability, original identity, accessibility and inappropriate third-party similarity.
5. Lite/Balanced/Cinematic memory and draw-call budgets.
6. A declared procedural fallback.
7. Renderer lifecycle proof showing disposal on restart/exit.
8. Desktop and mobile visual/device evidence.

## Art direction guardrails

The city may be atmospheric and premium, but it must remain an original neo-noir work environment. Do not copy locations, characters, UI, signage, logo treatments, missions, audio or assets from Cyberika, Titan Quest, Inotia or any other game.

## W366 handoff

W366 may create the first authored Neon Command District vertical slice only after a small approved original art pack has passed this ledger. It must retain the current guest-first/local-first boundaries and show only truthful local AI task cues.
