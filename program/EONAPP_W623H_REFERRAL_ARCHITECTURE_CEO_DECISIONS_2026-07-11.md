# W623H CEO Decisions — Referral, EONKEYS and Digital Rewards

> **Superseded for deployment by W623I:** use the existing dedicated `EONAPP_REFERRALS_DB` bound as `EON_REFERRALS_DB`. This W623H document remains historical evidence only.


Date: 2026-07-11  
Status: frozen source architecture; Cloudflare rollout still disabled until W623I proof

## 1. Monetisation

EONAPP monetises through subscriptions only. There are no display ads, rewarded ads, watch-an-ad unlocks, offerwalls or paid-attention mechanics in the active product.

A user may independently share or promote a referral link outside EONAPP. That is not an EONAPP advertising product. A link earns nothing merely because it was copied, clicked, posted, viewed or promoted.

## 2. Why a tiny server ledger is required

A fully browser-only reward system cannot reliably prevent a person from:

- referring their own account;
- copying another inviter's public identity;
- replaying the same milestone;
- claiming the same invite on multiple accounts;
- keeping a reward after a refund or dispute;
- fabricating a key balance in LocalStorage.

The chosen design keeps almost everything decentralised while making only scarce reward truth authoritative.

## 3. Decentralised responsibilities

The user's device continues to own:

- signed public invite links;
- generated images and videos;
- share cards and captions;
- campaign drafts;
- social destination choice;
- native share handoff;
- private prompts, media and provider credentials.

EONAPP does not register every link, track clicks, count impressions, inspect social posts or upload shared media.

## 4. Minimal Cloudflare responsibilities

The existing `EON_BILLING_DB` stores only:

- short-lived proof-of-possession challenges;
- referral identity to signed-in account association;
- one inviter to one invitee association;
- verified activation and retained-paid events;
- EONKEY grants, consumption and reversal;
- individual feature/cosmetic unlock receipts;
- digital reward receipts;
- aggregate progress derived from those qualified records.

There is no new D1 database, secret, cron, queue, click tracker, impression tracker or social-post tracker.

## 5. Reward rules

- Click, copy, share, impression or post: no reward.
- Trial start: no inviter reward.
- Useful first activation: one Signal Key plus a Welcome/Signal digital reward, capped at five Signal rewards per inviter per month.
- First retained paid referral in a calendar year: one Builder Key plus Builder digital reward.
- Second retained paid referral: one Builder Key plus Builder digital reward.
- Third retained paid referral: one Power Key plus Power digital reward.
- Launch paid-referral cap: three per inviter per calendar year.
- Paid retention: 14 days.

EONKEYS are non-cash, non-transferable and cannot create a subscription, discount, renewal credit, payout, wallet, token, provider credit or unlimited AI.

## 6. Reversal

Refund, dispute, cancellation, expiry, payment failure or entitlement revocation can reverse the related grant, redeemed unlock and digital reward. This is required even when the marginal cost to EONAPP is low, because a fake or permanent reward ledger would destroy trust and create account-farming incentives.

## 7. Identity safety

A public link alone cannot claim an inviter identity. The signed-in inviter must answer a fresh ten-minute P-256 challenge using the device's non-extractable private share key. Up to five device identities may attach to one account.

## 8. Privacy-safe growth measurement

The dashboard shows accepted invites, useful activations, pending retention and retained referrals. These numbers are calculated from existing qualified ledger rows only. EONAPP does not measure click-through rate, impressions, ad views or social-post activity.

## 9. Rollout decision

- Source: ready.
- Deployment: inactive by default.
- Testing activation: `EON_REFERRAL_ROLLOUT=testing` plus existing `EON_BILLING_DB`.
- Production activation: only after W623I two-account, rollback and deployed API proof.
- Rollback: unset or disable `EON_REFERRAL_ROLLOUT`; ordinary sharing and subscriptions continue while grants/redemption stop.
