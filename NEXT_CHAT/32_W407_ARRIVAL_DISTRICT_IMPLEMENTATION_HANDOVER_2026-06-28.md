# W407 Arrival District — Implementation Handover

**Date:** 2026-06-28  
**Baseline:** W405 source plus UX-1, UX-2, UX-3, W411, Share-2 and W406B  
**Status:** source/build validated; authored-procedural City vertical slice.

## Product outcome

W407 makes the first seconds in canonical Babylon `/eoncity` more legible and
more intentional without pretending that production binary art has been
completed.

The person now enters through a readable **Arrival Gate**, follows an illuminated
wet-street route, sees a **Meet EONBOT · Choose Work** mission beacon, has a
sightline toward the Command Deck, retains skyline/rain atmosphere where the
quality profile permits it, and receives a visible local first mission:

> Meet EONBOT, then choose one real work route.

The route does not open automatically. It stays inside the existing visible
interaction/review process and does not create a reward, score, account state,
private work transfer or background agent job.

## Source changes

### New Arrival District blueprint

`assets/js/city/eon-city-arrival-district.js` freezes five first-frame parts:
Arrival Gate, wet-street path, Command Deck exterior, skyline depth and EONBOT.
It explicitly records Babylon `/eoncity`, original procedural fallback, zero
binary assets, no user data, no network, no auto-start/auto-route and no reward.

### Babylon visual pass

`assets/js/city/eon-city-play-babylon.js` now renders:

- gate pylons, crossbeam, crown and readable entry sign;
- reflective route strips and bounded path tiles;
- one pulsing local mission beacon;
- a status line that preserves the older source-test phrase while adding the
  new user-facing Arrival Gate direction;
- metadata/runtime summary for the Arrival District.

W406B art-intake state remains reported and still says zero shipped/loadable
binary assets.

### New gates

- `qa:w407-arrival-district` — 13 source checks and 4 focused tests.
- `verify:w407-arrival-district` — full certification command.

## Important truth boundary

This is authored **procedural** composition. It does not ship a GLB, KTX2/Basis
texture, licensed marketplace asset, original commissioned asset, audio,
animation, hash, provenance evidence, human art review, device visual proof or
AAA/cinematic certification.

W406B remains the gate for any future binary release. Do not move an asset to
`shipped` until provenance, same-origin path, SHA-256, human review, LOD/texture
budget and desktop/mobile proof all exist.

## Next safe wave

W408 can add Creator Atrium and Forge Bay only after the W407 flow is manually
checked on real desktop/mobile hardware. Keep the Babylon canonical route and
no-binary boundary unless actual art evidence is supplied.
