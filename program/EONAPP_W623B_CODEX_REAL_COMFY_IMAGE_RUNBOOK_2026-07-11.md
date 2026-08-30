# EONAPP W623B — Codex Real Comfy Image Runbook

**Mission:** prove or disprove the W623A local-image path end to end on the owner Windows machine.  
**Release rule:** do not deploy or describe local image generation as working until every mandatory acceptance item passes.  
**Video:** out of scope and must remain disabled.

## 1. Work from a clean W623A source

Use the supplied W623A full source snapshot or apply the W623A delta to the exact 11 July 2026 handover source. Do not test from an older worktree.

In PowerShell:

```powershell
npm ci
npm run qa:w623a-comfyui-local-image
npm run qa:w623-ceo-grand-audit
npm test
npm run lint -- --max-warnings=0
npm run build
```

Expected source result:

- 753/753 maintained tests pass;
- lint has zero warnings;
- release/build gates pass;
- no video capability becomes active;
- no cloud fallback is introduced.

Record the source revision or, for an uncommitted ZIP, the SHA-256 of the ZIP and the final `git diff --check` result.

## 2. Start Comfy Desktop honestly

1. Open the installed official Comfy Desktop application.
2. Wait until its server/backend is ready.
3. Check only approved loopback endpoints, in this order:
   - `http://127.0.0.1:8188`
   - `http://127.0.0.1:8189`
   - `http://127.0.0.1:8000`
4. Do not widen EONAPP to LAN addresses, arbitrary ports or public Comfy servers merely to make the test pass.

PowerShell probe:

```powershell
$ports = 8188, 8189, 8000
foreach ($port in $ports) {
  try {
    $result = Invoke-RestMethod -TimeoutSec 10 -Uri "http://127.0.0.1:$port/system_stats"
    Write-Host "PASS $port"
    $result | ConvertTo-Json -Depth 8
  } catch {
    Write-Host "NO RESPONSE $port - $($_.Exception.Message)"
  }
}
```

A visible installed application is not enough. At least one approved endpoint must return real `/system_stats` JSON.

## 3. Configure explicit browser origin access

Run EONAPP on a local origin for this proof:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

`http://127.0.0.1:5173/local-ai`

ComfyUI must permit that exact origin. Prefer an explicit origin such as:

`http://127.0.0.1:5173`

Use ComfyUI/Desktop’s supported CORS setting or launch option equivalent to `--enable-cors-header http://127.0.0.1:5173`. Do not use wildcard CORS for the final proof unless the official Desktop build offers no narrower setting; if wildcard is temporarily required for diagnosis, record it as a blocker and do not certify the final security state.

Verify from PowerShell:

```powershell
$headers = @{ Origin = "http://127.0.0.1:5173" }
Invoke-WebRequest -Method Get -Headers $headers -Uri "http://127.0.0.1:8188/system_stats" | Select-Object StatusCode, Headers
```

The browser must not show a CORS, mixed-content or private-network failure during the successful lane.

## 4. Install one trusted low-load image checkpoint

Use one trusted, license-reviewed SD 1.5-class `.safetensors` checkpoint suitable for a 4 GB RTX 3050. Keep the first proof conservative:

- 512×512;
- batch size 1;
- 12 steps;
- standard built-in nodes only;
- no ControlNet, LoRA, upscaler, custom nodes or video nodes;
- no silent download performed by EONAPP.

Place the checkpoint in the ComfyUI/Desktop checkpoint location using the official application/model workflow, then restart or refresh ComfyUI so this endpoint returns it:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8188/object_info/CheckpointLoaderSimple" | ConvertTo-Json -Depth 20
```

The model list must come from ComfyUI itself. Do not hardcode a filename into EONAPP.

## 5. Run the mandatory happy path

On `/local-ai`:

1. Open **Local Image Lab**.
2. Confirm the endpoint is the responding approved loopback URL.
3. Click **Scan ComfyUI**.
4. Confirm the real device and at least one checkpoint appear.
5. Choose the trusted checkpoint.
6. Enter a harmless test prompt, for example:

   `A clean futuristic command city at sunrise, readable landmarks, cinematic but welcoming, no text, square composition.`

7. Click **Create local image** once.
8. Observe the real POST to `/prompt`.
9. Observe bounded polling of `/history/{prompt_id}`.
10. Observe the output fetch through `/view`.
11. Confirm the image renders in EONAPP.
12. Click **Save image** and verify a non-empty image file is written.

Acceptance requirements:

- one real prompt ID;
- one completed Comfy history record;
- one fetched image response;
- one visible EONAPP preview;
- one saved non-empty image;
- expected 512×512 dimensions;
- no request to a cloud/provider endpoint;
- no provider key used;
- no LAN scan;
- no automatic second generation;
- no video request;
- no raw prompt written to logs, evidence JSON or persistent storage.

Optional Windows image validation:

```powershell
Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Image]::FromFile("C:\path\to\saved-image.png")
[pscustomobject]@{
  Width = $image.Width
  Height = $image.Height
  Bytes = (Get-Item "C:\path\to\saved-image.png").Length
}
$image.Dispose()
```

## 6. Run mandatory failure and recovery lanes

### A. Comfy stopped

- Stop/close Comfy Desktop.
- Click scan.
- EONAPP must show a human-readable unreachable/timeout result.
- It must not claim image-ready and must not fall back to cloud.

### B. No checkpoint

- Use a clean Comfy profile or temporarily move the test checkpoint out of the active checkpoint directory.
- Restart/refresh Comfy.
- Scan must say Comfy is reachable but no checkpoint is available.
- Generate must remain disabled.
- Restore the checkpoint afterward.

### C. Unapproved endpoint

Try:

- `http://192.168.1.10:8188`
- `http://127.0.0.1:9999`
- a public HTTPS URL

