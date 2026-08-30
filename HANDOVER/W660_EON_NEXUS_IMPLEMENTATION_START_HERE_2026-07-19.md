# W660 EON NEXUS — Implementation Start Here

**Planning branch:** `chatgpt/w660-eon-nexus-plan`
**Verified source base:** `5a12c38a184d286774335550d034f549092f311e`
**Primary specification:** `docs/W660_EON_NEXUS_VISUAL_INTELLIGENCE_LAYER_2026-07-19.md`

## 1. Execution rule

Do not begin with a polished orb shader.

The first deliverable is a small, testable and privacy-safe observable-state contract connected to one genuine EONBOT conversation. The visual renderer is added only after the state contract proves that it can represent real readiness, voice, task, approval, provider and result events.

## 2. Proposed implementation slices

### W660A1 — State inventory and adapter audit

Inspect the existing Chat, voice, AI provider, project, task, approval, Forge and EONCITY modules. Produce a source-backed map of:

- current conversation state;
- voice/listening/speaking state;
- provider/local route;
- task lifecycle;
- approval/review lifecycle;
- result/file availability;
- cancellation and error state;
- existing event emitters and stores that can be reused.

Do not invent adapters for unavailable capabilities.

### W660A2 — Observable-state contract

Proposed modules:

- `assets/js/nexus/eon-nexus-state-contract.js`
- `assets/js/nexus/eon-nexus-event-adapter.js`
- `assets/js/nexus/eon-nexus-privacy-projection.js`
- `assets/js/nexus/eon-nexus-capability.js`

Responsibilities:

- normalize application events;
- derive one immutable visual snapshot;
- expose subscriptions without owning the underlying work;
- redact sensitive labels by default;
- classify route as local, direct provider, hosted-permitted or guide;
- distinguish available, selected, active, waiting, completed, failed and blocked;
- support deterministic replay in tests.

Suggested snapshot shape:

```js
{
  schema: 'eon.nexus.observable-state.v1',
  conversation: { id, label, isPrivate },
  project: { id, label, selected },
  eonbot: { state, canListen, isSpeaking },
  task: { id, label, stage, status, cancellable },
  route: { mode, providerLabel, privateOnDevice },
  approval: { pending, label, reviewActionId },
  nodes: [{ id, kind, label, status, count }],
  results: { count, unread },
  connection: { status, retryable },
  updatedAt
}
```

IDs and labels must be bounded and privacy-projected before reaching renderers.

### W660B1 — Static and reduced-motion Pulse

Proposed modules:

- `assets/js/nexus/eon-nexus-pulse.js`
- `assets/css/eon-nexus-pulse.css`
- `public/assets/css/eon-nexus-pulse.css`

Start with DOM/SVG or Canvas primitives. Implement a fully useful static representation before animated quality.

Required controls:

- Open EONBOT;
- Hold to speak / Start voice;
- Review approval;
- Open result;
- Minimize;
- accessible status label.

### W660B2 — Procedural animated Pulse

Proposed renderer:

- one procedural sphere or radial core;
- two or three bounded rings;
- limited path strokes;
- no model asset;
- no heavy engine on initial Chat load;
- visibility and reduced-motion governors.

The renderer consumes snapshots only. It must not query provider keys, projects or private files directly.

### W660C — Live Nexus

Proposed modules:

- `assets/js/nexus/eon-nexus-live-view.js`
- `assets/js/nexus/eon-nexus-node-layout.js`
- `assets/js/nexus/eon-nexus-gesture-controller.js`
- `assets/js/nexus/eon-nexus-accessible-list.js`
- `assets/css/eon-nexus-live.css`

Required modes:

- modal/full-screen;
- split with standard Chat;
- conventional list fallback;
- mobile portrait;
- reduced motion/static.

Initial node cap: five real nodes. Additional nodes must collapse into a count or readable list rather than forming an unreadable galaxy.

### W660D — Project Atlas

Proposed modules:

- `assets/js/nexus/eon-nexus-project-adapter.js`
- `assets/js/nexus/eon-nexus-atlas-view.js`

Scope only one selected project. Use existing project identifiers and local continuity contracts. Do not create a new project database.

### W660E — Product adapters

Add independent adapters after the shared contract is stable:

- Forge workflow adapter;
- Projects summary adapter;
- Local AI route adapter;
- Library provenance adapter;
- Automations timeline adapter;
- restrained Vault status adapter.

Adapters may translate existing state; they may not invent operational status.

### W660F — EONCITY hologram

Proposed modules:

- `assets/js/city/w660/eon-city-w660-nexus-hologram.js`
- `assets/js/city/w660/eon-city-w660-nexus-stations.js`
- `assets/js/city/w660/eon-city-w660-nexus-continuity.js`

Use Babylon only inside EONCITY. The City renderer receives the same privacy-projected snapshot as standard EONAPP.

Initial placements:

1. Creator Command Seat;
2. one EONBOT terminal;
3. Forge Bay;
4. one project workstation.

