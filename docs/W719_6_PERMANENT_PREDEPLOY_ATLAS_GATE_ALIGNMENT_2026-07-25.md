# W719.6 — permanent predeploy Atlas gate alignment

## Exact-environment finding

The permanent W624D predeploy advanced through the W719.5 HUD alignment and stopped in the historical W660D Project Atlas source gate.

Two source snapshots were obsolete:

- the accessibility check expected the original one-line Atlas-open branch, while the maintained Live Nexus now opens Atlas inside an explicit reviewed block and emits the `atlas-reviewed` signature-flow event;
- the automatic-effects check treated a read-only `navigator.mediaDevices.getUserMedia` capability reference as though the camera had been invoked.

The maintained runtime still opens and closes Atlas only through explicit controls, restores focus on close, and does not call camera, microphone, AI, approval or network execution from the Atlas projection.

## Repair

Only the historical W660D source gate is aligned:

- it recognises the maintained explicit reviewed Atlas-open block;
- it rejects an actual `getUserMedia(...)` invocation while allowing capability detection.

No runtime source, dependency, package lock, privacy projection, camera behavior, automatic action policy or production surface changed.
