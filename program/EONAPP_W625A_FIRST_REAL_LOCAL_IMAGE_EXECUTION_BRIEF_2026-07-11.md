# W625A Execution Brief — First Real Local Image Proof

Date: 2026-07-11
Prerequisite: W624L source complete
Authority: `EONAPP_W623B_CODEX_REAL_COMFY_IMAGE_RUNBOOK_2026-07-11.md`

## Mission

Prove one real, saved and reopenable local image through EONAPP using an already-installed, user-started ComfyUI runtime. Do not treat source integration, mocks, screenshots of Comfy alone or an image created outside EONAPP as proof.

## Frozen safety boundaries

- Approved loopback endpoints only: `127.0.0.1` or `localhost` on ports 8000, 8188 or 8189.
- No LAN host, public Comfy endpoint, hidden cloud fallback or automatic runtime/model/node installation.
- Runtime discovery and checkpoint discovery occur only after explicit user action.
- One conservative built-in image workflow first; no unreviewed workflow import.
- No local-video enablement in W625A.
- Do not expose unrelated checkpoint filenames or private local paths in evidence.

## Required positive proof

1. Start the official installed ComfyUI/Desktop runtime.
2. Open EONAPP from an approved local origin.
3. Explicitly scan the approved loopback endpoint.
4. Record runtime/device facts and discover at least one installed compatible checkpoint.
5. Review and submit one conservative 512×512 image request through EONAPP.
6. Observe real queued/running/completed state from Comfy history.
7. Fetch the actual output through the approved Comfy view endpoint.
8. Preview, save, reopen and export the image through EONAPP.
9. Record bounded provenance without private prompt or filesystem disclosure.

## Required negative and recovery proof

- Comfy stopped.
- Comfy reachable but no compatible checkpoint installed.
- Disallowed LAN/public endpoint rejected before request.
- Browser private-network/CORS block explained honestly.
- Timeout or interrupted runtime.
- User cancellation.
- Restart and retry after failure.

## Source and certification work

- Fix only defects revealed by the real proof lane.
- Preserve the permanent `npm run verify:codex-predeploy` command.
- Add current W625A gates/tests to the maintained manifest; do not revive archived historical expectations.
- Package redacted machine receipt, browser/network/console evidence, source delta, exact commands and honest PASS/FAIL.

## Acceptance

W625A passes only when one real image is generated, fetched, saved and reopened through EONAPP and all mandatory failure/recovery lanes are evidenced. If the current environment cannot access the owner's ComfyUI runtime, keep real proof pending and package exact owner/Codex commands; never convert mocks into a pass.

## W625A–W625C source batch update

The source now implements queued/running/cancel state, explicit local save, saved-file reopen, SHA-256 matching, redacted receipt export and the W625B allowlisted workflow registry. Preview alone is not a pass. Execute `program/EONAPP_W625A_OWNER_CODEX_REAL_COMFY_PROOF_COMMANDS_2026-07-11.md` for the current owner-machine procedure. Real evidence remains pending.
