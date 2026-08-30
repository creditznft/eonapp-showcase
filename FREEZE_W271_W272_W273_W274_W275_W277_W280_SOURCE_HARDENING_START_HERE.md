This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# W271/W272/W273/W274/W275/W277/W280 Source Hardening Freeze — Start Here

## What this freeze is

A source-only, release-hardening handover. It includes seven verified source baselines:

- W271-A0 accessibility/i18n source coverage;
- W272-A0 CSP/network/supply-chain source controls;
- W273-A0 City sensory controls (default-off);
- W274-A0 finite local City scripted guide;
- W275-A0 PWA cache/update boundaries;
- W277-A0 local default-off privacy diagnostics;
- W280-A0 public support narrative routing and boundary.

It does **not** make EONAPP launch-ready, deployable-by-default, externally audited, or eligible for chain/referral/beta activation. W260 remains **NO-GO**.

## Reproduce

```bash
npm ci
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w271-accessibility-i18n
npm run qa:w272-security-supplychain
npm run qa:w273-city-sensory-accessibility
npm run qa:w274-city-scripted-guide
npm run qa:w275-pwa-asset-policy
npm run qa:w277-privacy-measurement
npm run qa:w280-public-support-narrative
npm run qa:current-static-certification:tail
```

## Latest receipts

- 244/244 approved unit tests pass.
- ESLint has zero warnings.
- Production build emits 193 files.
- `npm audit --omit=dev --audit-level=high` reports zero production vulnerabilities.
- W260 NO-GO and inactive referral/milestone boundaries are preserved.

## Lighthouse rule

Do not use this sandbox for score collection. Its Chromium process returned `chrome-error://chromewebdata/` and `NO_NAVSTART` after the local server was ready. That is an environment block; it is neither a score nor an app-performance verdict.

## Stop conditions

Do not enable referral/milestone behavior, mutate Cloudflare/D1, add browser chain runtime, claim a beta/launch, or mark external evidence complete from this freeze.
