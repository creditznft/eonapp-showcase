# CITY-ART / CITY-WORLD — EON Noir Phase 1 Implementation

**Status:** Source implementation complete; not a deployment, performance certification, final asset pack, or release approval.

## Decisions applied

- EON City is the original **EON Noir** world: cyberpunk-informed in mood and composition, not copied from any game, artist, logo, character, environment, sign system, or copyrighted asset pack.
- No visible flagship landmark is represented by the old plain rectangular tower language.
- Option B remains intact: a user may explicitly create a private project district from a City-safe label. Each district is a bounded local render plan, not a public route, upload, or reading of project text, prompts, files, keys, or private references.
- The City must act as a native workspace: district art supports real stations; it must not create fake agent-work claims.
- Remote assets, ads, reward mechanics, social auto-posting, trading execution, and commerce activation remain out of scope for this Phase 1 implementation.

## Implemented source changes

- New `assets/js/city/eon-city-noir-architecture.js` original procedural architecture kit.
- Command Loom replaces the former central-box landmark language.
- Creator Atrium, Forge Basilica, Signal Sail, Archive Canopy, Automation Observatory, Support Dock and Device Observatory now have distinct authored-procedural silhouettes.
- Private project districts use the EON Noir project-district composition while retaining W438 local/private safeguards.
- Added a world layer with curbs, route rails, barriers, lanterns, elevated transit infrastructure, distant tapered skyline forms, and decorative local-only ambient drones.
- Added `tests/unit/city-noir-architecture.test.mjs` to guard the integration and privacy boundary.

## Still required before any flagship claim

1. `CITY-ROUTE`: canonical production `/eoncity` route and cache/legacy redirect proof.
2. `CITY-ENGINE`: WebGL warnings, staged streaming, frame-time, memory and device tier work.
3. `CITY-ART`: commissioned/original final GLB assets, provenance manifest, LODs, compressed textures and artistic review.
4. `CITY-WORLD`: terrain/streetscape density, weather moods, skyline depth, audio and lighting composition.
5. `CITY-NPCS`: original rigged NPCs, readable faces/visors, animation and role-safe behavior.
6. `CITY-WORKSPACE`: every station must open a real EONAPP tool and return users to the same world position.
7. `CITY-MOBILE`: landscape Explore Mode and portrait Companion Mode.
8. `CITY-QA`: automated visual snapshots, device matrix, long-run stability and final human art direction review.

## Claim boundary

This phase deliberately does **not** claim “AAA,” near-AAA, final mobile parity, all-device performance, final artwork, or production deployment. It establishes an original, testable architectural foundation so the remaining work can be measured rather than improvised.
