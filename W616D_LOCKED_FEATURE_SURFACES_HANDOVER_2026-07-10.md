# EONAPP W616D — Locked Feature Surfaces Handover

Date: 2026-07-10
Baseline: W616C Locked Feature Resolver source ZIP, SHA-256 `583bb60ac62348f0cc41b9845997e20f9351040028d8e67396c5d4b780294711`.

## What W616D completed

W616D connects the W616C locked-feature resolver to real UI surfaces instead of showing examples only on `/eon-keys`.

Real surfaces now render premium/limit decision cards:

- `/projects` — project slots and premium template library.
- `/workspace` — Studio workflows, creator presets, export kits, private showcase slots.
- `/local-ai` — local AI and own API-key workflow packs, with clear AI cost boundary.
- `/automations` — Power automation packs and Studio workflow systems.
- `/vault` — Vault/City cosmetics and private showcase slots, separated from recovery/security.

Every surfaced premium gate still shows the same safe decision model:

`Subscribe → Trial → Refer to earn EON Keys → Use earned EON Key`

## Safety boundary preserved

W616D does **not** activate:

- Dodo checkout sessions.
- Free-trial activation.
- Referral grant ledgers.
- Live EON Key redemption.
- Browser-only entitlement overrides.
- Any platform-paid AI/image/video generation cost.
- Any cash, wallet, crypto, NFT, payout, lottery, offerwall, renewal-discount, or money-like reward.

The cards are UI truth surfaces only. Buttons for upgrade, trial and key use are rendered disabled. The referral link points to `/eon-keys` for explanation only.

## Files changed or added

Added:

- `assets/js/referrals/eon-locked-feature-surface.js`
- `assets/css/eon-feature-locks.css`
- `scripts/w616d-locked-feature-surfaces-gate.mjs`
- `tests/unit/w616d-locked-feature-surfaces.test.mjs`
- `W616D_LOCKED_FEATURE_SURFACES_HANDOVER_2026-07-10.md`
- `EVIDENCE/W616D_LOCKED_FEATURE_SURFACES_2026-07-10/`

Updated:

- `package.json`
- `assets/js/eon-workspace-pages.js`
- `assets/js/local-ai/local-ai-page.js`
- `assets/js/eon-automations-page.js`
- `assets/js/vault/eon-vault-page.js`
- `workspace.html`
- `projects.html`
- `local-ai.html`
- `automations.html`
- `vault.html`

## Validation completed

Passed in this runtime:

```text
npm ci
npm run qa:w616d-locked-feature-surfaces
npm run qa:w616c-locked-feature-resolver
npm run qa:w616b-eon-keys-referral
node --test tests/unit/w520-core-modularisation.test.mjs tests/unit/w616b-eon-keys-referral-unlocks.test.mjs tests/unit/w616c-locked-feature-resolver.test.mjs tests/unit/w616d-locked-feature-surfaces.test.mjs
npm run lint -- --max-warnings=0
npm run build
```

Results:

- `npm ci`: completed, 0 vulnerabilities.
- W616D gate: 12/12 passed.
- W616D unit tests: 5/5 passed.
- W616C regression gate: 10/10 passed.
- W616C regression tests: 6/6 passed.
- W616B regression gate: 9/9 passed.
- W616B regression tests: 8/8 passed.
- Focused W520/W616B/W616C/W616D test set: 24/24 passed.
- Lint: passed with `--max-warnings=0`.
- Production build: passed; `distFiles: 444`; distribution SHA-256 `ace025bdc00ab8c304fd68c6d6e78667c74fa9c567d6b3f5c5ca2a6a4b53516f`.

## Honest caveats

- No browser screenshot/Playwright visual proof was run in this chat.
- No live Dodo checkout was tested or enabled.
- No server-side referral ledger, entitlement ledger, or key redemption endpoint exists from this wave.
- This remains source/runtime validation only, not a production deployment proof.

## Recommended W616E next step

Run browser preview proof for the five wired surfaces and capture DOM evidence that:

- `/projects`, `/workspace`, `/local-ai`, `/automations`, and `/vault` render the W616D premium boundary cards.
- Upgrade, trial and key-use buttons remain disabled.
- `/eon-keys` remains explanatory only.
- No checkout network request, Dodo route, key redemption, or entitlement storage write occurs.

Only after that should Codex start the server-side entitlement/referral planning wave. Keep Dodo checkout and live grants disabled until backend webhook evidence exists.
> historical-only
Use `CURRENT_PRODUCT_START_HERE.md` for current instructions.
Historical provenance is preserved in `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.
