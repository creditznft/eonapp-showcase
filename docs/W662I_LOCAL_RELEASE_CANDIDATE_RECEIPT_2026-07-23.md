# W662I Local Release Candidate Receipt

Date: 23 July 2026

## Result

W662A–H are source-implemented and covered by local automated contracts. The editable local tree is ready to be backed up and later used for a dependency-restored immutable build.

This is **not** a production or 9.5/10 acceptance certificate. The 9.5/10 claim remains blocked until the exact candidate is built, deployed to an immutable authenticated Preview, exercised in real browsers/devices and accepted by the owner.

## Local verification

- Focused W662/W661E/Forge/audio regression matrix: 66/66 passed.
- Maintained current-product source suite: 334 files inspected individually.
- 318 maintained files passed with 1,187 observed passing tests and 47 explicit historical skips.
- 16 maintained Babylon-dependent files were not counted as passed because `@babylonjs/core` could not be installed.
- Genuine maintained source failures: 0.
- Implementation/exposure ledger: 31 components validated; 29 remain human-proof-required and only 2 previously accepted lifecycle/provenance components remain complete.
- Cast certification: 15 assets, 30 primary/fallback variants and 39,877,452 bytes verified.
- Whole-app reconciliation: 17 video/source findings gated.
- Secret scan: 4,234 text files checked; no potential secrets found.
- W636 security/privacy/abuse source gate: 21/21 passed.
- W624D current-contract alignment: 17/17 passed.

## Dependency and build boundary

`npm ci` was attempted against the configured exact registry and failed with HTTP 503 while fetching `ws@7.5.11`. Because `node_modules` is unavailable:

- the 16 Babylon-dependent maintained files remain unexecuted;
- the Vite production build has not run;
- static build smoke, Lighthouse and authenticated browser/device proof have not run.

The dependency outage is recorded in `docs/W662I_NPM_DEPENDENCY_BLOCK_2026-07-23.md`. It is not represented as a source failure, and it is not represented as a passing build.

## Required next release stage

1. Restore exact dependencies with `npm ci` when the registry is available.
2. Run `npm run qa:w662-local-candidate`, the complete maintained suite, lint and production build.
3. Create one immutable Preview only after explicit owner approval.
4. Capture authenticated Chrome, Edge, Firefox, mobile/touch and controller evidence.
5. Prove Pulse → Live Nexus → City round-trip continuity, spatial Atlas, gateway, Expanse cells, Realm entry/exit, cast/animation, terminals, audio, focus and responsive layouts.
6. Request explicit owner acceptance before merge or production deployment.

GitHub, Preview and production were not changed by this local candidate.
