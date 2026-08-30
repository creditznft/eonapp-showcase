# W406B City Art Intake — Implementation Handover

**Date:** 2026-06-28  
**Baseline:** supplied W405 continuation bundle, then UX-1, UX-2, UX-3, W411 and Share-2  
**Status:** source/build validated; art intake is active as a release boundary, not as shipped binary art.

## Purpose

W406B turns the approved `Living Creator Metropolis` art direction into an
explicit production intake system. It improves truth and readiness before any
artist, contractor or binary asset is allowed into the public Babylon City.

Babylon at `/eoncity` remains the only public City engine. Existing original
procedural geometry remains the rendered fallback. This wave does not create a
second public City, download media, or label current visuals as final art.

## What is now in source

### Art bible and delivery policy

`assets/js/city/eon-city-art-intake.js` defines the midnight-neon atelier
standard: graphite/navy, glass and brushed metal, wet street reflections,
cyan/violet/mint signals, restrained bloom/rain/fog, readable human-scale
wayfinding, and authored hero set pieces.

The policy requires a later release to use a same-origin GLB, offline
KTX2/Basis packaging, `lod0/lod1/lod2`, quality budgets, provenance evidence,
SHA-256, human art review, mobile fallback, and real-device visual/performance
proof. Remote asset loading and user data remain forbidden.

### First-frame and district intake

The initial art priority is deliberately bounded:

1. Arrival Gate / calm entry plaza;
2. Command Deck exterior;
3. wet-street wayfinding kit;
4. distant skyline modules;
5. readable EONBOT companion.

The next planned authored district assets are Creator Atrium, Forge Bay and
Signal Tower. Each maps to an existing canonical landmark and a W365 catalog
entry. All entries remain `planned`, have no path, hash or evidence record, and
resolve to local procedural fallbacks.

### Runtime truth surface

The Babylon runtime now includes `artIntake` in its local summary and scene
metadata. It reports zero loadable or shipped binary assets. This is an
inspection surface only; it does not make a new network request or render a
new binary asset.

### New source controls

- `qa:w406b-city-art-intake` — 16 source checks and 5 focused unit tests.
- `verify:w406b-city-art-intake` — complete W406B certification command.
- The W365 catalog now contains 17 planned entries, including the five
  additional district/skyline placeholders required by the intake map.

## Held boundaries

W406B does not activate Sync, Relay, tracking, rewards, social connections,
posting, payment, vault data, asset uploads, user deployment or any live art
pipeline. It contains no new image, model, texture, audio, animation or other
binary media.

## Next required work

The next code wave is W407: build the Arrival District as a better authored
procedural vertical slice only where it can remain truthful. A genuine binary
art release must wait for licence/provenance intake, human review and device
proof; it must not be replaced by unlicensed or generated stand-ins.
