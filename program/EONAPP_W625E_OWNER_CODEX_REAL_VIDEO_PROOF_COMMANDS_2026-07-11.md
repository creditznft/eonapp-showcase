# EONAPP W625E — Owner/Codex Real Local Video Proof Commands

Date: 2026-07-11  
Source authority: W625H handover only

## Verdict rule

W625E passes only when EONAPP itself submits a real reviewed image-to-video job to an approved loopback ComfyUI runtime, observes real queue/history state, fetches the completed media, previews and plays it, saves it, reopens the owner-selected saved file, and confirms output integrity. The complete owner 4 GB fallback and all eleven negative/recovery lanes are also mandatory.

No mock, source assertion, Comfy-only screenshot, externally generated file or manually copied output is proof.

## 1. Certify the exact source

From the extracted W625H source root, use only:

```powershell
npm ci
npm run verify:codex-predeploy
```

All ordered stages must pass against one source fingerprint in `reports/w624d-codex-predeploy/receipt.json`.

## 2. Run the read-only preflight

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\w625e-owner-video-preflight.ps1 `
  -SourceRoot "C:\path\to\EONAPP_W625H_source" `
  -EvidenceRoot "C:\path\to\w625e-evidence"
```

The preflight scans only `127.0.0.1` ports 8188, 8189 and 8000. It neither installs nor generates anything and cannot certify W625E.

## 3. Owner approximately 4 GB fallback lane

1. Start the owner-installed ComfyUI runtime if available.
2. Start EONAPP:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

3. Open `http://127.0.0.1:5173/local-ai?creator=video`.
4. Scan the approved endpoint and enter measured RAM/storage/power/thermal facts.
5. Confirm the approximately 4 GB GPU receives `experimental` or `unsupported` and submission remains blocked.
6. Confirm the UI explains the blocker and offers Guide, future Direct BYOK or a supported device.
7. Capture browser network proof that no `/prompt`, model download, external provider or Cloudflare generation request occurred.

Do not lower the reviewed 8 GiB usable-VRAM threshold to force a pass.

## 4. Supported reference-machine lane

The selected device and workflow must meet the reviewed W625E runbook requirements. Use an owner-installed official ComfyUI/Desktop build and a reviewed native image-to-video API workflow. Do not use custom nodes for the first proof.

1. Configure exact-origin CORS for `http://127.0.0.1:5173`.
2. Open Local Video Lab.
3. Scan the approved loopback endpoint.
4. Enter measured system RAM, free storage, AC/battery and thermal facts.
5. Confirm `supported` before any upload or queue action.
6. Export the reviewed native workflow in ComfyUI API format.
7. Choose the workflow JSON in EONAPP.
8. Confirm the review returns no forbidden classes, custom-node hints or missing roles.
9. Copy the displayed workflow SHA-256 into the exact-digest confirmation field.
10. Confirm required models are owner-installed and licence-reviewed; do not make EONAPP install them.
11. Select one harmless PNG/JPEG/WebP first frame.
12. Keep 512×288, 33 frames, 16 fps, batch one, queue one, no audio, no interpolation and no upscale.
13. Enter a harmless motion brief and fixed seed.
14. Submit once.
15. Capture the real `/prompt` response and prompt ID.
16. Observe real preparing, queued/running and completed state from Comfy history.
17. Fetch the real output through the approved `/view` endpoint.
18. Play, pause, seek and replay the media inside EONAPP.
19. Save it through EONAPP.
20. Reopen the saved owner-selected file through EONAPP.
21. Confirm generated and reopened SHA-256 match and metadata is positive.
22. Export the redacted W625E receipt.

## 5. Eleven mandatory negative/recovery lanes

Record each from real evidence:

1. Runtime stopped and restarted.
2. Owner 4 GB blocked fallback.
3. Missing model/workflow and restoration.
4. Invalid/empty/oversize input rejected before upload.
5. LAN/public/unapproved-port endpoint rejected before request.
6. Exact-origin CORS removed, clear failure observed, then restored.
7. Queued or running job cancelled; partial output not marked complete; retry succeeds.
8. Timeout or runtime crash clears busy state; restart/retry succeeds.
9. Low disk blocks or warns; cleanup deletes nothing without approval and protects saved media.
10. Refresh/resume never invents progress; missing history becomes recoverable error.
11. Preview decode/container failure preserves valid saved output and does not rewrite generation truth.

## 6. Evidence and return package

Return:

- exact source archive checksum and certifying source fingerprint;
- permanent predeploy receipt;
- redacted owner fallback and reference-device capability reports;
- reviewed workflow ID/version/digest and private model digests kept out of public evidence;
- real prompt ID/history/output fetch facts;
- generated video byte size, metadata and SHA-256;
- EONAPP preview/playback/save/reopen/digest-match evidence;
- browser console and network summaries;
- all eleven negative/recovery lanes;
- machine-readable W625E receipt;
- W625H benchmark/certification board with an honest PASS/FAIL;
- any narrowly required source patch with deterministic tests.

Until all requirements pass, retain exactly:

```text
source-tooling-ready-real-reference-video-proof-pending
```
