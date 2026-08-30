# W767C — Expanse Proximity Interaction and Label Arbitration

## Authority

- Base commit: `c5d09d08400fc5b817d994b8c311df073998a889`
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: the existing canonical scene, mission ledger, NPC runtime and living-content runtime remain authoritative
- Deployment: none
- Production certification: not claimed

## Delivered scope

### 1. Strict world-label arbitration

The Expanse now renders no more than:

- one primary objective label, including when the objective is distant;
- two nearby interaction labels.

Targets are rejected when they are disabled, non-pickable, invisible, outside the camera, behind the camera or occluded by visible world geometry.

### 2. Authored-mesh deduplication

Imported GLB assets often contain several child meshes with the same interaction metadata. W767C derives a stable semantic identity from the action and safe IDs, so one character, terminal or objective produces one label regardless of mesh count.

### 3. Keyboard E interaction

While Expanse is active, the existing keyboard `E` action now interacts with the nearest eligible target within 5.2 horizontal metres. Transit blocks interaction until arrival. The nearest valid label receives the `[E]` prompt.

Hub station/discovery keyboard behavior remains unchanged outside Expanse.

### 4. Canonical interaction dispatch

Keyboard interaction does not emit progression events directly. The Gateway delegates to the existing owner:

- companion rescue and Return Gate → Gateway authority;
- authored campaign objectives → Signal Frontier authority;
- NPCs → NPC runtime;
- side missions, discoveries, events and productive expeditions → living-content activity runtime.

Each delegated interaction requires an explicit user action and reuses the same pointer-path handler, preserving progress gates, receipts and animation reactions.

### 5. Safe labels

NPC and activity metadata now carries only safe authored labels such as character names, mission labels and discovery labels. No private project content, prompt content, credentials or file names are projected into the world.

## Validation completed

Evidence: `W767C_FOCUSED_REGRESSION_157_PASS.log`

- Tests: 157
- Pass: 157
- Fail: 0
- Skipped: 0

Additional checks:

- syntax checks pass for all changed JavaScript modules;
- Git diff/whitespace check passes;
- one-primary/two-nearby arbitration passes;
- distant primary objective preservation passes;
- hidden and occluded target rejection passes;
- authored child-mesh deduplication passes;
- explicit-action enforcement passes across Gateway, campaign, NPC and activity runtimes;
- keyboard `E` source integration passes;
- all prior W766, W767A and W767B focused tests remain green.

## Environment limitations retained

No production build, browser render, authenticated Preview, foreground FPS proof or deployment is claimed because the locked dependency install remains unavailable in this sandbox.

## Next bounded coding wave

W767D should converge authored-asset diagnostics:

1. combine hero landmark, NPC and activity-asset states into one runtime truth report;
2. classify loaded, pending, rejected and fallback-presented records;
3. expose zone coverage and visible-presentation failures without treating a resolved promise as visual success;
4. retain exact primary/fallback paths and bounded failure reasons;
5. add a source-safe export for authenticated Preview and owner repair rounds.
