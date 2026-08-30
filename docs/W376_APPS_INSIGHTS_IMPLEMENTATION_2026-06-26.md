# W376 — Apps, official Blueprints and Insights & Forecasts

## What changed

- Apps now has five categories: Workrooms, Blueprints, Insights & Forecasts,
  AI Crew and Connections.
- The App Deck contains 20 versioned official Blueprints, all `1.0.0` and
  free in the local-first product baseline.
- Blueprints use one of 10 official local workflow templates. Every new
  template uses only `local-runner`, simulates work, and has a human review
  checkpoint. No provider is connected or called.
- Insights & Forecasts is an Apps collection. Its cards open the compatible
  `/trade?desk=...` route for Market Intelligence, Business Intelligence,
  Forecast Studio, Research Journal and Local Data Lab.
- `/trade` still visibly presents Market Intelligence. It is no longer a
  first-class shell navigation destination; Apps owns discovery, while `/trade`
  remains a direct/deep link for existing routes, EONBOT and City handoffs.

## No commercial activation

This wave does not configure Razorpay, PayU or any payment processor. It adds
no checkout, price, subscription, account entitlement, webhook, refund,
merchant KYC claim, payout, marketplace or paid-access button.

The commercial direction is documented in
`R4_APPS_BLUEPRINTS_COMMERCE_DECISION_2026-06-26.md`; M-00 remains a
hold-governance lane in the program ledger.

## Validation

```bash
npm run qa:r4-apps-foundation
npm run test:unit
npm run lint
npm run build
npm run smoke:build
```

Passing source gates do not certify Cloudflare Preview, an installed PWA,
browser/mobile rendering, merchant readiness, payment operation, an external
provider connection or update/rollback recovery.
