# W701 Runtime Authority Map

## Canonical authorities

| Concern | Authority | Boundary |
|---|---|---|
| Foreground work context | `assets/js/runtime/w702/eonapp-w702-canonical-work-state.js` | Pure immutable state and projections; no storage or execution |
| Reviewed foreground intent | `assets/js/action-gateway/eon-reviewed-foreground-action-gateway-w702.js` | Two-step review; returns an event/route but performs no navigation |
| City first playable frame | `assets/js/city/eon-city-play-core.js` | One Babylon scene, one canvas, one render loop |
| City world and camera safety | `assets/js/city/w703/eon-city-w703-world-safety.js` | Global sanitation and above-ground enforcement |
| External action gateway | Existing action-gateway contract and review pilot | Remains disabled/fail-closed for real external execution |
| Production hosting | Cloudflare Pages | Not mutable during W701–W703 |

## State ownership rule

Projects owns ordinary project records. Vault owns secret and recovery material. The W702 canonical state contains only bounded labels, identifiers, counts, routes and status projections. It does not become another project database, conversation store, credential store or provider runtime.

## Runtime ownership rule

The City keeps one protected Babylon renderer. W703 augments that owner with safety constraints; it does not create a second camera system, scene, canvas or render loop.

## Release reconciliation rule

The local handover reproduces the verified W700 source tree. Production additionally includes the narrow W700.4–W700.9 repair chain. New W701–W703 work must preserve that chain when the eventual candidate is reconciled. No production promotion is permitted until the complete local candidate is frozen and independently certified.
