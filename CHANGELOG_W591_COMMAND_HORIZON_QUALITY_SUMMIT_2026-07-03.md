# W591 — Command Horizon Quality Summit
## Source polish and access seal · 2026-07-03

## CEO conclusion

EON City had strong systems and strong boundaries, but its direct entry was still
trying to behave like an internal control dashboard. The player saw several
same-weight choices before receiving a compelling first action. This wave makes
one product decision: **City should begin as a place with a waypoint, not a
catalogue of modules.**

## What changed

- Direct City HUD is compressed to four primary choices: **Start here, EONBOT,
  Command Deck, Menu**.
- A local **Arrival Compass** points to the Command Deck and offers an explicit
  route chooser or Command Deck opening. It never opens work or a route by
  itself.
- A local overlay coordinator ensures only one `aria-modal` City panel can stay
  open. This prevents stack-on-stack panels obscuring the world.
- The legacy immersive play document now carries a source marker and will return
  a browser to `/eoncity` before it can start the renderer. Production redirects
  remain in force; this is defence-in-depth, not a new login or bypass.
- A W591 gate, tests, and canonical source verifier extend the W590 validation
  chain without changing the previous truth boundaries.

## Critique addressed

| Finding | Decision | Result |
|---|---|---|
| First-entry HUD competed with the world | Four primary actions only | City remains visually dominant |
| New player had no singular first objective | Arrival Compass targets Command Deck | Clear first 30-second loop |
| Panels could accumulate cognitively | One-modal policy | Cleaner recovery and focus |
| Old compatibility source could be served outside expected edge redirects | Legacy carrier self-blocks before renderer import | Canonical access station remains the only full City route |
| A synthetic “AAA score” would be misleading | No invented score | Preview/device review stays evidence-based |

## Deliberately unchanged

- `/eoncity` still waits for the signed-in access station before importing the
  heavy renderer.
- No Google/OAuth, CAPTCHA, account, entitlement, payment, subscription, reward,
  provider, microphone, voice, audio, social, multiplayer, telemetry, or work
  execution scope expanded.
- W575 two-lane preview evidence is still required. W591 adds no deployment,
  browser, physical-device, accessibility certification, or owner launch claim.

## Validation

Run `npm run verify:w555a-w591-source` with the supported bounded test
concurrency. This is source validation only.
