# EONAPP W625D–W625H Local Video Source Completion

Date: 2026-07-11  
Base authority: `EONAPP_W625C_FULL_SOURCE_SNAPSHOT_2026-07-11.zip`  
Base archive SHA-256: `9b27b94b3737bf9a27d880bcb2ccbc00e2c476389787a5ad958a460929125d09`

## Frozen verdict

This batch completes the source tooling for local-video capability, reviewed workflow execution, efficiency controls and evidence-gated certification. It does **not** certify that a real local video works on the owner machine or any reference machine.

The honest state is:

```text
W625D source-complete-real-device-evidence-pending
W625E source-tooling-ready-real-reference-video-proof-pending
W625F source-complete-real-workflow-compatibility-pending
W625G source-complete-real-device-calibration-pending
W625H tooling-complete-real-certification-pending
```

## W625D — capability detection

- Scans approved ComfyUI loopback endpoints only after explicit user action.
- Uses measured runtime/device facts and owner-entered RAM/storage/power/thermal confirmations.
- Keeps the reviewed native video reference floor at 8 GiB usable VRAM, 16 GiB RAM minimum, 32 GiB RAM recommended and 35 GiB free storage.
- Returns `supported`, `experimental` or `unsupported` with visible blockers and warnings.
- Keeps the owner approximately 4 GB RTX 3050 lane blocked before queue submission.
- Offers Guide, future Direct BYOK and supported-device alternatives without installing or allocating anything.
- Emits only redacted capability evidence.

## W625E — real-video proof tooling

- Uploads one validated PNG/JPEG/WebP first frame only to the selected approved loopback runtime.
- Submits one reviewed job through `/prompt`.
- Polls real `/history/{prompt_id}` state with bounded timeout.
- Exposes queued/running cancellation through the existing reviewed local queue/interrupt path.
- Fetches completed media through the approved local `/view` endpoint.
- Requires EONAPP preview, playback, save, owner-selected reopen and generated/reopened SHA-256 equality.
- Produces a redacted receipt that cannot pass from source integration alone.
- Requires all eleven failure/recovery lanes before `realVideoProofPass` can become true.

No real prompt ID, generated media, output digest or recovery-lane evidence was produced in the managed environment.

## W625F — reviewed product workflow

- Accepts bounded ComfyUI API-format JSON only.
- Rejects oversized graphs, forbidden network/execution nodes, unapproved classes, custom-node hints and missing required roles.
- Requires exact SHA-256 confirmation for the reviewed graph in the active session.
- Patches only the reviewed input image, prompt, seed, dimensions, frame count and FPS slots.
- Keeps the first proof to image-to-video, batch one, queue one, no audio, no interpolation and no upscaling.
- Does not install models, workflows, custom nodes or runtimes.

## W625G — efficiency governor

- Conservative default: 512×288, 33 frames, 16 fps, batch one and queue one.
- Clamps resolution, frame count, FPS and step count to reviewed limits.
- Shows directional workload and storage estimates, not guaranteed latency, VRAM or output size.
- Blocks low-storage submissions.
- Warns about missing AC power, battery state and thermal monitoring.
- Proposes cleanup but never deletes automatically and never includes owner-saved media in temporary cleanup.

## W625H — certification tooling

- Requires a passing real W625A image receipt.
- Requires a passing real W625E video receipt and every mandatory video recovery lane.
- Requires supported reference-device evidence and the owner 4 GB fallback evidence.
- Requires fixed benchmark rows for quality, latency, memory, failure recovery, privacy, output integrity and update compatibility.
- Defaults every benchmark to pending.
- Can certify only the specifically proven supported profiles.
- Source integration alone always returns no-go.

## Focused source validation

- W625D gate: 8/8; focused unit assertions: 8/8.
- W625E gate: 10/10; focused unit assertions: 8/8.
- W625F gate: 8/8; focused unit assertions: 6/6.
- W625G gate: 8/8; focused unit assertions: 6/6.
- W625H gate: 9/9; focused unit assertions: 5/5.
- Zero-warning ESLint: passed after replacing control-character regular expressions with explicit character filtering.

Final maintained-suite and permanent predeploy totals are recorded in the W625H machine receipts, not inferred here.

## Frozen boundaries

- Approved loopback hosts and ports only.
- No LAN or public ComfyUI endpoint.
- No Cloudflare generation endpoint.
- No hidden cloud fallback.
- No automatic runtime, model, workflow or custom-node installation.
- No arbitrary unreviewed workflow execution.
- No unsafe attempt on the owner approximately 4 GB device.
- No real-video or W625H certification claim without complete real evidence.
- Current mandatory tests remain certifying; superseded exact-copy assertions remain only in the explicit non-certifying archive.

## Permanent deployment verification

Use only:

```bash
npm ci
npm run verify:codex-predeploy
```

The runner remains source-fingerprinted, lock-protected and resumable. No competing deployment verification command was created.
