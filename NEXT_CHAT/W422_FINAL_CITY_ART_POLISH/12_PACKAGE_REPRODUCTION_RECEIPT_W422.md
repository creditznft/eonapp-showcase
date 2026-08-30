# W422 Package Reproduction Receipt

## Archive integrity

- ZIP integrity test: passed.
- Embedded source manifest: 2,487 entries verified.
- Missing entries: 0.
- Hash mismatches: 0.
- Forbidden packaged artifacts: 0 (`node_modules`, `dist`, artifacts, reports, browser profiles, `.env`, nested archives and checksum files were excluded).

## Fresh extracted-source validation

From a clean extraction of the final source archive:

- `npm ci`: passed.
- `npm run qa:w422-city-deep-art`: passed (5/5 local W422 tests; 10/10 gate checks).
- `npm run test:unit`: passed (**393/393**).
- `npm run build`: passed (production build script reports `ok: true`).
- `npm run smoke:build`: passed.
- `npm run audit:site`: passed.
- `npm run launch:readiness`: passed.
- `npm run security:secret-scan -- --allow-no-history`: passed.
- `npm audit --omit=dev --audit-level=high`: 0 production vulnerabilities.
- Fresh build check: exactly 58 City SVG art assets emitted under `dist/assets/city/art/`.

## Important boundary

This proves package reproducibility and source/build integrity. It does not prove production deployment, device visuals/performance, final GLB/KTX2 art quality, art licensing/rights review, Google OAuth, or D1 Sync behavior.
