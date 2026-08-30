# W648D — EON Forge AI Builder checkpoint

Date: 2026-07-13  
Baseline: sanitized W646 source at `cb88dea1`  
State: source checkpoint complete; not deployed; full maintained browser/live-provider certification pending

## Product outcome

EON Forge is now a genuine AI-assisted local development workspace for websites, landing pages, portfolios and simple client-side browser applications. The fixed starter, local editor, revision history, import/export, local image handling and isolated preview remain available.

W648D adds:

- **Build with AI** for a new four-file project.
- **Improve with AI** for an existing local project.
- Eight bounded professional actions: improve, feature, fix, restyle, accessibility, performance, refactor and documentation.
- Exact verified provider/model readiness; no silent provider fallback.
- Explicit consent and per-file selection before source leaves the browser.
- A selected-source context meter with reserved prompt overhead.
- A trusted parent-page AI controller using the maintained BYOK runtime.
- A request-bound `eon-forge-ai-proposal.v1` protocol.
- Strict allowlisting of `index.html`, `style.css`, `script.js` and `README.md`.
- Deduplicated selected paths and a delimiter-safe JSON source envelope whose contents are labelled as untrusted data, not instructions.
- Validation for schema, request ID, path, file count, size, secrets, binary content, unsafe dynamic execution, network access, remote assets and parent/storage escape patterns.
- Active provider-transport cancellation and a bounded 90-second timeout.
- Low-temperature structured code generation without changing ordinary Chat behavior.
- An isolated proposal that cannot mutate the saved project.
- Restricted proposed-project preview, bounded before/after source review, meaningful changed-line counts and diagnostics.
- Explicit **Apply Changes** and **Discard** controls.
- Stale-base protection before Apply.
- Revision creation and a sanitized source-free AI receipt after Apply.
- Mobile review layout and reachable controls.

## Security architecture

Provider requests run only in the trusted Forge parent page. Generated source is untrusted. The preview iframe remains:

- `sandbox="allow-scripts"`;
- without `allow-same-origin`;
- protected by `connect-src 'none'`;
- unable to access Vault, provider keys, cookies, parent storage or the provider runtime.

Forge code requests do not consume EONBOT chat history or the queued one-turn research packet. Only explicitly selected project files are sent. Provider output never writes directly to local state. Malformed, mismatched, oversized, unsafe, cancelled, timed-out, unauthorized, payment-blocked or rate-limited responses leave the project unchanged.

## Honest launch boundary

W648D may be described as:

> An AI-assisted local development workspace for websites and simple client-side browser apps, with review-before-apply and a network-isolated preview.

It does not yet claim backend/database generation, native mobile apps, arbitrary package installation, a terminal/container, GitHub publishing, user-project hosting or one-click generated-site deployment.

## Source validation completed here

- Forge AI compatibility gate: **27/27 passed**.
- Complete maintained unit suite: **999/1046 passed**, **47 explicit historical skips**, **0 failures**, **280 maintained files**, **10/10 chunks**.
- W624D archive integrity: **10/10 passed**; 36 archived files / 47 superseded assertions.
- Current-contract alignment: **17/17 passed**; 69 maintained replacement tests.
- Provider lifecycle: source gate passed for 15 finite BYOK contracts; **2/2 tests passed**.
- Provider/Local AI truth: 371 reachable modules checked; **5/5 tests passed**.
- ESLint: zero warnings and zero errors.
- Production build: passed; **483 distribution files** / **8,541,038 bytes**.
- Distribution SHA-256: `25d6efe2b2ea37e52fb04bc9b76baa7eae1150575fb07eec948517f0f4b325e5`.
- Build smoke: passed; 24 required files.
- Site audit: passed; 49 HTML files, three tools, one game, sitemap and precache verified.
- Launch readiness: **PASS**, zero blockers and zero warnings.
- App-surface quality gate: **PASS**, zero blockers and zero warnings.
- Identity surface gate: zero blockers and zero warnings.
- Page invariants gate: zero blockers and two pre-existing trust-page keyword review warnings (`about.html`, `privacy.html`); neither warning is Forge-specific.
- Workspace secret scan: 3,905 text files scanned; zero findings.
- Production dependency audit: **0 vulnerabilities**.

The complete unit suite was resumed from its source-fingerprint-bound checkpoint after the execution shell reached its time allowance. The unchanged fingerprint was verified, chunk 10 completed normally, and the maintained runner emitted its final passing receipt. No test was deleted, weakened or force-exited.

## Evidence limitations

No headed browser, live Groq settlement or maintained E2E certificate is claimed from this environment. The last Codex report stated that `npm run test:e2e:current` exceeded ten minutes without producing a result; that browser-runner termination defect remains a release blocker until Codex isolates and repairs it.

Codex must rerun the complete maintained unit suite on the target checkout, perform the deterministic headed Forge review, complete one minimal settled Groq proof, and then rerun the repaired maintained E2E gate before deployment.

No provider request, deployment or Cloudflare mutation was performed in this checkpoint.
