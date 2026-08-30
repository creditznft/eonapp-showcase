# W660A1 — EON NEXUS Observable-State Source Inventory

**Date:** 2026-07-19
**Branch:** `chatgpt/w660-eon-nexus-plan`
**Verified base:** W659N commit `5a12c38a184d286774335550d034f549092f311e`
**Status:** Source audit complete. This document does not claim that EON Pulse, Live Nexus, Atlas or the City hologram are implemented.

## 1. Audit conclusion

EONAPP already contains most of the truthful state required for EON NEXUS:

- active Chat thread and bounded messages;
- EONBOT ready/thinking/listening/speaking/error state;
- provider, model-readiness and local/hosted/guide route truth;
- foreground task graphs and safe node roles;
- review-needed, completed, failed, paused and cancelled task states;
- sanitized approval proposals and local review inbox items;
- active-project context, project tasks, artefacts, versions and outcomes;
- Forge and automation lifecycle vocabularies;
- EONCITY agent-presence and task-mirror records;
- live voice controller callbacks and capability truth.

The missing layer is not another runtime. It is one **privacy-projected observable-state contract** that subscribes to the existing sources, derives a stable snapshot and feeds every renderer.

No existing module should be replaced merely to create an orb. W660A2 should add adapters and narrowly scoped safe events around existing truth.

## 2. Source inventory matrix

| Domain | Current source | Existing truthful fields / lifecycle | Existing notification | Privacy readiness | W660 adapter decision |
|---|---|---|---|---|---|
| Active conversation | `assets/js/utils/chat-threads.js` | active thread ID, title, timestamps, bounded messages, provider/model/local metadata per reply | none | raw message content is session-only; title may be private | Read ID, message count, updated time and a redacted label. Add a safe `eon:chat-thread-state-changed` event at create/select/update/rename/delete boundaries. Render content only after explicit user open. |
| Chat live state | `assets/js/chat-page.js` | `pending`, local detection, active thread, conversation, emotion, voice flags, provider settings | temporary `window.EONBOTEmotion` diagnostics; direct DOM mutation | diagnostic state excludes keys, but detail text requires projection | Replace renderer dependence on diagnostics with a small Chat adapter that emits normalized state after existing transitions. Keep diagnostics for debugging only. |
| EONBOT expression | `assets/js/chat-page.js` | ready, thinking, listening, speaking, scanning, connected, reply-ready, careful, error, guide-ready | none beyond diagnostic getter | safe when detail is bounded | Map to normalized `ready`, `listening`, `processing`, `speaking`, `waiting`, `complete`, `error`, `offline`. Do not expose arbitrary reply text as status. |
| Provider / route | `assets/js/utils/ai-readiness.js`, `assets/js/chat/ai-runtime.js` | readiness, state, provider ID/label, verified model, runtime type local/hosted/guide, mode, verification reason | no single state event on settings/readiness change | display-safe readiness exists; API keys and endpoints must remain excluded | Use `getAIReadiness()` as authoritative display projection. Add a safe settings/readiness change event. Nexus receives provider label and route class only, never credentials or endpoint. |
| Browser voice capability | `assets/js/chat/eonbot-voice-capability-gateway.js` | blocked, dictation-ready, voice-ready, active AI route, browser-assisted privacy truth | computed on demand | already display-safe | Read as capability metadata. It must not imply microphone activity. |
| Live Voice runtime | `assets/js/chat/eon-live-voice-realtime.js` | idle, blocked, unavailable, requesting-microphone, connecting, live, error; active flag | explicit `onState` callback | no persisted audio; transcript is memory-only | Wrap `onState` in the Nexus event adapter. Map requesting/connecting/live/error truthfully. Do not treat capability-ready as active. |
| Foreground task | `assets/js/ai-kernel/eon-ai-kernel-bridge.js` | running, review-needed, completed, failed; task ID, safe title, project ID, role, privacy class, workflow state | session record write and City mirror, no general event | redacted by design; no raw prompt/output | Primary initial task source. Add event after successful upsert rather than polling sessionStorage. |
| Task vocabulary | `assets/js/ai-kernel/eon-task-contract.js` | draft, ready, running, review-needed, completed, paused, failed, cancelled; roles and bounded nodes | contract only | excellent; no raw prompt, key or execution method | Reuse vocabulary as the canonical Nexus task/node vocabulary. Do not invent a second status list. |
| Foreground task session | `assets/js/ai-kernel/eon-ai-kernel-session-store.js` | redacted task records, artefact IDs, review ID/status/expiry | none | session-only and redacted | Emit `eon:kernel-foreground-state-changed` after successful upsert. Snapshot adapter may read latest record on initialization/recovery. |
| Guarded action proposals | `assets/js/chat/eonbot-action-proposals.js` | reviewing, approved, cancelled, expired, failed; safe route/action label | none | safe finite metadata; no chat text, credentials or external effect | Strong source for orange approval ring and Review action. Add event after create/update. Keep approval execution outside renderer. |
| Local action cards | `assets/js/chat/eonbot-action-cards.js` | awaiting-review, reviewed, dismissed, expired; blocked/provider/connection/review kinds | none | safe labels only; explicitly non-executable | Use for review counts and blocked/connection-required nodes. Distinguish from executable proposals. Add safe inbox-change event. |
| Merged review inbox | `assets/js/ai-kernel/eon-ai-kernel-review-inbox.js` | merged kernel and local-card review items | none; derived on read | safe summary, no external approval | Use as initial approval-count projection. Renderer opens native Workspace/Chat review route. |
| Active project | `assets/js/shell/eon-whole-app-ux.js` | project ID/title/outcome/continue route; local-only | `eon:active-project-context-changed` | secret-like content rejected; title/outcome can still be private | Use project ID internally. Default display is `Active project`; reveal title only in an explicitly opened project context. Existing event is reusable. |
| Project and Library data | `assets/js/utils/eon-workspace-store.js` | projects, statuses, tasks, artefacts, automation IDs, Library items and use count | `eon:workspace-state-changed`, `eon:project-saved` | secrets rejected, but ordinary work remains private | Atlas adapter reads counts and selected-project records. Default projection exposes counts/categories; explicit Atlas open may show project-approved labels. |
| Project continuity | `assets/js/workspace/eon-project-operating-system.js` | versions, outcomes, continue route, Forge states, automation states/history | `eon:w631-state-changed` | credentials rejected; receipts bounded | Use for Atlas milestones, Forge stages and automation history. Do not infer deployment from `deploy-prepared`; require verified `deployed` receipt. |
| Automation OS | `assets/js/utils/automation-os-store.js` | workflows, schedules, approvals, audit, connection status, next run, run modes | `eon:automation-state-changed` | secret fields stripped; account hints may be sensitive | Timeline adapter uses status/count/time only by default. Never expose account hint, credential reference or config in Nexus labels. |
| City task mirror | `assets/js/ai-kernel/eon-city-event-bridge.js` | maps task states to City presence ready/active/waiting/complete/failed | delegates to agent-presence event | explicitly excludes prompts, output, model and credentials | Reuse for initial City hologram continuity. Do not let City approve or execute. |
| City agent presence | `assets/js/operator/agent-presence.js` | source, work reference, role, action, status, phase, bounded provider identity/category | `eon:agent-presence` | designed for truthful sanitized City cues | Strong source for Live Nexus nodes and City paths. Respect max visible count and preference detail level. Selected/available agents still require a separate capability list; presence means recorded lifecycle only. |

