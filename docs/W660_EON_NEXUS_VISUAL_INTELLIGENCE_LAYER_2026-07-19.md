# W660 — EON NEXUS: Visual Intelligence Layer of EONAPP

**Date:** 2026-07-19
**Planning branch:** `chatgpt/w660-eon-nexus-plan`
**Source base:** W659N commit `5a12c38a184d286774335550d034f549092f311e`
**Status:** Product definition and implementation contract. No runtime capability is claimed by this document.

## 1. Locked product definition

**EON NEXUS is the visual face and observable-control layer of the existing EONBOT system.**

It is not:

- a second assistant;
- a second conversation store;
- a fictional multi-agent simulator;
- a replacement for readable chat, files, projects or approvals;
- an always-running heavy 3D scene;
- a decorative orb that invents progress.

It begins as a lightweight living orb, expands into a real-time EONBOT command interface, and can zoom out into a selected-project map. The normal transcript and conventional controls remain available at every level.

The governing product principle is:

> Beautiful enough to feel futuristic, useful enough to remain open after the novelty disappears.

## 2. Core architecture decision

One authoritative EONBOT state contract feeds every representation:

```text
Conversation + task lifecycle + approvals + tools + provider route + results
                                  |
                     EON Observable State Contract
                                  |
       Chat transcript | EON Pulse | Live Nexus | Project Atlas | EONCITY hologram
```

No visual surface may maintain a competing task truth. A state event is emitted because the application genuinely entered that state; animation is only a rendering of that event.

### Required observable state domains

- conversation identity and selected project;
- EONBOT readiness, listening, processing and speaking;
- current task and truthful task-stage label;
- selected, active, waiting, complete, failed and blocked agents/tools;
- provider route: local, direct user-owned provider, hosted EONAPP-permitted route, or guide mode;
- pending approval or review action;
- generated result and user-opened file references;
- connectivity, cancellation, timeout and recovery state;
- privacy-safe summaries rather than raw sensitive content.

### Proposed event vocabulary

- `eonbot.ready`
- `eonbot.listening.started`
- `eonbot.listening.stopped`
- `eonbot.processing.started`
- `eonbot.speaking.started`
- `eonbot.speaking.stopped`
- `task.stage.changed`
- `task.approval.requested`
- `task.paused`
- `task.cancelled`
- `task.completed`
- `task.failed`
- `agent.selected`
- `agent.started`
- `agent.blocked`
- `agent.completed`
- `provider.route.changed`
- `result.available`
- `connection.changed`

The final implementation may use a smaller normalized schema, but all visible states must map to a real event or a stable derived state.

## 3. Three product levels

### Level 1 — EON Pulse

A compact EONBOT control available on selected EONAPP pages.

It communicates:

- ready;
- listening;
- processing;
- speaking;
- waiting for approval;
- completed result waiting;
- error or disconnected;
- local/private route;
- hosted/direct-provider route.

The Pulse remains quiet, does not cover important controls and pauses when hidden. It opens the same conversation used by standard Chat.

### Level 2 — Live Nexus

A full-screen, modal or split-screen command interface.

The centre is EONBOT. A bounded ring contains only genuinely relevant nodes, initially limited to five active categories such as:

- Current Project;
- Research;
- Files;
- Forge;
- Validation.

Other adapters can replace these based on context. A readable companion panel always provides:

- transcript;
- current stage;
- agent/tool results;
- files;
- approvals;
- errors and recovery actions;
- final output.

The orb is never the only way to understand or control the task.

### Level 3 — EON Atlas

A selected-project map showing:

- related conversations;
- tasks and milestones;
- generated outputs;
- project files;
- prior agent/tool activity;
- incomplete work;
- blocked work;
- next recommended action.

Atlas is project-scoped by default. It must not display the whole account as a noisy galaxy or expose unrelated private work.

## 4. Visual language

### EONBOT core

- dark graphite or near-black transparent core;
- restrained cyan internal energy for ready and listening states;
- warm orange approval ring;
- gold completion pulse;
- violet/cyan connected paths for selected active tools;
- shield geometry for local/private execution;
- broken or interrupted ring for error and disconnection;
- no constant violent motion, excessive bloom or unreadable particles.

