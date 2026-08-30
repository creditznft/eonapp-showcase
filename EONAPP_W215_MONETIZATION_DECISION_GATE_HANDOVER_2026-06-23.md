This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W215 — Monetization decision gate handover

## Current decision: intentionally no active monetization

All of the following are disabled in source and at public/API boundaries:
- offerwalls
- ads and rewarded ads
- SmartLink/Direct Link/Sponsor Boost
- provider SDK loading
- referral reward credits
- referral revenue share or payout
- subscriptions/purchases/unlocks based on campaigns
- postback acceptance
- redemption/minting/entitlement flows

## Referral policy now
A signed referral or Realm link can create only a local pending attribution. A Cloudflare `REFERRALS_DB` record may be queued only after a qualifying activity and contains hashed/pseudonymous relationship evidence. It is not a link registry, click ledger, payout table, or reward balance.

## Why reward/revenue share is not implemented
The exact future business policy is not yet approved. It must define campaign terms, eligibility, attribution window, fraud/replay controls, chargeback policy, tax/legal wording, data retention, user support, and provider callback evidence before it can create value.

## Activation rule
No future provider/campaign configuration may be turned on merely by adding environment variables. A separate reviewed wave must implement a named campaign and pass callback, replay, fraud, legal, UX, device, and Preview evidence gates.

## Source gate

```bash
npm run qa:w215-monetization-decision
```

Result in this tree: PASS.
