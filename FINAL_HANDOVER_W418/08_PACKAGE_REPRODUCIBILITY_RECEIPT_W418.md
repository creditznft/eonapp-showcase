# W418 Package Reproducibility Receipt

**Archive checked:** `EONAPP_FINAL_CODEX_W418_FLAGSHIP_AUDIT_2026-06-28.zip`  
**Companion checked:** `EONAPP_FINAL_CODEX_W418_FLAGSHIP_AUDIT_2026-06-28_DOCS.zip`  
**Check date:** 2026-06-28.

## Archive checks

- ZIP integrity test passed for both archives.
- The source archive extracted under one clean root directory.
- The source manifest validated every staged file.
- No `node_modules`, `dist`, runtime artifacts, reports, environment files or nested ZIP files were found in the extracted source archive.

## Fresh extraction validation

From a clean extraction of the source archive:

```bash
npm ci
npm run qa:w418-final-flagship-audit
npm run test:unit
npm run build
```

Results:

- `npm ci` passed.
- W418 final audit gate passed (8/8).
- Unit suite passed: 379/379.
- Build passed with its machine-readable report `ok: true`.

This receipt validates package reproducibility. It does not replace external device, OAuth, D1 Sync or final-art evidence.
