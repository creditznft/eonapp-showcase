# EONAPP W625A — Owner/Codex Real ComfyUI Proof Commands

Date: 2026-07-11  
Authority: W625C source batch derived only from `EONAPP_W624L_FULL_SOURCE_SNAPSHOT_2026-07-11.zip`  
Authoritative W624L archive SHA-256: `9da1fb6dc641eb45e6890a28834fe5bc669d9571d77fad3c007d65ebe1798757`

## Non-negotiable verdict rule

Source tests, mocks, screenshots of ComfyUI alone, or an image made outside EONAPP cannot pass W625A. The owner machine must generate one real 512×512 image through EONAPP, fetch and preview it, save it, reopen the saved file through EONAPP, and obtain a matching SHA-256 digest. Every mandatory negative/recovery lane must also have real evidence.

Local video remains disabled. Do not widen hosts or ports, add a LAN/public endpoint, install a runtime/model/node automatically, import an unreviewed workflow, or add a cloud fallback.

## 1. Certify the exact source

From the extracted source root, use only:

```powershell
npm ci
npm run verify:codex-predeploy
```

Do not create a second deployment verification command. Inspect `reports/w624d-codex-predeploy/receipt.json`; all ordered stages must pass against one unchanged source fingerprint.

## 2. Run the read-only owner preflight

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\w625a-owner-runtime-preflight.ps1 `
  -SourceRoot "C:\path\to\EONAPP_W625C_source" `
  -EvidenceRoot "C:\path\to\w625a-evidence"
```

The preflight checks only approved loopback ports `8188`, `8189`, and `8000`, real `/system_stats`, exact-origin CORS for `http://127.0.0.1:5173`, and checkpoint count. It does not generate an image and cannot certify W625A.

## 3. Start the owner runtime and EONAPP

1. Start the installed official ComfyUI/Desktop runtime yourself.
2. Use one owner-installed, licence-reviewed, low-load SD 1.5-class `.safetensors` checkpoint.
3. Start EONAPP:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

4. Open `http://127.0.0.1:5173/local-ai`.
5. Configure ComfyUI to allow that exact origin. Wildcard CORS is diagnostic only and cannot certify the final lane.

## 4. Mandatory positive path

Inside **Local Image Lab · W625A–W625C**:

1. Enter one approved loopback endpoint and click **Scan ComfyUI**.
2. Confirm a real runtime response and installed checkpoint discovery.
3. Select the reviewed checkpoint explicitly.
4. Keep first-proof mode at 512×512, 12 steps, batch one, standard built-in nodes only.
5. Enter a harmless prompt and click **Create 512×512 proof image** once.
6. Capture the real `/prompt` response and prompt ID.
7. Observe queued/running/completed state and the completed `/history/{prompt_id}` record.
8. Confirm the actual image is fetched through `/view` and previewed inside EONAPP.
9. Click **Save to this device**.
10. Click **Reopen saved image** and choose the file just saved.
11. Confirm EONAPP reports that the reopened file matches the generated image exactly.
12. Export the redacted proof receipt.

Acceptance requires a non-empty 512×512 file, matching SHA-256 after reopen, zero cloud/provider requests, no provider key, no automatic second render, and no video request.

## 5. Mandatory negative and recovery lanes

Record each as `pass` only from real owner evidence:

- **Runtime stopped:** close ComfyUI, scan, and confirm not-ready with no cloud fallback.
- **No checkpoint:** use an owner-controlled empty profile or temporarily remove the selected checkpoint; generation must remain disabled.
- **Unapproved endpoint:** LAN, public HTTPS, and unapproved ports must be rejected before network access.
- **CORS/private-network blocked and recovered:** remove exact-origin access, prove clear failure/stale-state clearing, restore access, and rescan successfully.
- **Timeout recovered:** stop or deliberately exceed the bounded wait after submission; busy state must end and retry must remain possible.
- **Cancellation recovered:** cancel one queued or running identified job using the visible button; EONAPP must stop waiting and request `/queue` deletion or `/interrupt` only for that local job.
- **Restart and retry:** restart ComfyUI after a failed/cancelled lane and complete a fresh real request.
- **Reset and refresh truth:** reset and refresh; temporary object URLs, output bytes and raw prompts must not be misrepresented as durable Library storage.

## 6. Evidence folder

Keep redacted evidence for:

- exact source ZIP/checksum and predeploy source fingerprint;
- successful permanent predeploy receipt;
- approved endpoint and redacted system facts;
- checkpoint count/family without unrelated private filenames;
- prompt ID, completed history and `/view` fetch;
- EONAPP preview, save, reopen and digest match;
- dimensions and positive byte size;
- browser network/console summaries;
- each negative/recovery lane;
- exported W625A receipt;
- final honest PASS/FAIL and open blockers.

Never include secrets, cookies, Google session data, local usernames, unrelated filesystem paths, raw private prompts, full private model inventories, or media bodies in JSON evidence.

## 7. Codex return package

Codex must return:

1. the redacted owner proof folder;
2. any narrowly required source fix and deterministic test;
3. the unchanged permanent predeploy command result;
4. a machine-readable W625A receipt;
5. a clear statement of whether W625A passed;
6. explicit confirmation that video stayed disabled and no cloud/LAN/public fallback was introduced.

Until all lanes pass, retain exactly:

```text
source-tooling-ready-real-owner-runtime-proof-pending
```
