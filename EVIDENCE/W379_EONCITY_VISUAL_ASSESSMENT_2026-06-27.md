# W379 EON City Visual Assessment

Date: 2026-06-27

## Assessment Summary

- `Portal`: `GREEN`
- `Spatial Command Space`: `RED`
- `Immersive Work Mode desktop`: `YELLOW`
- `Immersive Work Mode mobile`: `RED`
- `Overall EON City handover quality`: `RED`

The Portal surface is the strongest City screen in the current build. The current Spatial Command Space evidence is not a successful 3D experience; it falls back safely instead. Immersive Work Mode does render full-screen after entry, but desktop quality still needs lighting and interface polish, and mobile is visually overcrowded.

## Evidence Files

Primary screenshot set:

- `output/playwright/w379-city-visual-assessment/assessment.json`
- `output/playwright/w379-city-visual-assessment/eoncity-portal-desktop.png`
- `output/playwright/w379-city-visual-assessment/eoncity-portal-mobile.png`
- `output/playwright/w379-city-visual-assessment/eoncity-tour-desktop.png`
- `output/playwright/w379-city-visual-assessment/eoncity-tour-mobile.png`
- `output/playwright/w379-city-visual-assessment/eoncity-play-desktop.png`
- `output/playwright/w379-city-visual-assessment/eoncity-play-mobile.png`

Post-entry runtime capture:

- `output/playwright/w379-city-visual-assessment-live/live-assessment.json`
- `output/playwright/w379-city-visual-assessment-live/tour-live-desktop.png`
- `output/playwright/w379-city-visual-assessment-live/tour-live-mobile.png`
- `output/playwright/w379-city-visual-assessment-live/play-live-desktop.png`
- `output/playwright/w379-city-visual-assessment-live/play-live-mobile.png`

## Screen-By-Screen Verdict

### 1. EON City Portal

Verdict: `GREEN`

Why it works:

- Strong cinematic first impression
- Good visual hierarchy between hero, CTA, and destination cards
- Theme is coherent with the rest of the Graphite product direction
- Mobile still reads clearly and the primary CTA remains obvious

Risk level:

- Low for handover evidence
- Medium for final product sign-off only because it is a gateway, not the flagship runtime itself

### 2. Spatial Command Space (`/eoncity/tour`)

Verdict: `RED`

What current evidence shows:

- Pre-entry screen looks orderly and product-like
- After entry attempt, the renderer did not start in the tested environment
- The route returned to a safe fallback state instead of showing a successful 3D scene

Observed runtime result from `live-assessment.json`:

- desktop: `hasCanvas = false`
- mobile: `hasCanvas = false`
- visible copy indicates safe return to City Overview and renderer start failure

Conclusion:

- This is acceptable as a safety fallback
- It is not acceptable as proof that the 3D Spatial Command Space is currently working end-to-end

### 3. Immersive Work Mode desktop (`/eoncity/play`)

Verdict: `YELLOW`

What current evidence shows:

- Route enters a real full-screen canvas experience after explicit user action
- Desktop runtime capture confirmed:
  - `hasCanvas = true`
  - `fullscreenElement = true`
  - canvas covers the full viewport

Strengths:

- Strong neon atmosphere
- Clear feeling of a distinct flagship mode
- Controls and map are present and responsive enough for evidence capture

Weaknesses:

- Bright geometry is overexposed and washes out scene detail
- Overlay controls compete with the scene for attention
- It still reads more like an original preview vertical slice than a finished premium environment

### 4. Immersive Work Mode mobile (`/eoncity/play`)

Verdict: `RED`

What current evidence shows:

- The mobile route also enters full-screen canvas mode
- Runtime capture confirmed:
  - `hasCanvas = true`
  - `fullscreenElement = true`
  - canvas covers the mobile viewport

Why it fails visually:

- Landscape warning dominates the screen
- Controls stack into large overlapping blocks
- Scene visibility is reduced by overlay density
- Mobile hierarchy collapses under the combined informational, control, and map surfaces

Conclusion:

- Functional proof exists
- Mobile presentation is not currently release-quality

## Full-Screen Behavior Finding

The Babylon-style Immersive Work Mode is not embedded in the normal app shell after entry. In the tested desktop and mobile flows it becomes a full-screen canvas experience, which matches the product intent better than an embedded panel.

The Spatial Command Space does not currently demonstrate the same successful runtime behavior in this evidence pass.

## Top Concerns To Carry Into Handover

1. `Spatial Command Space runtime reliability`
   The current tested environment shows safe fallback instead of a working 3D command scene.

2. `Immersive desktop scene legibility`
   The current district lighting and bright geometry reduce clarity and make the scene feel overblown.

3. `Immersive mobile control density`
   Mobile overlays, warnings, and buttons compete too heavily with the scene and reduce trust in the experience.

## Final Handover Recommendation

Current recommendation: `Do not present EON City as fully launch-ready flagship proof yet.`

Safer wording for ChatGPT handover:

- Portal quality is strong and worth preserving.
- Immersive Work Mode has meaningful full-screen progress and should stay in active polish.
- Spatial Command Space still needs renderer-success proof, not only fallback proof.
- Mobile Immersive Work Mode needs focused UI reduction and hierarchy cleanup before it can be called polished.
