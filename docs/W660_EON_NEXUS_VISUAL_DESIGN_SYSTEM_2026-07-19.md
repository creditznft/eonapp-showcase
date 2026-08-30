# W660 — EON NEXUS Visual Design System

**Date:** 2026-07-19
**Branch:** `chatgpt/w660-eon-nexus-plan`
**Status:** Visual implementation target. No renderer is claimed by this document.

## 1. Design objective

EON NEXUS must feel like a living intelligence interface without becoming an unreadable science-fiction dashboard.

The design has two simultaneous layers:

1. **Emotional signal** — the orb instantly communicates readiness, listening, work, approval, completion, privacy and error.
2. **Productive evidence** — readable labels, task stages, approvals, files and results explain what the visual state actually means.

The emotional layer attracts attention. The readable layer earns long-term use.

## 2. Orb anatomy

The orb is procedurally assembled from six lightweight visual systems:

### A. Core

A dark translucent sphere or radial volume representing EONBOT itself.

- graphite-black centre;
- subtle internal cyan light in ready state;
- no face, eyes or character features in the standard app;
- the EONBOT character remains the embodied guide in EONCITY.

### B. Inner intelligence lattice

A restrained network of curved lines or softly moving points inside the core.

- indicates the system is available;
- remains slow and non-directional when idle;
- becomes directionally organized only during real processing;
- never displays fake calculations or percentages.

### C. State ring

The primary outer ring communicates the current task state.

- cyan continuous ring: ready;
- inward ripples: listening;
- controlled rotation: processing;
- orange stationary ring: approval waiting;
- one gold pulse followed by stable glow: complete;
- interrupted red-orange ring: error;
- dim broken ring: disconnected.

### D. Privacy shield

A thin geometric shell appears only for a proven local/private route.

- shield facets surround, but do not hide, the core;
- label says `Local AI` or the verified local runtime;
- browser speech is separately labelled and never implied to be offline-local unless proven.

### E. Connection paths

Curved paths connect the core to visible nodes.

- no path for merely available tools;
- faint dashed path for selected but idle tools;
- flowing path only for genuinely active work;
- stationary orange path for waiting approval;
- short gold confirmation wave for completed work;
- broken path for failed or disconnected work.

### F. Status crown

A small readable label group above or beside the orb:

```text
EONBOT
Inspecting files
Local AI · Private on this device
```

Only the first two lines are required in compact layouts. The provider/privacy line appears when space permits or when the user opens details.

## 3. Colour meaning

Colours are semantic and must not be used as decorative random cycling.

| Meaning | Visual family | Required non-colour cue |
|---|---|---|
| Ready / listening | cyan | Ready or Listening label; ring/ripple difference |
| Processing | cyan-to-violet | rotating ring and current stage label |
| Selected tool | violet | dashed path and Selected label |
| Approval waiting | orange | stationary ring and Review button |
| Completed | gold | Complete label and result card |
| Local/private | cyan shield | shield icon and Local AI text |
| Hosted/direct provider | violet/blue route | provider label and route text |
| Error | red-orange | interrupted geometry, error text and recovery action |
| Offline | muted graphite | broken path and Retry/Open Chat action |

Colour contrast must meet the existing EONAPP accessibility standard. No information may depend on glow alone.

## 4. EON Pulse layouts

### Desktop Pulse

Recommended resting size: approximately 56–72 CSS pixels, depending on route density.

Placement priorities:

1. Chat composer/header integration;
2. bottom-right only when it does not cover existing help, cookie, install or accessibility controls;
3. route-specific anchored placement in Forge or Projects.

Compact content:

- orb;
- one status dot/ring;
- optional approval/result badge;
- tooltip and accessible label.

Open state adds a small radial or card menu:

- Open EONBOT;
- Speak;
- Active task;
- Review approval;
- Open result;
- Expand Nexus.

### Mobile Pulse

Recommended resting size: 48–60 CSS pixels.

- positioned above bottom navigation/composer safe areas;
- never covers send, microphone, keyboard dismissal or browser controls;
- draggable only within a bounded safe region if repositioning is implemented;
- one-tap opens a bottom sheet rather than a tiny radial menu.

Mobile bottom sheet:

