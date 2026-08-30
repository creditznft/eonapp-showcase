# W452 — app-shell canonical-route polish

## Completed source work

- Migrated active UI navigation from the `/chat` and `/chat.html` compatibility aliases to the canonical root `/`.
- Kept incoming legacy Chat routes compatible in the route contract, app-shell state normalizer and signed-link parser; new links and new signed destinations now use the root route.
- Corrected the root Chat default in City, Workspace, EONBOT, Research, profile, support, Telegram, recovery and disabled-status surfaces.
- Tightened the disabled Billing page: Dodo approval in progress, no checkout/trial/payment rail, no wallet/crypto activation lane, no duplicated footer links, and no inactive price-selling wording.
- Changed the authenticated app-shell menu label from “Plans & pricing” to “Billing status” until verified checkout is active.
- Added a W452 source gate that prevents active route documents or reachable runtime modules from emitting legacy Chat navigation destinations.

## Honest boundary

This is a source and build-quality pass. It does not claim visual browser QA, mobile layout approval, service-worker adoption, merchant approval, test checkout, live Dodo webhook proof or production release certification.
