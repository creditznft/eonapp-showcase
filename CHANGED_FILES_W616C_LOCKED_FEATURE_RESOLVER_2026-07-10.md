# W616C — Locked Feature Resolver

Date: 2026-07-10
Base: W616B EON Keys referral unlocks source snapshot
Status: source-level implementation complete; targeted gates pass; no Dodo/live grant enabled.

## Purpose

W616C adds the product resolver required before the real referral and billing systems are connected. Every premium feature gate can now resolve the same safe choices:

1. Subscribe to the required tier or a higher tier.
2. Start an eligible trial where the tier supports it.
3. Refer real active users to earn EON Keys.
4. Use an earned EON Key to unlock the feature or a feature pass.

This keeps the CEO decision locked: users can either pay, trial, or refer to unlock real EONAPP capability. Referral rewards are not billing credits, renewal discounts, free months, cash, wallet balance, crypto, tokens, NFTs, payouts, or platform-paid AI credits.

## Important product truth

EONAPP has no platform-paid AI/image/video generation cost at launch. AI/image/video capability runs through the user's local AI runtime or the user's own provider/API key. EON Keys unlock EONAPP workflow capability, limits, templates, packs, automations, exports, showcases, Vault Relics, City cosmetics and feature passes.

## Files changed

- `assets/js/referrals/eon-feature-unlock-resolver.js` — new central resolver contract.
- `assets/js/referrals/eon-keys-catalog.js` — wording tightened to avoid any platform-paid AI-credit implication.
- `assets/js/referrals/eon-keys-page.js` — adds resolver status and locked-feature examples.
- `eon-keys.html` — adds locked-feature CTA styling.
- `scripts/w616c-locked-feature-resolver-gate.mjs` — new source gate.
- `tests/unit/w616c-locked-feature-resolver.test.mjs` — new unit tests.
- `package.json` — adds `qa:w616c-locked-feature-resolver`.

## Locked-feature examples covered

- Plus: project slots, premium templates, own API-key workflows, local AI workflows.
- Studio: creator preset packs, Studio workflow systems, premium export kits, private showcase slots.
- Power: advanced local-AI bundles, advanced own-key bundles, automation packs.
- Max: Max local/API-key workrooms, Max City/Vault skins.

## Validation run

Passed:

```bash
npm run qa:w616c-locked-feature-resolver
npm run qa:w616b-eon-keys-referral
node --test tests/unit/w520-core-modularisation.test.mjs tests/unit/w616b-eon-keys-referral-unlocks.test.mjs tests/unit/w616c-locked-feature-resolver.test.mjs
node --check assets/js/referrals/eon-feature-unlock-resolver.js
node --check assets/js/referrals/eon-keys-page.js
node --check scripts/w616c-locked-feature-resolver-gate.mjs
```

Results:

- W616C gate: passed 10/10.
- W616C unit tests: 6/6 passed.
- W616B regression gate: passed 9/9.
- Focused combined unit set: 19/19 passed.

Not claimed:

- `npm ci` did not complete in this chat runtime before timeout, so full lint/build signoff is not claimed here.
- No live Dodo checkout, server entitlement, referral ledger, or key redemption is active.

## Next wave

W616D should connect this resolver to real UI surfaces by replacing one or more hardcoded premium/limit messages with a shared disabled locked-feature CTA component. Keep it non-live until server ledgers and Dodo webhooks exist.
