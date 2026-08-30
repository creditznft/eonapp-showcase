# W108E Performance + Route Certification Patch

Date: 2026-06-11
Base: W108D Marketplace + Trust patch

## Mission

Turn the W108 polish wave into a repeatable certification pack instead of a one-off visual patch. The app now has a W108E route-certification manifest, QA gate, generated evidence reports, and a small homepage performance cleanup.

## Product decisions

- Keep the homepage focused on the three public attractions: EON City, EONBOT AI Chat, and AI Cockpit.
- Keep Market first-load experience tied to personal EON City starter NFTs and searchable catalog behavior.
- Keep Marketplace and paid/commercial actions truth-labeled and approval-gated.
- Keep Realm intent-first: the 3D city loader remains explicit-entry / QA-autoboot rather than unconditional heavy first paint.
- Keep IoT Device Lab visible as a safe advanced feature, with no silent real-device control.

## Code changes

### Added

- `assets/js/utils/w108-route-certification.js`
  - Shared W108E route manifest for the ten core routes.
  - Performance-budget constants.
  - User-journey matrix.
  - Helper functions for future QA and Trust Center reuse.

- `scripts/w108-final-certification-gate.mjs`
  - Static route certification gate for first-impression and broken-copy checks.
  - Emits `reports/W108E_ROUTE_CERTIFICATION.json` and `reports/W108E_ROUTE_CERTIFICATION.md`.

- `tests/unit/w108e-route-certification.test.mjs`
  - Verifies route coverage, EON City/Market/Device Lab signals, budgets, and journeys.

- `reports/W108E_ROUTE_CERTIFICATION.json`
- `reports/W108E_ROUTE_CERTIFICATION.md`

### Updated

- `index.html`
  - Removed homepage first-paint loading of Telegram growth/social mission CSS.
  - Removed idle import of the Telegram growth widget from the homepage support bootstrap.
  - Keeps chat support and accessibility autoload deferred after idle.

- `trust.html`
  - Added a W108 certification panel covering first impression, performance contract, and evidence files.

- `scripts/w105-all-route-performance-gate.mjs`
  - Now emits `CodexAuditPack/W105_PERFORMANCE/W105_FINAL_VERIFICATION.json`.
  - This preserves W105 evidence so the W106 integration gate can verify it in fresh source packages.

- `package.json`
  - Added `qa:w108-route-certification`.
  - Added `qa:w108-final`.

## Verification run

Passed:

```text
npm ci
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run qa:w108-route-certification
npm run qa:w105-performance
npm run qa:w106-live-integrations
node --test tests/unit/w108b-ux-compression.test.mjs tests/unit/w108c-realm-device-lab.test.mjs tests/unit/w108d-marketplace-trust-policy.test.mjs tests/unit/w108e-route-certification.test.mjs
npm run qa:w108-final
```

## Evidence generated

```text
reports/W108E_ROUTE_CERTIFICATION.json
reports/W108E_ROUTE_CERTIFICATION.md
CodexAuditPack/W105_PERFORMANCE/W105_ALL_ROUTE_PERFORMANCE_GATE.json
CodexAuditPack/W105_PERFORMANCE/W105_ROUTE_BUDGETS.json
CodexAuditPack/W105_PERFORMANCE/W105_FINAL_VERIFICATION.json
CodexAuditPack/W106_LIVE_INTEGRATIONS_CONTRACTS/W106_FINAL_VERIFICATION.json
```

## Honest boundary

- This patch adds static/source certification and rebuild evidence. It does not run real browser Lighthouse inside this final package step.
- Live `eonapp.ch` is still the old deployed version until this package is deployed.
- `npm ci` still reports existing dependency audit issues: 40 vulnerabilities. I did not run automatic dependency upgrades because dependency updates should be a separate controlled patch.
- Smart contracts, NOWPayments receiver logic, wallet settlement, live trading execution, and Cloudflare secrets were not changed.
