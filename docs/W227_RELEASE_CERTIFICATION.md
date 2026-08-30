# W227 — Legacy Retirement and Release Certification

## Purpose

W227 closes source-controlled release work after W226's commercial no-go decision. It does **not** declare production launch approval.

## Source-controlled completion targets

- whole-tree secret scan, plus reachable git-history scan in CI;
- route/status/claim evidence registry;
- explicit public handling for every root HTML surface;
- archival of browser tests that assert disabled Pool Point, token swap, subscription, referral-leaderboard, builder-growth, or live-trading products;
- W217/W218 route and shell regression coverage;
- zero-warning lint, build, static/PWA checks, and data-survival gates;
- source manifest, checksum, and rollback procedure in the handover.


## Test-contract policy

`npm run test:unit` now runs the explicit current-product suite (W217–W227 plus the active privacy, PWA, signed-link, City, and disabled-commerce boundaries). The prior wildcard suite remains available as `npm run test:unit:legacy-diagnostic` for migration archaeology only. It is not a release gate because it asserts retired Pool Point, token, reward, payout, prefilled-market, and legacy dashboard behavior that conflicts with the frozen W217 product contract.

## External proof still required before production sign-off

1. GitHub branch protection on `main` with required checks and review policy.
2. CI run with `fetch-depth: 0` proving the history scanner against the real repository history. This handover archive does not contain usable Git history, so a local `security:secret-scan:ci` run is expected to stop rather than give a false pass.
3. Cloudflare Pages Preview and production route matrix: desktop, mobile portrait, and mobile landscape.
4. Browser proof for Chat drawer/composer, Share Center, Market generation, City 2D/3D fallback, Realm save/share, Vault recovery, and disabled commercial surfaces.
5. PWA install, update, rollback, offline recovery, and persisted-data test on physical devices. Run `npm run qa:w227-shell-route:browser` against a permitted Preview/CI browser environment for the new Phase 1/2 regression coverage.
6. Accessibility, Lighthouse, CSP/security-header, and console-error proof from a permitted browser environment.

## No-go boundary

W227 must not activate affiliate tracking, rewards, payouts, checkout, account publication, public user commerce, token transfers, Pool Point conversion, or any “earn by sharing” mechanism. Invite & Share Center remains a signed invitation and local campaign-draft tool only.

## Verified source evidence in this handover

| Evidence | Result | Boundary |
|---|---|---|
| `npm run test:unit` | Pass — 106 checks | Explicit current-product suite only; the wildcard legacy suite is diagnostic-only. |
| `npm run qa:w216-release-candidate` | Pass | Route truth, shell, Share Center, EONBOT, Market, City/Realm/3D parity, disabled commerce, lint/build/PWA/static gates, and production dependency audit. |
| `npm run qa:w227-product-truth` | Pass — 129 route states, 7 claims | Every root HTML surface is canonical, system-only, or explicitly retired; all listed active claims have evidence. |
| `npm run security:secret-scan` | Pass — whole tree | Repository text scan runs even without a diff and masks any detected value. |
| CI history scanner | Algorithm proven in a disposable Git fixture | The extracted handover intentionally fails CI-history mode because it does not contain usable Git history; the GitHub workflow uses `fetch-depth: 0`. |
| Playwright W227 discovery | Pass — 3 tests discovered | Browser execution launched Chromium but `localhost` navigation was blocked by administrator policy. No visual/interaction result is claimed. |
| Data survival source proof | Pass | W145 update-safe storage and W209 encrypted backup boundary tests pass; real-device export/restore and deployment-update proof remain external. |

## Phase status at source level

| Phase | Source status | Production/browser status |
|---|---|---|
| 0 — safety/truth baseline | Complete where a source handover can prove it: W226 baseline manifest, whole-tree scan, product-status/evidence registry, data-safety tests | Protected branch, real repository history scan, and representative device export remain external |
| 1 — routes/legacy retirement | Complete | Browser route proof pending permitted Preview/CI |
| 2 — Chat-first shell/themes/Share Center | Complete | Desktop/tablet/mobile interaction proof pending permitted Preview/CI |
| 3–9 | Complete as implemented, disabled-policy-safe source contracts | Feature/browser/device proof pending where listed above; no commercial activation approved |
| 10 — release certification | Source controls complete | **Not production-approved** until all external proof items are complete |
