# W476-A6 — API, CSP, SBOM and Release Evidence

**Status:** source implementation complete; release remains blocked pending W476-B/W477/W478/W479 evidence.  
**Scope:** explicit Pages Function contract, CSP report validation, package-lock SBOM, raw-audit runner, candidate external-origin inventory and release-system evidence.  
**Exclusions:** payment/Dodo, checkout, billing, wallets, token/NFT, reward/payout, referral grant, provider credential, production deployment, browser/device proof, and local image/video adapter activation.

## Delivered source controls

- `config/w476-api-surface-contract.mjs` describes all **18 deployed Functions**: 17 `/api/*` routes plus `/csp-report`.
- Each route has its accepted methods, conditional/disabled state, identity/origin guard, data class, sensitive-data exclusion and negative cases.
- `scripts/w476-api-surface-contract-gate.mjs` confirms source/handler alignment and writes an auditable contract plus negative-test matrix to `EVIDENCE/W476_A6/`.
- `/csp-report` accepts the legacy `application/csp-report` JSON form and the Reporting API `application/reports+json` array form. It bounds size, rejects foreign document origins, strips query/fragment/resource details, and has no-store responses.
- `_headers` and `public/_headers` now declare both the modern `Reporting-Endpoints: csp-endpoint="/csp-report"` header and the existing `Report-To` fallback, while CSP retains `report-to csp-endpoint; report-uri /csp-report`.
- `scripts/w476-a6-release-evidence-gate.mjs` produces package-lock SBOM and candidate origin evidence without treating these as live deployment proof.
- `scripts/w476-a6-supplychain-audit.mjs` records raw full and production `npm audit --json` output. It fails on audit execution failure, production vulnerability, or full high/critical vulnerability; it never turns a failed audit into a fake green status.

## Evidence boundary

The source gate deliberately remains **not** a production release certification. It does not prove that Cloudflare deployed the Function files, that browser Reporting API delivery succeeds, that the endpoint header arrives from production, that a live CSP violation is recorded/redacted, that Local AI loopback CORS/PNA works, or that any device/browser works.

The external-origin inventory scans candidate browser/runtime source and excludes documentation, archives, tests, build scripts and dependencies. It is a map, not a network allow decision. In the current source it will surface broad `https:` CSP allowances, unreviewed observed literals and legacy local endpoints. Those findings block release approval and flow into W476-B/W477; they are not silently marked as safe.

## Commands

```bash
npm run qa:w476-a6-api-surface
npm run qa:w476-a6-csp-reporting
npm run qa:w476-a6-release-evidence
npm run audit:w476-a6
npm run release:verify
```

`npm run audit:w476-a6` must be run after any lockfile update. The generated evidence reports the actual raw audit status rather than assuming production dependencies and development/deploy tooling are equivalent.

## Local Creator Media programme

The deeper creator-focused image/video roadmap is recorded in `docs/W479M_LOCAL_CREATOR_MEDIA_PROGRAMME.md`.

It explicitly includes a non-technical “Choose your device” setup journey, lightweight image-to-video through high-end local video tiers, separate runtime adapters, device capability grades, local-first outputs, and truthful no-fallback rules. It does **not** claim that image or video local generation is wired today.
