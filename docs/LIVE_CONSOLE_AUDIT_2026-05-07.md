# Live Console Audit — Production (eonapp.ch)

Date: 2026-05-07
Auditor: Copilot live browser sweep
Method: open production pages, navigate and click key UI surfaces, capture browser console logs

## Pages Audited

- https://eonapp.ch/
- https://eonapp.ch/workbench.html
- https://eonapp.ch/vault.html
- https://eonapp.ch/signal.html
- https://eonapp.ch/market.html

## Findings

### 1) `Cannot use import statement outside a module`

Observed on multiple pages.

Likely cause:
- stale client-side cached script path loading an ES module file as classic script.

Fixes applied:
- `assets/js/utils/runtime-loader.js`
  - reward scripts are explicitly loaded with `type='module'`
- `assets/js/main.js`
  - service worker registration now uses `updateViaCache: 'none'`
- `sw.js`
  - service worker version bumped to force refresh (`v29`)

### 2) `The requested module './p2p-nostr.js' does not provide an export named 'fetchRecentEonEvents'`

Observed on WorkBench page.

Likely cause:
- stale client module graph mismatch between importer and cached dependency.

Fixes applied:
- `assets/js/utils/distributed-inference.js`
- `assets/js/utils/bounty-board.js`

Both now import `p2p-nostr` as namespace and use safe fallbacks if `fetchRecentEonEvents` is unavailable, preventing fatal page errors.

### 3) Service worker preload warning

Observed warning:
- navigation preload request canceled before `preloadResponse` settled.

Fix applied:
- `sw.js`: disabled navigation preload enable block to remove noisy warning class and simplify runtime behavior.

### 4) `/api/v1/errors` returning 405

Observed on production console.

Assessment:
- likely stale-client path from old error-reporting runtime or external runtime behavior.
- no active `/api/v1/errors` call exists in current source tree.

Mitigation in this patch:
- forced service worker/client refresh path to aggressively replace stale cached scripts.

### 5) Vault `/api/v1/vault/*` 404

Observed in live console.

Assessment:
- backend route is not part of current static-first production runtime.
- likely stale client call path from cached script set.

Mitigation in this patch:
- same SW refresh path and module-cache hardening.

## Non-site/Contextual Noise (not treated as app blockers)

- browser-extension/third-party environment logs such as:
  - `lockdown-install.js`
  - `feature_collector.js`
- WebSocket relay availability warnings from public Nostr relays (network-state dependent).

## Status

- Code fixes implemented locally.
- Ready for production deploy and retest.

## Retest Procedure (after deploy)

1. Hard refresh once (`Ctrl+F5`) to ensure SW swap.
2. Visit WorkBench, Vault, Signal, Market.
3. Confirm the two critical errors are gone:
   - `Cannot use import statement outside a module`
   - `does not provide an export named 'fetchRecentEonEvents'`
4. If any `/api/v1/errors` still appears, capture timestamp + page and compare with latest commit hash.
