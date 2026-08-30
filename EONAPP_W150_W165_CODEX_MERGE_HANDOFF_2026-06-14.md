# EONAPP W150–W165 Codex Merge Handoff

## Purpose

This package is the complete W150–W165 wave handoff for Codex to merge into the repo and deploy. It is cumulative and should be treated as one source snapshot plus an optional patch set.

## Included wave

```text
W150 — Telegram/Monetag reward hardening
W156 — EON City Ultra Showcase
W157 — District Landmark Sculpt
W158 — NPC Identity and Animation
W159 — Private Workstation Ultra Office
W160 — Photo Mode and Trailer Capture Lab
W161 — Lighting/Weather/Audio Polish
W162 — Gameplay Clarity and Onboarding
W163 — Generated Realms Ultra Parity
W164 — Sustained Performance Lab
W165 — Final Gamer/Power-User Certification
```

## Merge approach

Preferred:

1. Extract the full source zip into a clean branch/worktree.
2. Compare against current `main`.
3. Merge all tracked source changes.
4. Run dependency install and gates.
5. Deploy only after build/smoke/server verification passes.

Alternative:

1. Apply the patch package from W164 to W165 if the repo already includes W164 exactly.
2. Run the same gates.
3. Deploy after verification.

## Critical protected systems

Do not rewrite or simplify these during merge:

```text
/telegram must stay a 200 rewrite to /telegram.html; no redirect loop.
/reward-access must stay a stable rewarded-ad route.
Rewards must stay user-tap-only; no auto-open ads.
Account-wide reward entitlement still needs Cloudflare/postback/status proof; frontend success alone is not real subscription entitlement.
Market first impression must not be empty; starter NFT/drop proof stays launch-critical.
Vault persistence, generated NFTs, API keys, receipts, unlocks, backups, and account-local data must survive Cloudflare updates.
```

## Commands Codex should run

```bash
npm ci
npm run qa:w165-final-gamer-power-user-certification
npm run qa:w150-w165-codex-handoff
npm run lint -- --max-warnings=50
npm run build
npm run smoke:build
npm run qa:w149-ceo-launch-verification:server
npm audit --omit=dev --audit-level=high
```

Optional broader checks:

```bash
npm run test:unit
npm run qa:final-w135-w148-rescue-handoff
npm run audit:site
npm run launch:readiness
```

## Already passed in this package

```text
qa:w165-final-gamer-power-user-certification: PASS
qa:w156-w165-eoncity-visuals: PASS
qa:w150-w165-codex-handoff: PASS
qa:w150-telegram-reward-hardening: PASS
qa:w138-market-nft-generation-proof: PASS
qa:w145-update-safe-user-data-survival: PASS
audit:site: PASS
launch:readiness: PASS with dist/ warning only
npm audit --omit=dev --audit-level=high: PASS, 0 vulnerabilities
```

## Local limitation in this chat container

This handoff source does not include `node_modules`; therefore local `build`, `lint`, `smoke:build`, and W149 server verification were not completed in the chat container. The expected result must be verified on Codex/deploy after `npm ci`.

## Final merge rule

If Codex finds conflicts, preserve the newest W165 versions of these files unless current `main` has newer non-overlapping production fixes:

```text
assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js
assets/js/realm3d/engine/WorldPanels.js
assets/js/realm3d/w157-w165-certification-proof.js
package.json
scripts/w165-final-gamer-power-user-certification-gate.mjs
tests/unit/w165-final-gamer-power-user-certification.test.mjs
```

For conflicts in Telegram, Market, Vault, or reward code, stop and inspect carefully. Do not accept changes that introduce redirects, auto ads, data wipes, or frontend-only subscription entitlement.
