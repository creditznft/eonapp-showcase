# W251 — City to Workspace work gateway

## Decision

**PASS for local-static source/output proof only.** W251 turns one City Play
route into a useful beginner-work bridge without transferring private data,
creating work automatically, or changing the app into a game economy.

## Implemented

- Strict local `CityWorkMission` receipt for the Knowledge Archive → Workspace
  route only.
- Receipt allowlist, expiry, dismissal, opened/completed state and safe return
  marker.
- Explicit Workspace choices: save a local project, ask EONBOT a generic plan,
  return to City, or dismiss.
- No automatic project creation, Chat message, route activation, provider call,
  wallet call, chain read, remote analytics or value state.
- Source wording now accurately says City Play never opens a route
  automatically; it may only prepare a reviewed normal anchor route.

## Verification

- `npm run test:unit` — **171/171** passed.
- `npm run lint -- --max-warnings=0` — passed.
- `npm run build` — passed.
- W239/W242/W243/W244/W247/W248/W249/W250/W251 gates — passed.
- Build smoke, site audit, launch readiness, PWA static QA, page/identity/
  quality gates, workspace secret scan and production dependency audit — passed.

## Explicitly not done

- No automatic execution of any EONAPP action.
- No transfer of prompt, key, provider, project, Realm, wallet, chain, account,
  reward or payment data.
- No chain runtime connection despite supplied C0-P mainnet presence evidence.
- No launch, device-performance, art-completion or mobile-fullscreen claim.

## Next

W252 — original art/provenance and visual-production system; W253 — universal
input/orientation; W254 — performance governor before district expansion.
