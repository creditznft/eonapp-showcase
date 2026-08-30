# W591 — Command Horizon Quality Summit Audit and Decision Ledger
## Final source polish review · 2026-07-03

## Executive judgement

EON City is no longer a thin visual wrapper around EONAPP modules. Its source
contains an authored four-region journey, a protected access station, a bounded
workload governor, deterministic visual profiles, local review surfaces, and a
clear separation between presentational City interactions and real work,
identity, commerce, audio, or provider actions.

The central quality issue was not missing features. It was **hierarchy**. Direct
entry put too many same-weight choices near the player before establishing a
reason to move through the world. That made a carefully authored City feel like
an internal dashboard wearing a game skin.

W591 makes a deliberate product decision: **EON City is a focused command-place,
not a module launcher or an open-world promise.** A player should first see one
credible direction, then choose a route, then review a bounded action.

## Audit findings and decisions

| Area | Finding | CEO decision | W591 result |
|---|---|---|---|
| First 30 seconds | Direct entry competed with the world through equal-weight HUD actions | Prioritise orientation over feature discovery | Four primary actions only: Start here, EONBOT, Command Deck, Menu |
| Player motivation | The City had destinations but no singular first waypoint | Make Command Deck the default authored signal | Local Arrival Compass guides manually; nothing opens automatically |
| Cognitive recovery | Multiple review panels could create a stacked-control-room feeling | One modal City surface at a time | Local overlay coordinator closes competing visible dialogs |
| Access safety | Compatibility documents depended too heavily on edge redirects | Add source-level defence in depth | Legacy carrier marks itself and returns to canonical `/eoncity` before renderer boot |
| Scope discipline | “AAA” language could overclaim untested art, devices, audio and performance | Do not award a synthetic score | Local source validation is green; preview and device visual judgement remain pending |
| Product cohesion | City risked becoming a second app shell | Treat City as a calm spatial entry point | External/native actions remain explicit confirmation paths |

## What remains deliberately restrained

- No public full-City bypass, demo password, test flag, client unlock, CAPTCHA
  workaround, identity impersonation, or OAuth automation exists.
- No payment, subscription, entitlement, reward, referral, ad, chance, social,
  multiplayer, provider, connector, microphone, voice, sound, telemetry,
  remote asset, user-data, or work-execution capability was widened.
- The new compass is local wayfinding only. It does not open a route, start a
  mission, or complete work without a later direct player action.
- One-modal behaviour coordinates presentation panels, not native browser
  dialogs, permission prompts, or external routes.
- Procedural/vector City presentation remains the source-controlled fallback.
  Binary art, asset licence review, physical-device assessment, and performance
  certification require separate evidence.

## Source validation result

The canonical command is:

```bash
EONAPP_TEST_CONCURRENCY=8 npm run verify:w555a-w591-source
```

For this W591 source snapshot it completed with all 31 checks green: lint, the
W555A–W591 source gates, 733 current product unit tests, production build,
smoke, 44-page site audit, launch readiness, and production dependency audit.

This result is **source validation only**. It does not create a preview,
deployment, browser recording, physical-device test, Google/OAuth completion,
security sign-off, asset clearance, or owner go/no-go decision.

## Required Codex proof after a named preview

1. Guest access station stays truthful and does not boot the heavy renderer.
2. Normal human sign-in reaches the authenticated City preview without a test
   bypass.
3. The first frame presents the four-action HUD and Arrival Compass cleanly.
4. Compass, Command Deck, EONBOT, Menu, and two other panels can be opened in
   sequence with no stacked modal remnants.
5. The W575 journey remains intact: Arrival Gate → Command District → Creator
   Atrium → Forge Bay.
6. Desktop, Android touch, iPhone/iPad Safari, tablet, controller where
   available, portrait, landscape, reduced motion, sound-off, refresh/recovery,
   and low-quality fallback receive human evidence.

See `W591_FINAL_EONCITY_PREVIEW_POLISH_RUNBOOK_2026-07-03.md` and the existing
W575 gameplay runbook for the evidence format and stop rules.
