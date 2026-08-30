# W221 CityWorldState + 2D RPG vertical slice

## Product truth

EON City is now a local-first browser RPG-style workspace vertical slice. It has a movable avatar, physical scenery collision, an objective, a reachable Command Centre, real deep links into EONAPP surfaces, and persistent City state.

This is not an online game, a public metaverse, a marketplace, a rewards program, or a simulated city. It intentionally has no NPC traffic, player count, loot, purchases, earnings, token, checkout, payout, or hidden background work.

## CityWorldState v1

Storage key: `eon:city:world-state:v1`

The state carries only:

- City identity and seed
- District graph and discovered districts
- Avatar appearance and local position
- Local objective/visit progress
- Safe inventory *references* only
- Local feature flags

It never receives raw Vault secret values, recovery data, API keys, private chat content, wallet material, payment status, referral attribution, or commercial ledger data.

## Migration rule

Historic City preference records are copied to v1 only after a safe normalization pass. The source record is retained unchanged. A malformed v1 record is copied to a bounded local backup key before a clean v1 state is created.

## Controls

- Desktop: arrow keys or WASD; `E` to interact
- Touch: tap-to-walk and on-screen D-pad
- Controller: left stick; primary action button near a district
- Reduced motion: no avatar bob/path animation
- Low-power devices: bounded canvas scale and no extra visual effects

## Validation

```bash
npm run qa:w221-cityworldstate-2d
npm run qa:w221-cityworldstate-2d:browser
```

The browser command requires a Playwright Chromium install or `CHROMIUM_PATH`. It is not evidence of production interaction until it has actually run.
