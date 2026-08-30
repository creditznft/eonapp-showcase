# W624F Execution Brief — NPC Production System

Date: 2026-07-11  
Prerequisites: W624A art bible, W624B runtime owner, W624C Command District, W624D Wayfinder/camera, W624E EONBOT Orbit  
Constraint: W624C runtime visual score remains pending; do not expand final-quality production beyond the existing Command District

## Mission

Build a bounded NPC production system for the existing Command District. NPCs must improve orientation and productive-work understanding without becoming static mannequins, fake workers or invented agent activity.

## Required implementation

1. Create at least four distinct Productive Nocturne NPC archetypes with readable silhouettes and grounded human scale.
2. Give each archetype deterministic local states for idle, navigate, work, talk, listen, point, wait, recover and unavailable.
3. Assign honest roles tied to real current surfaces: project guide, creator technician, automation operator and archive/workspace guide.
4. Use only authored Command District paths, safe anchors and collision-aware movement; never obstruct spawn, Unstuck, Wayfinder, Orbit, camera or interaction cards.
5. Every interaction must open a review card, explain a real route/status or show an explicit proof-gated boundary. No automatic route opening or work execution.
6. Never invent job progress, customer activity, payments, rewards, queue state, project success or economy.
7. Add deterministic schedules/idle variety that remain presentation-only and do not claim server activity.
8. Add crowd/LOD tiers and a weak-device fallback that can reduce or disable NPC detail without breaking productive navigation.
9. Keep captions primary; voice remains optional and explicit. Preserve reduced motion, keyboard, touch and controller access.
10. Keep NPC state local and disposable. Do not mutate projects, providers, billing, referrals, Vault or account data.
11. Preserve the W624B single runtime owner, disposal/session-expiry/re-entry behavior and the W624C no-expansion gate.
12. Extend the stable `npm run verify:codex-predeploy` path and maintained-test manifest without renaming the external Codex command.

## Acceptance

Produce focused source gates/tests plus real-browser evidence where available for:

- four distinct archetypes and nine bounded states;
- real-role/real-route mappings;
- pathing, spacing, collision and recovery;
- no static flagship-path mannequins;
- no fake operational or commercial claims;
- weak-device/LOD fallback;
- clean disposal and re-entry;
- compatibility with Wayfinder, camera, Orbit and the deterministic Codex suite.

Do not claim final voice acting, production AI agents, physical-device crowd performance or owner visual approval from source tests.
