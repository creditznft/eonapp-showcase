# W419 Validation Receipt

**Date:** 2026-06-28

## Passed locally

The following components passed from the final W419 source tree:

```text
npm ci
npm run lint -- --max-warnings=0
npm run qa:w406b-city-art-intake
npm run qa:w419-city-original-vector-art
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run security:secret-scan -- --allow-no-history
npm audit --omit=dev
```

Results:

- lint: pass;
- W405, Share-2, W411/W412, W406B–W419 and W394C gates: pass in the full W419 verifier run;
- current runnable-product unit tests: **382/382 pass**;
- build: pass;
- smoke: pass;
- site audit: pass (43 HTML files scanned);
- launch readiness: pass;
- secret scan: pass;
- production dependency audit: **0 vulnerabilities**;
- build-copy verification: **18/18 SVG art assets** emitted to `dist/assets/city/art/`.

## Combined-run note

A final all-in-one `verify:w419-city-original-vector-art` rerun after handover-document additions reached the execution environment's outer time limit **after** all gates, 382 tests, build and smoke had passed, before repeating site audit/readiness. Those remaining commands were then run separately and passed. This is an environment time limit, not a failed source check.

## Not captured locally

- real browser visual rendering or screenshots;
- desktop/Android/iOS control evidence;
- production Google OAuth session evidence;
- Cloudflare D1 two-device Sync evidence;
- human visual/licence review of final binary 3D art.

Those are deliberately still external proof items, not failed source checks.
