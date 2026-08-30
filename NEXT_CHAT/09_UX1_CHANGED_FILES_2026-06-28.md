# UX-1 Changed-File Manifest

## Product implementation

- `assets/js/eon-app-shell.js` — reusable guest-to-Google modal, guest/account shell labels, account menu states, user-tapped OAuth entry, focus handling.
- `assets/css/eon-app-shell.css` — modal and mobile safe-area styling.
- `assets/css/eon-chat-first.css` — header account affordance styling cleanup.
- `profile.html` — removes obsolete acknowledgement control from Profile.
- `assets/js/profile-page.js` — Profile Google entry no longer requires an acknowledgement.
- `functions/api/auth/google/start.js` — identity-only OAuth start does not require an acknowledgement query flag.
- `functions/_shared/eon-auth.js` — OAuth flow records notice version rather than a misleading acknowledgement requirement.

## Contracts, gates and tests

- `config/w373-identity-account-operations-contract.mjs`
- `scripts/w373-identity-account-operations-gate.mjs`
- `tests/unit/w373-identity-account-operations.test.mjs`
- `config/w400c-google-identity-entry-contract.mjs`
- `scripts/w400c-google-identity-entry-gate.mjs`
- `tests/unit/w400c-google-identity-entry.test.mjs`
- `config/w405-live-ux-city-rescue-contract.mjs`
- `scripts/w405-live-ux-city-rescue-gate.mjs`
- `tests/unit/w405-live-ux-city-rescue.test.mjs`
- `scripts/w395-google-identity-d1-readiness-gate.mjs`
- `tests/unit/w374-google-oauth-pages-functions.test.mjs`

## Source-integrity restoration (inactive design contracts only)

- `platform-backend/contracts/eon-account-commerce-foundations.v1.json`
- `platform-backend/contracts/eon-commercial-decision-gate.v1.json`
