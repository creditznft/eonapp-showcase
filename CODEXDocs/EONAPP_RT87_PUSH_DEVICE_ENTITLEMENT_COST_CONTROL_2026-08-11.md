# EONAPP RT87 — Push Device Entitlement Cost Control

Date: 2026-08-11

RT87 is the final pre-Codex cost-control wave for browser Web Push. It does not change the RT86 Queue/D1/Web Push architecture. It changes only how many active push subscriptions one account may retain.

## Canonical device allowance

| Billing state | Active push devices |
|---|---:|
| Free | 1 |
| Trial | 1 |
| Plus active/cancelling | 2 |
| Studio active/cancelling | 3 |
| Power active/cancelling | 4 |
| Max active/cancelling | 5 |
| Grace / past due / revoked / disputed / expired | 1 |

The allowance is **server-authoritative from the Dodo entitlement ledger**. Browser input cannot request or override a plan or device limit.

`cancelling` keeps the paid allowance only while the signed billing ledger still reports paid access through the paid period. Once the webhook changes the account to free/revoked/expired, the allowance returns to one.

## Enforcement points

1. `POST /api/notifications/subscription` reads `EON_BILLING_DB`, resolves the server allowance and immediately disables older excess push subscriptions. If the billing binding/schema cannot be read, it fails closed to **one device**.
2. Signed Dodo webhook reconciliation re-reads the resulting entitlement and prunes `EON_IDENTITY_DB` while push rollout is `testing` or `production`.
3. Downgrade/expiry pruning retains the newest allowed active subscriptions by `updated_at DESC` and disables older excess rows. It does not delete account data.
4. If billing has already reconciled but push-device pruning fails while push is active, the webhook asks the provider to retry (`push_device_policy_retry_required`). Billing writes are idempotent, so the retry is for the device-policy side effect, not a second entitlement grant.

## Preview behavior

The checked-in Pages Preview environment currently has no `EON_BILLING_DB` binding. That is intentionally fail-closed: Preview push behaves as Free/Trial = **1 device** unless Codex explicitly creates/binds a Preview billing D1 for paid-plan simulation.

Do **not** bind Production billing data into Preview merely to test multiple-device tiers.

## Production behavior

Production Pages already declares both `EON_IDENTITY_DB` and `EON_BILLING_DB`. After the existing RT86 Production rollout gates are intentionally enabled, new subscriptions and later Dodo lifecycle events enforce the 1/2/3/4/5 policy automatically.

## Codex proof

Run:

```bash
npm run qa:rt87-push-device-cost
npm run qa:rt86-retention-scale
npm run qa:launch95-final
```

Then in a controlled non-production billing test environment prove:

- Free account: enrolling a second browser/device disables the older active push subscription.
- Trial account: remains capped at 1.
- Plus: 2 active, third enrollment disables the oldest.
- Studio: 3.
- Power: 4.
- Max: 5.
- Max -> Plus signed plan-change webhook: active push rows reduce to 2 newest.
- Paid -> expired/revoked: active push rows reduce to 1 newest.
- Browser attempts to submit `tier`, `plan` or `maxActiveDevices`: no effect.
- Missing/unavailable billing ledger: enrollment remains capped at 1.

Production push remains disabled by RT86 source controls until the full owner/browser/Cloudflare proof is green.
