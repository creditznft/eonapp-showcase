# W422 Validation Receipt

**Baseline:** W421 source archive only  
**Validated source:** W422 deep original art polish  
**Scope:** code/source validation, not device/OAuth/Sync/final-3D-art proof

## Completed individual checks

| Check | Result | Notes |
|---|---|---|
| `npm ci` | PASS | clean dependency install; dev audit notice is recorded separately |
| `npm run lint -- --max-warnings=0` | PASS | no lint warnings |
| W405 identity/city rescue gate | PASS | prior boundaries retained |
| W412 fail-closed Sync transport gate | PASS | no Sync activation claim |
| W417 asset-release preflight | PASS | final binary art remains separately gated |
| W418 flagship audit | PASS | final-art/device proof boundary retained |
| W419 original vector art | PASS | foundation remains intact within expanded catalog |
| W420 cinematic direction | PASS | bounded local art profiles retained |
| W421 Art Review | PASS | original review surface retained and expanded |
| W422 deep-art gate | PASS, 10/10 | 58 assets, 5 chapters, 33 placements, 10 views |
| `npm run test:unit` | PASS, 393/393 | W422 test is in the counted current product suite |
| `npm run build` | PASS | 309 dist files; 58 City SVG assets emitted |
| `npm run smoke:build` | PASS | required build output present |
| `npm run audit:site` | PASS | 43 HTML files, routes/precache verified |
| `npm run launch:readiness` | PASS | static source readiness only |
| `npm run security:secret-scan -- --allow-no-history` | PASS | no potential secrets detected |
| `npm audit --omit=dev --audit-level=high` | PASS | 0 production vulnerabilities |

## Combined verifier

`npm run verify:w422-city-deep-art` completed lint, all named predecessor/W422 gates, secret scan, and **393/393** tests. The restricted execution environment stopped it after it entered its repeated build stage. This is not recorded as a combined-command pass. The same final source passed build, smoke, site audit, and launch readiness individually above.

## External evidence still mandatory

This receipt does **not** certify final binary art, human art/rights review, real-device visual/performance proof, production Google OAuth, D1 two-device Sync, or deployment status.

## Fresh archive reproduction

The sealed W422 source archive was extracted into a clean directory. Its embedded manifest verified with **0 missing files, 0 hash mismatches, and 0 forbidden package artifacts**. From that extracted copy, `npm ci`, the W422 gate, **393/393** current product tests, production build, smoke check, site audit, launch readiness, secret scan, and production dependency audit all passed. The fresh production build emitted exactly **58** City SVG assets under `/assets/city/art/`.
