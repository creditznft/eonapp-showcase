# Session 8 — Payments/Rewards/Telegram/Monetag CEO Audit

Status: source proof green, live proof still required.

## CEO decision
Paid ads remain HOLD until real Telegram Mini App, Monetag valued postback, low-value NOWPayments, and post-deploy browser proof are captured.

## Implemented
- Server-truth proof panels on Reward Access, Telegram, Subscription, and Vault Payments.
- Shared `payment-reward-proof.js` diagnostics and status hydration.
- Reward Access now ties Monetag `ymid` to the status proof panel after ad callback.
- Telegram now exposes server-truth reward status alongside session/channel status.
- NOWPayments IPN stored payload is sanitized to public proof fields.
- Static gate added: `npm run gpt55:payment-reward-server-truth-gate`.

## Architecture rule
Front-end callback can unlock local pending UX, but account-wide reward/payment entitlement requires Cloudflare status proof.
