# W418 Package Contents and Exclusions

## Full source package

Contains the runnable application source, package-lock, tests, scripts, City renderer/profile/preflight code, documentation, and the complete W418 Codex operator folder.

## Documentation companion

Contains the W418 operator handover, the W405 product masterplan and proof checklist, W412–W418 implementation/proof documentation, validation receipt, changed-file record and source manifest.

## Deliberately excluded from the source archive

- `.env`, `.env.*`, Cloudflare/API/OAuth secrets and customer data;
- `node_modules`, `dist`, build reports, cache folders, browser profiles and test-result output;
- nested handover archives and generated checksum files;
- unreviewed binary City art, GLB/KTX2 assets, media packs and any asset without the W417 preflight evidence.

## Integrity procedure

1. Verify the archive SHA-256 before extraction.
2. Extract into a fresh directory.
3. Run `npm ci`.
4. Run `npm run verify:w418-final-flagship-source`.
5. Read `00_START_HERE_CODEX.md` before deployment or asset intake.