## 3. Existing event sources that can be reused

- `eon:active-project-context-changed`
- `eon:workspace-state-changed`
- `eon:project-saved`
- `eon:w631-state-changed`
- `eon:automation-state-changed`
- `eon:agent-presence`
- Live Voice `onState` callback

These events are useful but not sufficient. They use different payload shapes and some only indicate that storage changed. W660A2 should normalize them instead of teaching renderers about every storage schema.

## 4. Narrow safe events to add

The following events are justified because their current modules otherwise require polling or private implementation access:

- `eon:chat-thread-state-changed`
  - detail: thread ID, message count, updatedAt, operation;
  - no message body or raw generated title.

- `eon:eonbot-live-state-changed`
  - detail: ready/listening/processing/speaking/error state, timestamp;
  - no prompt, reply or credentials.

- `eon:ai-route-state-changed`
  - detail: route class, bounded provider ID/label, readiness state;
  - no key, endpoint or account.

- `eon:kernel-foreground-state-changed`
  - detail: redacted session record already accepted by the kernel store.

- `eon:review-inbox-state-changed`
  - detail: pending count, source kind and updatedAt;
  - no raw review content.

These should be emitted only after a successful underlying state change. They do not create a new source of truth.

## 5. Proposed normalized snapshot for W660A2

