# Final source handover — W250 to W290

**Package type:** cumulative source snapshot + Codex GPT-5.4 merge/deploy/evidence handover.

**Canonical repository:** `creditznft/EONAPP` (private), default branch `main`.

## Authority

This package is the cumulative source authority for the unmerged W250–W290 work completed through June 25, 2026. It supersedes the individual W263, W265, W267, W271, W280, W282, W286, W287, and W288 source freezes as the single Codex merge input. It contains the original source, retained historical handover material, and the final W280-B1 + W286-B3 source changes.

Do not combine this with prior zip archives. They are historical checkpoints only. Use this source tree and its manifest.

## Included

- Full Vite source, `package-lock.json`, tests, scripts, workflow files, route contracts, and cumulative W250–W290 documentation.
- W250–W257 City prepared-action, native gateway, art provenance, input/accessibility, performance, parity, EONBOT proposals, and beginner-mission work.
- W263/W264/W281/W285 local capability, project handoff, provider lifecycle, and device-support contracts.
- W265/W286 Orientation Hall plus City Agent Presence, Work Huddles, and Outcome Relay across City Lite, Three.js Visual Tour, and Babylon City Play.
- W267/W268 hardening/runbook boards; W271–W277 accessibility, CSP, sensory, scripted guide, PWA, and privacy boundaries; W280-B1 local support evidence pack; W287/W288 EONBOT voice/language and Creator handoff review protections.
- Exact external evidence, Cloudflare read-only, legal/security, beta, and final-recertification packets.

## Deliberately excluded

`.git`, `node_modules`, `dist`, all `.env*` and `.dev.vars` files, secrets, generated test artifacts, coverage, caches, logs, temporary files, and nested zip archives. Run a fresh `npm ci` after extraction.

## Final local verification receipt

- `npm run test:unit`: **279/279 passing**.
- `npm run lint -- --max-warnings=0`: pass, zero warnings.
- `npm run build`: pass, **194** generated production files.
- `npm run qa:current-static-certification:core`: pass.
- `npm run qa:current-static-certification:tail`: pass.
- Workspace secret scan: pass.
- `npm audit --omit=dev`: **0 known production vulnerabilities**.

## Read in this order

0. `FINAL_HANDOVER/EONAPP_W250_W290_FINAL_CODEX54_MEGA_HANDOVER_2026-06-25.md` — single professional handover document.

1. `FINAL_HANDOVER/CODEX_GPT54_MERGE_AND_PREVIEW_RUNBOOK.md`
2. `FINAL_HANDOVER/W250_W290_COMPLETION_AND_LAUNCH_MATRIX.md`
3. `FINAL_HANDOVER/CODEX_GPT54_COPY_PASTE_PROMPT.md`
4. `FINAL_HANDOVER/EXTERNAL_EVIDENCE_AND_LAUNCH_BLOCKERS.md`
5. `FINAL_HANDOVER/VISUAL_EVIDENCE_INDEX.md`
6. `docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md`
7. `docs/W282_W259_W266_W276_EXTERNAL_EVIDENCE_PROTOCOL_2026-06-25.md`
8. `docs/W268_W278_W279_EXTERNAL_REVIEW_DOCKET_2026-06-25.md`
9. `docs/W289_W290_FINAL_RECERTIFICATION_BOARD_2026-06-25.md`

## Truthful release state

**W260 is still NO-GO.** This source package does not authorise production deployment, referral/reward activation, D1 writes, Cloudflare configuration changes, wallet/chain/token/payment functions, a public beta, or final certification. Codex may merge on a safety branch, validate locally, push a review branch, and run an explicit Preview-only workflow after the required local checks.
