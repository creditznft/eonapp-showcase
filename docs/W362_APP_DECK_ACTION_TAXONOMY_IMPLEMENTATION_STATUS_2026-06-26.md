# W362 — EON App Deck + A-01 Action Taxonomy

## Implemented source scope

- Added canonical `/apps` route, route-contract row and App shell navigation item.
- Added **EON App Deck** with exactly four categories: Workrooms, AI Crew, Connections and Blueprints.
- Added four outcome Workrooms, five role-scoped Crew cards, eight planned Connection cards and seven official Blueprint cards.
- Added foreground-only Chat handoff for Workrooms/Crew; it prefills a prompt and does not auto-send it.
- Added local selection receipt for Blueprints. A Blueprint only pre-fills an Automations goal; the user must still explicitly create a local workflow draft.
- Added the seven-class action taxonomy: Read, Draft, Write, Publish, Spend, Delete and Admin.
- Added taxonomy display in Automations and an App Deck entry point from City Portal and Three.js Command Space.
- Added `apps` to shared CityWorldState mode transitions.

## Explicitly not implemented

No OAuth, Google Login, API-key collection, account connection, external provider call, Cloudflare change, scheduler, background runner, external write, message send, publish, spend, delete, admin action, commercial catalogue, subscription, entitlement, wallet, token, referral, payout, marketplace or production deployment.

## Verification command

```bash
npm run qa:w362-app-deck-action-taxonomy
```

This is a source/unit gate only. It is not live route proof, browser proof, provider proof or Cloudflare proof.
