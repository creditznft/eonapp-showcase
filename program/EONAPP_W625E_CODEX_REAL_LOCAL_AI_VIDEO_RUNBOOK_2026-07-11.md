# EONAPP W625E — Codex Real Local AI Video Proof Runbook

**Mission:** prove or disprove one real local AI video workflow end to end through EONAPP.  
**Mandatory first workflow:** image-to-video using ComfyUI's native Wan2.2 TI2V 5B workflow on a supported reference machine.  
**Owner laptop rule:** the approximately 4 GB RTX 3050 machine must prove a correct safe fallback. It must not be forced through an unsafe or misleading video run.  
**Release rule:** do not describe local video as working until a real video is submitted, completed, previewed, saved, reopened, inspected and recovered from failure through EONAPP.

## 1. Frozen architecture boundary

The proof must preserve all current EONAPP decisions:

- execution happens on the user's device;
- EONAPP Cloudflare Functions do not receive video prompts, reference images, model names, job payloads, outputs or provider credentials;
- no silent cloud fallback;
- no automatic model download;
- no permanent provider key in ordinary browser storage;
- no arbitrary LAN host, arbitrary port or public Comfy endpoint;
- one job at a time by default;
- cancellation, timeout and cleanup are visible user actions;
- source integration, mocks, screenshots of Comfy alone, or a file created outside EONAPP do not pass.

## 2. Required source checkpoint

Use the exact W625D/E source checkpoint that contains:

1. local video capability detection;
2. a versioned allowlisted Comfy video workflow registry;
3. EONAPP submit, status, cancel, history, preview, save and reopen handling;
4. a device governor that can return `supported`, `experimental` or `unsupported`;
5. provenance recording without raw private prompts;
6. explicit image-to-video mode;
7. no Cloudflare generation endpoint.

Before real-device work:

```powershell
npm ci
npm run qa:w623c-commercial-truth
npm run qa:w623d-production-reachability
npm run qa:w623e-information-architecture
npm run qa:w625d-local-video-capability
npm run qa:w625e-real-local-video-contract
npm run lint -- --max-warnings=0
npm run build
```

Do not substitute a giant archived historical suite for the maintained current gates. Record any unrelated historical failure honestly.

## 3. Reference hardware lane

The mandatory real-generation lane requires a supported reference machine. Minimum proof target:

- Windows 11 or supported Linux;
- NVIDIA GPU with at least 8 GB usable VRAM for the selected ComfyUI native Wan2.2 TI2V 5B workflow;
- at least 32 GB system RAM recommended for offload headroom;
- at least 35 GB free storage before model installation and output capture;
- current supported NVIDIA driver;
- current ComfyUI/Desktop stable build containing the native workflow template;
- AC power connected and battery-saving mode off;
- thermal monitoring available.

If capability detection reports less than the workflow's reviewed minimum, EONAPP must block generation and offer Direct BYOK or Guide mode. Do not lower the threshold merely to obtain a pass.

## 4. Owner RTX 3050 4 GB fallback lane

On the owner's approximately 4 GB RTX 3050 laptop:

1. Open `/local-ai?creator=video`.
2. Run device capability detection.
3. Confirm the UI reports local video as unsupported or experimental according to measured free VRAM, RAM and storage.
4. Confirm the Generate button remains disabled for the reviewed Wan2.2 TI2V 5B workflow.
5. Confirm the user sees a plain-language reason.
6. Confirm safe alternatives are shown:
   - prepare an image-to-video storyboard in Guide mode;
   - use a future direct user-owned BYOK video provider;
   - move the local job to a supported device.
7. Confirm no model download, allocation attempt, browser crash, Comfy queue submission or hidden cloud request occurs.

This fallback lane is mandatory even when the reference machine passes.

## 5. Start ComfyUI on an approved loopback endpoint

Start the installed official ComfyUI/Desktop application and wait for its backend.

Approved endpoints, in order:

- `http://127.0.0.1:8188`
- `http://127.0.0.1:8189`
- `http://127.0.0.1:8000`

PowerShell probe:

