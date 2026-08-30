# W615 EON City Recovery / Shell Hotfix — Merge, Deploy and Evidence Runbook

**Baseline:** W613 + W615 exact delta  
**Status:** source-side implementation complete; current production render diagnosis remains required.  
**Allowed browser method:** a human's normal already signed-in Chrome/Edge session attached through a loopback-only DevTools endpoint.

## 0. Safety boundary

Do not use Codegen login, cookie export/injection, Playwright storage state, copied browser profiles, Google bypass, direct guest renderer boot, or synthetic session state. Do not collect raw tokens, cookies, prompts, private project data, Vault contents, or browser local storage.

## 1. Apply cleanly in the real Git checkout

```powershell
# Start from a clean real checkout that is aligned to origin/main.
git fetch origin
git status --short
git rev-parse HEAD
git log -1 --oneline

# Review the exact patch before apply.
git apply --check HANDOVER\W615_FROM_W613.patch
git apply --3way HANDOVER\W615_FROM_W613.patch

git diff --check
git diff --stat
```

If Codex receives the exact-delta archive rather than the full source package, apply `W615_FROM_W613.patch` from its root. Do not apply on top of unrelated City experiments; resolve those intentionally first.

## 2. Required local source gates

```powershell
npm ci
npm run lint -- --max-warnings=0
npm run qa:w615-city-recovery-shell
npm run qa:w600a-city-overlay-proof
npm run qa:w607-city-gameplay-contract
node scripts/w392-direct-eon-city-entry-gate.mjs
node scripts/w405-live-ux-city-rescue-gate.mjs
node scripts/w427-babylon-direct-boot-gate.mjs
node scripts/w216-local-finalization-gate.mjs
npm run test:unit

$env:EONAPP_SOURCE_REVISION=(git rev-parse HEAD).Trim()
npm run build
npm run smoke:build
npm run audit:site
npm run security:secret-scan
npm audit --omit=dev --audit-level=high
```

Expected source evidence from this package: zero lint warnings; W615 recovery gate passes; W600A/W607 contracts pass; maintained unit suite 741/741 passes; build/smoke/site/security gates pass. Rerun every command in the real Git checkout; do not transfer local claims as deployment proof.

## 3. Capture the current live problem before deploy

Open `https://eonapp.ch/eoncity` in the **ordinary already signed-in browser**. Keep that same tab open. Start Chrome/Edge only with a loopback DevTools endpoint; do not attach remotely.

```powershell
$env:EON_CITY_AUTH_BASE_URL='https://eonapp.ch'
$env:EON_CITY_CDP_ENDPOINT='http://127.0.0.1:9222'
npm run evidence:w615-city-surface
```

Read `reports/w615-city-surface/surface.json` and `city-surface.png`. The snapshot records only bounded page state: current path, route/play/access/recovery markers, canvas dimensions, shell presence and a screenshot. It does not navigate, sign in, read cookies, or mutate storage.

## 4. Diagnose the actual live marker

| Snapshot result | Required next investigation | Not acceptable |
|---|---|---|
| `CITY_RECOVERY_VISIBLE` + `CITY_IMPORT_FAILED` | First-party dynamic import chunk network status, cache, CSP, release asset mapping | Auth workaround or external script replacement |
| `CITY_RECOVERY_VISIBLE` + `CITY_ENGINE_CREATE_FAILED` | WebGL init, browser GPU acceleration/context errors, canvas rect | Call this a content/layout pass |
| `CITY_RECOVERY_VISIBLE` + `CITY_CANVAS_MOUNT_FAILED` | Canvas host, DOM/init lifecycle, page errors | Retrying indefinitely |
| `CITY_RECOVERY_VISIBLE` + `CITY_ASSET_LOAD_FAILED` | First-party local asset requests and asset policy | Remote art/assets workaround |
| `CITY_RECOVERY_VISIBLE` + `CITY_CONTEXT_LOST` | GPU context evidence, one Lite retry | Claim full desktop graphics pass |
| `CITY_RECOVERY_VISIBLE` + `CITY_FIRST_FRAME_TIMEOUT` | Render-loop/frame evidence and canvas dimensions | Treat a blank canvas as loaded |
| `CITY_RENDER_SURFACE_MISSING` | Access-station/import lifecycle and page errors | Assume sign-in is the issue |
| `CITY_CANVAS_VISIBLE` | Continue W599 authenticated runner | Treat canvas alone as closure |

If the marker differs, capture it verbatim in the redacted receipt and add a narrow cause-specific patch. Do not guess.

## 5. Deploy normally

Deploy through the ordinary repository/CI/Cloudflare route. Record:

- Git commit SHA
- production build provenance JSON hash and source revision
- first-party EON City chunk/asset response facts relevant to the discovered marker
- deployment/CI receipt

No session, secret, cookie, personal project, Vault, or raw model output belongs in the evidence package.

## 6. Post-deploy normal-browser proof

In the same ordinary signed-in browser profile:

```powershell
$env:EON_CITY_AUTH_BASE_URL='https://eonapp.ch'
$env:EON_CITY_CDP_ENDPOINT='http://127.0.0.1:9222'
$env:EON_CITY_EXPECTED_BUILD_PROVENANCE='C:\path\to\real-checkout\dist\build-provenance.json'
node scripts/w599-run-authenticated-eoncity.mjs
```

The production closeout must prove all of the following:

- guest City access does not boot full Babylon City;
- normal signed-in City access does boot the usable canvas;
- current deployed provenance equals the exact deploy candidate;
- Start Here pointer ownership is top-most (canvas does not intercept it);
- `EONBOT`, `Voice`, `Chat`, `Districts`, `Command Deck`, and `Menu` exist; generic `Interact` does not;
- controls open/close as expected;
- signed-in refresh returns to a stable City;
- W615 recovery state is absent on the successful run.

Only `AUTHENTICATED_CITY_AND_GATE_PROVEN` closes W600A. `PASS_WITH_DIAGNOSTICS` requires manual review. Any `CITY_*` failure is a launch blocker.

## 7. Visual/manual acceptance after repair

1. Standard sidebar appears on desktop and compact mobile navigation appears at small width.
2. Recovery text and actions are grouped/readable—not scattered across the grid.
3. The page scrolls in recovery/access states; immersion locks scroll only while the actual City is running.
4. `Get City help` is visibly a link/action, not a disabled-looking native button.
5. Retry full City and Lite retry make no automatic navigation or destructive state change.
6. A Lite retry happens at most once per recovery cycle, then exposes a redacted marker and clear normal-app exits.

## Rollback

Rollback only the W615 commit if it causes a regression; retain the pre-deploy screenshot/JSON and deployment/provenance receipts. Do not rollback by cache-purging blindly or modifying signed-in browser state.
