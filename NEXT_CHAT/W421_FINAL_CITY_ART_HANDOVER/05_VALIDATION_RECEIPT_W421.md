# W421 Validation Receipt

**Date:** 2026-06-28

## Passed from the final W421 source tree

```text
npm ci
npm run lint -- --max-warnings=0
npm run qa:w419-city-original-vector-art
npm run qa:w420-city-cinematic-art-direction
npm run qa:w421-city-art-review
npm run qa:w418-final-flagship-audit
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run security:secret-scan -- --allow-no-history
npm audit --omit=dev --audit-level=high
```

Results:

- lint: pass;
- W419 art gate: **9/9** pass;
- W420 composition gate: **7/7** pass;
- W421 art-review gate: **8/8** pass;
- W418 flagship audit gate: **8/8** pass;
- current runnable-product unit suite: **388/388** pass;
- production build: pass;
- smoke: pass (24 required files);
- site audit: pass (43 HTML files; sitemap/precache verified);
- launch readiness: pass;
- secret scan: pass;
- production dependency audit: **0 vulnerabilities**;
- build output carries the full **18/18** SVG City art files at `dist/assets/city/art/`.

## Combined-run limitation

`npm run verify:w421-city-art-review` completed all included gates and the 388-test suite, then the restricted execution environment stopped it as it entered its repeated build stage. The final source was then rebuilt and separately passed build, smoke, audit, readiness, secret scan and production dependency audit. This is an environment execution-limit note, not a failed source test.

## Deliberately not claimed

- real browser screenshot/video evidence;
- desktop/Android/iOS City visual/control evidence;
- production Google OAuth proof;
- Cloudflare D1 two-device Sync proof;
- human review of final binary GLB/KTX2 art.

## Fresh archive reproducibility

The sealed W421 source archive was extracted into a new directory and checked against its source manifest:

- 2,387 manifest entries verified with no missing file, byte-size or SHA-256 mismatch;
- no package entry contained `node_modules`, `dist`, artifacts, cache/report folders, environment files, nested ZIPs or checksum files;
- fresh `npm ci` passed;
- fresh W421 gate passed;
- fresh current unit suite passed: **388/388**;
- fresh production build, smoke, site audit and launch readiness passed;
- fresh build output contained **18** original SVG City art files at `dist/assets/city/art/`.

`npm ci` reports development dependency advisories in this repository; the separately run production dependency audit remains **0 vulnerabilities** with `npm audit --omit=dev --audit-level=high`.
