# W477 release evidence protocol

This protocol prevents a green source check from being misread as a production release approval.

## Pre-deploy source checks

```bash
npm run qa:w477-route-seo-legacy
npm run lint -- --max-warnings=0
npm run release:verify
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

## After deployment: capture, label, review

Use the W476-B reviewed-browser procedure against the exact preview or production origin. Capture and label:

- route requested, final URL, status, redirects and cache headers;
- document title, canonical, robots and rendered page/404 state;
- sitemap and robots bodies from the deployed host;
- console/network entries for core pages and Local AI;
- CSP enforcement/reports and approved loopback runtime behavior;
- a desktop browser plus Android/iOS or a recorded unavailable-device exception;
- an owner review line for every NOT PASS observation.

## W477 GO criteria

W477 can be marked complete only when the source gate passes **and** deployed evidence confirms the declared canonical map. A missing route, unexpected redirect, cache mismatch, unknown origin, CSP breakage, Local AI runtime failure, or unreviewed legacy reference remains a blocker.
