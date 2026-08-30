# W624B — City Runtime Consolidation Changed Files and Validation

Date: 2026-07-11  
Status: source-complete; focused gates and production build green  
Source revision: `01a8c157dc21b1dabb741e306238065a0d566d23`

## New runtime files

- `assets/js/city/eon-city-runtime-state-machine.js`
- `assets/js/city/eon-city-runtime-asset-manifest.js`
- `assets/js/city/eon-city-runtime-owner.js`
- `config/w624b-city-runtime-consolidation-contract.mjs`
- `scripts/w624b-city-runtime-consolidation-gate.mjs`
- `tests/unit/w624b-city-runtime-consolidation.test.mjs`

## Updated runtime and route files

- `assets/js/city/eon-city-access-station.js`
- `assets/js/eon-city-play-station.js`
- `assets/js/city/eon-city-play-babylon.js`
- `assets/css/eon-city-play.css`
- `config/w554-eon-city-access-project-portals-contract.mjs`
- `scripts/w554c-eon-city-client-load-gate.mjs`
- `eoncity.html`
- `eoncity-play.html`
- `eoncity-3d.html`
- `eoncity-lite.html`
- `sw.js`
- `public/sw.js`
- `package.json`

## Programme and continuation files

- `program/EONAPP_W624B_CITY_RUNTIME_CONSOLIDATION_2026-07-11.md`
- `program/EONAPP_W624C_COMMAND_DISTRICT_VERTICAL_SLICE_EXECUTION_BRIEF_2026-07-11.md`
- `EONAPP_MASTER_LAUNCH_ROADMAP_W623_W640_2026-07-11.md`
- `EONAPP_MASTER_LAUNCH_LEDGER_W623_W640_2026-07-11.json`
- `EONAPP_W624B_NEXT_CHAT_START_HERE_2026-07-11.md`
- `EONAPP_W624B_NEXT_CHAT_PROMPT_2026-07-11.md`
- `CHANGED_FILES_W624B_CITY_RUNTIME_CONSOLIDATION_2026-07-11.md`
- `EONAPP_W624B_VALIDATION_RECEIPT_2026-07-11.json`

## Runtime result

- One canonical heavy route: `/eoncity`.
- One server-authoritative access preflight: `/api/city/access`.
- One heavy runtime owner.
- Heavy station no longer self-mounts.
- Eleven explicit runtime states.
- Twelve recovery cases.
- Named-stage progress instead of timer-based fake progress.
- Five required local core assets with build-controlled integrity metadata.
- Five optional streamed detail assets.
- Four local procedural/silent fallbacks.
- Static compatibility redirects contain no renderer module entry.
- Canonical City shell no longer mounts a second generic app sidebar.

## Final validation

- W624B gate: **19/19**
- W624B tests: **5/5**
- W624A gate/tests: **17/17; 5/5**
- Direct protected City entry: **15/15; 3/3**
- Renderer hardening: **8/8; 5/5**
- Babylon direct boot: **9/9; 3/3**
- One-public-City retirement: **10/10; 2/2**
- City certification tooling: **9/9; 3/3**
- Client-first City load: **14/14; 6/6**
- Built-output owner chunk check: **14/14**
- Commercial truth: **64/64**
- Production reachability: **348 files / 600 import edges / 0 quarantined**
- Referral scale compatibility: **16/16; 4/4**
- Certification V2: **24/24; 6/6**
- Targeted ESLint: **zero errors and zero warnings**
- Secret scan: **3,428 text files; zero potential secrets**
- Production build: **passed**
- Build smoke: **passed**
- Distribution files: **462**
- Minified files: **292**
- Size reduction: **41.05%**
- Distribution SHA-256: `b8acea9dd8fb16d053875f34192820a32c613102774180f4914ce1736807452a`

## Evidence boundary

No claim is made for authenticated production boot, physical-device WebGL recovery, sustained FPS/memory/thermal performance, final Command District art, target-frame runtime parity, final rigs, mobile/controller quality or owner visual approval.
