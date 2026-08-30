# W623D — Production Reachability And Legacy Value-System Quarantine

Date: 2026-07-11  
Status: source-complete; focused certification and production build green

## CEO architecture frozen

1. Dodo Payments is the only subscription checkout rail.
2. The canonical paid prices remain Plus $4.99, Studio $14.99, Power $29.99, and Max $49.90 per month, each with a seven-day trial.
3. Referrals may award non-transferable EONKEYS only through the server ledger after activation, identity, qualification, retention, cap, refund/dispute, and abuse checks.
4. EONKEYS may unlock selected individual features, limits, workflows, templates, or cosmetics. They cannot create a subscription, whole-tier entitlement, discount, renewal credit, cash value, provider credit, wallet, token, payout, or unlimited AI generation.
5. AI image/video execution is local or direct BYOK. Cloudflare does not proxy creator prompts, reference files, provider credentials, jobs, or generated media.
6. Historical NFT, wallet, token, old pricing, reward, and superseded commerce modules may remain in source for migration/evidence, but they may not enter the production browser or Cloudflare Function import graph.

## What changed

### New files

- `assets/js/collection/eon-vault-reveal-visuals.js`
- `config/w623d-production-reachability-contract.mjs`
- `config/w623d-quarantine-manifest.json`
- `reports/w623d-production-reachability/graph.json`
- `scripts/w623d-production-reachability-gate.mjs`
- `tests/unit/w623d-production-reachability.test.mjs`

### Updated files

- `assets/js/eon-workspace-pages.js`
- `assets/js/market/eon-market-page.js`
- `assets/js/market/market-private-drop.js`
- `assets/js/utils/referral-par.js`
- `config/product-evidence-registry.mjs`
- `package.json`
- `scripts/build-production.mjs`
- `tests/unit/w220-market-generation-vertical-slice.test.mjs`

## Product changes

1. Replaced the production Market import of the retired official-commerce foundation with the canonical W623C subscription catalogue.
2. Replaced active NFT-era preview imports with a neutral deterministic Vault Reveal visual module.
3. New generated Reveal saves use `eon:vault-reveals:generated:v1`; earlier NFT-named keys are read only for explicit migration compatibility and are no longer written by the active generator.
4. Market now clearly states that it is not a marketplace and that subscription checkout is separate from Vault Reveals.
5. Workspace now describes EONKEYS as proof-gated rather than claiming all referrals are disabled.
6. The browser invite compatibility layer now states that only the canonical server ledger can grant EONKEYS.
7. Product evidence statuses now recognize `Live-sensitive` and `Proof-gated` truth states.
8. Every production build runs the W623D reachability gate before Vite emits files.

## Reachability evidence

- HTML documents analysed: 33
- Browser script entries: 130
- Cloudflare Function entries: 19
- Unique production entries: 49
- Reachable source files: 338
- Import edges: 573
- Quarantined modules reachable: 0

## Focused validation

- W623D gate: passed
- W623D unit tests: 5/5 passed
- Focused affected regression suite: 28/28 passed
- Targeted ESLint: zero errors and zero warnings
- Production build: passed
- Distribution files: 450
- Minified files: 288
- Size saved: 41.34%
- Distribution SHA-256: `9386b3b44e3e6bd822572c5079e35feae9f146d7b87f953e0be441d7b1ad9613`

## Evidence boundary

This wave deliberately did not rerun every historical test. One unrelated W353 beta-readiness fixture remains outside W623D certification because it no longer reaches its historical ready state and is not touched by the production reachability architecture. The W623D evidence consists of the new graph gate, all directly affected product tests, commercial truth tests, route/evidence tests, targeted lint, and one clean production build.

## Next wave

W623E — simplify and freeze the ChatGPT-style information architecture: one clear Create entry, one coherent sidebar hierarchy, no duplicate route concepts, beginner-first labels, and capability discovery without clutter.
