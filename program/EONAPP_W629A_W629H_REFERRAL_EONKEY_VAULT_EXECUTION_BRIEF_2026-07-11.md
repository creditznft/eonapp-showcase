# EONAPP W629A–W629H — Referral, EONKEY and Vault Reveal execution brief

Date: 2026-07-11
Status: source-complete; real account/provider/production evidence pending

## Frozen boundaries

- Signed links remain stateless and public-safe.
- A signed-in inviter must prove possession of the non-extractable P-256 share identity.
- One invitee can attach to one inviter only; self-referral and multi-level relationships are rejected.
- Clicks, copies, shares, posts, impressions, sign-up, trial start and checkout start never create an EONKEY.
- Useful activation requires a one-time first-party server milestone receipt. A browser event alone cannot mint one.
- Paid rewards require a genuine provider-origin billing event and 14-day retained-active state.
- Signal grants are capped at five per inviter per month. Paid grants are capped at three per inviter per calendar year.
- EONKEYS are non-cash, non-transferable and redeem only named individual features, limits, workflows, templates or cosmetics.
- Refund, dispute, failure, expiry, abuse and support reversal can revoke the source grant, redeemed unlock and related Vault Reveal.
- Vault Reveals are deterministic non-financial visual records. They are not generated media, rarity claims, ownership, wallets, tokens or market listings.
- Public certification remains NO-GO until every W629H real-evidence lane passes.

## Source implementation

- `assets/js/referrals/eon-referral-program-w629.js`
- `assets/js/referrals/eon-vault-reveal-integration-w629.js`
- `assets/js/referrals/eon-referral-server-runtime.js`
- `assets/js/referrals/eon-referral-server-client.js`
- `assets/js/referrals/eon-keys-page.js`
- `functions/api/referrals.js`
- `migrations/referrals/0001_referral_authority.sql`
- `migrations/0002_minimal_referral_eonkeys.sql`
- `config/w629-referral-certification-board.json`

## Permanent verification

```bash
npm ci
npm run verify:codex-predeploy
```

Do not create or use another deployment certification command.
