# W628 Owner/Codex Real Dodo Lifecycle Proof Runbook

Date: 2026-07-11  
Purpose: collect genuine provider, Cloudflare D1 and browser evidence without exposing secrets or customer payment data.

## Preconditions

1. Work only from the W628F authoritative source fingerprint and committed source revision named in the validation receipt.
2. Use the production Cloudflare project and intended D1 binding.
3. Keep `.env.local`, API keys, webhook secret, entitlement signing key, cookies and raw webhook bodies out of evidence.
4. Use a clearly identified owner-controlled customer account and the smallest permitted real transaction path.
5. Do not synthesize a provider-origin webhook as proof. A synthetic signed event may be used only as a separately labelled diagnostic.

## Source certification first

```bash
npm ci
npm run verify:codex-predeploy
```

## Required real evidence lanes

1. **Checkout:** signed-in owner selects one tier; D1 contains the pre-provider checkout attempt; browser opens an allowlisted Dodo hosted checkout; no entitlement appears before webhook delivery.
2. **Provider webhook:** Dodo sends the event with real `webhook-id`, timestamp and signature headers; EONAPP returns 2xx only after durable processing.
3. **D1 lifecycle:** billing event, checkout attempt, lifecycle row and compatibility entitlement row agree on redacted references and event ordering.
4. **Activation:** tier, trial state and period dates appear after webhook reconciliation; a new browser session reads the same server state.
5. **Portal:** signed-in owner opens the real Dodo customer portal and returns safely to Billing.
6. **Cancellation/reactivation:** schedule period-end cancellation, verify access remains until the provider period end, then reactivate where supported; UI changes only after provider webhook events.
7. **Plan change:** prove one upgrade and one downgrade rule using the approved owner account or provider-safe test path. Record immediate versus next-billing-date behavior.
8. **Failure/reversal:** capture provider-safe evidence for failed payment, expiry, refund and dispute handling. Never intentionally create abusive chargebacks solely for testing; use provider-supported sandbox/test evidence where a destructive real event is inappropriate.
9. **Resilience:** replay the same real event id, deliver an older real/test event after a newer one, reject a forged signature, recover a partially processed event, and prove the state is not widened.
10. **Receipt/tax/support:** verify safe provider invoice/receipt links, tax display, redacted support export and rollback instructions.

## Evidence redaction

Evidence may contain:

- proof lane name;
- UTC timestamp;
- HTTP status;
- redacted event type;
- one-way digest;
- duplicate/out-of-order booleans;
- redacted D1 row counts and state names.

Evidence must not contain:

- card data;
- customer email or address;
- API keys, signing keys or webhook secret;
- raw webhook payload;
- session cookies;
- complete provider customer, subscription or payment identifiers.

## Certification decision

Keep verdict `no-go-real-dodo-lifecycle-evidence-pending` until all 17 rows in `config/w628-billing-certification-board.json` pass. Source strings, mocks, local unit tests, screenshots of the Dodo dashboard alone and synthetic events are not real billing certification.
