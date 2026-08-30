# W452.1 Changed Files — Active Canonical Destination Hygiene

## Purpose

Finish a real legacy-cleanup seam found during the W451/W452 audit: the public
Research Lab cards had already migrated to `/insights`, but an old App Deck
validator, its source gate, and the old R4 processor-decision records still
asserted `/trade`, Razorpay, or Cashfree.

## Changes

- Corrected the App Deck validation contract so its five Research Lab cards
  must use canonical `/insights?desk=` routes.
- Preserved `/trade` and `/trade.html` only as `301` inbound compatibility
  redirects in the central route contract.
- Updated W376's historical catalogue gate to certify canonical public
  Research Lab behaviour while treating `trade.html` only as the physical build
  source behind `/insights`.
- Updated R4 commercial governance to point to the W450 Dodo
  approval-pending decision. No fallback processor is queued, and no payment,
  checkout, free trial, webhook, entitlement or public price is activated.
- Added W452.1 as a narrow regression gate for active App Deck Research Lab
  routes, redirect-only legacy aliases, and single-candidate Dodo status.

## Still not claimed

No deployment, browser redirect proof, merchant approval, Dodo checkout,
webhook, trial, entitlement, customer portal, device proof, or release
certification occurred in this source wave.
