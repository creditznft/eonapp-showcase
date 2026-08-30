# W476-A6 Quality Gate Report — 2026-07-02

## Result

**SOURCE + LOCAL VERIFICATION PASS. RELEASE CERTIFICATION REMAINS BLOCKED.**

This package is a clean source/evidence handoff. It is not a claim that these Functions or headers are deployed on `https://eonapp.ch`, that a browser has delivered a CSP report, or that any local runtime/device has passed.

## Delivered

- Explicit `API_SURFACE_CONTRACT.json` generation for all **18 deployed Functions**: 17 `/api/*` routes plus `/csp-report`.
- **33 negative cases** covering disabled, unconfigured, wrong-origin, malformed, oversize and invalid inputs.
- CSP collector supports legacy `application/csp-report` and modern `application/reports+json`; it rejects foreign document origins and retains only directive, redacted document path and blocked origin.
- `Reporting-Endpoints: csp-endpoint="/csp-report"` added alongside the existing `Report-To` fallback and CSP `report-to` / `report-uri` directives.
- Deterministic package-lock SBOM, production component list, raw audit runner and candidate external-origin inventory.
- Wrangler lock upgraded to **4.106.0**. Narrow lockfile overrides remediate the remaining vulnerable tooling chain without touching production application dependencies.
- Future local creator image/video programme added as W479-M, including non-technical device-first onboarding and light image-to-video through high-end local video tiers. No media adapter is claimed connected.

## Passed commands

| Command | Result |
|---|---|
| `npm ci --ignore-scripts --no-audit --fund=false` | PASS |
| `npm run lint -- --max-warnings=0` | PASS |
| `npm run release:verify` | PASS — includes W476-A1 through W476-A6 gates |
| `npm run test:unit` | PASS — 527 passed, 0 failed |
| `npm run build` | PASS — 286 dist files |
| `npm run smoke:build` | PASS — 21 required build files |
| `npm run audit:site` | PASS — 43 HTML files, tools/games/sitemap/precache checks |
| `npm run launch:readiness` | PASS — no blockers/warnings in source readiness check |
| `npm run audit:w476-a6` | PASS — full audit 0; production audit 0 |

## Final local audit result

| Scope | Vulnerabilities |
|---|---:|
| Full lockfile/tooling | 0 |
| Production dependencies (`--omit=dev`) | 0 |

The earlier six advisories were all development/deployment-chain findings. Updating the compatible Wrangler lock and applying focused overrides removed the remaining Vite/ESLint/Lighthouse transitive findings. The production audit was 0 before and after this lock repair.

## Evidence written

`EVIDENCE/W476_A6/` contains:

- `API_SURFACE_CONTRACT.json`
- `API_NEGATIVE_TEST_MATRIX.json`
- `API_SURFACE_GATE.json`
- `SBOM_PACKAGE_LOCK.json`
- `SBOM_PRODUCTION_COMPONENTS.json`
- `EXTERNAL_ORIGIN_INVENTORY.json`
- `RELEASE_EVIDENCE_GATE.json`
- `NPM_AUDIT_FULL.json`
- `NPM_AUDIT_PRODUCTION.json`
- `NPM_AUDIT_SUMMARY.json`

## Release-blocking findings carried forward honestly

- Production Function method/negative testing: **NOT RUN**.
- Production Reporting API header and synthetic CSP delivery/redaction: **NOT RUN**.
- Browser console/CSP/network review: **NOT RUN**.
- Candidate source inventory is not a live network inventory. It currently records broad `https:` CSP allowances, **270 unreviewed observed source literals**, and **9 legacy local literals** outside the W476 Local AI loopback contract. These require W476-B/W477 review/removal/proof; they are not trusted runtime permissions.
- Ollama, LM Studio and Jan production browser CSP/CORS/PNA proof: **NOT RUN**.
- Physical device proof, service-worker update/rollback proof, OAuth lifecycle proof and City playable proof: **NOT RUN**.
- Local image/video model execution: **NOT IMPLEMENTED**.
- Dodo/payment remains blocked until W479.5 obtains real non-payment certification evidence.