All must be rejected before a network request.

### D. CORS/private-network denial

Temporarily remove the explicit CORS allowance and reload the local page.

- Scan must fail clearly.
- No false-ready state may remain.
- Restore the explicit origin allowance and prove recovery.

### E. Timeout/job failure

Use a controlled timeout or stop Comfy after submission.

- The UI must leave its busy state.
- It must report failure without infinite polling.
- A retry after Comfy restart must work.

### F. Reset and refresh

- Click **Reset connection**.
- Confirm endpoint/self-test state clears.
- Refresh after an output.
- Confirm the temporary object URL/output is not falsely treated as durable Library storage.
- Confirm no raw prompt is restored from hidden persistent storage.

## 7. Capture evidence

Create a dated evidence folder containing:

1. source revision or source ZIP SHA-256;
2. command transcript for install, tests, lint and build;
3. redacted `/system_stats` response;
4. redacted checkpoint discovery summary containing counts/digests rather than unrelated private model filenames where possible;
5. screenshots:
   - Comfy Desktop ready;
   - EONAPP scan success;
   - checkpoint selected;
   - generated image visible;
   - saved file properties;
   - each required error/recovery lane;
6. browser network summary proving only the EONAPP local origin and approved Comfy loopback endpoint were used;
7. browser console summary;
8. final machine-readable receipt.

Do not include API keys, cookies, Google session material, local usernames, unrelated filesystem paths, raw private prompts or full private model inventories.

Suggested receipt shape:

```json
{
  "schema": "eonapp.w623b.real-comfy-image-proof.v1",
  "recordedAt": "<ISO timestamp>",
  "sourceRevisionOrZipSha256": "<value>",
  "eonappOrigin": "http://127.0.0.1:5173",
  "comfyEndpoint": "http://127.0.0.1:8188",
  "systemStatsReached": true,
  "checkpointCount": 1,
  "workflow": {
    "width": 512,
    "height": 512,
    "batch": 1,
    "standardNodesOnly": true
  },
  "promptSubmitted": true,
  "historyCompleted": true,
  "outputFetched": true,
  "outputVisibleInEonapp": true,
  "outputSaved": true,
  "savedOutputBytes": 0,
  "savedOutputWidth": 512,
  "savedOutputHeight": 512,
  "cloudRequestsObserved": 0,
  "providerKeysUsed": false,
  "videoAttempted": false,
  "negativeLanes": {
    "runtimeStopped": "pass",
    "noCheckpoint": "pass",
    "unapprovedEndpoint": "pass",
    "corsDeniedAndRecovered": "pass",
    "timeoutRecovered": "pass",
    "resetAndRefreshTruth": "pass"
  },
  "verdict": "pass-or-fail",
  "openBlockers": []
}
```

Replace `savedOutputBytes` with the observed positive value.

## 8. Fix policy

When a lane fails:

- fix the narrowest real defect;
- add or update a deterministic unit/source test;
- do not disable endpoint validation;
- do not broaden ports or hosts casually;
- do not add a hidden cloud fallback;
- do not persist raw prompts to “make recovery easier”;
- do not enable video;
- rerun the complete maintained suite, lint, release verification and build.

## 9. W623B pass gate

W623B is **PASS** only when:

- source gates remain green;
- real Comfy API is reached on an approved loopback endpoint;
- a real installed checkpoint is discovered;
- one real 512×512 image completes;
- the image is fetched, rendered and saved from EONAPP;
- all six failure/recovery lanes pass;
- no cloud/provider request or secret is involved;
- evidence is redacted and complete.

Anything less remains **source-integrated, real-device proof pending**.

## Paste-ready Codex instruction

> Continue from the exact W623A source. Execute `program/EONAPP_W623B_CODEX_REAL_COMFY_IMAGE_RUNBOOK_2026-07-11.md` end to end on this Windows machine. Do not deploy, enable video, weaken loopback/CORS restrictions, add a hidden cloud fallback, or claim success from mocks. Start the installed official Comfy Desktop app, prove an approved loopback API, use one trusted low-load SD 1.5-class checkpoint, run the EONAPP Local Image Lab at `http://127.0.0.1:5173/local-ai`, generate one real 512×512 image, fetch it through Comfy history/view, save it, run every required negative/recovery lane, fix only real defects, rerun 753/753 tests plus lint/release/build, and return a redacted machine-readable receipt, screenshots, network/console evidence, source delta, and an honest PASS/FAIL verdict.
