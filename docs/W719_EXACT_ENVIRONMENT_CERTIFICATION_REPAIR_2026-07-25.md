# W719 exact-environment certification repair

Date: 2026-07-25

## Finding

The first healthy Node 22 / exact-dependency GitHub runner reproduced the W719 source and installed the unchanged lockfile, including Babylon.js `9.7.0`. The permanent predeploy gate then found one stale maintained assertion in `tests/unit/w649-eoncity-district-runtime.test.mjs`.

The W665 residency test still expected the pre-W676 Orientation Hall composition of four active W649 assets. W676 intentionally extended the Orientation Hall district manifest with the authored six-resident cast. After the existing W659F supersession boundary removes the old Ascension Portal asset, the current balanced Orientation Hall residency contains nine active assets.

## Repair

The test now derives the balanced asset sets for Orientation Hall, Forge Basilica and Archive Canopy from the current W649 district manifest and the maintained W659F supersession boundary.

The behavioral assertions remain unchanged in purpose:

- the first district remains resident while the second district finishes loading;
- no asset is disposed during that second load;
- entering a third district evicts only the oldest residency after the new district is ready;
- the active and resident district identities remain exact;
- final disposal releases every loaded district asset.

## Boundaries

- Runtime source changed: **no**
- Babylon version or dependency changed: **no**
- Package lock changed: **no**
- Asset manifest changed: **no**
- Cloudflare Preview or production changed by this repair: **no**
- Historical test archived or disabled: **no**
- Assertion weakened: **no**; expected sets are now derived from the authoritative current manifests.

This repair requires a fresh exact-environment certification run. It does not authorize production promotion or replace the W718 owner scorecard and W719 owner-GO receipt.
