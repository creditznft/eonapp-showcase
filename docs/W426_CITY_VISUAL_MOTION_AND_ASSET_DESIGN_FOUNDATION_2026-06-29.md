# W426 — EON City visual motion & authored asset design foundation

## What is implemented in source

- The real Babylon renderer now owns the City visual progression plan. It is a **Foundation-only** presentation plan: no subscription, purchase, reward, referral, account, Vault Reveal, wallet or collection state is read.
- Original local SVG surfaces can now receive subtle in-engine texture drift on Balanced and Cinematic profiles. Wet streets, glass grids, carbon surfaces and neon circuits move through Babylon texture offsets. Clamped labels and emblems remain still for readability.
- Motion stops when City is paused, effects are reduced, or the Lite profile is selected. No media download, upload, telemetry, user data or background task is involved.
- A structured design kit defines six professional NPC targets and four architectural kits, including silhouettes, materials, readable features, idle/locomotion loops, LOD expectations and review requirements.
- The design kit is a brief for original future GLB/GLTF production. It ships **no binary characters, no final building assets and no final-visual-grade claim**.

## Visual progression policy

The visible City always renders the `foundation` tier today. The additional tiers—Signal, Studio, Command and Skyline—are preview-only art-direction concepts.

A future visual upgrade may not activate until all of these exist:

1. An independently audited entitlement model.
2. Clear person-visible activation and reversal controls.
3. Account recovery, rollback and support procedures.
4. Abuse prevention and policy review.
5. Real-device visual and performance evidence.

This keeps Vault Reveals as safe non-financial visual preview material. Nothing is earned, purchased, transferred, traded or applied as an entitlement in W426.

## Babylon-only City policy

`/eoncity` is the only public City entry and starts Babylon directly. Old 2D/Three.js/tour paths remain redirects for compatibility and are not public navigation paths. No new City asset target is approved outside the Babylon runtime.

## Acceptance checks

- `npm run qa:w426-city-motion-progression`
- `npm run test:unit`
- `npm run build`
- Manual real-device checks still required: direct entry, reduced-motion, Lite profile, texture motion, keyboard/touch controls, City pause/resume, low-end fallback, and visual review.

## Not proof

W426 does not prove that Google login works live, that City starts on every device, that Sync/notifications are released, that rewards or referrals are active, or that the planned 3D characters/buildings exist. Those are separate release gates.
