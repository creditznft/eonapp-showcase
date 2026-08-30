# W718 Independent Certification and Owner Acceptance Runbook

**Source baseline:** W717 commit `763fb77` plus W718 certification machinery.  
**Production:** W700.9 remains unchanged.  
**Rule:** source readiness, the fast suite and static evidence never award the institutional 9.5 score.

## Current registry status

The bounded exact-lockfile install attempted on 2026-07-25 stopped with HTTP 503 while fetching `ws` through the managed npm gateway. The lockfile was unchanged. No alternate Babylon version, CDN replacement or shim was used. This is recorded in `config/w718-dependency-install-attempt.json` as an infrastructure block.

## Fast source lane

Run:

```text
npm run qa:w718-independent-certification-source
npm run verify:w718-fast-suite
```

The fast suite executes every maintained unit file except the 24 maintained files whose static dependency closure reaches `@babylonjs/core`. Those 24 remain in the permanent manifest and must run in the exact lane.

## Exact lane

On Node 22 with a healthy package registry:

```text
npm ci
npm run verify:w718-exact-certification
```

The orchestrator verifies exact Babylon 9.7.0 packages and then runs source authority, security, the complete maintained unit suite, one production build and build smoke. It does not award owner acceptance.

## Browser, device and owner evidence

Capture all nine journeys defined in the master plan, including NEXUS compact/split/full/in-world continuity, all nine City districts, Expanse entry/return, persistence, low mode and reduced motion. Run headed Chromium, Firefox and Edge; desktop, tablet and mobile layouts; keyboard, touch and pointer; screen-reader semantic alternatives; and the 30-minute performance/memory route.

Complete `config/w718-owner-scorecard.json` only with evidence paths. Acceptance requires:

- every pillar at least 9.0;
- weighted score at least 9.5;
- every quantitative gate and journey passed with evidence;
- zero open P0/P1 defects;
- explicit owner approval.

## Handoff to W719

W719 may freeze a candidate only after the exact W718 receipt is successful and the owner scorecard evaluates to accepted. The production build must not be rebuilt between Preview and production.