```js
{
  schema: 'eon.nexus.observable-state.v1',
  revision: 1,
  conversation: {
    id: '',
    label: 'Private conversation',
    messageCount: 0,
    updatedAt: '',
    openRoute: '/chat'
  },
  project: {
    id: '',
    label: 'Active project',
    selected: false,
    status: 'none',
    taskCount: 0,
    artefactCount: 0,
    openRoute: '/projects'
  },
  eonbot: {
    state: 'ready',
    detailCode: 'ready',
    canListen: false,
    isListening: false,
    isSpeaking: false
  },
  task: {
    id: '',
    label: 'No active task',
    state: 'ready',
    stage: 'idle',
    cancellable: false,
    foregroundOnly: true
  },
  route: {
    mode: 'guide',
    providerId: 'guide',
    providerLabel: 'Guide mode',
    privateOnDevice: false,
    verified: false
  },
  approval: {
    pending: false,
    count: 0,
    label: 'No approval waiting',
    reviewRoute: '/workspace'
  },
  nodes: [],
  results: {
    count: 0,
    unread: 0,
    label: 'No new results'
  },
  connection: {
    state: 'available',
    retryable: false,
    label: 'Ready'
  },
  quality: {
    mode: 'balanced',
    reducedMotion: false,
    renderActive: false
  },
  updatedAt: ''
}
```

The exact field names can change during W660A2, but the constraints are locked:

- immutable snapshot;
- bounded lists and labels;
- no key, endpoint, raw prompt, raw reply, account hint or private filename;
- renderer-agnostic;
- deterministic derivation;
- conventional routes included for every actionable visual state.

## 6. State mapping decisions

### EONBOT

| Existing truth | Nexus state |
|---|---|
| ready / guide-ready / connected but idle | `ready` |
| voice microphone genuinely active | `listening` |
| Chat pending or kernel running | `processing` |
| speech synthesis or Live Voice output active | `speaking` |
| task or proposal review-needed | `waiting-approval` |
| completed task with unread result | `complete` |
| failed task, voice error or disconnected route | `error` |

Provider readiness alone must not animate as active processing.

### Nodes / agents

- `available`: capability exists, no active presence record;
- `selected`: user included it in the current plan, no active record;
- `active`: a matching task node/presence is running;
- `waiting`: review or dependency is blocking progress;
- `complete`: recorded completion;
- `failed`: recorded failure;
- `blocked`: capability or policy explicitly prevents start.

Only `active` may receive an active flowing path.

### Local/private route

The shielded core appears only when the current task route is proven `device-local` or a verified local provider is selected for that task. Browser speech must remain separately labelled because browser recognition is not proof of offline local speech.

## 7. Gaps that W660 must not hide

1. Chat thread writes currently emit no safe change event.
2. Chat live/emotion state is page-local and directly tied to DOM updates.
3. Kernel session writes emit no general event.
4. Proposal/action-card stores emit no review-inbox change event.
5. There is no current unified unread-result counter.
6. Available/selected tools are not the same thing as active agent presence.
7. Project page `selectedProjectId` is UI-local; cross-route selection must use the existing active-project context.
8. Several automation records can describe drafts/simulations; they must not be visualized as live execution.
9. EONCITY has a truthful presence bridge, but no holographic renderer or shared Nexus snapshot yet.
10. No performance measurements exist for a Pulse renderer because no renderer has been implemented.

These are implementation tasks, not reasons to invent status.

## 8. W660A2 implementation boundary

Create only:

- `assets/js/nexus/eon-nexus-state-contract.js`
- `assets/js/nexus/eon-nexus-event-adapter.js`
- `assets/js/nexus/eon-nexus-privacy-projection.js`
- `assets/js/nexus/eon-nexus-capability.js`
- focused unit tests and one contract gate.

Do not create Pulse CSS, Canvas, WebGL, shader, gesture or EONCITY hologram files in W660A2.

The first adapter should connect one genuine Chat conversation, AI readiness, foreground kernel task, review count and active-project context. Forge, Automations, Atlas and City adapters remain later slices.

## 9. W660A1 acceptance result

- Existing state sources were identified across Chat, AI route, voice, task, review, project, Forge, Automation and City domains.
- Safe reusable events were separated from missing events.
- Privacy suitability and required projection were recorded per source.
- A bounded normalized snapshot was proposed.
- No animation or new operational claim was added.
- The architecture remains one EONBOT/task/project truth with multiple renderers.

**W660A1 status: source audit complete. W660A2 observable-state contract is the next coding slice.**
