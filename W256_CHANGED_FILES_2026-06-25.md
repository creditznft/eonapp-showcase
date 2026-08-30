# W256 changed files

## Runtime

- `assets/js/chat/eonbot-action-proposals.js` — new local proposal, approval, cancellation, expiry, failure and Vault return contract.
- `assets/js/chat/eonbot-command-hub.js` — guarded plans require review rather than direct Chat CTAs.
- `assets/js/chat/eonbot-action-receipts.js` — opaque proposal-reference support only.
- `assets/js/chat-page.js` — review/confirm/cancel UI and safe Vault return route creation.
- `assets/js/chat/chatbot.js` — guarded compact-widget requests route to full Chat review.
- `assets/js/vault/eon-vault-page.js` and `vault.html` — explicit Vault-to-Chat return control.

## Verification

- `tests/unit/w256-eonbot-proposals-vault-return.test.mjs`
- `scripts/w256-eonbot-proposals-vault-return-gate.mjs`
- `scripts/run-current-unit-suite.mjs`
- `package.json`
- `tests/unit/w230-eonbot-command-hub.test.mjs`

## Documentation/evidence

- This changelog, W256 handoff, evidence directory, source origin, root start file, continuation prompt, R3 roadmap/status/decision log and package contents.
