> SUPERSEDED by `W648D_FORGE_AI_BUILDER_IMPLEMENTATION_2026-07-13.md`. Retained only for checkpoint history.

# W648 — EON Forge AI Builder implementation

Date: 2026-07-13  
Baseline: sanitized W646 source at `cb88dea1`  
Release state: source-complete, not deployed, headed live-provider certification pending

## Product outcome

EON Forge is now a genuine AI-assisted local development workspace for websites, landing pages, portfolios and simple client-side browser applications. It is no longer limited to a fixed starter template plus a chat handoff.

The W648 implementation adds:

- **Build with AI** for a new project.
- **Improve with AI** for an existing project.
- Exact verified provider/model readiness.
- Explicit consent before selected source files leave the browser.
- A separate trusted parent-page AI controller that reuses the maintained BYOK runtime.
- A request-bound structured project protocol.
- Strict allowlisting of `index.html`, `style.css`, `script.js` and `README.md`.
- Validation for paths, schema, request ID, size, secrets, unsafe dynamic execution, remote/network APIs, remote assets and parent/storage escape patterns.
- An isolated AI proposal that cannot mutate the project directly.
- Proposed-project preview inside the existing network-disabled sandbox.
- File-level change summaries and source checks.
- Explicit **Apply Changes** and **Discard** controls.
- Stale-base protection before Apply.
- Revision creation and sanitized AI change receipts after Apply.
- Existing local undo, restore, import, export, image assets and backup behavior.
- Mobile-specific AI review and control layout.

## Security architecture

Provider requests run only in the trusted Forge parent page. The preview iframe remains:

- `sandbox="allow-scripts"`;
- without `allow-same-origin`;
- protected by `connect-src 'none'`;
- unable to access Vault, API keys, parent storage, cookies or the provider runtime.

Forge code tasks use an explicit bounded workload budget. The ordinary chat caps remain unchanged. Forge requests do not consume EONBOT chat history or the one-turn client research packet; only the project files selected in the Forge consent UI are included.

Model output never writes directly to local project state. Invalid, malformed, mismatched, oversized, unsafe, cancelled, timed-out, unauthorized, payment-blocked or rate-limited responses leave project files unchanged.

## Honest launch boundary

W648 may be described as:

> An AI-assisted local development workspace for websites and simple client-side browser apps, with review-before-apply and a network-isolated preview.

W648 does **not** claim:

- backend or database generation;
- native mobile app generation;
- arbitrary package installation;
- a local terminal/container;
- GitHub publishing;
- generated-site hosting;
- one-click deployment.

These remain later Forge waves after the secure local AI builder receives live browser certification.

## Source validation completed here

- Forge compatibility and AI gate: 18/18 passed.
- Provider/runtime + Forge focused gate: 33/33 passed.
- W624D archive integrity: 10/10 passed.
- Current-contract alignment: 17/17 passed during the maintained-suite run.
- ESLint: zero warnings, zero errors.
- Production build: passed; 483 distribution files.
- Build smoke: passed; 24 required files.
- Workspace secret scan: passed; zero findings.
- Dependency installation: `npm ci --ignore-scripts --no-audit --no-fund` completed from the lockfile.

## Evidence limitations

A headed browser review was attempted with the available system Chromium. The managed environment blocked all page navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR`, including loopback and locally intercepted origins. No visual or live-provider certification is claimed from this environment.

The maintained unit runner completed the first nine groups without assertion failure and reached the last group, but the long grouped process did not terminate consistently in this environment. Every file in the last group passed when run independently. The runner was not weakened or forced to exit; Codex must rerun it on the target Windows machine and preserve the existing failure if it reproduces.

No provider was called and no Cloudflare or production state was changed.
