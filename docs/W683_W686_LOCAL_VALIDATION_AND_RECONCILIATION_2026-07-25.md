# W683–W686 Local Validation and Reconciliation

Date: 2026-07-25
Branch: `local/w671-n3-c3-rebuild`

## Green source checks

- New W683–W686 focused assertions: **18/18**.
- Combined Nexus continuity/Atlas batch: **27/27**.
- Complete W671–W686 wave chain: **67/67**.
- Inherited W677–W682 batch: **24/24**.
- W624D non-certifying archive integrity: **10/10**.
- W624D current-contract alignment: **17/17**.
- W662C–H continuity, Atlas, gateway, cast and whole-app reconciliation: **18/18**.
- W668 flagship Nexus: **13/13**; W668B Atlas UX: **6/6**; W668C City Nexus: **6/6**.
- W669 evidence-gated release source checks: **17/17** and unit assertions **5/5**.
- W670 source reconciliation: **27/27** and unit assertions **6/6**.
- Maintained unit-test manifest and permanent runner: **361/361 files aligned**.
- First maintained-suite chunk: **128/133 assertions passed**, **2 explicit historical skips**, and **3 imports stopped before assertions** because `@babylonjs/core` is absent. Later chunks were correctly left uncertified.
- Changed/new JavaScript syntax, relative imports, JSON integrity and Git diff integrity: **passed**.

## Reconciliation performed

- W672's direct fixed-field source assertion now follows the W683 renderer authority.
- The W661D release-authority gate accepts W669 and later maintained waves instead of falsely restricting itself to W669/W670.
- Drag-preview updates no longer cause render churn.
- Typed/gesture rotation, zoom and expansion now drive the visible field and the same undoable view authority.
- Single-object grouping is rejected; grouping requires two explicit selections and deterministic local group IDs.
- Atlas interactive semantics and cross-kind node identity collisions were corrected.
- Atlas now preserves and highlights the exact selected NEXUS work object before the explicit City handoff.
- The W686 City hologram gained a review-only direct-pick path.

## Inherited baseline-package omission found

The reconstructed W671–W682 source line contains `assets/data/social-preview-manifest.json`, but the 12 PNG files referenced by that manifest are absent from the local source tree. The W661D gate therefore reports `social-card-assets` as failed while its other 11 checks pass. This omission predates W683–W686 and is present in the imported W678/W682 source baseline; it must not be hidden or worked around by weakening the gate.

Required reconciliation no later than W693–W694:

1. restore the 12 exact W670 social-card PNGs from the authoritative W670 source/repository;
2. verify their hashes and dimensions;
3. rerun W661D, the complete maintained suite, build and public-preview gates.

## Dependency-backed runtime boundary

`node_modules` is absent and the package registry previously returned HTTP 503 for `@babylonjs/core@9.7.0` and `ws@7.5.11`. No headed-browser, real-Babylon, visual-quality, long-session, memory or owner-device certification claim is made by this local source checkpoint.

## Release boundary

This is local source development only. No GitHub upload, GitHub Actions run, preview, merge, Cloudflare deployment, production change or 9.5/10 acceptance occurred.
