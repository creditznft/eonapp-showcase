# Start Here — Continue From W623H

Date: 2026-07-11  
Completed checkpoint: W623H  
Next wave: W623I

Use the included W623H full source snapshot as authoritative. Do not restart from W623G or an older Codex worktree.

## Frozen truth

- EONAPP monetises through subscriptions only.
- There are no in-app ads, rewarded ads or watch-an-ad unlocks.
- External referral-link promotion is separate from EONAPP monetisation and earns nothing unless the programme is active and a server-verified milestone qualifies.
- The minimal referral authority reuses `EON_BILLING_DB`; it needs no new database, secret, cron, queue, link registry or click/post tracker.
- Signed public links remain stateless; raw invite tokens are session-only.
- Useful activation can grant a capped Signal Key and digital reward.
- Paid referral keys require 14-day retention and use Builder, Builder, Power progression with a three-per-year cap.
- Refund/dispute/cancellation/expiry/failure/revocation can reverse grants, unlocks and digital rewards.
- EONKEYS cannot create subscriptions, discounts, cash, wallets, tokens, payouts, provider credit or unlimited AI.

## W623H evidence

- W623H source gate: 20/20.
- SQL lifecycle tests: identity proof, replay rejection, self-referral rejection, activation grant, paid hold, redemption and reversal.
- Focused W623C–H tests: 31/31.
- Secret scan: green.
- Production build and W623D quarantine gate: green.
- Source viral readiness: 9.7/10.
- Deployed rewards remain inactive until W623I Cloudflare proof.

## W623I first actions

1. Read the Cloudflare activation runbook and combined real-device proof runbook.
2. Apply migration `migrations/0002_minimal_referral_eonkeys.sql` to the existing billing D1.
3. Set `EON_REFERRAL_ROLLOUT=testing`; do not add a secret or second database.
4. Deploy and prove two separate accounts through bind, accept, activate, Signal grant, digital reward and low-risk redemption.
5. Prove self-referral, copied-link identity theft and browser balance tampering fail.
6. Disable rollout and confirm ordinary sharing/subscriptions continue.
7. Complete desktop/mobile native Share and eleven-language voice/RTL/IME evidence.
8. Keep the production 14-day paid retention rule intact.

Do not mark W623I complete from source-only tests.
