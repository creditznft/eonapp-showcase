# UX-3 Language Matrix and Voice Validation Receipt — 2026-06-28

## Commands run and actual results

| Command | Result |
|---|---|
| `npm run lint -- --max-warnings=0` | PASS |
| `npm run qa:w394b-multilingual-voice` | PASS (9/9 static checks; 3/3 subtests) |
| `npm run qa:w394c-language-matrix` | PASS (11/11 static checks; 3/3 subtests) |
| `npm run test:unit` | PASS (334/334) |
| `npm run build` | PASS (222 output files; minified 7,486,472 → 4,069,818 bytes) |
| `npm run smoke:build` | PASS (24 required files plus assets) |
| `npm run audit:site` | PASS (43 HTML files; sitemap and precache verified) |
| `npm run launch:readiness` | PASS (no blockers; no warnings) |

## Combined verifier note

`npm run verify:ux3-language-voice` completed lint, W394B, W394C and the full 334/334 unit segment. The outer execution wrapper timed out after it entered its build stage. The build, smoke, site audit and readiness commands were then rerun separately and passed as recorded above. This is an environment time-limit note, not a claim that a single-command run completed end-to-end.

## Evidence boundary

Static and build checks are not a browser/device certification. Browser speech support, microphone permission, actual recognition quality, real mobile layout and localized visual proof still require the manual device evidence listed in the approved proof checklist.
