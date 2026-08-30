# R4-COMM-02 Start Here — Global Commerce and EON Invite

**Status:** No commerce has been activated.

This wave corrects the earlier overly broad referral decision. A customer
promotion can be designed without paying referral income, but it remains
inactive until provider written approval and server-side proof exist.

Read in order:

1. `docs/R4_COMM02_GLOBAL_COMMERCE_EON_INVITE_AND_PRICING_DECISION_2026-06-26.md`
2. `config/r4-comm02-global-commerce-contract.mjs`
3. `scripts/r4-comm02-global-commerce-gate.mjs`
4. `program/R4_PROGRAM_LEDGER_2026-06-26.json`

Run:

```bash
npm run qa:r4-comm02-global-commerce
npm run qa:r4-program-ledger
```

Do not:

- add provider credentials or a checkout;
- show prices as available for purchase;
- activate EON Invite, coupons, free time, affiliate or payout logic;
- replace server-backed entitlement requirements with localStorage;
- state that KYC, refunds or product support are fully outsourced.
