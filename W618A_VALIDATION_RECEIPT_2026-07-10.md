# W618A Validation Receipt

Validation was run from `/mnt/data/eon_w617b_source_stage` after applying W618A changes on top of the W617B source package.

## Commands and outcomes

- `npm ci` — passed; 0 vulnerabilities.
- `npm run qa:w618a-eon-city-command-world` — passed; gate 15/15 and tests 5/5.
- `npm run qa:w617b-launch-master-plan` — passed; gate 14/14 and tests 6/6.
- `npm run qa:w617a-shell-launch-readiness` — passed; gate 10/10.
- `npm run qa:w616d-locked-feature-surfaces` — passed; gate 12/12 and tests 5/5.
- `npm run qa:w616c-locked-feature-resolver` — passed; gate 10/10 and tests 6/6.
- `npm run qa:w616b-eon-keys-referral` — passed; gate 9/9 and tests 8/8.
- `node scripts/w607-city-gameplay-contract-gate.mjs` — passed.
- `node --test tests/unit/w607-city-gameplay-contract.test.mjs tests/unit/w618a-eon-city-command-world.test.mjs` — passed; 9/9.
- `npm run lint -- --max-warnings=0` — passed.
- `npm run build` — passed.
- `npm run smoke:build` — passed.
- `npm run launch:readiness` — PASS, 0 blockers, 0 warnings.
- `npm run launch:page-gate` — PASS, 0 blockers, 0 warnings.
- `npm run launch:identity-gate` — PASS, 0 blockers, 0 warnings.
- `npm run launch:quality-gate` — PASS, 0 blockers, 0 warnings.
- `npm run security:secret-scan` — PASS.

## Build receipt

Production build completed with:

- `distFiles`: 444
- `distributionSha256`: `31d5f466823257d98d37e94e8383c2d62880010acc8a18c2ffa729eef394ade2`

## Boundary notes

This is source/build validation only. W618A fixes the source-level control convention, default mouse travel, City UI wiring and account-return URL cleanup, but it is not a replacement for live browser proof. W618F remains required for desktop Chrome/Edge, mouse, keyboard, mobile, return-route and cache proof.
