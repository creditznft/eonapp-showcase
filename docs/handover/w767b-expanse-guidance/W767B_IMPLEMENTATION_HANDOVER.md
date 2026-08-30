# W767B — Expanse HUD Isolation and EONBOT Guidance

## Authority

- Base commit: `3b548a17a0796e99bf307bdb75e274e75500ccea`
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: one Babylon engine, one scene, one player identity, one canonical EONBOT and one mission/progression authority
- Deployment: none
- Production certification: not claimed

## Delivered scope

### 1. Expanse-only presentation mode

The Command Hub UI now receives the canonical world mode. While Expanse is active it suppresses:

- Command Hub station labels;
- the Hub interaction prompt;
- Command Hub feedback chrome;
- Living Nexus, Live Monitors, City Menu and Share launchers;
- the keyboard City Menu shortcut.

Returning to the Hub restores those controls through the same world-mode transition.

### 2. Frontier HUD

The maintained Expanse overlay now exposes a compact exploration HUD with:

- current Signal Frontier zone;
- active objective;
- objective distance;
- companion state;
- explicit safe return to the Command Hub;
- mission board access.

The HUD is active only in Expanse and does not create a second application shell.

### 3. Ground-circuit GPS route

The objective marker now renders a bounded pulsing circuit path from the player toward the current target. Segment count and spacing are capped, and the destination ring, beam and directional chevron remain the landmark authority.

### 4. Explicit EONBOT Guide me behavior

The HUD provides an explicit `EONBOT, guide me` control. It cannot activate silently. When requested, the existing canonical companion moves to a bounded lead point ahead of the player along the active objective route, then stops when:

- the objective changes;
- the destination is reached;
- the guidance window expires;
- Expanse is exited;
- the user cancels guidance.

The route presentation strengthens while guide mode is active.

### 5. Deterministic guidance contracts

A dependency-free W767B guidance director now owns:

- bounded ground-route point construction;
- label-candidate arbitration primitives for the next proximity wave;
- explicit guide-request validation;
- lead-point calculation;
- expiry and arrival termination.

It does not duplicate the map, mission or progression authorities.

## Validation completed

Evidence: `W767B_FOCUSED_REGRESSION_153_PASS.log`

- Tests: 153
- Pass: 153
- Fail: 0
- Skipped: 0

Additional checks:

- syntax checks pass for every changed JavaScript module;
- Git diff/whitespace check passes with the repository CRLF policy;
- Hub UI world-mode isolation source contract passes;
- Expanse HUD and explicit guide control source contract passes;
- ground-circuit route bounds pass;
- guide activation, lead position, arrival and expiry behavior pass;
- all focused W766 and W767A regressions remain green.

## Environment limitations retained

The locked dependency tree remains unavailable because the configured package mirror does not provide `ws@7.5.11`. Therefore no production build, Babylon browser render, authenticated Preview, FPS proof or deployment is claimed.

## Next bounded coding wave

W767C should complete physical interaction clarity and accessibility:

1. expose a canonical proximity interaction candidate view from the Expanse gateway;
2. support keyboard `E` interaction for nearby Expanse objectives, NPCs and activities;
3. show at most one primary objective label and two nearby interaction labels;
4. derive labels from safe authored metadata and hide disabled, invisible or distant targets;
5. preserve pointer interaction and all existing mission receipts.
