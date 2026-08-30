# EONAPP W400C + W391D — Merge File Map

Baseline: `EONAPP_W399_POSTDEPLOY_FULL_SOURCE_HANDOVER_2026-06-28.zip` / deployed W399 source.

## Changed runtime files

- `assets/js/eon-app-shell.js`
  - adds a guest-first Account / Sign in action in the root EONBOT header;
  - routes to Profile first rather than opening OAuth from the header;
  - label is driven by the privacy-safe `/api/auth/session` availability state.
- `assets/js/profile-page.js`
  - adds an honest account-foundation status message for unavailable, testing-ready, and signed-in states.
- `assets/css/eon-chat-first.css`
  - adds responsive styling for the header account action.
- `functions/_shared/eon-relay.js`
  - new fail-closed Relay helper for a future dedicated tracking database.
- `functions/api/relay/invites/create.js`
  - new authenticated, same-origin, disabled-by-default invite creation endpoint.
- `functions/api/relay/attribution/capture.js`
  - new authenticated, same-origin, one-direct-attribution endpoint.
- `functions/api/relay/status.js`
  - reports a fail-closed Relay state; no grant or reward action is enabled.
- `relay/migrations/0001_eon_relay_pilot.sql`
  - extends the future dedicated Relay schema with opaque HMAC invite tokens and direct attribution rows.
- `scripts/run-current-unit-suite.mjs`
  - includes the two current W400C/W391D unit suites.
- `package.json`
  - adds W400C/W391D source gates and the composite verification command.

## New source gates and tests

- `config/w400c-google-identity-entry-contract.mjs`
- `scripts/w400c-google-identity-entry-gate.mjs`
- `tests/unit/w400c-google-identity-entry.test.mjs`
- `config/w391d-relay-tracking-contract.mjs`
- `scripts/w391d-relay-tracking-prep-gate.mjs`
- `tests/unit/w391d-relay-tracking-prep.test.mjs`

## New handover documents

- `HANDOVER_DOCS/EONAPP_W400C_W391D_IMPLEMENTATION_HANDOVER_2026-06-28.md`
- `HANDOVER_DOCS/CODEX_CONTINUE_W400C_W391D_PROMPT_2026-06-28.md`
- `HANDOVER_DOCS/W400C_W391D_VALIDATION_SUMMARY_2026-06-28.json`
- `HANDOVER_DOCS/EONAPP_W400C_W391D_CHANGED_FILES_2026-06-28.md`

## Non-activation boundary

This is source preparation, not an activation release. Do not bind or migrate `EON_RELAY_DB`, do not set `EON_RELAY_ROLLOUT=tracking|pilot`, and do not enable Collection grants, Relay rewards, social OAuth/posting, Action Gateway execution, GitHub/Cloudflare user deployment, payment billing, or public OAuth rollout from this handover.
