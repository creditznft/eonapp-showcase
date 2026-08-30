# W617A — Shell Launch Readiness

Date: 2026-07-10
Baseline: W616D Locked Feature Surfaces

## Decision

The next safest coding wave after W616D is not another monetization surface. It is launch-blocking shell readiness:

- mobile drawer must be truly inert when closed, not only visually offscreen or `aria-hidden`;
- main content must be inert only while the mobile drawer is open;
- desktop sidebar must not inherit mobile drawer hiding;
- legacy bottom navigation labels must clear the contrast floor;
- the shell/menu fix must have a standalone QA gate before billing or referral ledgers are connected.

## Files changed

- `assets/js/shell/eon-shell-navigation.js`
  - Added pure `getEonShellDrawerAccessibilityState()` resolver.
  - Encodes desktop / mobile-open / mobile-closed drawer accessibility state centrally.

- `assets/js/eon-app-shell.js`
  - Uses the central drawer resolver.
  - Applies `sidebar.inert` for closed mobile drawer.
  - Applies `main.inert` only while the mobile drawer is open.
  - Initializes the drawer through `setDrawerOpen(false, state)` instead of a partial `aria-hidden` write.
  - Re-syncs drawer state on viewport resize through the same close/open path.
  - Stores `data-eon-drawer-state` for QA and future browser proof.

- `assets/css/chat.css`
- `assets/css/layout.css`
- `assets/css/subscription.css`
- `assets/css/workbench.css`
  - Replaced low-contrast legacy bottom-nav colors.
  - Added stronger active/focus label color.
  - Added focus-visible where the old selector only used focus.

- `scripts/w617a-shell-launch-readiness-gate.mjs`
  - New standalone 10-check gate for drawer accessibility and bottom-nav contrast hardening.

- `tests/unit/w617a-shell-launch-readiness.test.mjs`
  - New 5-test unit contract covering mobile closed, mobile open, desktop, shell wiring and CSS contrast markers.

- `package.json`
  - Added `qa:w617a-shell-launch-readiness`.

## Validation commands

```bash
npm run qa:w617a-shell-launch-readiness
npm run qa:w616d-locked-feature-surfaces
npm run qa:w616c-locked-feature-resolver
npm run qa:w616b-eon-keys-referral
node --test tests/unit/w520-core-modularisation.test.mjs tests/unit/w616b-eon-keys-referral-unlocks.test.mjs tests/unit/w616c-locked-feature-resolver.test.mjs tests/unit/w616d-locked-feature-surfaces.test.mjs tests/unit/w617a-shell-launch-readiness.test.mjs
```

## Validation result

- W617A gate: 10/10 passed
- W617A unit tests: 5/5 passed
- W616D regression: passed
- W616C regression: passed
- W616B regression: passed
- Focused W520/W616B/W616C/W616D/W617A set: 29/29 passed

## Still not claimed

- No browser visual proof yet in this runtime.
- No Cloudflare production deployment.
- No Dodo checkout activation.
- No live trial activation.
- No live EON Key redemption.
- No referral grant ledger activation.
- No browser-only entitlement unlock.
