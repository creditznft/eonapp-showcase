# W649 — EONCITY premium character and art direction

Status: approved design direction for the wave after Forge checkpoint; no production activation yet.

## Visual audit of the current W647 checkpoint

The current characters are useful engineering prototypes, not premium game characters. The screenshots reveal five root problems:

1. Pathfinder A and B share almost the same proportions, stance and costume massing.
2. Heads read as blank helmet blocks; there is no face, emotion or readable identity.
3. Neon appears as uniform rings and trim, so it resembles plastic decoration rather than integrated cybernetic design.
4. Limbs and joints are cylindrical and stiff, with limited anatomical taper and weak hand/foot construction.
5. Materials, role accessories and silhouette hierarchy are too similar; distance readability is poor.

EONBOT/Orbit also lacks a clear front, face and emotional pose language, making its purpose visually confusing.

## Honest quality target

A fully photoreal AAA human character is not realistic from procedural code alone within a roughly 4 MB complete character-system budget. The strongest local/no-external-model-maker outcome is a **premium stylized neo-human** direction: believable anatomy, clean PBR materials, expressive faces/visors, authored silhouettes and studio-quality animation readability without pretending to be photoreal.

The 4 MB ceiling is a budget, not a target. Geometry must be added only where it improves the gameplay silhouette, face, deformation or close-camera read.

## Recommended face direction: hybrid human + smart visor

Use a stylized visible lower face and cheek structure with a transparent/emissive upper smart visor. This gives:

- human identity and readable skin;
- expressive eyes/brows or glyphs on the visor;
- optional emoji-like states for distant gameplay;
- compact textures and fewer facial blend shapes;
- a distinctive EON brand rather than a generic helmet.

Pathfinder A and B must receive different facial proportions, head shapes, hair/hood treatment and resting expression. A full blank visor remains only as an optional cosmetic, not the default face.

## Cyber-sigil neon system

Replace uniform glowing bands with asymmetrical role-specific cyber-sigil paths:

- temple to neck to clavicle;
- one dominant arm and opposite leg;
- torso branches that follow anatomy and garment seams;
- small hand/finger or boot continuations;
- different patterns per role.

Use emissive mask atlases or UV-following curve meshes. Glow should pulse during scan, ability, dialogue and navigation states—not shine at maximum everywhere. Keep bounded bloom so EONCITY remains Productive Nocturne rather than a neon casino.

## Character construction

- Three genuinely different base archetypes: agile Pathfinder, balanced operator and heavier specialist.
- Proper shoulder, elbow, hip, knee, hand and foot proportions.
- Shared optimized armature with deformation-safe weights.
- Modular coat, shoulder, chest, belt, backpack, hood/hair and boot pieces.
- Distinct silhouette first; color swaps are secondary.
- PBR atlas separating skin, cloth, ceramic armour, metal, glass and emissive masks.
- LOD0 close/gameplay, LOD1 normal traversal and LOD2 distance/mobile.
- W646/W647 prototype models retained as immediate rollback only.

## Motion quality

Prioritize idle asymmetry, breathing, weight shifts, grounded feet, shoulder/hip counter-rotation, natural hand shapes and role-specific gesture language. Eliminate T-pose stiffness, shoulder collapse, knee popping and foot sliding before adding more animation clips.

## EONBOT/Orbit redesign

Keep a compact companion drone for brand distinction, but give it:

- a clear forward-facing expressive aperture;
- a broken halo and three asymmetric fins;
- readable up/down tilt and fin poses;
- eye/glyph states for listen, think, speak, point, scan, warn, celebrate and sleep;
- a quieter idle glow and stronger state-change animation;
- camera exclusion, dismiss, mute and reduced-motion behavior.

A tiny humanoid is not recommended because it would compete with NPCs and require another expensive rig.

## Production waves

1. **W649A — silhouette lock:** front/side/gameplay-distance sheets for all archetypes and Orbit.
2. **W649B — procedural model rebuild:** Blender Python/local geometry generation, modular garments and clean topology.
3. **W649C — face and visor system:** hybrid faces, expression atlas/glyph states and role identity.
4. **W649D — cyber-sigil system:** anatomy-following emissive masks, state animation and bounded bloom.
5. **W649E — rig/deformation:** shared skeleton, weights, foot contact and close animation review.
6. **W649F — PBR/material atlas:** skin, cloth, armour, metal, glass and emissive hierarchy.
7. **W649G — NPC cast and Orbit:** five productive roles with distinct silhouettes and real product actions.
8. **W649H — City art integration:** landmark silhouettes, entrances, street kit, lighting, atmosphere and route readability.
9. **W649I — LOD/streaming/performance:** Lite/Balanced/Cinematic profiles, cache reuse and rollback.
10. **W649J — Codex headed certification:** Babylon screenshots/video, animation/deformation inspection, mobile traversal, FPS/memory/WebGL receipts and authenticated/guest boundaries.

## External-tool decision

No external AI 3D generator is required for the recommended premium stylized direction. Blender running locally with scripted mesh generation, UV/material creation and manual-quality rules is sufficient. If the owner later demands photoreal human faces comparable to MetaHuman/Character Creator, a specialist external character tool or artist becomes the honest route; procedural code should not fake that claim.
