# W682 — Expanse Population, Discoveries and Street Activity

Date: 2026-07-25
Base source authority: W678 checkpoint `c82b96291a7c6bb81b214462d97addc6e7679621`

## Delivered

Quality-bounded density profiles now add:

- Lite: 14 ambient actors, 6 discoveries, 8 street events
- Balanced: 30 ambient actors, 12 discoveries, 16 street events
- Cinematic: 52 ambient actors, 18 discoveries, 28 street events

The population plan uses eight visual archetypes, varied public activities, unique deterministic schedules and no adjacent archetype repetition. Discoveries are real pickable scene objects that enter the existing review-first Expanse landmark flow. Street activity and actors animate only in the canonical update loop; reduced-motion mode stops actor travel.

## Truth boundary

Ambient silhouettes do not claim to be real users, workers or agents. Discoveries do not open automatically. No private data, remote traffic, background assistant or second render loop is introduced.

## Targeted evidence

`tests/unit/w682-expanse-population.test.mjs` — 4 assertion groups.
