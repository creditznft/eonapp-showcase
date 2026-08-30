# W286-B1 City Agent Presence — package validation

## Baseline

- Parent source: W265/W283/W284/W286 freeze on 25 June 2026.
- Scope: source-only Agent Presence Bridge and CEO/evidence/Codex handover.
- State: W260 remains **NO-GO**.

## Verification receipt

| Check | Result |
|---|---|
| Current approved unit suite | PASS — 269/269 tests |
| New W286-B1 focused gate | PASS — 3/3 focused tests |
| ESLint | PASS — zero warnings |
| Production build | PASS — 195 distribution files |
| City regression set W248–W255 + W259 | PASS |
| W260 release board | PASS — NO-GO preserved |
| Static release tail | PASS — smoke, audit, PWA, page/identity/quality, secret scan, production dependency audit |
| Workspace secret scan | PASS — no potential secrets |
| Production dependency audit | PASS — 0 known vulnerabilities |

## Lighthouse truth

No score is included. This sandbox previously produced `chrome-error://chromewebdata/` / `NO_NAVSTART`; W282 must run on a normal browser-capable desktop/mobile environment with raw artifacts retained outside Git.

## Reproducibility note

The package lockfile is unchanged from the prior verified freeze. The environment rejected a new `npm ci` request at the runner layer, so lint/build used the lock-identical dependency tree from the immediately preceding verified workspace. Codex must perform a fresh `npm ci` before merge/deploy work and compare its result with this source manifest.

## Orchestration ceiling receipt

The all-in-one core wrapper reached the environment’s five-minute ceiling only after route sync, the complete **269/269** unit suite, W216 and W228 passed, while entering the legacy closure sequence. This is not represented as a complete wrapper pass. The remaining source/release stages were then rerun in bounded groups and passed: W234–W238, W145, W216 syntax, W239, W242, W247, W259, W263–W288, W260, W267/W268, W271–W277, W280, R3-F1 and R3-F2. The static release tail also passed.

## Build-output counting note

`npm run build` reports **195 product output files**. A subsequent filesystem count is **196** because `dist/.eon-build-report.json` is a build receipt produced after the product-output count; it is not a second product page or asset.

## Archive policy

The final source archive excludes `node_modules`, `dist`, `.git`, artifacts, coverage, caches, logs, temporary folders, Playwright/Lighthouse output, Hardhat cache/artifacts, `.env*`, secret files, and nested archives. It contains source, tests, documentation, package metadata, and the SHA-256 manifest only.
