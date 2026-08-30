# W453.1 Source Implementation and Validation — Production City Edge Proof

## What was implemented

W453.1 adds a single opt-in **post-deploy HTTP proof runner** derived from the current route contract.

It checks, only after a caller explicitly supplies `--confirm-network` and an HTTPS deployment origin:

- canonical public Chat `/`, EON City `/eoncity` and Research Lab `/insights` document delivery;
- every direct legacy City/Realm/old-City alias declared in `RETIRED_REDIRECTS` converges to `/eoncity`;
- `/realm?mission=arrival` and `/eoncity.html?mission=arrival` retain the explicit safe City query after redirect;
- delivered `/sw.js` still includes the current City legacy-navigation interception source markers.

The report keeps only route metadata, redirect paths/statuses, marker booleans, content type, byte length and a SHA-256 content hash. It never writes a response body, credentials, cookies, prompts, payment data, browser storage or user-specific query string to disk.

## Safe invocation for Codex after deployment

```bash
npm run qa:w453a-production-city-edge-proof
node scripts/w453a-production-city-edge-proof.mjs --base-url https://eonapp.ch --confirm-network --out artifacts/w453a-production-city-edge-proof/live.json
```

The command exits nonzero on a missing marker, redirect loop, unexpected final path, query loss or HTTP failure.

## Not claimed

This is source tooling only. No production request was made while implementing it. It does not prove Service Worker adoption by an existing browser, cache clearing, Babylon rendering, console/WebGL health, GPU performance, device thermal behavior, touch/rotation, visual quality or release certification.
