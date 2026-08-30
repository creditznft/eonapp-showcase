# W623I Cloudflare Live Testing Status

Date: 2026-07-11  
Evidence source: owner-provided Codex execution report and Cloudflare AI review  
Status: live testing activation complete; genuine lifecycle proof pending

## Confirmed activation state

- Production has `EON_REFERRALS_DB` bound to the existing dedicated referral D1.
- Preview is not bound to the Production referral database.
- `EON_BILLING_DB` remains bound to the existing billing database.
- Both referral migrations were applied non-destructively.
- `EON_REFERRAL_ROLLOUT=testing` is set in Production, not promoted to `production`.
- No database reset, table deletion, row deletion, secret change, paid Cloudflare feature, cron, queue, R2, KV, Durable Object or new database was introduced.
- Deployment ID reported: `63ec539b-a552-451d-b99b-28aae3e561b5`.
- Owner-provided checks reported 200 responses for `/api/referrals`, `/api/billing/referral-status`, and `/api/billing/status` with the expected dedicated/testing/subscriptions-only state.

## Still pending

- genuine two-account attribution and activation;
- genuine Dodo-origin retained payment;
- 14-day maturity;
- refund/dispute reversal;
- real EONKEY grant and redemption;
- physical-device native Share proof;
- rate-limit and scale baseline.

No synthetic reward, forged Dodo event or fake lifecycle completion may be used to close these items.

## Safe rollback

Disable or remove `EON_REFERRAL_ROLLOUT`, redeploy the same source, and retain the D1 binding, schema and rows. Time Travel restore is not the normal rollback path.
