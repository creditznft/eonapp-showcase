# EONAPP W731–W734 Command Hub Handoff

## Authority

Continue only from the local W734 commit and tree recorded in the final package manifest. Its parent authority is the sealed W730 commit:

```text
789a77665905197d283ce184f3161a6946323241
```

Do not overlay older source packages. Do not reintroduce Expanse, district belts, the old Living Nexus realm runtime, or duplicate City panel/business logic.

## Completed product state

EON City now has one active compact Command Hub runtime. The user enters a complete bounded atrium rather than an unfinished open world. Ten visible stations open maintained full-screen 2D productive surfaces:

1. EONBOT Nexus
2. Create Forge
3. Project Atlas
4. Library Vault
5. Share & Capture Studio
6. Command Console
7. Automation Theatre
8. Local AI Lab
9. My Realm Portal
10. Plans & access

The City menu can guide to or directly open stations. Closing a shared surface returns to the same City runtime. Creator Capture, subscription checkout, sharing and all consequential actions remain explicit and reviewed.

## Runtime boundaries

- Active entrypoint: `assets/js/city/eon-city-play-core.js`
- Runtime owner: `assets/js/city/w731/eon-city-w731-command-hub-runtime.js`
- Product contract: `assets/js/city/w731/eon-city-w731-command-hub-contract.js`
- Launch asset manifest: `assets/js/city/w731/eon-city-w731-launch-asset-manifest.js`
- Progressive local loader: `assets/js/city/w731/eon-city-w731-local-assets.js`
- Shared work registry: `assets/js/work-surface/eon-work-surface-registry.js`

## Important invariants

- One Engine, Scene and render loop.
- No reachable empty or unfinished area.
- No open-world/Expanse launch promise.
- Screen-space labels only for required readable station text.
- Every visible primary station is functional.
- No City-only copy of forms, billing logic, sharing logic or capture logic.
- No automatic checkout, media upload, post, navigation or agent action.
- First playable frame requires zero GLBs.
- Local content-hashed GLBs load progressively and fail safely.
- Blocked movement returns Pathfinder to idle.
- City Menu/work surfaces stop background movement.
- Future gateways remain closed and non-interactive.

## Validation truth

The dependency-free maintained suite and all W731–W734 source gates pass with zero genuine source failures. Exact Babylon/build/browser lanes are still mandatory but blocked because `node_modules` is absent and the configured npm gateway timed out.

Do not report W735 complete until exact dependencies install from the unchanged lockfile and all maintained Babylon files, build output, headed browsers and owner-device evidence pass.

## W735 continuation order

1. Verify commit, tree and package SHA-256.
2. Run `npm ci` using Node 22 and the unchanged lockfile.
3. Run the 18 maintained exact-dependency files and the complete 24-file exact-dependency contract.
4. Run the production build and emitted-output fences.
5. Confirm old Nexus/Expanse/district owners do not appear in emitted launch imports.
6. Run headed Chromium, Edge and Firefox route/interaction proof.
7. Run desktop and mobile-landscape City proofs, including denied/unsupported capability paths.
8. Audit all themes and shared station-to-panel parity.
9. Build one immutable candidate and record source commit, tree and dist digest.
10. Stop for owner review. Do not deploy automatically.

## Prohibited actions

- Do not push, merge, deploy, roll back or start Cloudflare Preview from this handoff alone.
- Do not delete historical tests to obtain green output.
- Do not count dependency-blocked files as passed.
- Do not reopen the open-world launch scope.
- Do not replace shared productive surfaces with small City overlays.
