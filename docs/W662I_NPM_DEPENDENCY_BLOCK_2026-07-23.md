# W662I npm Dependency Block — Resolved Source-Suite Receipt

Date: 23 July 2026

## Earlier local limitation

The first local attempt to run:

```text
npm ci --include=dev --no-audit --no-fund --prefer-offline
```

was blocked by an HTTP 503 response while resolving `ws@7.5.11`. At that time, 16 maintained Babylon-dependent files were correctly recorded as dependency-blocked rather than represented as passing.

## Resolution

The storage-free GitHub runner later installed the exact `package-lock.json` with Node 22 successfully. It then executed the maintained source suite with the full dependency graph available:

- maintained files: **334**;
- passed files: **334**;
- dependency-blocked files: **0**;
- genuine failed files: **0**.

This resolves the dependency/source-suite limitation only. It does not certify the production build, immutable Preview, authenticated browser/device matrix, owner acceptance, merge, production deployment, or a 9.5/10 claim.
