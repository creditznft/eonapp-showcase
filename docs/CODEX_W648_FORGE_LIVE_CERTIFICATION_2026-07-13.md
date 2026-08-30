> SUPERSEDED by `CODEX_W648D_FORGE_LIVE_CERTIFICATION_2026-07-13.md`. Retained only for checkpoint history.

# Codex instructions — W648 Forge live certification

Use the W648 full-source package as the only candidate. Do not merge an older Forge tree over it. Restore the owner's existing `.env.local` locally; never commit or include it in evidence.

## 1. Restore and source gates

From `source/`:

```powershell
npm ci
npm run qa:w648-forge-ai-builder
npm run lint
npm run build
npm run smoke:build
npm run security:secret-scan
npm run test:unit:current
```

Do not deploy if any maintained test fails or the maintained runner does not terminate. Diagnose the exact file/process handle rather than deleting tests or adding a blanket force-exit.

Also diagnose the previously reported `npm run test:e2e:current` ten-minute non-termination. Run its specs separately, record per-spec durations, close every page/context/server/timer, and then rerun the complete maintained browser gate.

## 2. Deterministic Forge browser review without a provider call

Open the normal Forge route in headed Chromium and verify:

1. Start page shows **Build with AI** and **Create manual starter**.
2. No verified provider produces setup guidance and makes no provider request.
3. Manual starter still works.
4. Existing projects, code editing, preview, checks, revisions, import, backup and export still work.
5. Preview iframe has `sandbox="allow-scripts"`, no `allow-same-origin`, and CSP `connect-src 'none'`.
6. Preview cannot read parent storage, Vault, cookies or provider keys.
7. Desktop, tablet and 390 px mobile layouts have no blocking overflow or unreachable Apply/Discard controls.
8. Browser console contains no unhandled error.

Save screenshots and a machine-readable receipt without browser storage, source content or secrets.

## 3. One minimal real Groq Forge proof

Use only the already verified Groq provider/model. Do not silently change provider or model. Make one paid/request-settled generation unless the first attempt fails before provider settlement.

1. Open Forge using the owner's normal local test origin.
2. Confirm the exact verified Groq provider and model shown by Forge.
3. Create a new project with a unique nonce, for example `W648-FORGE-<timestamp>`.
4. Select the four approved project files and accept the explicit source-sharing consent.
5. Request a small polished website or simple browser app with one visible JavaScript interaction containing the nonce.
6. Confirm exactly one official Groq Chat Completions request and HTTP 2xx settlement.
7. Confirm no API key appears in URL, console, receipt, source, screenshot metadata or exported files.
8. Confirm the response is accepted only as `eon-forge-ai-proposal.v1` with the matching request ID.
9. Review changed files, line counts, diagnostics and proposed preview.
10. Verify saved project files remain unchanged before Apply.
11. Click **Apply Changes** explicitly.
12. Confirm one new revision and one sanitized `eon-forge-ai-change-receipt.v1` receipt.
13. Undo/restore and verify the previous version.
14. Reapply or regenerate only if required for the proof; do not create repeated paid traffic merely for screenshots.
15. Export the project, reopen/import it, and confirm byte hashes plus visible nonce behavior.
16. Confirm Vault/session cleanup after the proof.

## 4. Negative browser lanes

Use request interception or a local deterministic fixture where appropriate. Prove no mutation for:

- malformed JSON;
- wrong request ID;
- traversal or unknown path;
- secret-bearing output;
- oversized output;
- remote fetch/WebSocket/EventSource/sendBeacon code;
- `eval` or `new Function`;
- provider or model mismatch;
- 401, 402 and 429;
- timeout;
- Cancel;
- Discard;
- project edited after proposal but before Apply.

## 5. Evidence package

Return:

- exact source commit and tree/hash;
- exact commands and exit codes;
- maintained unit and browser totals;
- Forge desktop/mobile screenshots;
- redacted network metadata proving official Groq hostname and HTTP 2xx;
- proposal/apply/undo/export/reopen receipts;
- preview sandbox/CSP proof;
- secret-scan and build receipts;
- explicit statement that generated projects remain local and were not published;
- remaining blockers;
- deployment recommendation.

Do not deploy W648 merely because the source gates pass. Deployment requires the full maintained browser suite to terminate and the real Forge proof above to pass.
