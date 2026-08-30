# EONAPP W628A–W628F — Genuine Dodo Billing Execution Brief

Date: 2026-07-11  
Source state: source-complete / live evidence pending  
Public certification: NO-GO

## Frozen authority

- Dodo hosted checkout is the only paid subscription checkout rail.
- Checkout is created by a same-origin authenticated server route.
- A checkout attempt must be recorded in D1 before the provider call.
- Only a verified Dodo-origin webhook may change entitlement lifecycle state.
- Browser callbacks, return query strings, local storage and customer-action responses never grant paid access.
- Duplicate delivery may repair a previously interrupted event; a fully processed duplicate is idempotent.
- An event older than the current lifecycle source timestamp is recorded as out-of-order and cannot overwrite newer state.
- Portal, cancellation, reactivation, upgrade and downgrade requests are review-first server actions. They remain webhook-pending.
- Refund, expiry and lost dispute revoke access. Open dispute fails closed. Payment failure can enter only the bounded configured grace state.

## Source surfaces

- `assets/js/billing/eon-dodo-live-runtime.js`
- `assets/js/billing/eon-billing-lifecycle.js`
- `assets/js/billing/eon-dodo-customer-actions.js`
- `functions/api/billing/checkout.js`
- `functions/api/billing/status.js`
- `functions/api/billing/portal.js`
- `functions/api/billing/subscription-action.js`
- `functions/api/billing/webhooks/dodo.js`
- `assets/js/commerce/billing-commercial-status.js`
- `config/w628-billing-certification-board.json`

## W628A — Controlled checkout

The route validates the tier against the canonical product map, rejects browser entitlement claims, writes a `creating` checkout attempt first, includes the attempt id in provider metadata, records provider session success/failure, and returns a Dodo allowlisted URL without granting entitlement.

## W628B — Signed webhook and D1 lifecycle

The webhook verifies the Standard Webhooks headers and timestamp, hashes the raw payload, records processing state, normalizes provider lifecycle fields, rejects stale ordering for state mutation, supports duplicate repair, updates both the detailed lifecycle table and compatibility entitlement table, and keeps referral delivery retryable.

## W628C — Entitlement truth

The status route reads both compatibility entitlement and detailed lifecycle rows. The public payload exposes only redacted state, dates and safe Dodo invoice/receipt links. The UI does not infer access from checkout return parameters.

## W628D — Provider-managed customer actions

Portal, period-end cancellation, reactivation and plan change routes require sign-in, same-origin mutation protection and explicit user confirmation. Upgrade requests use immediate provider application; downgrade requests use the next billing date. No action route directly writes entitlement state.

## W628E — Failure and reversal

The lifecycle distinguishes active, trialing, cancelling, grace, past-due, revoked and disputed states. Refund, expiry and lost disputes revoke; an open dispute fails closed; out-of-order reversal cannot overwrite a newer provider event.

## W628F — Certification

Source gates cannot certify live billing. The fail-closed board requires 17 genuine evidence rows covering checkout, provider-origin webhook, D1, entitlement activation, cross-session refresh, portal, cancel/reactivate, failure, refund, dispute, replay, ordering, forgery rejection, tier changes, receipt/tax links and rollback/support.

## Permanent deployment command

```bash
npm ci
npm run verify:codex-predeploy
```

Do not add another deployment command.
