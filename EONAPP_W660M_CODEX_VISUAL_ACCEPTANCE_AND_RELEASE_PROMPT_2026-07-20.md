# W660M — One-Run Codex Visual Acceptance and Release Preparation

Use only the supplied W660M complete source archive and its SHA-256 file.

## Non-negotiable authority

1. Verify the W660M archive checksum before extraction.
2. Treat W660L as the immutable parent and W660M as a new source evolution.
3. Do not overwrite or mutate the W660L source, W660L deployment bundle, or current production deployment.
4. Do not deploy the old W660L `deploy-root/` as proof of W660M.
5. Do not claim 9.5/10 from source checks alone.
6. Preserve one Babylon owner, one EONBOT state contract, nine City Nexus stations, six functional stations and the global shell Nexus boundary.
7. Do not add automatic AI work, voice capture, checkout, sharing, private reads or fabricated completion.

## Verify source

From the extracted W660M root:

```text
npm ci --ignore-scripts --prefer-offline --no-audit --no-fund
npm run qa:w660m-source
npx eslint assets/js/city/w660m/eon-city-w660m-experience-director.js assets/js/city/eon-city-companion-director.js assets/js/city/w649/eon-city-w649-babylon-core-runtime.js assets/js/city/w649/eon-city-w649-animation-manifest.js assets/js/city/w649/eon-city-w649-district-runtime.js assets/js/city/eon-city-play-core.js assets/js/city/w659n/eon-city-w659n-product-layer.js tests/unit/w660m-eoncity-living-rebuild.test.mjs scripts/w660m-eoncity-living-rebuild-gate.mjs
npm run build
npm run smoke:build
node scripts/w660k-eoncity-live-evidence-repair-gate.mjs --require-dist
node scripts/w660i-eoncity-visual-rescue-gate.mjs --require-dist
```

Stop on any failure. Do not weaken tests to obtain a pass.

## Run headed browser acceptance

Run the existing authorized local City proof in a real headed Chromium/Chrome environment. Use the source-controlled fixtures; do not use a production account or private user data.

The acceptance must prove all of the following:

### Nine districts

Capture one unobstructed 16:9 screenshot in each district after district residency settles:

1. Orientation Hall
2. Transit Network
3. Agent Theatre
4. Creator Atrium
5. Forge Basilica
6. Command Centre
7. Archive Canopy
8. Vault Station
9. Trade Dome

Each screenshot must show the world clearly. Close or collapse panels that unnecessarily hide the scene, while retaining enough HUD to identify the district and state.

### Real movement

Provide either a short headed video or timestamped sequential screenshots proving:

- keyboard press-and-hold movement;
- semantic touch `forward/backward/left/right` movement;
- short tap movement;
- stop/release behavior;
- walk/run animation transitions;
- no modal/D-pad collision.

### Living Pathfinder and residents

Observe long enough to prove:

- Pathfinder changes standing animations and does not remain frozen;
- at least three resident characters perform local patrol/work routines;
- at least one resident acknowledges Pathfinder at close range;
- unsupported animation states do not play arbitrary clips.

### EONBOT

Prove all of these without scripting fake DOM state:

- follow while Pathfinder moves;
- curious idle orbit;
- guide or observe near a productive target;
- scan near a physical Nexus station;
- return and settle at the canonical Creator Atrium dock.

### Productive City + Nexus

Prove:

- all nine physical Nexus stations are present and readable;
- all six functional stations remain usable;
- terminal/operator actions open the existing review-first product panels;
- one assistant/state contract is preserved;
- the application-shell Nexus is not duplicated inside City;
- living status does not obstruct the world.

### Mobile

Capture at least:

- one landscape mobile screenshot with touch controls visible;
- one portrait/fallback screenshot;
- one mobile interaction sequence showing touch movement and a productive panel;
- reduced-motion behavior.

Use a real mobile browser or a truthful device emulation. Label emulated evidence as emulated.

## Score honestly

Score each category from 0–10 with evidence links:

- World visual quality
- District uniqueness/readability
- Pathfinder animation/life
- Resident animation/life
- EONBOT intelligence/readability
- Physical Nexus integration
- Productive interaction clarity
- Desktop controls
- Mobile controls/layout
- Performance/stability
- Truth/privacy/review-first behavior

A final score of 9.5/10 is allowed only when the weighted evidence supports it. For every category below 9.5, repair the source, rerun the complete source/build gates, and repeat only the affected visual evidence plus a final smoke traversal.

## Release preparation after acceptance

After all acceptance evidence passes:

1. Create a new W660M complete Cloudflare Pages deployment bundle using the repository's recursive staging authority.
2. Include the final static candidate, complete `functions/` tree, all recursively discovered support modules, `_routes.json`, manifests, provenance and standalone verifier.
3. Deploy from the new bundle's `deploy-root/`, never from a nested `dist/` directory.
4. Do not rebuild during promotion.
5. Deploy to a preview first.
6. Repeat the nine-district, movement, mobile and API smoke checks on preview.
7. Do not change production without the user's explicit final promotion instruction.

## Required output

Return:

- exact source and candidate digests;
- complete command/test ledger;
- nine district screenshots;
- movement evidence;
- EONBOT follow/scan/dock evidence;
- mobile evidence;
- per-category scorecard;
- defects found and repaired;
- preview URL and preview verification, if a preview was explicitly authorized;
- a new complete deployment-bundle ZIP and checksum only after visual acceptance;
- an explicit statement that production was or was not changed.
