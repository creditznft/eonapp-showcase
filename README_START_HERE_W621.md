# W621 — Live Dodo / Cloudflare Rollout Handover

Date: 2026-07-10

## Current truth

W620 prepared referral feature unlocks, Agent Theater completion, and the Dodo setup contract. The owner then created the Dodo products, webhook, live read/write API key, Cloudflare secrets, product ID variables, `EON_BILLING_ROLLOUT=production`, and the `EON_BILLING_DB` D1 binding.

W621 completes the missing source work so Codex can deploy a real live billing runtime instead of the W619/W620 fail-closed placeholder routes.

## Dodo products

```text
DODO_PRODUCT_PLUS=pdt_0Nis1ygG50cHTUTsp7Gwa      # $4.99/mo, 7-day trial
DODO_PRODUCT_STUDIO=pdt_0Nis7CRUoZ9B0QfEzQ1w3    # $14.99/mo, 7-day trial
DODO_PRODUCT_POWER=pdt_0Nis7RsQydyq2vm7Yn5i0     # $29.99/mo, 7-day trial
DODO_PRODUCT_MAX=pdt_0Nis7lrISs3fLPlO5t39E       # $49.99/mo, 7-day trial
```

## Cloudflare environment expected

```text
Project: eonapp-ch
Production domain: https://eonapp.ch
D1 database: eonapp-billing
D1 binding: EON_BILLING_DB
Rollout: EON_BILLING_ROLLOUT=production
Secrets: DODO_PAYMENTS_API_KEY, DODO_WEBHOOK_SECRET, EON_ENTITLEMENT_SIGNING_KEY
```

Never print or commit secret values.

## New W621 source behavior

- `/api/billing/status` now reports live server configuration and current signed-in account entitlement from D1.
- `/api/billing/checkout` now requires same-origin POST + signed-in Google session, maps tier to Dodo product, creates a hosted Dodo checkout session at `https://live.dodopayments.com/checkouts`, includes 7-day trial and server account/tier metadata, and returns `checkoutUrl`.
- `/api/billing/webhooks/dodo` now has GET health and signed POST processing.
- The webhook POST verifies Dodo Standard Webhooks headers: `webhook-id`, `webhook-signature`, `webhook-timestamp`.
- D1 tables are initialized on demand: `eon_billing_events`, `eon_entitlements`, `eon_referral_ledger`, `eon_key_grants`.
- Webhook idempotency uses `webhook-id` as the primary event key.
- `subscription.plan_changed` updates entitlement tier.
- `refund.succeeded`, `subscription.cancelled`, `subscription.expired`, `subscription.failed`, `subscription.on_hold`, `dispute.opened`, `dispute.lost`, `dispute.expired`, `dispute.accepted`, and `entitlement_grant.revoked` revoke/downgrade access.
- Referral/EON Key unlocks remain server-ledger only; no browser-only unlock, cash, wallet, crypto, NFT, commission, renewal discount, free month, or unlimited all-Max grant.

## Required Codex proof

1. Merge W621 source.
2. Deploy to Cloudflare preview/production according to owner instruction.
3. Confirm billing routes no longer 404:
   - `/api/billing/status`
   - `/api/billing/checkout`
   - `/api/billing/webhooks/dodo`
   - `/api/billing/referral-status`
4. Confirm `GET /api/billing/webhooks/dodo` returns route-live health.
5. Confirm unsigned webhook POST is rejected.
6. Use Dodo dashboard Testing tab to send signed events and confirm 2xx + D1 writes.
7. Confirm checkout creation for Plus, Studio, Power, Max returns Dodo `checkout_url` and includes 7-day trial.
8. Confirm Google-authenticated checkout flow only; no guest paid checkout.
9. Confirm D1 entitlement changes for active/renewed/plan_changed/refund/cancel/expired/dispute.
10. Run all W621/W620/W619/W618 gates plus browser proof.

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

## Honest caveats

This ChatGPT sandbox cannot verify Cloudflare secrets, D1 bindings, live Dodo API key validity, live Dodo webhook signing secret value, or real browser proof. Codex must verify those from the connected deployment environment. Current production endpoints were still returning 404 before W621 deployment, which is expected until this source is deployed.
> historical-only
Use `CURRENT_PRODUCT_START_HERE.md` for current instructions.
Historical provenance is preserved in `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.
