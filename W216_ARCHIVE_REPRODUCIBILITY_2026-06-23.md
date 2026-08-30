# W216 Archive Reproducibility Check — 2026-06-23

## Archive integrity

The final source archive was tested with `unzip -t` and reported no compressed-data errors.

## Fresh-extraction check

A fresh extraction of the archive was created outside the original worktree. In that extraction:

1. `npm ci --ignore-scripts` completed.
2. The current W180–W215 targeted gates and W216 local-finalization gate completed successfully.
3. The remaining release checks completed successfully:
   - lint with zero warnings;
   - production build;
   - build smoke check;
   - static site audit;
   - launch-readiness;
   - PWA manifest/source readiness;
   - page-invariants;
   - identity-surface;
   - app-surface quality;
   - `npm audit --omit=dev` with zero production vulnerabilities.

This verifies that the final archive contains the source/configuration needed for the current local release path. It does not replace Cloudflare Preview/device/screenshot evidence.