```text
[Orb] EONBOT · Working
Inspecting files

[Open chat] [Hold to speak]
[View active task]
[Review approval — 1]
[Expand Nexus]
```

## 5. Live Nexus desktop layout

### Standard full-screen composition

```text
┌─────────────────────────────────────────────────────────────────────┐
│ EON NEXUS       Current Project       Local AI       Minimize  Close│
├────────────────────────────────────┬────────────────────────────────┤
│                                    │ Conversation / Task / Results  │
│          [ Research ]              │                                │
│               ╲                    │ Inspecting project files        │
│ [ Files ] ── [ EONBOT ] ── [Forge]│ • Read project context          │
│               ╱                    │ • 3 files available             │
│        [ Validation ]              │ • Approval not required         │
│                                    │                                │
│        visual command field        │ [Stop] [Open files] [Chat]      │
├────────────────────────────────────┴────────────────────────────────┤
│ Conversation   Agents   Results   Project Atlas                     │
└─────────────────────────────────────────────────────────────────────┘
```

The visual field should use roughly 55–65% of the width. The readable panel uses the remaining width and remains independently scrollable.

### Split mode

```text
┌──────────────────────────┬──────────────────────────┐
│ Standard EONBOT Chat     │ Compact Live Nexus       │
│ transcript + composer    │ orb + five nodes + stage │
└──────────────────────────┴──────────────────────────┘
```

Split mode is the strongest daily-work layout because it retains familiar Chat while adding visual state.

### Node rules

- maximum five primary visible nodes in the first implementation;
- additional active categories collapse into `+3 more` and the accessible list;
- node size represents importance or focus, never fabricated workload percentage;
- selected node opens its readable card in the side panel;
- node positions remain stable during one task to avoid cognitive noise.

## 6. Live Nexus mobile layout

The visual field occupies the upper 42–52% of the screen. A draggable sheet contains readable content.

```text
┌───────────────────────┐
│       EON NEXUS       │
│      [small nodes]    │
│       [ EONBOT ]      │
│  Inspecting files     │
├───────────────────────┤
│ ━ draggable handle    │
│ Conversation          │
│ Agents  Results       │
│                       │
│ readable cards        │
│                       │
│ [Speak] [Stop] [Chat] │
└───────────────────────┘
```

Gestures:

- drag visual field to rotate;
- pinch to expand/minimize;
- long press orb to speak;
- swipe tabs to conversation/agents/results;
- swipe down from top or use Close button to leave.

Every gesture has a button in the sheet or header.

## 7. Project Atlas layout

Atlas is a structured project map, not an infinite universe.

### Primary rings

1. central selected project;
2. current tasks/milestones;
3. related conversations and outputs;
4. previous completed activity.

Blocked and incomplete work is placed in a clearly labelled `Needs attention` sector rather than hidden behind decorative distance.

Readable project panel:

- project status;
- task counts;
- latest milestone;
- files/outputs count;
- waiting approvals;
- next recommended action;
- Continue Project button.

The recommendation must state why it is suggested, for example:

> Next: review the Forge preview because generation completed and deployment has not been approved.

## 8. Forge visualization

Forge should use a mostly linear or gently curved workflow rather than a random galaxy:

```text
Request → Plan → Files → Generate → Validate → Preview → Approval
```

State treatment:

- completed stages remain stable gold/neutral;
- current stage receives active motion;
- future stages remain dim and explicitly `Not started`;
- approval stage turns orange and stops active generation motion;
- deployment never appears complete without the existing verified deployment receipt.

The centre orb can remain visible as coordinator, but the workflow path is the primary information structure.

## 9. Automations visualization

Automations should use a circular timeline:

- centre: selected automation;
- near-future arc: upcoming scheduled runs;
- past arc: successful/failed/cancelled receipts;
- condition-watch state: stationary waiting marker;
- approval-required state: orange gate before the next run;
- no spinning sphere implying constant execution while an automation is merely scheduled or waiting.

## 10. Vault variation

Vault uses a restrained secure Nexus status:

- static or low-motion dark core;
- lock/shield geometry;
- backup status;
- provider-key verification count;
- pending explicit approval;
- no file graph, secret labels, orbiting credentials or playful loot-box treatment.

