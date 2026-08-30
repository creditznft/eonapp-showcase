# W600A + W607 — EON City Gameplay, Controls and Production-Proof Programme

**As of:** 4 July 2026  
**Scope:** close the authenticated production interaction blocker first; make the Command Horizon loop direct, legible and testable before any district expansion.  
**Status:** source mechanics implemented; authenticated production and real-device proof remain open.

## Truthful current position

W602–W604 created local Navigator, EONBOT and Command Horizon asset candidates. W611 restored a clean current unit-test baseline. Neither fact proves that the deployed City is playable.

W600A is the release-critical proof lane. The prior authenticated run showed a visible Start Here control that could be intercepted by the Babylon canvas. The source now gives that exact defect a named runner outcome: `CITY_OVERLAY_POINTER_INTERCEPT`.

W607 now adds source-backed gameplay mechanics:

- positive strafe resolves to visible screen-right for a forward-facing camera;
- keyboard, touch and controller select one active movement source rather than blending stale axes;
- every playable landmark gains an enlarged transparent direct hit volume behind its visible signal;
- entering a landmark radius produces a small nearby **Review / Guide** cue;
- proximity is informative only: it never navigates, opens a route, starts work, starts Voice, or sends data;
- direct-entry HUD remains named: **EONBOT, Voice, Chat, Districts, Command Deck, Menu**; generic `Interact` is rejected;
- first-run dialog sits at an isolated input layer and the browser runner checks actual stacking/pointer ownership before it clicks the visible dismiss control.

## W600A external closure — required evidence

This step cannot be completed by source tests.

1. Deploy the exact W607 SHA/build to the intended production target.
2. In a normal Chrome/Edge profile, sign in to EONAPP through the ordinary Google flow.
3. Start that already signed-in browser with a loopback-only DevTools endpoint. Do not export cookies, create a Playwright storage state, inject a session, or use a login bypass.
4. Run `node scripts/w599-run-authenticated-eoncity.mjs` with the production URL and loopback endpoint.
5. Require all of these in its redacted `summary.json`:
   - guest access denies full Babylon boot;
   - signed-in City authorization permits full boot;
   - the real canvas has usable dimensions;
   - `pointerOwnership.firstRunDismiss.topMatchesControl === true`;
   - `pointerOwnership.firstRunDismiss.canvasIndex` is absent or below the control in the element stack;
   - Start Here, Voice, EONBOT, Menu and Command Deck open/close;
   - named HUD inventory exists and generic `Interact` does not;
   - refresh recovers the signed-in City.
6. Only `AUTHENTICATED_CITY_AND_GATE_PROVEN` closes W600A. `PASS_WITH_DIAGNOSTICS` needs review; any named failure stays open.

## W607 game-play acceptance matrix

| Journey | Required evidence | Pass condition |
|---|---|---|
| Landmark discovery | Desktop and touch screenshots/video | Named neon signal and nearby Review/Guide cue are readable; approach does nothing automatically. |
| Direct click/tap | Mouse and touch evidence | Clicking/tapping each featured landmark opens its own review card; close returns to the same stable City. |
| Keyboard movement | Desktop visual capture | W/A/S/D and arrows match screen convention; right moves/turns right, not left. |
| Controller | Browser/device capture | Left stick is movement, A/primary reviews the named nearby landmark only; no generic action is exposed. |
| Touch | Landscape mobile capture | Analogue movement, direct landmark tapping, review/guide controls and safe-area layout work. |
| Camera/collision | Desktop capture with notes | Camera stays outside walls; player cannot tunnel through the initial static blockers; collision shows a non-destructive status cue. |
| Voice/Chat | Browser/device capture | Voice panel opens only by tap/click; microphone never starts on boot; Chat link is visible; any browser caption/dictation claim matches the actual browser result. |
| Portal/return | Every pilot route | See → review → explicit enter → native surface → return to City restores a stable pose/camera without false completion. |
| Recovery | Refresh/context/resume path | First-run and resume never compete; recovery explains what happened and preserves a visible way back. |
| Performance | Desktop and mobile Lite captures | Quality tier is visible; no claim is made from source-only frame data; long-session/memory observations are recorded. |

## Featured pilot destinations

1. Command Deck
2. Projects / Forge path
3. Local AI
4. Creator Studio
5. Vault / collection
6. Archive Gardens

Each pilot must use a real native product destination or remain clearly review-only. Decorative landmarks cannot look actionable unless they are actionable, and functional landmarks cannot be unlabelled.

## What this wave does not claim

- natural-motion visual approval for Navigator or EONBOT;
- final approved/cleared art assets;
- KTX2/Basis compression;
- real iPhone/Android/controller proof;
- live AI conversation voice;
- multiplayer, background agents, automatic task execution, payments or posting;
- W600A production closure.

## Next gates after W600A/W607 evidence

1. W607 AI — owner-authorized direct/local text and code output evaluation, redacted receipts only.
2. W608 City art — only after the Command Horizon loop passes: approved character/world assets, KTX2/Basis+LOD packaging, performance profiles and human visual captures.
3. W608–W610 Creator — loopback ComfyUI adapter, authorized edit workflow and local quality dashboard after actual media output proof.
4. W145 persistence, commercial/payment design, legal/support, accessibility/mobile, and final release board remain independent mandatory tracks.
