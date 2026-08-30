# W720–W724 foundation validation

## Authority

- Source ZIP SHA-256: `5aa0554ca6edd0b9ac8a64d51f25bf47a20b1458ecaa08e420dca2ee3f9655b0`
- Reported live commit: `cc3e698a8468ec447bf8eab7dc85875318fa34cd`
- Reported tree: `1331baf4149f3f42a2b70d5bef1618897fbcde7b`
- Approved product direction: Hybrid Command Hub.
- Deployment authority: none.

## Implemented

- W720 canonical source authority and baseline.
- W721 enforceable product-reset contract and explicit non-certifying archive for 33 superseded launch tests.
- W722 Graphite, Obsidian and Ember theme system with safe legacy migration.
- W723 beginner-first shell, consolidated Help authority, and route reset.
- W724 full-screen 2D Quick Command surface launched by one Orb.
- Existing 3D City Nexus source and build marker preserved.

## Validation results

- W720–W724 focused foundation gates: PASS.
- Node syntax checks for changed/new JavaScript modules: PASS (57 files).
- Maintained test manifest: 378 certifying test files.
- Dependency-free maintained test files: PASS (365 files).
- Exact Babylon-dependent maintained files: 13 externally blocked, not waived.
- Route contract: PASS (168 routes).
- Site audit: PASS (49 HTML documents, sitemap and precache verified).
- Launch page invariants: PASS with 0 blockers and 2 existing ad-keyword review warnings.
- Identity surface gate: PASS with 0 blockers.
- App-surface quality gate: PASS with 0 blockers and 0 warnings.
- Active-surface import fence: PASS (306 reachable modules).
- W633 every-route audit: PASS 11/11.
- W634 responsive/accessibility/input: PASS 13/13.
- W635 performance/cache/update-safety source gate: PASS 17/17.
- W636 security/privacy/abuse source gate: PASS 21/21.
- W717 security/certification simplification: PASS 11/11.
- W718 independent-certification source readiness: PASS 10/10; independent certification not awarded.
- Secret scan: PASS (4,509 text files scanned; no potential secrets).
- CRLF-aware diff whitespace check: PASS.

## External dependency block

The configured npm package gateway returned HTTP 503 for both `npm ping` and `npm ci`. Therefore:

- no production build was claimed;
- no Playwright/browser run was claimed;
- no Babylon runtime lane was claimed;
- no deployment, merge, push or production mutation occurred.

See `npm-registry-attempt.log` and `blocked-babylon-tests.json`.

## Next approved implementation authority

W725 establishes shared productive work-panel contracts so normal routes, the full-screen Quick Command surface, and future City Nexus stations invoke the same real components without duplicate business logic.