Vault details open in the native Vault surface.

## 11. EONCITY Nexus hologram

### Shared visual identity

The City hologram uses the same state colours, ring meanings and labels as standard EONAPP. It can add spatial depth, volumetric light and world interaction, but it may not change what a state means.

### Placement 1 — Creator Command Seat

Primary personal work Nexus.

- hovers 0.7–1.1 metres above the console;
- opens current project and recent conversation;
- seated interaction can use a larger semi-circular panel;
- standing proximity shows only compact project/task status.

### Placement 2 — EONBOT terminal

General-purpose Chat continuation.

- orb rests inside or above a terminal cradle;
- approach shows `Continue EONBOT`;
- interaction opens the same active thread;
- leaving range minimizes without ending the conversation.

### Placement 3 — Forge Bay

Workflow-specific Nexus.

- central orb above Forge control table;
- stage path extends toward physical Forge consoles;
- the currently relevant console receives a subtle guidance beam;
- pending approval remains at the main control table and cannot be approved accidentally by proximity.

### Placement 4 — Project workstation

Atlas entry point.

- compact project orb plus task rings;
- interaction opens the selected project Atlas;
- project title remains hidden until deliberate focus when privacy mode is enabled.

### Placement 5 — Command District

Public/system status only.

- shows EONBOT availability, local/connected route category and current user-visible task status;
- no private conversation/project detail in an exposed district location;
- deeper information requires interaction and the authenticated personal panel.

### Personal floating companion

Deferred until station integration passes.

When added:

- small and quiet;
- follows only inside approved zones;
- sleeps during gameplay/capture when requested;
- never blocks the camera or HUD;
- does not create a second Chat state;
- can guide the player to the station associated with the current real task.

## 12. Motion timings

These are starting targets, subject to device testing:

- idle breathing cycle: 4–7 seconds;
- listening ripple: 0.8–1.4 seconds;
- processing rotation: 3–6 seconds per revolution;
- completion pulse: one 0.8–1.2 second event;
- node focus transition: 180–300 milliseconds;
- expand/minimize: 250–450 milliseconds;
- error transition: immediate geometry change, no shaking loop;
- approval state: stationary ring with subtle 3–5 second luminance breathing.

Reduced-motion mode removes rotation, travelling particles, parallax and continuous pulses while preserving labels, geometry and status changes.

## 13. Typography and labels

- use the existing EONAPP type system;
- short stage labels, ideally under 32 characters;
- detailed explanation belongs in readable cards;
- avoid all-caps paragraphs;
- use real verbs: Reading, Inspecting, Preparing, Waiting, Validating, Complete;
- use `Not started`, `Selected`, `Working`, `Waiting`, `Complete`, `Failed`, `Blocked` consistently.

## 14. Quality-mode differences

### Full

- procedural depth and internal lattice;
- smooth paths and bounded particles;
- richer glow and spatial response;
- maximum 60 FPS subject to governor.

### Balanced

- simplified core depth;
- fewer particles;
- 30 FPS target;
- default for most devices.

### Low power

- radial gradient/core sprite or simple Canvas;
- no free particles;
- paths update only on state change;
- 15–20 FPS maximum while visibly active.

### Static / reduced motion

- semantic SVG/DOM representation;
- no continuous animation;
- status changes use text, icons and discrete geometry;
- fully functional controls and accessible list.

## 15. Visual acceptance checklist

A design implementation is accepted only when:

- the orb can be understood without colour;
- the current stage is readable without opening a node;
- approval visibly stops active processing motion;
- selected and active tools look different;
- complete uses one confirmation pulse rather than endless celebration;
- local/private shield is shown only for proven local routing;
- mobile controls do not cover Chat or navigation;
- five-node cap and accessible overflow list work;
- reduced-motion mode preserves all information;
- EONCITY station states match standard-app states;
- normal Chat remains one action away.

## 16. Final visual direction

The correct target is not “the busiest possible Jarvis screen.” It is a calm premium instrument:

- quiet when idle;
- expressive when listening;
- legible while working;
- still when waiting for the user;
- confident when complete;
- transparent when blocked or offline.

EON NEXUS should look alive because the product is doing something real, not because the renderer never stops moving.
