# W244 — Provider, Local AI and EONBOT truth audit

**Status:** local source-and-output pass. This wave does not prove external providers, a local runtime, Preview, a real device, PWA update/rollback, Git history, or production deployment.

## Defects closed

1. A saved hosted key and a hard-coded catalog model could be mistaken for a runnable provider.
2. Local-runtime probing could be reached from older surfaces without an explicit user self-test workflow.
3. Chat could detect a local runtime and imply that it was selected for replies.
4. Compatibility routing retained a rare fallback which could treat stored-key presence as routing evidence if its primary planner failed.
5. Old setup aliases, a public 404 footer, signed-link allowlists, and active Vault reminders still exposed retired setup destinations.
6. The old floating EONBOT widget was still dynamically reachable from Workspace-era runtime loaders. It carried obsolete provider, wallet, reward, onboarding and commercial copy.

## Remediation

- `assets/js/chat/ai-runtime.js`
  - Hosted providers require a current `verified-model-list` evidence record.
  - Local providers require a current Local AI device self-test record.
  - No provider can run from a stored key, static default model, detected loopback port, or compatibility fallback alone.
  - Disabled/unproven catalog entries normalize safely to Guide Mode.
- `assets/js/chat-page.js`, `assets/js/utils/ai-readiness.js`, `assets/js/vault/eon-vault-page.js`, `vault.html`
  - Vault is the only active credential-entry and hosted compatibility-check surface.
  - Chat never accepts raw provider keys or performs a verification probe.
  - Local discovery is informative only; Local AI must be explicitly opened and self-tested.
- `assets/js/utils/eon-auto-router.js`
  - Routing uses current verification evidence, not marketing/price labels or stored keys.
- `assets/js/eon-workstation-page.js`, `assets/js/utils/runtime-loader.js`, `assets/js/trade-support-bootstrap.js`
  - The floating legacy widget is no longer dynamically reachable from current runtime paths.
  - The retained compatibility helper is intentionally inert; Chat remains the only EONBOT surface.
- `404.html`, `assets/js/utils/site-shell.js`, `assets/js/utils/app-language.js`, `assets/js/utils/onboarding-reminder.js`, `assets/js/utils/signed-share-link.js`
  - Current public links and active reminder paths use canonical routes.
  - Signed links no longer accept retired onboarding destinations.
  - The 404 footer is aligned to Chat, Projects, Workspace, EON City, Vault and Local AI.

## Regression proof

- `tests/unit/w244-provider-local-ai-truth.test.mjs`
  - explicit loopback user intent;
  - evidence-gated hosted/local readiness;
  - Guide fallback for unverified providers;
  - Vault-only credential entry;
  - no Chat verification or automatic local selection;
  - no active floating-widget import.
- `scripts/w244-provider-local-ai-truth-gate.mjs`
  - source and emitted-output fence for retired setup links, unsafe readiness wording and the retired widget.

## Final local evidence

- 157/157 approved current-product tests passed.
- lint passed with zero warnings.
- production build passed with 129 `dist` files.
- W239, W242, W243, W244, W247 and W248 gates passed.
- smoke, site audit, launch-readiness, PWA-install source gate, identity/quality, workspace secret scan and `npm audit --omit=dev` passed.

Evidence is stored in `EVIDENCE/W244/`.

## Still mandatory before launch

Run W241 Preview/device/PWA-update/rollback/Git-history/reviewer proof. Do not describe a provider as supported, a local runtime as installed, or the app as launch-ready solely from this package.