```powershell
$ports = 8188, 8189, 8000
foreach ($port in $ports) {
  try {
    $stats = Invoke-RestMethod -TimeoutSec 10 -Uri "http://127.0.0.1:$port/system_stats"
    Write-Host "PASS $port"
    $stats | ConvertTo-Json -Depth 8
  } catch {
    Write-Host "NO RESPONSE $port - $($_.Exception.Message)"
  }
}
```

At least one approved endpoint must return real `/system_stats` JSON. EONAPP must not scan the LAN.

## 6. Explicit local origin and CORS

Run EONAPP locally:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

`http://127.0.0.1:5173/local-ai?creator=video`

Configure ComfyUI to permit exactly that origin using its supported CORS option. Do not use wildcard CORS for certification unless the stable Desktop build offers no narrower option; if wildcard is unavoidable, record it as a security blocker and do not issue a final pass.

Verify:

```powershell
$headers = @{ Origin = "http://127.0.0.1:5173" }
Invoke-WebRequest -Method Get -Headers $headers -Uri "http://127.0.0.1:8188/system_stats" | Select-Object StatusCode, Headers
```

The successful lane must contain no CORS, mixed-content or private-network failure.

## 7. Install one reviewed native video workflow

Use the current ComfyUI native **Wan2.2 TI2V 5B** template from the built-in Video workflow browser. Do not begin with custom nodes.

Record:

- ComfyUI build/version;
- exact workflow template version or digest;
- exact model file names and SHA-256 digests in the private evidence log;
- model license/source review;
- expected VRAM/RAM/storage class;
- whether the workflow supports image-to-video and text-to-video;
- all output nodes and media container settings.

EONAPP must import only a reviewed, versioned allowlisted workflow contract. It must not execute an arbitrary user-supplied graph during this proof.

## 8. Conservative mandatory image-to-video settings

Use one harmless local first-frame PNG that contains no private person, copyrighted logo, credential, address or sensitive information.

Initial target:

- mode: image-to-video;
- width: 512;
- height: 288;
- frame count: 33;
- frame rate: 16 fps;
- target duration: approximately 2 seconds;
- batch: 1;
- queue concurrency: 1;
- seed: fixed and recorded;
- motion strength: low or medium reviewed default;
- output: MP4 where the native workflow supports it, otherwise WebM;
- no audio for the first proof;
- no upscaler, interpolation, ControlNet, LoRA or custom node.

Suggested harmless motion brief:

`A calm futuristic command plaza at sunrise. Slow camera push forward, soft moving fog, subtle lights, stable architecture, no text, no people, no sudden cuts.`

Raw prompt text may remain in the active local job memory while required for execution, but it must not enter redacted receipts, logs, analytics, Cloudflare requests or unrelated persistent storage.

## 9. Mandatory end-to-end happy path

From EONAPP:

1. Open Local Video Lab.
2. Confirm the approved responding loopback endpoint.
3. Run capability detection.
4. Confirm the reference machine is `supported` for the selected workflow.
5. Confirm the reviewed workflow and required models are discovered from ComfyUI.
6. Select **Image to video**.
7. Choose the local first-frame PNG.
8. Review dimensions, frame count, FPS, estimated storage and workload.
9. Submit once.
10. Observe one real POST to `/prompt`.
11. Record one real prompt/job ID.
12. Observe bounded status polling or a reviewed local event channel.
13. Confirm progress changes from preparing to queued/running/completed using real Comfy state.
14. Confirm Cancel remains available while the job is cancellable.
15. Observe completed history from `/history/{prompt_id}`.
16. Fetch the actual generated media through the approved Comfy output endpoint.
17. Render the video in EONAPP's `<video>` preview.
18. Play, pause, seek and replay it.
19. Save the file through EONAPP.
20. Confirm the saved file is non-empty.
21. Reopen the saved file from EONAPP's local result/history surface.
22. Confirm width, height, duration, frame rate/container where available.
23. Confirm the provenance summary identifies local runtime, workflow version/digest, dimensions, frames, FPS, seed and timestamps without exposing the raw prompt.
24. Confirm zero Cloudflare AI-generation requests and zero provider keys.

## 10. Optional second lane: text-to-video

After the image-to-video lane passes, run one short text-to-video job using the same reviewed workflow and conservative limits.

