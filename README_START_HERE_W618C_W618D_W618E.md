# Start Here — W618C/W618D/W618E

Use this package after W618B.

## What is done

W618C makes `/eoncity` default to a usable **EON Command Room** cockpit.
W618D adds truthful **Living City Dashboard** signal projection.
W618E adds launch-safe **Agent Theater** foundations.

## Current product truth

EON City direction is now:

```text
Command Room first
3D Explore second
Living Dashboard truthful signals
Agent Theater dormant by default, active only from receipt-backed job signals
```

No browser/visual proof is claimed yet. W618F is required next.

## First verification commands

```bash
npm ci
npm run qa:w618c-eon-command-room-default
npm run qa:w618d-living-dashboard-signals
npm run qa:w618e-agent-theater-foundations
npm run qa:w618b-share-command-center-shell
npm run qa:w618a-eon-city-command-world
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run launch:readiness
npm run launch:page-gate
npm run launch:identity-gate
npm run launch:quality-gate
npm run security:secret-scan -- --allow-no-history
```

## Next coding/proof wave

W618F must use a real browser/device proof harness:

```text
Open /eoncity in Chrome/Edge.
Verify Command Room appears by default.
Click every Command Room screen.
Test shortcuts C/P/F/S/L/A/V/H/M/R/Escape.
Enter 3D Explore.
Click/tap district signals.
Test mouse movement and click travel.
Test sidebar and top-right Share Center.
Test mobile portrait and landscape.
Test service-worker/cache update safety.
Capture screenshots and proof JSON.
```

Do not resume Dodo/server activation until W618F proof passes.
> historical-only
Use `CURRENT_PRODUCT_START_HERE.md` for current instructions.
Historical provenance is preserved in `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.
