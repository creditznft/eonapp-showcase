# EONAPP W624D — Player Avatar, Camera and Deterministic Certification

Date: 2026-07-11  
Status: source-complete; real-browser and physical-device proof pending  
Canonical City route: `/eoncity`

## Mission completed

W624D replaces the prototype-feeling player/camera layer with one local-only Wayfinder experience inside the existing W624C Command District. It also removes the repository test ambiguity that repeatedly delayed Codex deployment by separating current release contracts from superseded historical snapshots without deleting either.

## Wayfinder result

- Distinct Productive Nocturne silhouette: asymmetrical service coat, luminous route spine, readable visor and grounded boots.
- Inclusive, non-sexualized and cosmetic-only profile with no body-stat or pay-to-win effect.
- Nine deterministic states: `idle`, `walk`, `run`, `turn`, `interact`, `inspect`, `celebrate`, `sit-work`, `recovery`.
- Reduced-motion handling converts celebration to a calmer inspect state.
- No network IO, route opening, work execution, provider request, billing/referral mutation or private-data read from the Wayfinder policy module.

## Camera result

Five authored profiles are available:

1. Follow
2. Left shoulder
3. Right shoulder
4. Close
5. Wide

The camera resolves its requested radius against the W624C collision volumes before applying it. Visible controls expose camera cycling, Follow reset and local pose previews. Keyboard uses `C` and `R`; controller shoulder mappings and visible touch controls remain explicit. None of those controls auto-navigates or confirms a work route.

## Frozen architecture preserved

- `/eoncity` remains the only heavy-renderer document.
- `/api/city/access` remains server-authoritative.
- `eon-city-runtime-owner.js` remains the only production mount/disposal owner.
- The station does not self-mount.
- The W624B eleven-state lifecycle and core/optional asset boundaries remain unchanged.
- W624C destinations, paths, collision volumes, spawn and nearest-safe-point Unstuck contract remain authoritative.
- District expansion remains blocked until real W624C runtime captures score at least 9.0/10.

## Repository test-contract alignment

The former complete unit run mixed current contracts with exact assertions from older product states. W624D classifies those snapshots explicitly:

- 47 exact superseded assertions across 36 files remain visible as named `test.skip` entries.
- The original 36 files are retained byte-for-byte in `archive/tests/superseded-exact-copy/W624D_2026-07-11/` with SHA-256 metadata.
- The archive is explicitly non-certifying and cannot enter the maintained runner.
- 223 maintained test files are listed in `config/w624d-current-unit-test-manifest.json`.
- Current replacement tests for live Dodo, Create-first navigation, one-City runtime, Command District and Wayfinder/camera are mandatory.
- The maintained runner defaults to one worker because several historical tamper-detection tests temporarily modify shared source before restoring it. Opt-in parallelism remains diagnostic-only.

## Codex predeploy command

```bash
npm ci
npm run verify:codex-predeploy
```

The lock-protected runner executes 18 ordered stages and writes a machine-readable receipt. Overlapping certification is rejected rather than allowed to race on shared test files. The exact one-command run completed successfully against this W624D source with **18/18 stages passed**.

## Validation

- Maintained unit suite: **814 total / 767 passed / 47 named historical skips / 0 failed**
- Maintained test files: **223**
- W624D Wayfinder/camera gate: **20/20**
- W624D focused tests: **6/6**
- Current-contract alignment: **16/16; 6/6 tests**
- Historical archive integrity: **10/10; 1/1 test**
- W621 live Dodo/Cloudflare: **46/46; 6/6 tests**
- W623C commercial truth: **64/64**
- W623D production reachability: **350 files / 604 import edges / 0 quarantined**
- W623E information architecture: **5 primary / 6 Create modes / 10 aliases; 5/5 tests**
- W623H minimal referral ledger: **20/20; 3/3 tests**
- W623I referral scale: **16/16; 4/4 tests**
- W624A art bible: **17/17; 5/5 tests**
- W624B runtime: **19/19; 5/5 tests**
- W624C Command District: **24/24; 6/6 tests**
- Targeted ESLint: **zero errors and warnings**
- Secret scan: **3,505 text files / zero findings**
- Production build and smoke: **passed**
- Distribution: **462 hashed files; 292 minified; 41.05% size reduction**
- Distribution SHA-256: `fa6d706a0477cc9bde11837c4ebe278decdc60cd11db4cedf32648b820a110f5`
- W623F post-build certification: **24/24; 6/6 tests**

## Evidence boundary

This environment cannot certify real browser/GPU rendering or physical keyboard, touch and controller feel. W624D does not claim:

- authenticated production City boot;
- real-device camera comfort or clipping quality;
- physical touch/controller behavior;
- sustained FPS, memory, battery or thermal performance;
- W624C 90/100 visual approval;
- final rigged binary character art.

Use `npm run proof:w624d-wayfinder-camera:browser` on the owner/Codex machine, followed by physical-device checks. Source and unit evidence must never be converted into a visual/device pass.