This lane is useful but does not replace the mandatory image-to-video proof. Record it separately because input validation and first-frame handling differ.

## 11. Output inspection

Minimum acceptance:

- positive file size;
- video metadata loads in EONAPP;
- duration is greater than zero;
- dimensions match the reviewed output or documented model rounding;
- browser can play the file from start to finish;
- no corrupted frames that prevent playback;
- saved file reopens after page refresh;
- output does not disappear merely because a temporary object URL was revoked;
- local history distinguishes temporary preview from durable saved media.

Optional `ffprobe` inspection when installed:

```powershell
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -of json "C:\path\to\saved-video.mp4"
```

If `ffprobe` is unavailable, use browser video metadata plus Windows file properties and record that limitation.

## 12. Mandatory failure and recovery lanes

### A. Runtime stopped

- Stop ComfyUI.
- Scan and submit must fail clearly.
- No false-ready state and no cloud fallback.
- Restart ComfyUI and prove recovery.

### B. Unsupported 4 GB device

- Run the owner-laptop fallback lane.
- Submission must remain blocked before model allocation.
- Guide/Direct BYOK alternatives must remain usable.

### C. Missing model or workflow

- Temporarily remove or deactivate one required model/workflow from the test profile.
- Capability discovery must name the missing requirement without a crash.
- Generate remains disabled.
- Restore it and prove recovery.

### D. Invalid input image

Try an unsupported type, empty file and oversize image.

- Reject before submission.
- Do not upload or queue the bad file.
- Show accepted types and size limits.

### E. Unapproved endpoint

Try LAN, public and unapproved-port endpoints.

- Reject before a network request.

### F. CORS/private-network denial

Remove the explicit origin allowance temporarily.

- Scan fails clearly.
- No stale ready state remains.
- Restore the allowance and prove recovery.

### G. Cancel while queued or running

- Submit one controlled job.
- Cancel once through EONAPP.
- Confirm the Comfy queue/job receives the cancellation where supported.
- UI reaches `cancelled`, not `complete`.
- Partial output is not presented as a finished result.
- A fresh retry works.

### H. Timeout or Comfy crash

- Stop Comfy after submission or use a controlled timeout.
- Polling ends within the configured bound.
- Busy state clears.
- Retry works after restart.

### I. Low disk space / cleanup

- Use a controlled low-space threshold or test fixture.
- EONAPP blocks or warns before submission.
- It proposes cleanup but deletes nothing without approval.
- Existing saved media is not removed by temporary-job cleanup.

### J. Refresh and resume truth

- Refresh while queued/running and after completion.
- Reattach only when the local prompt/job ID is valid and the user chooses to resume.
- Never invent progress.
- Completed saved output remains reopenable.
- An expired/missing Comfy history entry becomes an honest recoverable error.

### K. WebGL/browser media failure

- Simulate preview decode failure or unsupported container.
- Preserve the saved file and offer open/download guidance.
- Do not mark generation failed if Comfy completed and the file is valid.

## 13. Privacy and network proof

Capture a browser network summary proving:

- EONAPP local origin;
- one approved Comfy loopback origin;
- no EONAPP Cloudflare generation endpoint;
- no external model/provider request from the browser during generation;
- no analytics payload containing prompt, image bytes, model name, job ID or output path;
- no provider key.

Model files may have been installed separately by the user before the run. Record installation source and license review, but do not count that as an EONAPP runtime network request.

## 14. Evidence pack

Create a dated evidence folder containing:

1. source revision or source ZIP SHA-256;
2. command transcript for focused gates, lint and build;
3. redacted device capability report;
4. redacted `/system_stats` summary;
5. workflow version/digest and model digests;
6. first-frame input digest and dimensions;
7. screenshots of capability pass, submit, real progress, completed preview, save, reopen and metadata;
8. video file SHA-256;
9. browser console summary;
10. browser network summary;
11. every negative/recovery lane;
12. machine-readable receipt;
13. final PASS/FAIL verdict and open blockers.

Do not include credentials, cookies, Google session material, unrelated local paths, Windows username, private prompts, private media, full model inventory or private output content in a public handover.

