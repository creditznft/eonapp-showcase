# W573 — Seeded City Ambience Scope Board
## Approved local-source scope · 2026-07-03

## Product purpose

Make Command Horizon feel more alive through a finite, deterministic visual layer: decorative NPC motion cues, distant light-pod traffic, static wayfinding signs, and small visual moments. This is atmosphere only. It does not represent real people, real activity, a live city, an event programme, or user progress.

## Allowed implementation

- One source-controlled local seed plus an explicit finite phase index.
- Three finite quality budgets: Lite, Balanced, and Cinematic.
- Lite retains only static readable wayfinding signs. Balanced and Cinematic may add capped decorative NPC cues, light-pod traffic, and visual moments.
- Procedural Babylon geometry/text only, integrated through the existing staged City renderer.
- Existing City pause and reduced-effects guards freeze all W573 motion while leaving static signs readable.
- A local runtime summary may expose only counts and local visual truth.

## Non-negotiable boundaries

- No real-world schedule, countdown, calendar, invite, reward, or notification semantics.
- No audio, microphone, speech recognition, TTS, audio capture, autoplay, provider, or voice behaviour; W562 and W572 stay unchanged.
- No network, remote asset, stream, binary-art loader, edge proxy, telemetry, storage, browser permission, background task, or device-clock read.
- No account, project, prompt, Vault, model, private work, identity, entitlement, payment, ownership, collectible, social, multiplayer, route-opening, or autonomous-work field.
- No fake productive activity, user presence, or AI progress claim. Ambient NPCs remain noninteractive decorative guides.
- No deployment, preview, production, browser visual review, or physical-device performance claim.

## Acceptance criteria

1. A pure, deterministic source module produces only allowlisted visual entries for a given quality, seed, and phase index.
2. Lite is a genuine low-motion fallback; it has static signs and no traffic, visual moments, or ambient NPC cue count.
3. Balanced/Cinematic counts are finite and validated; all signs, traffic, moments, and NPC cues are noninteractive and local-only.
4. The Babylon scene consumes the source plan, renders it without loaders, and freezes all motion on pause or reduced effects.
5. Source gate and unit coverage prove no clock, calendar, notification, sound, network, storage, private-data, commercial, entitlement, social, or workload scope expansion.
6. Full source validation and an updated portable handover are required before any later deployment decision.
