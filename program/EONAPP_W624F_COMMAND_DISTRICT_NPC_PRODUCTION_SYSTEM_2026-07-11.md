# EONAPP W624F — Command District NPC Production System

Date: 2026-07-11  
Status: source-complete; maintained certification green; browser/device/crowd-performance proof pending  
Canonical City route: `/eoncity`

## Purpose

W624F adds a bounded, review-first NPC layer to the existing Productive Nocturne Command District. The guides improve orientation and explain real EONAPP destinations without becoming fake workers, autonomous agents, simulated customers or decorative operational dashboards.

## Four authored archetypes

1. **Mira — Project Guide**
   - Route: `/projects`
   - Explains the private-by-default project return path.
   - Cannot read project names, prompts, files, progress or sync state.

2. **Tavi — Creator Technician**
   - Routes: `/create`, `/forge`
   - Explains user-started creation and build surfaces.
   - Cannot claim generation, publishing, repository activity or deployment.

3. **Oren — Automation Operator**
   - Route: `/automations`
   - Remains explicitly unavailable/dormant until genuine job evidence exists.
   - Cannot invent queues, customers, schedules, provider calls or external actions.

4. **Sera — Archive & Workspace Guide**
   - Routes: `/library`, `/workspace`
   - Explains saved-output and workspace surfaces.
   - Cannot expose document titles, recipients, shares, posts, messages or live feeds.

Each archetype has a distinct Productive Nocturne silhouette, accent, grounded human scale, truth boundary and canonical route mapping.

## State and interaction contract

The local controller exposes exactly nine presentation states:

`idle · navigate · work · talk · listen · point · wait · recover · unavailable`

`talk`, `listen`, `point` and `work` require an explicit visible user action. A `work` request resolves to a presentational wait state and reports `workExecuted: false` and `routeOpened: false`.

Every guide interaction follows two visible steps:

1. Open an informational review card.
2. Separately confirm a canonical route.

The NPC module itself cannot navigate, execute work, call a provider, write browser storage, create a network request or mutate project, Vault, billing, referral or account state.

## Authored movement and recovery

The four guides use only W624C Command District branch paths:

- `project-branch`
- `creator-branch`
- `agent-branch`
- `archive-branch`

Their deterministic endpoints remain outside the authoritative Arrival Plaza spawn, all six Unstuck recovery points and W624C landmark collision volumes. The system preserves Wayfinder movement, camera sightlines and EONBOT Orbit formation space.

The older W409 living-city guard was updated—not skipped—to recognize the newer authored-path patrol contract as the maintained replacement for the old sinusoidal micro-patrol signature.

## Weak-device and accessibility behavior

LOD profiles are deterministic:

- `cinematic`: four authored guides, 24 Hz presentation updates.
- `balanced`: four readable guides, 12 Hz updates.
- `lite`: two silhouette guides, 4 Hz updates.
- `disabled`: zero optional guides; productive City navigation remains intact.

Captions remain primary. Controls are visible and keyboard/touch accessible. Reduced-motion mode removes unnecessary patrol motion. Performance protection may lower NPC LOD without changing routes, user work or commercial state.

## Runtime ownership

W624F preserves:

- `/eoncity` as the only heavy renderer document;
- `/api/city/access` as server-authoritative access;
- `eon-city-runtime-owner.js` as the sole mount/disposal owner;
- the W624B eleven-state lifecycle and deterministic asset boundary;
- W624C destinations, paths, spawn, collision and Unstuck;
- W624D Wayfinder and five-profile camera system;
- W624E captions-first EONBOT Orbit.

No district expansion or visual certification is claimed.

## Repository certification improvement

The stable external command remains:

```bash
npm run verify:codex-predeploy
```

W624F adds source-fingerprinted checkpoints. If a shell or CI wrapper interrupts the long certification command, the next invocation resumes only the completed prefix and only when the certifying source fingerprint is unchanged. Any source change invalidates the checkpoint and forces a fresh run. The repository lock still prevents overlapping runs.

## Evidence boundary

Source gates prove the bounded contract and integration. They do not prove:

- final imported character rigs or voice acting;
- physical-device crowd density, frame pacing, memory, battery or thermals;
- authenticated production City behavior;
- final visual quality or owner approval;
- production AI agents, live job activity or autonomous work.

The managed loopback fixture started, but Playwright Chromium was unavailable. The browser receipt is honestly `BLOCKED` and contains no screenshots.
