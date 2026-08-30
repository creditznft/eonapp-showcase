# W286-B2 / W289 / W290 — package validation

## Scope

- Parent source: W286-B1 City Agent Presence source hardening, 25 June 2026.
- New source work: live-work command-loop huddles plus an external-evidence/recertification board.
- Release state: **W260 NO-GO preserved**.

## Verification receipt

| Check | Result |
|---|---|
| Current approved unit suite | PASS — 273/273 tests |
| W286-B1 agent-presence gate | PASS |
| W286-B2 live-work-command gate | PASS |
| W289/W290 evidence-board gate | PASS |
| ESLint | PASS — zero warnings |
| Production build | PASS — 195 product output files plus build receipt |
| City regression gates | PASS — existing City safeguards preserved |
| Referral/Cloudflare decision gates | PASS — inactive / evidence-only preserved |
| Static release tail | PASS — smoke, audit, PWA, page/identity/quality, secret scan, production dependency audit |
| Workspace secret scan | PASS — no potential secrets |
| Production dependency audit | PASS — 0 known production vulnerabilities |

## Lighthouse truth

No Lighthouse score is included. The current sandbox’s managed Chromium remains environment-blocked (`chrome-error://chromewebdata/` / `NO_NAVSTART`). W282 must be collected on a normal desktop/mobile browser environment with raw artifacts retained outside Git.

## Orchestration note

The combined core runner is subject to a five-minute environment ceiling. Its initial run completed route sync, the full 273-test suite, W216, W228 and W234–W238 before its ceiling. The remaining source stages were then replayed in bounded groups and passed, including W145, syntax, zero-warning lint, build, W239/W242/W247, W259, W263–W289, W260, W267/W268, W271–W277, W280, R3-F1 and R3-F2. The static release tail also passed. This package does not represent the truncated wrapper itself as a complete certification.

## Archive policy

The final source archive excludes `node_modules`, `dist`, `.git`, artifacts, coverage, caches, logs, temporary folders, Playwright/Lighthouse output, Hardhat cache/artifacts, `.env*`, secret files and nested archives. It contains source, tests, documentation, package metadata and the SHA-256 source manifest only.
