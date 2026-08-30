# W216 Local Release Audit — 2026-06-23

## Scope and decision

This audit is the final local-source pass for the cumulative W180–W215 rebuild. It validates the implementation that can be proved inside a source/build environment. It **does not** claim Cloudflare Preview, production deployment, real-device, QR-camera, PWA-install, network-header, or rendered-screenshot evidence.

## Local release-candidate result

`npm run qa:w216-release-candidate` completed successfully.

The command runs:

1. W180–W215 targeted source gates.
2. W216 local-finalization gate.
3. Syntax checks for the current security, City, Realm Studio, referral, trade, and audit modules.
4. ESLint with zero warnings.
5. Production build and smoke check.
6. Static site audit.
7. Launch-readiness, page-invariants, identity-surface, and app-surface quality gates.
8. PWA manifest/source install-readiness check.
9. `npm audit --omit=dev`.

Results:

- Targeted current release gates: pass.
- Lint: pass, zero warnings.
- Production build and smoke: pass.
- Static site audit: pass; 70 HTML files scanned.
- Launch-readiness: 0 blockers, 0 warnings.
- Page invariants: 0 blockers, 0 warnings.
- Identity surface: 0 blockers, 0 warnings.
- App-surface quality: 0 blockers, 0 warnings.
- PWA source/manifest check: pass.
- Production dependency audit: 0 vulnerabilities.

The complete local command output is retained as `release-evidence/W216_RELEASE_CANDIDATE.log` in the final Codex package.

The archive itself was integrity-tested and checked from a fresh extraction; see `W216_ARCHIVE_REPRODUCIBILITY_2026-06-23.md`.

## Final code hardening completed in this pass

- Added a single `qa:w216-release-candidate` command and a separate historical broad-test diagnostic command. The old broad test command was preserved; it was not hidden or rewritten to create a false green status.
- Added syntax coverage for the current City, Realm Studio, referral, share-link, trade, telemetry, and release-gate modules.
- Strengthened static-route validation so the active canonical W212/W213 routes are known to the site audit:
  - `/realm-studio`
  - `/referral`
  - `/r`
  - `/m`
- Confirmed the canonical City split:
  - `/eoncity` is the low-device 2D Operator Map.
  - `/eoncity/3d` is an optional CSS 3D station with a non-JavaScript return path to the 2D map.
  - no legacy heavy 3D engine boot remains in the current 3D station page.
- Confirmed Realm Studio creates local Realm records and fresh portable `eon3` signed share links with QR/copy/native share support and no central link registry.
- Confirmed referral links are portable `eon2` signed links and Realm shares are portable `eon3` signed links; each new link receives a fresh 128-bit cryptographic share ID.
- Added an explicit route-retirement proof: old `realm.html`, `realmworld.html`, `team-realm.html`, `marketplace.html`, and `subscription.html` routes remain Cloudflare redirects to their canonical non-commercial destinations. They cannot become competing active referral, Realm, marketplace, or campaign surfaces.
- Kept referral-tree storage limited to future qualified relationship records. Link issuance/opening/QR/copying does not create a central issued-link/click/raw-token registry.
- Kept all rewards, provider callbacks, ads, offerwalls, revenue share, payouts, checkout, payment rails, subscription activation, and referral-value grants disabled.
- Repaired public truth surfaces so About, Privacy, Billing, Support, Tools, Leaderboard, Telegram, and Reward Access describe the disabled commercial boundary consistently.
- Kept Trade manual/reference/paper-only, with a hard live-execution lock and exportable safety receipt.
- Redacted telemetry paths to pathname-only local evidence and retained CSP report bounds/redaction.

## Known limitation: historical broad test suite

The preserved historical broad unit command remains red:

```text
npm run test:unit
1357 tests total
1247 pass
109 fail
1 skipped
```

Those failures are predominantly stale pre-W180 expectations for retired campaign/economy/reward/marketplace/legacy-3D flows and historical infrastructure contracts. They are documented rather than ignored in `TEST_BASELINE_AND_LEGACY_DIAGNOSTIC_W216_2026-06-23.md`.

The current release candidate is approved only on the targeted W180–W216 gates listed above. Do not state that the entire historical suite is green.

## Evidence still required outside this environment

1. Cloudflare Pages Preview deployment and asset/header verification.
2. Browser screenshots of Chat, Projects, Library, Workspace, Market, Vault, Trade, 2D City, 3D City, Realm Studio, referral landing, and public trust pages.
3. Physical Android, iPhone Safari, and desktop PWA checks.
4. QR scan using a second device and validation of both `eon2` and `eon3` links.
5. Cloudflare update/persistence proof for Vault, Projects, Library, Automations, Market previews, Realm Studio records, and safe local backup/restore.
6. Network proof that disabled commercial routes do not load provider SDKs or perform campaign callbacks.
7. A human release review before production promotion.

See `EONAPP_W216_EVIDENCE_MATRIX_2026-06-23.md` and `CODEX_W216_PREVIEW_DEPLOY_PROMPT_2026-06-23.md`.
