# ChatGPT 5.5 Recommendations And Audit Targets - W216

## Highest-priority checks

### 1. Production live follow-up

Production now serves the newer W216 shell, so the next audit is no longer "why is production old?" but:

- do a cache/update sanity pass on already-open tabs
- confirm the custom domain and preview alias stay in sync on the key routes
- verify no production-only regressions appeared after the direct upload

### 2. Market behavior versus expectations

The current W216 source and tests deliberately accept a private local selection flow with prehydrated starter content and progressive generation. This means the user complaint is important:

- the user expects more obvious live NFT generation
- current code/test truth mainly guarantees that Market never opens blank and that starter/generated local cards appear

Audit:

- `assets/js/market-page.js`
- `tests/unit/w138-market-nft-generation-proof.test.mjs`

Decide whether the intended product behavior is:

- current local private-selection previews only, or
- stronger on-demand unique generation on first interaction, with different UX copy and proofs

### 3. Visual cleanup on the new shell

The new layout is materially better, but it still needs a small polish pass:

- top utility/header area on preview chat is crowded and visually overlaps in desktop screenshots
- mobile `automation-studio` top navigation text is cramped
- small button/text density issues should be checked across mobile `chat`, `market`, `workspace`, and `vault`

Best evidence folders:

- `output/playwright/w216-liveqa-2`
- `output/playwright/live-prod-check`

### 4. Route/alias cleanup

The canonical route works for the automation page:

- `/automation-studio`

But the alias still deserves cleanup:

- `/automations`

Audit `_redirects`, `public/_redirects`, and any shell/router link generation to make sure legacy aliases do not loop or compete with canonical pages.

## Secondary checks

### 5. PWA/install/update truth

Double-check:

- service worker update messaging
- whether old cached HTML or asset references can survive a production promotion
- whether install prompts and update prompts look clean in the new shell

### 6. Lighthouse and performance

Run Lighthouse against local preview/prod-style builds and check:

- mobile performance regressions
- layout shift in crowded top sections
- unused JS/CSS around the new shell

### 7. Public copy and intent consistency

The new Market copy is safer and more truthful. Verify that copy across public pages still matches the current product stance:

- not claiming financial value
- local/private-selection positioning
- clear Vault save semantics

## Recommended GPT-5.5 sequence

1. `npm ci`
2. `npm run qa:w216-release-candidate`
3. inspect `output/playwright/w216-liveqa-2`
4. compare local render with live production `eonapp.ch`
5. audit `market-page.js` and W138 tests together
6. run Lighthouse on the routes most likely to regress visually
7. patch only the highest-confidence visual/routing issues

## Honest constraints

- broad `npm run test:unit` still includes historical stale failures unrelated to the current W180-W216 release candidate
- external proof gates like real Telegram user-session proof and real provider-origin rewarded callbacks are not replaced by source-only checks
- production/preview mismatch must be treated as deployment truth, not guessed away as cache alone
- after the 2026-06-23 production promotion, the main deployment question shifts to cache/update behavior and live visual parity rather than "preview only"
