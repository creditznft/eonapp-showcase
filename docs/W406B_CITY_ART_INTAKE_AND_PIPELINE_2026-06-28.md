# W406B — EON City Art Intake and Offline Pipeline

**Date:** 2026-06-28  
**Status:** source-only foundation; no binary art release

## Decision

Babylon at `/eoncity` remains EONAPP's only public City engine. W406B adds the
art-intake ledger for the selected `Living Creator Metropolis` direction. It
does not create a second public City, download art, or claim that current
procedural geometry has authored-art or AAA visual proof.

## Included

- a first-frame art plan: Arrival Gate, Command Deck exterior, wet-street
  wayfinding, skyline depth and EONBOT companion;
- planned authored district intake: Creator Atrium, Forge Bay and Signal Tower;
- mapping from each intake record to the W365 catalog and canonical landmark;
- original/licensed provenance gates, human-review requirement and same-origin
  release policy;
- GLB container policy, KTX2/Basis texture packaging policy, `lod0/lod1/lod2`
  policy, quality budgets and mobile procedural fallback;
- a Babylon runtime summary that reports the intake state without loading art.

## What remains deliberately absent

No binary art is included. There is no GLB, texture, material bundle,
animation, audio, asset license evidence, SHA-256 release record, human art
review, browser visual capture, GPU benchmark or device performance proof.
W406B therefore does not certify final City art quality, AAA quality, cinematic
quality, device controls or production readiness.

## Future binary release rule

A future asset may become loadable only after all of these are independently
recorded and proven:

1. W365 catalog entry with approved provenance and reviewed licence evidence.
2. Same-origin GLB path and SHA-256, with no remote asset fetch.
3. Offline KTX2/Basis texture package, LOD tiers and bounded materials/draw
   calls under the existing quality profile.
4. Human art review and screenshots on the intended desktop and mobile tiers.
5. A mobile fallback that remains usable if the binary is not selected.

Until then, the EON City runtime must keep the local procedural fallback and
honest source-only wording.

> **W611 current-state note (4 July 2026):** W602–W604 now include source-controlled same-origin GLB engineering candidates for the Navigator, EONBOT, Arrival Gate, Command Deck and Wayfinding. These candidates do **not** constitute final visual-release certification: KTX2/Basis final packaging, human art/licence review, real browser/device visual and performance evidence, authenticated City closure, and owner approval remain pending.
