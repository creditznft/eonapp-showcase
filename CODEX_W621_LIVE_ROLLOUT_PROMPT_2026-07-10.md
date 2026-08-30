> historical-only
Use `CURRENT_PRODUCT_START_HERE.md` for current instructions.
Historical provenance is preserved in `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.

# Paste to Codex — W621 EONAPP Live Rollout

You are Codex working on EONAPP.

## Source

Use the W621 source package / patch from this handover. It is based on W620 and adds live Dodo/Cloudflare billing runtime.

## Owner-completed manual setup

Dodo products are live:

```text
DODO_PRODUCT_PLUS=pdt_0Nis1ygG50cHTUTsp7Gwa
DODO_PRODUCT_STUDIO=pdt_0Nis7CRUoZ9B0QfEzQ1w3
DODO_PRODUCT_POWER=pdt_0Nis7RsQydyq2vm7Yn5i0
DODO_PRODUCT_MAX=pdt_0Nis7lrISs3fLPlO5t39E
```

Pricing:

```text
Plus $4.99/mo
Studio $14.99/mo
Power $29.99/mo
Max $49.99/mo
All paid plans: 7-day free trial
```

Dodo subscription settings:

```text
Allow Multiple Subscriptions = disabled
Allow Subscription Updates = enabled
Upgrade = immediate, charge difference immediately
Downgrade = next billing date
Plan-change payment failure = prevent plan change
Products should be in one Product Collection for upgrade/downgrade portal flow
```

Cloudflare owner says these are configured:

```text
Project: eonapp-ch
D1 database: eonapp-billing
D1 binding: EON_BILLING_DB
EON_BILLING_ROLLOUT=production
Secrets: DODO_PAYMENTS_API_KEY, DODO_WEBHOOK_SECRET, EON_ENTITLEMENT_SIGNING_KEY
```

Do not ask the owner to paste secrets. Do not print secrets. Do not commit secrets.

## Required deployment work

1. Merge/apply W621 patch.
2. Deploy to Cloudflare.
3. Confirm routes no longer 404:
   - https://eonapp.ch/api/billing/status
   - https://eonapp.ch/api/billing/checkout
   - https://eonapp.ch/api/billing/webhooks/dodo
   - https://eonapp.ch/api/billing/referral-status
4. Confirm `GET /api/billing/webhooks/dodo` returns route-live health.
5. Confirm unsigned webhook POST returns 401/4xx and no D1 entitlement write.
6. Confirm Dodo dashboard Testing sends a signed webhook that returns 2xx and creates an idempotent `eon_billing_events` row.
7. Confirm checkout creation works for all four tiers from a signed-in account and returns a Dodo `checkout_url`.
8. Confirm checkout payload includes `subscription_data.trial_period_days=7` and metadata `eon_account_id`, `eon_tier_id`, `eon_trial_days`.
9. Confirm D1 schema is initialized:
   - `eon_billing_events`
   - `eon_entitlements`
   - `eon_referral_ledger`
   - `eon_key_grants`
10. Confirm lifecycle events:
   - `subscription.active`, `payment.succeeded`, `subscription.renewed`, `subscription.plan_changed` grant/update paid entitlement.
   - `refund.succeeded`, `subscription.cancelled`, `subscription.expired`, `subscription.failed`, `subscription.on_hold`, `dispute.opened`, `dispute.lost`, `dispute.expired`, `dispute.accepted`, `entitlement_grant.revoked` revoke/downgrade entitlement.
11. Confirm referral/EON Key unlocks remain server-ledger only; no browser query/localStorage unlock, no cash/wallet/crypto/NFT/commission/renewal-discount/free-month reward.
12. Confirm EON City W618F browser/mobile proof passes in a real unblocked browser.

## Required commands

```bash
npm ci
npm run qa:w621-live-dodo-cloudflare-rollout
npm run qa:w620-referral-agent-dodo-completion
npm run qa:w619-dodo-server-ledger
npm run qa:w618f-eon-city-browser-proof
npm run qa:w618e-agent-theater-foundations
npm run qa:w618d-living-dashboard-signals
npm run qa:w618c-eon-command-room-default
npm run qa:w618b-share-command-center-shell
npm run qa:w618a-eon-city-command-world
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run launch:readiness
npm run launch:page-gate
npm run launch:identity-gate
npm run launch:quality-gate
npm run security:secret-scan -- --allow-no-history
PLAYWRIGHT_BASE_URL=https://eonapp.ch npm run qa:w618f-eon-city-browser-proof:browser
```

## Final report required

Return:

```text
commit SHA
Cloudflare deployment URL
route status for all billing routes
D1 binding proof without secret values
D1 table proof
Dodo checkout proof for Plus/Studio/Power/Max
Dodo webhook signed delivery proof
Dodo idempotency proof
entitlement grant/revoke proof
EON City browser/mobile proof screenshots or artifact paths
build hash
all command results
final go/no-go recommendation
```
