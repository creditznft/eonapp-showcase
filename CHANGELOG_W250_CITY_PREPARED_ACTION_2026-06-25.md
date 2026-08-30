# W250 — CityWorldState V2 + prepared City action

## Decision

**PASS for local-static source and output proof only.** W250 adds one functional game-to-work route boundary; it does not make EON City a completed RPG, authorize autonomous app actions, or activate any chain feature.

## Implemented

- CityWorldState schema advances from V1 to V2 without changing its localStorage key. Existing V1 data is normalized forward and preserved; only `play.preferredQuality`, `play.reducedEffects`, and `play.lastLandmarkId` are added.
- Babylon Play now detects five original local landmarks: Command Centre, Build Workshop, Knowledge Archive, Realm Relay, and Local AI Observatory.
- Interact prepares exactly one registered internal destination. A review sheet explains the route and data boundary. The user must perform a second, separate confirmation click to follow the internal link.
- The permitted destinations are EONBOT Chat, Projects, Workspace, Realm Studio, and Local AI. There is no value-bearing, provider, external URL, private-data, or automatic-navigation path.
- City Play never navigates by JavaScript. The confirmation routine returns an allowlisted internal href only; the visible anchor is the user-controlled navigation step.

## Explicitly not done

- No direct in-game work panel, Chat draft transfer, provider-key entry, hardware probing, chain status, wallet, token, contract, mission reward, marketplace, multiplayer, or server telemetry.
- No claim of mobile device performance, final art, launch readiness, or Polygon mainnet connection.

## Next

W251 will select one destination (Workspace first) and prove that City can hand off a small, non-sensitive intent label while preserving draft state and returning safely.
