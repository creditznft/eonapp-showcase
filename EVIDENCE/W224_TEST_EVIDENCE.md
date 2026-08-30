# W224 Test Evidence — 24 June 2026

## Passed locally

```text
npm run qa:w224-cityworldstate-3d
npm run qa:w216-source-syntax
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run qa:w216-release-candidate
```

`qa:w216-release-candidate` passed with all included route, product, persistence, safety, build, PWA, audit, quality, and production dependency checks. The build reported 316 dist files and 28.27% minification reduction. `npm audit --omit=dev` reported 0 production vulnerabilities.

## Browser limitation

The W224 Playwright spec is present and discoverable. System Chromium could launch via `CHROMIUM_PATH=/usr/bin/chromium`, but it was not allowed to navigate to `http://localhost:4173/eoncity/3d` from this environment:

```text
net::ERR_BLOCKED_BY_ADMINISTRATOR
```

This is not treated as a product pass. Run the browser command in CI/Codex or a permitted workstation to produce interaction screenshots/traces.
