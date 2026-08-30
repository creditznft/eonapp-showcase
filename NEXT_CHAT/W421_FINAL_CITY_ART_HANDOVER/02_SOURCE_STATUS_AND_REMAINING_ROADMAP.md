# Source Status and Remaining Roadmap — W421

## Completed and coded

| Area | Current state |
|---|---|
| Guest-first sign-in/account/settings shell | Complete in source |
| Voice/language matrix and composer microphone fallback | Complete in source |
| Share/Remix on Creator, Forge and City outputs | Complete in source |
| Sync Basic schema + fail-closed transport | Complete in source; not activated |
| Option A — Living Creator Metropolis | Complete in source: six district concepts, living systems, Mission Board and Validation Lab |
| Option B — Signal Expeditions | Complete in source: four finite local templates |
| City renderer | PBR procedural materials, Lite/Balanced/Cinematic profiles, bounded cinematic shadows |
| City art | 18 original same-origin SVG assets, runtime integration, Art review panel, six local cinematic compositions |
| Source certification | W405–W421 relevant gates, lint, full units, build, smoke, audit, readiness and secret scan |

## Remaining work cannot be honestly completed only in this source environment

### A. Production and device evidence

1. Deploy a preview from this package.
2. Test desktop, Android and iOS City controls/quality profiles.
3. Capture clean screenshots and short video using real devices.
4. Record all visual, control and performance defects in Validation Lab/Device Lab; fix any defects in a subsequent source wave.

### B. Final binary-art release — W417

1. Create/commission/review original or properly licensed 3D assets.
2. Produce optimized GLB with KTX2/Basis textures and LOD0/LOD1/LOD2.
3. Add provenance evidence, hashes, metrics and asset manifest.
4. Pass `scripts/city-asset-release-preflight.mjs`.
5. Obtain a human art/rights review and repeat device visual/performance proof.

### C. Identity and Sync activation

1. Production-testing Google OAuth proof with a disposable approved account.
2. Provision dedicated `EON_SYNC_DB` D1 binding and required safe flags.
3. Run Device A/Device B opt-in, import/merge, offline conflict, tombstone and empty-device restore drills.
4. Keep Vault/API credentials outside Sync Basic unless a later separate E2EE Vault release is proven.

## Recommended sequence

1. Deploy W421 preview and collect City art/device evidence.
2. Fix real-device defects, if any.
3. Complete production OAuth proof.
4. Complete W412 two-device Sync proof before activation.
5. Complete W417 final binary-art delivery and repeat visual proof.
6. Only after these proofs, decide whether a formal flagship visual-grade release claim is justified.
