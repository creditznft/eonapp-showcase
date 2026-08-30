# W616D Validation Receipt

All validation was run from `/mnt/data/eon_w616d_work` after unpacking the W616C source ZIP.

## Commands and outcomes

- `npm ci` — passed; 0 vulnerabilities.
- `npm run qa:w616d-locked-feature-surfaces` — passed; gate 12/12, tests 5/5.
- `npm run qa:w616c-locked-feature-resolver` — passed; gate 10/10, tests 6/6.
- `npm run qa:w616b-eon-keys-referral` — passed; gate 9/9, tests 8/8.
- Focused combined unit set — passed; 24/24.
- `npm run lint -- --max-warnings=0` — passed.
- `npm run build` — passed.

## Build receipt

Production build completed with:

- `distFiles`: 444
- `distributionSha256`: `ace025bdc00ab8c304fd68c6d6e78667c74fa9c567d6b3f5c5ca2a6a4b53516f`

## Evidence logs

See `EVIDENCE/W616D_LOCKED_FEATURE_SURFACES_2026-07-10/`.
