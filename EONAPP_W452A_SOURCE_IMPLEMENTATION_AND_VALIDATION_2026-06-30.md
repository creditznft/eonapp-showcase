# W452.1 Source Implementation and Validation — 2026-06-30

## Scope completed in source

W452.1 closes a discovered active-contract mismatch rather than adding a new
product surface.

- Active App Deck Research Lab cards are canonical `/insights?desk=` links.
- `/trade` and `/trade.html` are retained only as route-contract 301 aliases.
- W376 catalogue validation and its source gate now certify current public
  route truth rather than the retired alias.
- R4 commercial planning now agrees with W450: Dodo Payments is the one
  approval-pending candidate; all commercial flags, checkout and the planned
  seven-day trial remain inactive.

## Validation to run from this checkpoint

```bash
npm run qa:w376-apps-insights
npm run qa:w452-app-shell-quality
npm run qa:w452a-active-canonical-destination
npm run qa:w450-dodo-approval-readiness
node scripts/r4-comm01-graphite-commerce-gate.mjs
node --test tests/unit/r4-comm01-graphite-commerce.test.mjs
```

## Not claimed

This source gate does not prove a deployed redirect, browser history repair,
service-worker adoption, Dodo underwriting, checkout, webhooks, trials,
entitlements, phone testing, or release readiness.
