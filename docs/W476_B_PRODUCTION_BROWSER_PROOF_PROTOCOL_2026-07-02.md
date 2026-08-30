# W476-B — Production Browser, Function and Release Evidence Protocol

**Status:** source controls complete; all production/device evidence remains open until captured on a reviewed Cloudflare preview or production deployment.

## Scope and truth boundary

W476-B turns the W476-A1–A6 source contracts into a controlled evidence process. It does **not** deploy source, certify a release, approve payments, enable Dodo, connect a local image/video model, begin OAuth, write Sync data, create a relay invite, or contact a hosted AI provider.

The runner stores only bounded technical observations: route path, status, byte length, content hash, expected-marker boolean, selected header booleans, response shape keys, resource origins, resource types and console/error counts. It never stores query strings, fragments, cookies, browser storage, request/response bodies, console text, screenshots, local model names, provider content, OAuth data, account information or personal work.

## Source command

```bash
npm ci --ignore-scripts --no-audit --fund=false
npm run lint -- --max-warnings=0
npm run release:verify
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run qa:w476-b-source
```

A source pass proves only that the no-network evidence tools are intact.

## Reviewed preview/production observation

Run against a reviewed preview first. Do not attach browser profiles or cookies. Do not use a personal account.

```bash
node scripts/w476-b-production-proof.mjs \
  --allow-network \
  --browser \
  --base-url=https://YOUR-REVIEWED-ORIGIN \
  --chromium-path=/usr/bin/chromium \
  --out=../w476-b-preview-redacted.json
```

For the approved public origin, the same command may be run with `--base-url=https://eonapp.ch`. The report must remain outside the repository until an owner reviews it.

The automated probe covers only safe read-only status endpoints, wrong-method rejections for write endpoints, the CSP collector transport contract, document headers and ephemeral Chromium observation. OAuth start/callback and all allowed mutation cases are explicitly manual-only so automation cannot start a provider flow, delete an account, create an invite, store attribution or write Sync data.

## Automated acceptance checks

1. `/`, `/chat`, `/profile`, `/local-ai`, `/eoncity` and `/insights` return the expected marker and CSP reporting directives.
2. `/local-ai` retains its narrow loopback exception and does not receive `upgrade-insecure-requests`.
3. `/csp-report` accepts a redacted non-critical Reporting API payload with `204`, rejects a foreign document with `400`, and returns a same-origin OPTIONS policy.
4. Public safe Function status endpoints return safe JSON shape only. Write-only endpoints reject GET with `404` or `405`; either is fail-closed method denial for Pages Functions. Anonymous Sync read stays fail-closed (`401` or `503`).
5. An ephemeral Chromium run finds no console/page errors on the selected routes and records external origins only, not full URLs.
6. Any observed external origin absent from W476-A6’s static inventory is a **NOT PASS** result until reviewed.

An automated pass means **captured pending human review**, never release approval.

## Required manual evidence

### Local AI text runtimes

For **Ollama**, **LM Studio** and **Jan**, use a runtime installed by the test user on the same device:

1. Open `/local-ai` and explicitly choose the runtime.
2. Tap scan; EONAPP must not start the runtime, download a model or probe a LAN.
3. Confirm the model discovery result without storing the model name in source evidence.
4. Run the runtime self-test.
5. Make one harmless local EONBOT request.
6. Force a runtime failure and confirm no cloud provider becomes selected or contacted without a new user choice.
7. Attempt a blocked LAN address and a wrong port; both must remain rejected.
8. Record only pass/fail state plus redacted CSP/CORS/PNA class. A CORS/PNA failure is **NOT PASS**, not a reason to silently loosen policy.

### CSP browser delivery and authorised redaction review

1. From a clean browser profile on the reviewed origin, trigger one non-critical same-origin synthetic violation (for example, an intentionally blocked image URL).
2. Confirm the browser delivers a report to `/csp-report` and receives the expected status.
3. An authorised Cloudflare/log operator confirms any stored event contains only directive, document path without query/fragment, blocked origin, and timestamp.
4. Do not copy logs, raw payloads, page content, account data or tokens into source control.

### Conditional API matrix

Run only on a disposable reviewed preview. Use no real account data.

- Exercise the full W476-A6 contract matrix for configured/unconfigured, cross-origin and malformed requests.
- Validate OAuth start/callback with a dedicated test client only after the Google console configuration is reviewed.
- Do not submit `DELETE_EON_ACCOUNT` under an authenticated session.
- Do not create relay invites/attribution, write Sync records/tombstones or enable any action gateway.
- Record status/error-class only.

### Analytics, update/rollback, data survival, devices

- Confirm the analytics bridge stays local/default-off until explicit consent and produces no remote request before consent.
- On an installed PWA/device, prove update, rollback, encrypted portable backup/restoration and local-data survival using disposable test data.
- Capture desktop, Android and iOS proof for navigation, safe areas, touch, orientation, City readability, keyboard navigation, screen reader flow, locale/RTL, typed fallback and explicit microphone permission.

## Failure handling

A failing route, header, CSP report, CORS/PNA condition, browser error, unknown origin, inaccessible runtime or missing device evidence is **NOT PASS**. Keep the release blocked, save a redacted issue summary outside the repository, and route fixes to W477/W478/W479 rather than weakening the contracts.

## Exit condition

W476-B can move to W477 only when the reviewed preview/production evidence board records each required row. It does not itself enable commerce. W480/Dodo remains blocked until W479.5 records final non-payment certification and explicit owner approval.
