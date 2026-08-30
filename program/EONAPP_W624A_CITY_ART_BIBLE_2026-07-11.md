# EON City W624A Art Bible — Productive Nocturne

Date: 2026-07-11  
Status: source-complete; owner target-frame review and runtime proof pending  
Authority: `assets/js/city/eon-city-art-bible.js`

## One-sentence vision

EON City is a premium stylized neo-noir science-fantasy city where every beautiful place leads to useful, reviewable productive work.

## CEO design decisions

1. **Productive wonder over decorative spectacle.** Every hero place opens a real workflow, persisted outcome, or honest guide.
2. **Authored silhouettes before emissive detail.** The Command Loom, Agent Theatre, Creator Atrium, Forge Basilica, Signal Sail, Archive Canopy, player, EONBOT, and NPC roles must remain recognizable when shown as flat silhouettes.
3. **Readable nocturne, not a black screen.** The playable foreground, faces, entries, signs, and paths remain readable. Fog and darkness separate depth rather than hide missing art.
4. **Human warmth balances the night.** Warm entrances, occupied interiors, gardens, service lights, and role-specific NPC activity prevent the world from feeling sterile.
5. **Truthful state only.** Jobs, dashboards, agents, missions, rewards, and progress can animate only from real state. No decorative fake productivity.
6. **Calm mastery.** EON City is not a neon casino, combat game, crypto world, or cluttered control room.

## Visual language

- Neutral graphite, carbon, wet steel, blue glass, moon mist.
- District accents: signal cyan, creator violet, forge amber, archive mint, social magenta.
- At least 72% of major surfaces remain neutral.
- No more than two hero accents appear in one composition.
- Materials show roughness, edge response, weather, and scale. Mirror chrome and featureless black are rejected.
- The time of day is blue-hour nocturne after rain, with an open indigo sky, restrained moon grid, distant transit, and three fog-depth bands.

## Architecture language

Hero architecture uses human-scale civic science fantasy:

- a readable street-level base;
- a distinct body and crown;
- one signature silhouette gesture;
- one visible believable working interior;
- clear entries using warm service light;
- skyline spectacle that does not obstruct the camera or route.

Repeated procedural boxes are allowed only in distant background massing. They cannot serve as flagship landmarks.

## Character direction

### Player — Wayfinder

The default player is a capable newcomer rather than a chosen-one superhero. The silhouette uses a long utility coat, compact field pack, and one asymmetric shoulder light. Personalization must support body presentation, skin tone, hair or headwear, coat panel, accent light, mobility aid, and earned cosmetics without pay-to-win attributes.

### EONBOT — Orbit

EONBOT is a small obsidian core inside an offset halo and two expressive light fins. Expression comes from halo tilt, fin pose, eye aperture, light pulse, voice, and captions. EONBOT is warm, curious, concise, dismissible, and never pretends to perform autonomous work.

### Productive NPC cast

- Project Navigator — resumes or creates a real project.
- Creator Technician — prepares a real image or video flow.
- Forge Architect — opens a reviewable Forge build.
- Archive Keeper — finds, restores, or explains saved local work.
- Support Wayfinder — opens help, recovery, accessibility, or safe return.

The flagship path cannot contain static mannequin NPCs.

## Productive RPG contract

A City mission must create at least one real outcome:

- saved project;
- generated artifact;
- reviewable proposal;
- setting change;
- backup or restore receipt;
- support resolution.

The outcome must persist, expose its source and timestamp, and remain visible outside the City where appropriate. A fake success screen cannot complete a mission.

Allowed progression: learning milestones, non-financial reputation, cosmetics, Vault Reveals, and proof-gated EONKEY individual unlocks. Prohibited progression: cash value, tokens, tradable ownership, loot boxes, gambling, pay-to-win power, and fake productivity scores.

## HUD and signage

- Desktop persistent HUD: current objective, nearby useful destination, Share, Menu.
- Mobile persistent HUD: objective, interact, movement/camera, Menu.
- Maximum four simultaneous primary actions.
- Destination signs use one to three words.
- Action labels use verb + object, such as `Open Project` or `Review Job`.
- Decorative glyphs never replace readable labels.
- Language, voice, accessibility, and advanced job details remain progressively disclosed.

## Camera and motion

Gameplay is responsive third-person exploration with collision, reset, unstuck, spawn safety, shoulder/zoom options, and motion comfort. The first frame places the player and EONBOT in the foreground, Command Loom as the dominant promise, Creator and Forge silhouettes on the thirds, and one readable route through the scene.

Animation emphasizes stylized weight, readable anticipation, and clean settles. Running-job animation is legal only while a genuine job state is running. Reduced-motion mode removes nonessential bobbing, pushes, and loops.

## Performance target ceilings

These are design budgets for later implementation, not current measurements:

| Profile | Visible triangles | Draw calls | Texture memory | Initial compressed transfer | NPCs | Target FPS |
|---|---:|---:|---:|---:|---:|---:|
| Lite | 220k | 170 | 220 MB | 16 MB | 5 | 30 |
| Balanced | 650k | 320 | 560 MB | 34 MB | 10 | 45 |
| Cinematic | 1.1m | 480 | 900 MB | 52 MB | 16 | 60 |

Common ceilings: one compressed asset under 8 MB, initial audio under 4 MB, total audio under 20 MB, bounded particle and dynamic-texture counts, and quality downgrade without a full reload.

## Target frames

- `assets/city/art/w624a-targets/eon-city-desktop-arrival-target.svg`
- `assets/city/art/w624a-targets/eon-city-mobile-arrival-target.svg`
- `assets/city/art/w624a-targets/eon-city-cast-lineup-target.svg`

These are original art-direction targets, not runtime screenshots or final rigs.

## Reject list

Reject any City build with dominant empty black space, generic neon boxes, crushed faces, unreadable signs, inconsistent scale, static mannequin NPCs, camera clipping, all accents used everywhere, HUD clutter, fake jobs, fake economy, combat/loot-box language, private data in scenery, required remote art, or district expansion before the Command District reaches 9.0/10.

## Quality gates

- Command District must independently score at least **9.0/10** before final-quality district expansion.
- W624L requires owner visual/product approval of at least **9.5/10**.
- No flagship category may score below **9.0/10**.
- Source strings and tests cannot award visual certification. Fresh runtime captures and real-device evidence are mandatory.
