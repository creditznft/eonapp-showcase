# W225 Phase 8 test evidence — 24 June 2026

## Targeted foundation contract

```bash
npm run qa:w225-account-catalog-foundations
```

Result: PASS — 19 tests.

It covers:

- display-safe local account foundation; no credentials, wallet, email, private chat, or server account data in output;
- sensitive-shaped account connection input is rejected without network request or browser storage write;
- future public Realm manifest is allowlisted and inactive, excluding private City state, local showcase data, Vault data, credentials, payment data, attribution, and payout data;
- official catalog, checkout, receipt, delivery, affiliate, payout, token settlement, and user seller marketplace flags remain false;
- new source modules contain no network or browser-storage call;
- Profile, My Realm, and Market state the inactive boundaries truthfully.

## Existing safety regression

```bash
npm run qa:w212-market-links
```

Result: PASS — 21 tests. The W212 Market assertion now verifies the stronger W225 server-truth foundation rather than obsolete one-line copy.

## Full release candidate

```bash
npm run qa:w216-release-candidate
```

Result: PASS.

Included: generated route contract, W217–W225 unit suites, legacy safety regressions, syntax checks, zero-warning lint, production build/smoke, site audit, launch/PWA gates, disabled monetisation checks, and `npm audit --omit=dev` with 0 production vulnerabilities.

Full raw output: `evidence/W225_FULL_RELEASE_CANDIDATE.log`.

## Browser proof

The W225 browser spec is present and Chromium launches through its system-binary fallback, but navigation is blocked in this environment with `ERR_BLOCKED_BY_ADMINISTRATOR`. See `W225_BROWSER_RENDER_LIMITATION_2026-06-24.md`.
