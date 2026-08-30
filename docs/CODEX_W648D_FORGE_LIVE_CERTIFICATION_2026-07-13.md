# Codex instructions — W648D Forge certification

Use the W648D full-source checkpoint as the only Forge candidate. Do not merge an older Forge tree over it. Restore the owner's existing `.env.local` only on the local Windows machine; never commit or package it.

## 1. Restore and source gates

From `source/`:

```powershell
npm ci
npm run qa:w648-forge-ai-builder
npm run qa:w624d-test-archive
npm run qa:w624d-current-contract-alignment
npm run qa:w281-ai-provider-lifecycle
npm run lint
npm run build
npm run smoke:build
npm run security:secret-scan -- --allow-no-history
npm audit --omit=dev --audit-level=high
npm run test:unit:current
```

Expected focused Forge result: **27/27**. Expected complete current-unit result from this checkpoint: **999/1046 passed**, **47 explicit historical skips**, **0 failures**, **280 maintained files**. Do not deploy if a maintained test fails or the maintained runner does not terminate. Identify the exact file/handle rather than deleting tests or adding a blanket force-exit.

Diagnose the reported `npm run test:e2e:current` ten-minute non-termination. Run specs separately, record durations, close every page/context/server/timer and then rerun the complete maintained browser gate.

## 2. Deterministic headed review without a provider call

Verify on the normal Forge route:

1. Start page shows **Build with AI** and **Create manual starter**.
2. No verified provider produces setup guidance and no request.
3. Manual starter, editor, preview, checks, revision history, import, backup, local images and export still work.
4. Eight professional AI actions are visible and select only their intended files.
5. The source context meter deduplicates selections, warns near its reserved limit and disables an over-limit request.
6. New-build AI requires all four approved files before a provider call.
7. Proposed changes show bounded current/proposed source, meaningful line counts, diagnostics and restricted preview.
8. Cancel aborts the active transport; Discard leaves files unchanged.
9. Apply creates one revision and one sanitized `eon-forge-ai-change-receipt.v1` receipt.
10. Preview iframe has `sandbox="allow-scripts"`, no `allow-same-origin`, and CSP `connect-src 'none'`.
11. Preview cannot read parent storage, Vault, cookies or provider keys.
12. Desktop, tablet and 390 px mobile layouts have no blocking overflow or unreachable controls.
13. Browser console contains no unhandled error.

Save screenshots and a machine-readable receipt without source contents, browser storage or secrets.

## 3. One minimal real Groq proof

Use only the already verified Groq provider/model. Do not silently change provider or model.

1. Open Forge on the owner's normal local test origin.
2. Confirm exact verified provider and model.
3. Create a project with a unique nonce such as `W648D-FORGE-<timestamp>`.
4. Select all four approved files and accept explicit source-sharing consent.
5. Choose one professional action and request a small polished website or simple browser app with one visible JavaScript interaction containing the nonce.
6. Confirm exactly one official Groq request and HTTP 2xx settlement.
7. Confirm the API key is absent from URL, console, receipt, source, screenshots and export.
8. Confirm acceptance only as `eon-forge-ai-proposal.v1` with the matching request ID, provider and model.
9. Confirm saved files are unchanged before Apply.
10. Review changed files, bounded diff, diagnostics and restricted preview.
11. Apply explicitly; confirm one revision and one sanitized receipt.
12. Undo/restore and verify the previous version.
13. Export, reopen/import, verify byte hashes and visible nonce behavior.
14. Confirm Vault/session cleanup.

Do not create repeated paid calls merely for screenshots.

## 4. Negative lanes

Use deterministic interception/fixtures where appropriate. Prove no mutation for malformed JSON, wrong request ID, duplicate/traversal/unknown path, unapproved file, missing generate files, delimiter-like source text, secret-bearing output, oversized output, remote fetch/WebSocket/EventSource/sendBeacon code, `eval`/`new Function`, provider/model mismatch, 401/402/429, timeout, Cancel, Discard and a project edited after proposal but before Apply.

## 5. Evidence and release decision

Return exact source commit/tree/hash, commands and exit codes, maintained unit/browser totals, desktop/mobile screenshots, redacted Groq settlement metadata, proposal/apply/undo/export/reopen receipts, preview sandbox/CSP proof, build and secret-scan receipts, remaining blockers and a deployment recommendation.

Do not deploy merely because source gates pass. Deployment requires the full maintained browser suite to terminate and the real Forge proof above to pass.
