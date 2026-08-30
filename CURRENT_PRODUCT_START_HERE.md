# EONAPP — Current Product Start Here

**Certified source base:** W659N commit `5a12c38a184d286774335550d034f549092f311e`
**Active local milestone:** W660 EON NEXUS + complete Productive EONCITY candidate
**Implementation status:** source-complete through W660H; exact-current headed and Preview certification pending
**Live production status:** older reduced City release; not the W660 candidate

This file is the current continuation entrypoint. Historical handovers remain evidence for their original checkpoints, but they do not override this file, the maintained test runner, or the current source contracts.

## 1. Identity and custody boundary

Google Login is identity-only. It confirms the signed-in EONAPP account and does not authorize EONCITY to read prompts, chats, project contents, provider keys, Vault contents, files, payment data, microphone, camera, or social accounts.

EON.HUB is a separately packaged product surface and is not the EONCITY runtime, an alternate City route, or a second assistant store.

The canonical City URL is `/eoncity`. The lightweight access station checks identity first; only an authorized foreground session may import the full Babylon City. Fullscreen, audio, microphone, camera, facecam, recording, haptics, sharing, provider requests, rewards and external navigation remain explicit user actions.

## 2. Current W660 source truth

The local candidate implements the approved W660 sequence end to end:

1. **W660A1** — source-backed observable-state inventory;
2. **W660A2** — shared immutable Nexus state and privacy projection;
3. **W660B1** — accessible static/reduced-motion EON Pulse;
4. **W660B2** — bounded procedural Pulse motion with performance controls;
5. **W660C** — Live Nexus in full-screen, split-screen and mobile layouts;
6. **W660D** — truthful selected-project Atlas;
7. **W660E** — focused Forge, Projects, Local AI, Library, Automations, Vault, Settings and Billing adapters;
8. **W660F** — nine purpose-bound EONCITY holographic Nexus stations using the same privacy-projected EONBOT state;
9. **W660G** — the lightweight Pulse and expandable Live Nexus across application-shell product routes, while Chat keeps its dedicated bridge and EONCITY keeps its 3D holograms;
10. **W660H** — ChatGPT-style fixed shell regions, always-visible composer/account dock, corrected Continue actions, page-specific Nexus identity/data and explicit full-screen gestures.

No slice creates a second assistant, chat history, project store, task store, file store, agent history or fictional technical activity.

## 3. Complete Productive EONCITY candidate

The candidate is the authenticated full progressive City, not the obsolete reduced production scene. Its source contracts currently cover:

- nine playable destinations: Orientation Hall, Transit Network, Agent Theatre, Creator Atrium, Forge Basilica, Command Centre, Archive Canopy, Vault Station and Trade Dome;
- 34 effective latest City assets with primary and fallback variants, while five superseded duplicates remain excluded;
- 14 effective characters, all bound to reviewed product roles;
- nine purpose-bound Nexus holograms placed across the City;
- EONBOT mini-chat with the existing conversation truth, Dictate, Voice Conversation and compatible Live Voice boundaries;
- Sharing Center with explicit signed public invite/referral actions;
- Creator Capture for local gameplay recording, optional microphone and optional facecam, local preview/save and explicit share flow;
- missions, XP, EONKEYS and non-financial Vault Reveals;
- membership, referral and billing boundaries without invented entitlement state;
- Agent Theatre, explicit district transit, proximity-bound terminals/NPCs and review-first productive actions;
- one protected Babylon renderer owner with progressive loading, content-hashed assets, cache reuse and same-route recovery.

The procedural skyline/landmark layer is decorative only. Real GLB assets remain the readable functional anchors and decorative meshes cannot capture picking, collisions or camera occlusion.

## 4. Graphics and device selection

The City inspects WebGL capability and the unmasked renderer locally. A capable discrete NVIDIA GPU profile such as an RTX 3050 with 16 GB system memory selects **Cinematic / High detail** automatically unless the user explicitly chooses another profile, enables data saving, or the browser exposes only a software renderer.

The quality selection is visible in the City HUD and can be changed in the in-world Visual Profile settings. Software-rendered CI is allowed to select a safety profile; that does not override the required physical-device proof on the user’s gaming laptop.

## 5. Maintained local certification

Run from the active source root:

```bash
npm test
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
node scripts/w659n-productive-city-gate.mjs
node scripts/w660a2-eon-nexus-state-gate.mjs
node scripts/w660b1-eon-nexus-pulse-gate.mjs
node scripts/w660b2-eon-nexus-pulse-motion-gate.mjs
node scripts/w660c-live-nexus-gate.mjs
node scripts/w660d-project-atlas-gate.mjs
node scripts/w660e-product-adapters-gate.mjs
node scripts/w660f-city-nexus-gate.mjs
node scripts/w660g-app-shell-nexus-gate.mjs
node scripts/w660h-chat-shell-page-nexus-gate.mjs
node scripts/w660-city-completion-matrix-gate.mjs
node scripts/w660-city-emitted-candidate-gate.mjs
```

Keep the maintained current test runner authoritative. Superseded exact-copy historical tests belong in an explicit non-certifying archive and must not force current source back to an obsolete reduced-City contract.

## 6. Evidence boundary

The following are **not yet certified** merely because source and local build gates pass:

- GPU-backed headed traversal on the RTX 3050 laptop;
- visual placement/readability of every district, asset, character and Nexus station;
- physical microphone, facecam and gameplay-recording permission flows;
- immutable Cloudflare Preview behavior;
- production deployment and post-deployment verification.

The current public `eonapp.ch/eoncity` release is an older reduced build and is not evidence for the W660 candidate. It must not be tuned or accepted as the final City.

## 7. Release workflow and cost control

Finish and freeze one complete local milestone before publishing. Do not create a GitHub commit or Actions run for each small repair.

The release sequence is:

1. complete local source, unit, lint, build, emitted-asset, smoke and secret checks;
2. create one manifest-backed local milestone package;
3. publish one clean GitHub milestone commit/PR;
4. run one consolidated headed browser lane only when local gates are green;
5. deploy one immutable Preview candidate;
6. inspect the logged-in Preview in GPU-backed Opera across all nine districts and productive systems;
7. deploy production only after the evidence is reviewed.

## 8. Hard product boundaries

- One EONBOT, one conversation truth and one selected-project truth across Chat, Nexus and EONCITY.
- No fabricated completion percentages, agents, terminal output, files, milestones, relationships or rewards.
- Renderers receive privacy-projected state, never credentials, raw private prompts, Vault contents or hidden file paths.
- No silent local-to-hosted fallback.
- Recording, microphone, camera, voice, sharing, navigation and commercial actions remain explicit and reviewable.
- Standard Chat, keyboard, touch and screen-reader controls remain available at every visual level.
- No production, provider, payment, OAuth, Drive, device, City or launch claim without its explicit evidence lane.
