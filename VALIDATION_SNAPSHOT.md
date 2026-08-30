# Validation snapshot — W260 R2 / W266 + W276 evidence hardening

## Fresh local verification

- `npm run test:unit`: **207/207** approved current-product tests passed.
- `npm run lint -- --max-warnings=0`: passed.
- `npm run build`: passed with **193** emitted production files.
- W145, W247, W259, W260, W266 and W276 gates: passed.
- R3-F1/R3-F2, smoke build, site audit (**40** HTML files), launch readiness,
  PWA static QA and workspace secret scan: passed.
- `npm audit --omit=dev`: **0 production dependency vulnerabilities**.
- Root full dependency audit: **6 development advisories** (1 low, 1 moderate,
  4 high), unresolved.
- Smart Contracts `npm run c0i:offline`: intentionally
  `blocked-online-and-artifact-proof-required`; `npm run test:c0i`: **9/9**
  passed. Smart Contracts full audit: **53 advisories** (18 low, 27 moderate,
  8 high), unresolved.

## Evidence truth

- W266 local server preflight: HTTP 200 for `/chat`.
- W266 local browser capture: **environment-blocked** because the current
  environment lacks a Playwright browser executable. It recorded 0/12
  screenshots and grants no visual/device/release evidence.
- W276 local simulation detects dynamic `eon:` key loss, mutation and
  unexpected additions. It grants no external upgrade/restore/PWA proof.

## Still open / cannot be claimed

- Physical Android, iPhone, desktop, constrained/no-WebGL and installed-PWA
  task evidence, screenshots/video, performance, console/network/headers and
  independent visual/accessibility review.
- Preview/live verification, deployment rollback, Git-history secret review,
  support/rollback ownership and legal/security sign-off.
- W276 real update/restore/cache/IndexedDB/recovery drill.
- W258 C0-I live RPC/runtime/ABI comparison, role/custody evidence, manifest
  review and contract-toolchain remediation or accepted risk.

W260 therefore remains **NO-GO** and W261 must not start.
