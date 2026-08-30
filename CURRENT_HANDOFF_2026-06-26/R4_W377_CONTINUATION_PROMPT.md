# Fresh Continuation Prompt — R4 W377

Use this source as the current baseline. Do not deploy or activate payment/referral/merchant systems simply because their planning contracts exist.

## Current source truth

- Apps includes 32 local-first official Blueprints and 16 approval-first local Workflow templates.
- The Blueprint workroom handoff is explicit and local only: Project + Library template + Workflow draft.
- Market Intelligence lives within Apps / Insights & Forecasts; `/trade` remains compatibility-only.
- Commerce and EON Invite are planning-only. No provider is selected.
- W276 data-survival evidence remains NO-GO until real Preview/device update-and-rollback proof exists.

## Next recommended wave

**W378 — Visual Apps/Workroom certification and Blueprint quality pass**

1. Run a real browser walkthrough for Apps on desktop and mobile.
2. Verify every collection filter, selected Blueprint, Pack specification, and “Prepare local workroom” action.
3. Verify the created Project, Library template and Workflow draft persist locally and can be safely deleted.
4. Check keyboard access, reduced-motion behaviour and Graphite default presentation.
5. Curate the first six maintained Pro Pack deliverables only after the free Blueprint quality bar is validated.
6. Keep all commerce, provider, checkout, referral and entitlement flags inactive.

## Required checks before another handover

```text
npm run qa:w377-institutional-blueprints
npm run qa:w376-apps-insights
npm run qa:r4-comm02-global-commerce
npm run qa:r4-program-ledger
npm run lint
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run security:secret-scan
```
