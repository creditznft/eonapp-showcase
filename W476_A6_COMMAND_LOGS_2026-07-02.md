# W476-A6 verification command log

Executed against the packaged source baseline on 2026-07-02 (Asia/Kolkata).

| Command | Result |
|---|---|
| `npm ci --ignore-scripts --no-audit --fund=false` | Pass |
| `npm run lint -- --max-warnings=0` | Pass |
| `npm run release:verify` | Pass; includes W476-A1 through W476-A6 source gates |
| `npm run test:unit` | Pass; 527 passed, 0 failed |
| `npm run build` | Pass; 286 output files |
| `npm run smoke:build` | Pass; 21 smoke-checked files |
| `npm run audit:site` | Pass; 43 HTML, 3 tools, 1 games; sitemap and precache present |
| `npm run launch:readiness` | Pass; source readiness had no blockers or warnings |
| `npm run audit:w476-a6` | Pass; full and production raw `npm audit` both report 0 vulnerabilities |

## Evidence boundary

These are source and local-build checks. They do **not** prove a deployed browser session, production CSP report retention, Cloudflare configuration, OAuth return behavior, real-device behavior, or payment readiness. Those remain W476-B and later evidence gates.
