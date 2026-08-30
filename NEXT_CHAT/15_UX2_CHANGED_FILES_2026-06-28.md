# UX-2 Checkpoint — Changed File Manifest

This checkpoint contains the validated UX-1 and UX-2 source changes relative to the supplied W405 continuation bundle.

## UX-2 additions

- `config/ux2-shell-modals-contract.mjs`
- `scripts/ux2-shell-modals-gate.mjs`
- `tests/unit/ux2-shell-modals.test.mjs`
- `NEXT_CHAT/12_UX2_SHELL_MODALS_IMPLEMENTATION_HANDOVER_2026-06-28.md`
- `NEXT_CHAT/13_UX2_VALIDATION_RECEIPT_2026-06-28.md`
- `NEXT_CHAT/14_START_HERE_AFTER_UX2_2026-06-28.md`
- `NEXT_CHAT/15_UX2_CHANGED_FILES_2026-06-28.md`

## UX-2 changes

- `assets/js/eon-app-shell.js` — reusable shell modal layer; Profile, Settings and Apps modes; account-menu/More-menu wiring; explicit inactive-capability copy.
- `assets/css/eon-app-shell.css` — accessible shared overlay, tab, app-gallery and mobile layout styles.
- `package.json` — `qa:ux2-shell-modals` source gate.
- `tests/unit/w244-provider-local-ai-truth.test.mjs` — aligns the legacy assertion with the canonical `/local-ai` destination used by the compact shell.
- `NEXT_CHAT/BUNDLE_INDEX.md` — continuation index.

## UX-1 retained in this checkpoint

- `assets/js/eon-app-shell.js`, `assets/css/eon-app-shell.css`, `assets/css/eon-chat-first.css` — Guest-first compact sign-in modal and shell behavior.
- `profile.html`, `assets/js/profile-page.js`, `functions/api/auth/google/start.js`, `functions/_shared/eon-auth.js` — removes obsolete backup acknowledgement as a precondition while retaining truthful local-data boundaries.
- `config/w373-identity-account-operations-contract.mjs`, `scripts/w373-identity-account-operations-gate.mjs`, `scripts/w395-google-identity-d1-readiness-gate.mjs`, `config/w400c-google-identity-entry-contract.mjs`, `scripts/w400c-google-identity-entry-gate.mjs`, `config/w405-live-ux-city-rescue-contract.mjs`, `scripts/w405-live-ux-city-rescue-gate.mjs`, and related unit tests — aligns established source gates with the approved UX-1 behavior.
- `platform-backend/contracts/eon-account-commerce-foundations.v1.json` and `platform-backend/contracts/eon-commercial-decision-gate.v1.json` — restored inactive design-only contracts absent from the original archive, needed by the current suite; neither enables a commercial or Sync capability.
- `NEXT_CHAT/06_…` through `10_…` — UX-1 handover, validation receipt, start-here note, changed-files record and browser-proof limitation.

## Intentionally excluded from handover ZIPs

- `node_modules/`, `dist/`, `artifacts/`, `reports/`, caches, browser profiles and test-result directories;
- `.env`, `.env.*`, environment templates and any secrets;
- generated report caches and bundled output.
