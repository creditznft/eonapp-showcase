# W255 — City parity registry

**Status:** local-static complete on 2026-06-25. External Preview, device and human task evidence remain open.

## Outcome

City Lite, Visual Tour and Babylon Play now consume one source-controlled landmark identity and action contract. This replaces parallel route tables that could drift across renderers.

## What changed

- Added `assets/js/city/city-landmark-registry.js` as the canonical seven-landmark registry.
- Preserved the existing seven persistent City state IDs so historic local visits and First Circuit progress remain compatible.
- Derived the five actionable internal routes from that registry: `/chat`, `/projects`, `/workspace`, `/realm-studio`, `/local-ai`.
- Corrected the stale Realm action from retired `/realm` to canonical `/realm-studio`.
- Kept Preview Gallery and Vault Safehouse intentionally inert; neither can become a hidden marketplace, wallet, credential, commerce, reward or provider path.
- Moved City Lite, Visual Tour and Babylon Play to shared prepare → review → separate confirm actions. No mode navigates automatically.
- Updated historical tests that had asserted duplicated route-table text instead of the registry contract.

## Non-goals

- No new renderer, district, asset pack, city economy, rewards, wallet, contract call, provider access, credential access, payment flow, publishing, multiplayer or background simulation.
- No change to the local City progress data schema or stored district IDs.

## Evidence

- 182/182 approved current-product tests passed.
- Zero-warning lint passed.
- Production build passed.
- W239/W242/W243/W244/W247/W248/W249/W250/W251/W252/W253/W254/W255 gates passed.
- Static PWA/readiness/site/page/identity/quality/secret/dependency checks passed.

Evidence logs: `EVIDENCE/W255_CITY_PARITY_REGISTRY_2026-06-25/`.

## Open proof

This wave has not proven Android, iPhone, desktop browser, PWA update/rollback, human visual acceptance or production deployment behavior. Those remain W259/W260 obligations.