### Motion truth table

| Real state | Visual behaviour |
|---|---|
| Ready | slow breathing light and minimal drift |
| Listening | inward ripples and microphone halo |
| Processing | controlled rotation with stage label |
| Speaking | outward voice waveform or soft radiating bands |
| Approval waiting | stationary orange ring and visible Review button |
| Complete | one gold pulse, then stable result marker |
| Error | interrupted ring, reduced motion and readable error action |
| Local/private | shielded core and explicit Local label |
| Disconnected | dim core, broken path and Retry/Use Chat control |

Decorative idle motion is allowed, but it must remain visually different from active work.

## 5. Interaction contract

### Mobile and tablet

- drag: rotate the visible node system;
- tap: select a node;
- double-tap: focus/open the current EONBOT conversation;
- long press: hold to speak;
- pinch outward: expand;
- pinch inward: minimize;
- swipe upward: active tasks;
- swipe downward: close/back;
- swipe sideways: conversation, agents and results.

Every gesture has a visible equivalent control. Gestures enhance efficiency; they are never required for discoverability or accessibility.

### Desktop

- mouse drag: rotate;
- wheel/trackpad: bounded zoom;
- click: inspect;
- double-click: focus;
- visible buttons and keyboard shortcuts for open, close, speak and view switching;
- optional split mode with conventional chat beside the visualization.

### Accessibility

- full keyboard operation;
- semantic labels and a list-view equivalent for every node;
- screen-reader announcements only for meaningful state changes;
- reduced-motion and static modes;
- no information encoded by colour alone;
- touch targets meeting the existing EONAPP accessibility standard;
- pause and close controls always visible.

## 6. Real actions

EON NEXUS may provide only actions backed by existing or explicitly added application contracts:

- continue the same EONBOT conversation;
- start and stop voice input;
- inspect the real current task;
- inspect active or blocked tools/agents;
- view the provider/local route;
- open the selected project;
- inspect results and user-visible generated files;
- pause or stop cancellable work;
- approve or reject proposed actions;
- return to an earlier reviewable stage when supported;
- continue completed work;
- switch local/hosted route only when policy and capability permit;
- open standard Chat at any time.

The system must never show fake percentages, simulated terminal output or invented agent activity.

## 7. EONAPP placement matrix

| Surface | Nexus form | Purpose |
|---|---|---|
| EONBOT / Chat | Pulse + Live Nexus + split mode | Main home, voice, status, agents, approvals and results |
| Forge | Live Nexus workflow adapter | Request → Plan → Files → Generate → Validate → Preview → Approval |
| Projects | Atlas | Project tasks, conversations, files, outputs and milestones |
| Local AI | Pulse + route detail | Device/private state, runtime availability and explicit fallback choices |
| Library | simplified relationship view | Origin project/conversation and reuse relationships |
| Automations | circular timeline adapter | Upcoming, running, successful, failed and condition-waiting runs |
| Vault | restrained secure status adapter | Lock, backup, review and approval only; no playful galaxy |
| Settings / Billing | small help control only | Contextual EONBOT support without a full visualization |

Nexus is not automatically shown on every page. Each route must justify its useful state and performance cost.

## 8. EONCITY integration

The EONCITY hologram is a renderer and interaction point for the same EONBOT state contract.

### Approved placements

- above the Creator Command Seat;
- at dedicated EONBOT terminals;
- inside Forge Bay;
- Command District command surface;
- beside project workstations;
- optional personal floating companion.

### Continuity rule

A user may begin in normal EONAPP, enter EONCITY and continue the same selected conversation/project state. EONCITY must not create a parallel conversation or a City-only agent history.

### Character relationship

- EONBOT characters are embodied guides and operators.
- EON NEXUS represents the intelligence, task graph, tools and data connections.
- Characters may point to, summon or explain the Nexus, but they do not pretend to be independently working when no real task is active.

### City interaction examples

- approaching the Creator Command Seat reveals a compact Nexus and the current project;
- approaching Forge Bay shows the real build stage and any pending approval;
- a project workstation opens the selected project Atlas;
- the companion orb can guide the player to the physical station connected to the current task;
- leaving interaction range minimizes the hologram without losing the standard app state.