Do not add the personal floating companion until station continuity and mobile performance pass.

## 3. Event truth and review-first rules

A visible active path requires a real active event. A selected but idle agent uses a distinct selected state. Waiting approval must stop active processing animation and show a Review control.

Allowed stage labels are understandable application stages, for example:

- Reading project;
- Inspecting files;
- Preparing plan;
- Waiting for approval;
- Running validation;
- Complete.

Rejected patterns:

- fake percentages;
- invented token counts;
- simulated terminal logs;
- decorative nodes labelled as working agents;
- “secure” or “private” without a proven local route;
- automatic opening of private filenames or conversation content.

## 4. Test programme

Proposed focused tests:

- `tests/unit/w660-nexus-state-contract.test.mjs`
- `tests/unit/w660-nexus-privacy-projection.test.mjs`
- `tests/unit/w660-nexus-pulse.test.mjs`
- `tests/unit/w660-nexus-gesture-controls.test.mjs`
- `tests/unit/w660-nexus-project-atlas.test.mjs`
- `tests/unit/w660-nexus-eoncity-continuity.test.mjs`

Proposed gates:

- `scripts/w660-eon-nexus-state-gate.mjs`
- `scripts/w660-eon-nexus-performance-gate.mjs`
- `scripts/w660-eon-nexus-browser-proof.mjs`

Minimum deterministic cases:

1. ready → listening → processing → speaking → ready;
2. processing → approval waiting → approved → processing → complete;
3. processing → cancelled;
4. processing → failed → retryable;
5. local route remains visibly local;
6. hosted/direct route is visibly different;
7. selected agent is not shown as active;
8. private project and file names remain redacted until explicit open;
9. hidden Pulse pauses rendering;
10. reduced-motion/static output preserves all information;
11. keyboard and visible-button alternatives exist for gestures;
12. Chat and EONCITY snapshots resolve to the same conversation/project identity.

## 5. Performance evidence

Measure rather than assume:

- incremental compressed JS/CSS size;
- initial Chat render cost with Pulse closed;
- idle CPU and frame rate;
- open Live Nexus CPU/GPU cost;
- memory before/open/after close;
- background and hidden-tab behaviour;
- mobile Balanced and Low power modes;
- EONCITY impact when the hologram is outside interaction range.

The Pulse must not import Babylon or EONCITY assets.

## 6. Browser and device matrix

Source tests are not final proof. Capture headed evidence for:

- Chromium desktop;
- Firefox desktop where supported by the existing test lane;
- mobile portrait and landscape;
- touch drag, pinch, long press and visible equivalents;
- keyboard-only operation;
- reduced motion;
- low-power quality mode;
- microphone denied;
- provider disconnected;
- local runtime unavailable;
- pending approval;
- task cancellation;
- standard Chat fallback;
- EONCITY station open/minimize/continuity.

## 7. Commit boundaries

Keep small auditable commits:

1. state audit and contract tests;
2. privacy projection and capability truth;
3. static Pulse;
4. animated Pulse and performance governor;
5. Live Nexus shell and accessible list;
6. real nodes, approvals and result cards;
7. mobile gestures and visible alternatives;
8. Project Atlas;
9. focused product adapters;
10. EONCITY station hologram;
11. browser/device evidence and final audit.

Do not combine the entire programme into one unreviewable commit.

## 8. Acceptance ladder

### Pulse prototype accepted

- one real EONBOT conversation;
- eight truthful states;
- standard Chat always available;
- privacy projection proven;
- static/reduced-motion mode;
- no initial-load regression above the approved budget.

### Live Nexus accepted

- five real nodes;
- readable transcript/stage/results panel;
- real approvals and cancellation;
- mobile and keyboard proof;
- provider/local route truth.

### Atlas accepted

- one selected project only;
- tasks, chats, files, outputs and milestones use existing truth;
- no whole-account exposure;
- next action is explainable and reviewable.

### EONCITY hologram accepted

- same conversation and project state as standard EONAPP;
- station interaction does not create a parallel state store;
- hologram sleeps outside range;
- City Map or standard Chat remains a useful fallback;
- real mobile and desktop City proof passes.

## 9. First coding command sequence

After checking out the approved implementation branch from W659N:

```bash
npm ci
npm run lint -- --max-warnings=0
npm run qa:w659n-productive-city
npm run qa:w659n-productive-city:build
```

Then perform the W660A state inventory before adding any renderer. After each implementation slice, run its focused tests plus maintained lint/build/smoke. Archive superseded exact-copy historical tests as non-certifying; never weaken current maintained gates to accommodate a visual prototype.

## 10. Immediate next action

Begin **W660A1 only**:

- inspect current Chat/EONBOT/voice/provider/project/task/approval event sources;
- write the source-backed state inventory;
- identify reusable contracts and missing truth boundaries;
- propose the smallest normalized snapshot;
- do not yet add orb animation.
