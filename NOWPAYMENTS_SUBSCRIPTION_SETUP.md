# NOWPayments subscription setup for EONAPP

## Current plan IDs (use these)
- EON Supporter — $1 / 30 days — **184680164**
- EON Starter — $3 / 30 days — **1883171009**
- EON Core — $5 / 30 days — **1820493070**
- EON Pro — $10 / 30 days — **1436661614**
- EON Creator — $20 / 30 days — **307536143**
- EON Business — $50 / 30 days — **1440207630**

## Exact URLs to paste into NOWPayments
### Payment notifications link
`https://eonapp.ch/api/nowpayments/ipn`

### Successful payment page
`https://eonapp.ch/nowpayments/success`

### Payment failed page
`https://eonapp.ch/nowpayments/failed`

### Partial payment page
`https://eonapp.ch/nowpayments/partial`

## What is wired in the repo
- Verified IPN callback handler at `/api/nowpayments/ipn`
- KV-backed status endpoint at `/api/nowpayments/status`
- Front-end plan mapping for all six public tiers
- Safe return pages that poll verification before local activation
- Renewal extension logic for repeated verified `finished` payments
- Local expiry downgrade back to Free when a NOWPayments-paid term ends on this device

## Current renewal model
- EONAPP treats NOWPayments as the source of truth for paid activations
- A verified `finished` payment activates or extends access on the device
- If the current paid term ends and no new verified payment has arrived, the device downgrades back to Free
- Without NOWPayments email-subscription customer records or billing-service accounts, reminders are **not** automatic from EONAPP itself

## Important note about NOWPayments subscriptions
NOWPayments offers two main recurring flows:
- **E-mail subscriptions**, which require a customer email address for recurring invoice reminders
- **Billing service**, which requires customer accounts / balances managed in NOWPayments

Because the current EONAPP site is local-first and does not yet maintain NOWPayments customer accounts or required customer emails, the repo currently behaves like **verified manual renewals** rather than a full hands-off recurring billing system.

## Cloudflare setup needed
1. Deploy the site on `eonapp.ch`.
2. In Cloudflare Pages / Workers, add the secret `NOWPAYMENTS_IPN_SECRET`.
3. Bind the KV namespace as `NOWPAYMENTS_SUBS_KV`.
4. Redeploy after the binding and secret are in place.

## Safe activation rule
Grant or extend access only when the verified payment status becomes **`finished`**.
