# W616B — EON Keys Referral Feature Unlock Foundation

Date: 2026-07-10
Baseline: `test-source(4).zip`

## CEO decision implemented

EONAPP referral rewards no longer use inviter renewal discounts, free subscription months, wallet value, cash, crypto, payout, token or NFT mechanics. The source now models referrals as **EON Keys**: non-cash app unlocks that can unlock real EONAPP capability.

Users should eventually see three unlock paths when they hit a premium feature wall:

1. Subscribe to Plus / Studio / Power / Max.
2. Start an eligible Dodo trial after billing is live.
3. Refer active users, earn EON Keys, and unlock selected features without paying.

## Important AI cost boundary

EONAPP does **not** sell platform-paid hosted AI/image/video generation at launch. AI, image and video generation runs through the user's local AI runtime or the user's own provider/API key. EON Keys unlock EONAPP workflow capability, not EONAPP-paid AI credits.

## Files changed / added

### Added
- `assets/js/referrals/eon-keys-catalog.js`
- `assets/js/referrals/eon-keys-page.js`
- `eon-keys.html`
- `scripts/w616b-eon-keys-referral-gate.mjs`
- `tests/unit/w616b-eon-keys-referral-unlocks.test.mjs`

### Updated
- `assets/js/eon-app-shell.js`
- `assets/js/shell/eon-shell-navigation.js`
- `assets/js/commerce/eon-offer-catalog.js`
- `assets/js/chat/guide-mode-playbooks.js`
- `config/route-contract.mjs`
- `_redirects`
- `public/_redirects`
- `package.json`

## Source behavior

- Adds 5-tier feature map: Free, Plus, Studio, Power, Max.
- Keeps Plus as the public trial tier.
- Keeps Studio trial contextual.
- Keeps Power and Max without public trials at launch.
- Adds Signal, Builder and Power Keys.
- Adds feature unlock menu for project limits, templates, workflows, local-AI/own-key AI workflows, automation packs, export kits, showcase slots, feature passes, Vault Relics, City skins and profile identity.
- Adds a non-live EON Keys page at `/eon-keys`.
- Moves Vault / Billing / Invite / Backup / Settings / Help into the profile hub.
- Simplifies main sidebar to EONBOT, Projects, Library, Forge, EON City and More tools.
- More tools now contains Automations / EON Flow, Local AI, Workspace, Studio / Collection and Insights.

## Validation performed

Passed:

```text
npm run qa:w616b-eon-keys-referral
node --test tests/unit/w520-core-modularisation.test.mjs tests/unit/w616b-eon-keys-referral-unlocks.test.mjs
npm run lint -- --max-warnings=0
```

Not fully re-certified in this turn:

```text
npm run build
npm test
```

The full production build was attempted in this container, but Vite remained in the transform phase until the tool timeout. No final build signoff is claimed here.

## Still non-live

This wave does not activate:

- Dodo checkout.
- Subscription grants.
- Trial grants.
- Referral attribution server ledger.
- EON Key grants.
- Paid referral events.
- Refund or chargeback automation.
- Any cash/crypto/wallet/payout/revenue-share path.

## Next coding wave

W616C should implement the local locked-feature UX contract:

- `featureId -> required plan -> accepted key type -> duration/limit` resolver.
- UI helper copy: Subscribe / Trial / Refer / Use Key.
- No Dodo calls yet.
- No live key grant yet.