## 9. Rendering and performance contract

Standard EONAPP must use a dedicated lightweight renderer rather than loading Babylon or a large 3D model for the Pulse.

Recommended implementation order:

1. CSS/Canvas or lightweight WebGL Pulse renderer;
2. procedural sphere, rings and paths;
3. HTML/SVG labels and accessible controls;
4. optional richer renderer only for Live Nexus;
5. existing Babylon integration only inside EONCITY.

### Quality modes

- Full;
- Balanced;
- Low power;
- Static/reduced motion.

### Initial performance budgets

- Pulse code and critical styles: target under 90 KB compressed incremental payload;
- no GLB required for Pulse or Live Nexus;
- Pulse idle frame rate: 15–30 FPS based on device and visibility;
- Full Nexus target: 30–60 FPS with automatic downgrade;
- pause rendering when hidden, backgrounded, offscreen or covered by another full-screen surface;
- bounded particles and node count;
- no blocking work on the initial Chat render path;
- lazy load Live Nexus only after explicit open or prefetch during idle on capable devices.

Budgets are targets until measured in the real build and on reference devices.

## 10. Privacy and truthfulness

Default visual labels disclose categories, not sensitive names or content:

- “3 project files” rather than private filenames;
- “Private conversation” rather than message content;
- “Vault item” rather than secure details;
- “Local model” rather than hidden credentials or filesystem paths.

The user explicitly opens details. The interface must distinguish:

- available;
- selected;
- active;
- waiting;
- completed;
- failed;
- blocked.

No raw credentials, provider keys, private prompts, contact data, Vault contents or hidden file paths belong in the visual state contract.

## 11. Rollout programme

### W660A — Observable state foundation

Build the normalized EONBOT observable-state store, event adapter and truth tests. Integrate one existing Chat conversation without a visual renderer.

### W660B — Pulse prototype

Implement ready, listening, processing, speaking, approval, complete, error and local/private visual states. Add visible controls and static fallback.

### W660C — Live Nexus

Add full-screen/modal and split modes, five real nodes, transcript panel, approvals, provider route, result cards, voice and mobile gestures.

### W660D — Project Atlas

Connect one selected project’s conversations, files, tasks, outputs, milestones and next action.

### W660E — Focused app adapters

Add purpose-built adapters for Forge, Projects, Local AI, Library and Automations. Add only a restrained Vault status variant.

### W660F — EONCITY hologram

Render the same state contract in Babylon at approved stations and prove continuity between normal EONAPP and EONCITY.

## 12. Phase 1 prototype acceptance criteria

The first prototype is accepted only when:

1. It uses one genuine EONBOT conversation.
2. Every visual state is driven by an observable application event.
3. Standard transcript and controls remain usable.
4. Eight core states are visibly and accessibly distinct.
5. Local/private state is explicit and never silently changes route.
6. Approval waiting includes a real review action.
7. Error includes a real recovery or standard-Chat fallback.
8. No fake percentage, fake agent or fictional technical activity appears.
9. Reduced-motion/static mode works.
10. Pulse pauses when hidden and does not materially delay initial Chat rendering.
11. Desktop keyboard and mobile touch controls pass.
12. Focused tests, lint, build, smoke and browser evidence pass before merge.

## 13. Stop rules

Stop and repair before expansion when any of these occurs:

- visual activity cannot be tied to a real state;
- a second conversation or task truth is introduced;
- private labels appear automatically;
- Pulse degrades initial Chat performance beyond the approved budget;
- gestures lack visible equivalents;
- the visualization becomes necessary to complete a basic task;
- EONCITY uses different task/project state from standard EONAPP;
- the system looks active while work is actually waiting, blocked or complete.

## 14. Product conclusion

EON NEXUS is a strong fit for EONAPP because it converts the product’s distributed AI, project, Forge, local-provider and City capabilities into one understandable visual language. Its advantage is not the orb alone. The durable value is truthful continuity:

- the same EONBOT;
- the same conversation;
- the same selected project;
- the same approvals;
- the same provider/privacy route;
- multiple useful visual forms.

The orb is the entrance. The observable state contract is the product.
