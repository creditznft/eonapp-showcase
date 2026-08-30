# W227 — Legacy Retirement and Release Certification

## Implemented source controls

- Added W227 public product-status and claim-evidence registry.
- Added product-truth verifier covering every canonical, compatibility, and retired route.
- Filled explicit retired redirects for direct legacy root pages: admin, campaign admin, live trading dashboard, tools, trust, wallet risk, and index document entry.
- Replaced diff-only secret scanning with a whole-tree scanner and CI git-history mode.
- Changed CI permissions to read-only, required full history for the scanner, and restored zero-warning lint.
- Replaced obsolete live-mainnet Copilot instructions with the frozen W227 no-go boundary.
- Archived stale browser suites that asserted Pool Points, token swaps, subscriptions, referral leaderboard/builder growth, and live-trading dashboard behavior.
- Added W227 source and browser regression tests for Phase 1 routes, Phase 2 shell behavior, Share Center, and legacy retirement.

## Honest remaining boundary

Source certification is not production-browser proof. This runtime cannot navigate EONAPP through Chromium because local/public navigation is administrator-blocked, so browser/device/Cloudflare proof remains required in CI or a permitted local environment.

## Final certification refinements

- Added an explicit current-product `test:unit` manifest and retained the former wildcard suite as `test:unit:legacy-diagnostic` only.
- Corrected the secret-scan CLI parser so both `--mode ci` and `--mode=ci` invoke the real CI history mode.
- Added a W227 browser command for the shell/route regression spec and documented the administrator-blocked navigation result.
- Added W227 final handover/verification documentation, including exact external CI/Preview requirements and rollback guidance.