## 15. Suggested machine-readable receipt

```json
{
  "schema": "eonapp.w625e.real-local-video-proof.v1",
  "recordedAt": "<ISO timestamp>",
  "sourceRevisionOrZipSha256": "<value>",
  "eonappOrigin": "http://127.0.0.1:5173",
  "comfyEndpoint": "http://127.0.0.1:8188",
  "referenceDevice": {
    "gpuClass": "<redacted model class>",
    "usableVramBytes": 0,
    "systemRamBytes": 0,
    "freeStorageBytes": 0,
    "capabilityVerdict": "supported"
  },
  "ownerFourGbFallback": {
    "capabilityVerdict": "unsupported-or-experimental",
    "submissionBlocked": true,
    "modelDownloadStarted": false,
    "cloudFallbackObserved": false
  },
  "workflow": {
    "family": "Wan2.2 TI2V 5B",
    "mode": "image-to-video",
    "workflowVersionOrDigest": "<value>",
    "standardCoreNodesOnly": true,
    "width": 512,
    "height": 288,
    "frames": 33,
    "fps": 16,
    "batch": 1,
    "seedRecorded": true
  },
  "job": {
    "promptSubmitted": true,
    "promptIdRecorded": true,
    "realProgressObserved": true,
    "historyCompleted": true,
    "outputFetched": true,
    "outputPreviewed": true,
    "outputSaved": true,
    "outputReopened": true
  },
  "output": {
    "container": "mp4-or-webm",
    "bytes": 0,
    "sha256": "<value>",
    "durationSeconds": 0,
    "width": 512,
    "height": 288,
    "playbackCompleted": true
  },
  "privacy": {
    "cloudGenerationRequestsObserved": 0,
    "providerKeysUsed": false,
    "rawPromptInRedactedEvidence": false,
    "referenceImageUploadedExternally": false
  },
  "negativeLanes": {
    "runtimeStoppedAndRecovered": "pass",
    "fourGbFallback": "pass",
    "missingModelAndRecovered": "pass",
    "invalidInputRejected": "pass",
    "unapprovedEndpointRejected": "pass",
    "corsDeniedAndRecovered": "pass",
    "cancelledAndRetried": "pass",
    "timeoutOrCrashRecovered": "pass",
    "lowDiskProtected": "pass",
    "refreshResumeTruth": "pass",
    "previewDecodeRecovery": "pass"
  },
  "verdict": "pass-or-fail",
  "openBlockers": []
}
```

Replace all zero placeholders with observed positive values where applicable.

## 16. Pass gate

W625E is **PASS** only when:

- the source gates remain green;
- the owner 4 GB laptop proves the safe fallback;
- a supported reference device is detected honestly;
- the reviewed native workflow and models are discovered;
- one real image-to-video job is submitted through EONAPP;
- real queued/running/completed state is observed;
- one real video is fetched, previewed, saved and reopened through EONAPP;
- output metadata and SHA-256 are recorded;
- cancellation, timeout, missing-model, invalid-input, CORS, low-space and refresh/recovery lanes pass;
- no Cloudflare generation request, provider key or silent external fallback occurs;
- evidence is complete and redacted.

Anything less remains **planned or source-integrated; real local-video proof pending**.

## Paste-ready Codex instruction

> Continue from the exact W625D/E source checkpoint and execute `program/EONAPP_W625E_CODEX_REAL_LOCAL_AI_VIDEO_RUNBOOK_2026-07-11.md` end to end. First prove the owner's approximately 4 GB RTX 3050 receives the correct safe local-video fallback with no model allocation or cloud fallback. Then use a supported reference machine and the reviewed native ComfyUI Wan2.2 TI2V 5B image-to-video workflow. Submit one conservative 512×288, 33-frame, 16 fps job through EONAPP; observe a real prompt ID and real Comfy progress/history; preview, save, reopen and inspect the actual video; run every mandatory negative and recovery lane; preserve local-only privacy; rerun focused gates, zero-warning lint and one production build; and return a redacted evidence pack, machine-readable receipt, source delta and honest PASS/FAIL verdict. Do not certify from mocks, a Comfy-only result, an external file, screenshots alone or source strings.
