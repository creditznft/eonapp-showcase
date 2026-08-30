# EONAPP W745 — Validation Receipt

Date: 2026-07-29  
Branch: `w737-city-recovery-local`  
Deployment: none

## Passed locally

```text
npm run qa:w745-final-city-polish
60/60 source tests passed
launch asset binary integrity passed: 42 entries, 84 variants, 81,099,884 bytes
site audit passed: 49 HTML files
page invariant blockers: 0
identity blockers: 0
app-surface quality blockers: 0
app-surface quality warnings: 0
git diff --check: passed
syntax checks: passed
launch GLB binary integrity: passed
asset entries checked: 42
GLB variants checked: 84
asset bytes checked: 81,099,884
Pathfinder rig and 11 exact authored clips: verified
EONBOT runtime-directed/no skeletal clip claim: verified
```

The maintained W745 gate includes binary verification of every assigned launch GLB (existence, bytes, SHA-256, GLB structure, meshes/materials, Pathfinder clips and EONBOT no-clip truth), plus the W635/W650 update-safe cache contracts, W719/W731-W734 Command Hub authority, W736A first-frame repair, W741-W742 menu/share/membership/motion contracts, W743 performance/cache hardening, W744 Command Centre completion and the W745 final polish/red-team tests.

## Dependency/build evidence

Locked dependency installation was retried without changing `package-lock.json`:

```text
npm ci --ignore-scripts --no-audit --no-fund --fetch-retries=2 --fetch-timeout=20000
result: failed; no node_modules produced
internal registry: HTTP 503 Service Temporarily Unavailable while fetching ws
```

Direct public npm access is unavailable in this environment because the public registry hostname cannot be resolved.

The production build was invoked only to confirm the explicit missing-dependency boundary:

```text
npm run build
result: failed before build
reason: ERR_MODULE_NOT_FOUND for esbuild
```

The W745 browser command was also invoked:

```text
npm run qa:w745-final-city-polish:browser
result: failed before tests
reason: the available `playwright` executable is not the locked Node Playwright test runner (`unknown command test`)
```

A system Chromium is present, but raw-source loading is not valid evidence because Vite/esbuild must bundle the bare Babylon imports. No build or browser pass is claimed.

## Final boundary

W745 is source-clean and ready for Codex testing. It is not deployment-certified. Codex must install the unchanged lockfile, build, execute the browser suites, produce a preview and collect real visual evidence before any merge or production promotion.
