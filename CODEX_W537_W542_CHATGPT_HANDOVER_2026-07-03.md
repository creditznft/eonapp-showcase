> **historical-only provenance.** This W537–W542 receipt is retained for evidence and archaeology; it is not a current coding or release entrypoint.
>
> Read `CURRENT_PRODUCT_START_HERE.md` first. The preserved W524 portability receipt is `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.

# EONAPP W537-W542 Codex Handover

## Scope

This handover packages the current source from branch `codex/w537-w542-20260703` in the clean worktree:

- `C:\Users\credi\WORKSPACE\EONAPP_W536_MERGE_20260703`

It includes the current W537 source changes, the new W537 source/browser proof lane, and the latest local evidence files created in this pass.

## What changed in source

### W537 completed

- Profile was rebuilt into a true selected-panel Settings layout on desktop.
- Profile now behaves like an accordion on mobile.
- Vault remains separate.
- Capsule default surface now emphasizes only:
  - Create one encrypted Capsule
  - Restore a Capsule
  - Optional collapsed Google Drive backup
- Move-plan, exclusions, inspect-first restore rules, and technical detail were compressed into collapsed disclosures under `Advanced recovery`.
- Repeated warning copy was reduced and detailed boundary language was moved into `Learn why` style disclosures.

### Main edited files

- `profile.html`
- `capsule.html`
- `assets/js/profile-page.js`
- `assets/css/eon-hubs.css`
- `assets/css/eon-vault-v2.css`
- `scripts/w533-domain-continuity-gate.mjs`
- `scripts/run-current-unit-suite.mjs`
- `scripts/w517-canonical-release-verify.mjs`
- `package.json`

### New W537 files

- `config/w537-consumer-ux-compression-contract.mjs`
- `scripts/w537-consumer-ux-compression-gate.mjs`
- `tests/unit/w537-consumer-ux-compression.test.mjs`
- `tests/e2e/w537-consumer-ux-compression.spec.ts`

## Validation completed in this pass

- `npm run qa:w537-consumer-ux-compression`
- `npm run qa:w537-consumer-ux-compression:browser`
- `npm run qa:w525b-account-vault-ux`
- `npm run test:unit`
  - Result: `617/617` passed
- `npm run lint -- --max-warnings=0`
- `npm run qa:w517-source-syntax`
- `npm run build`
- `npm run qa:w519-legacy-transport-quarantine:dist`
- `npm run qa:w521-eon-city-source-engineering:dist`
- `npm run qa:w522-gate-risk-convergence:dist`
- `npm run smoke:build`
- `npm run audit:site`
- `npm run qa:w239-public-output-quarantine`
- `npm run launch:readiness`
- `npm audit --omit=dev`
  - Result: `0 vulnerabilities`

## Evidence created in this pass

- `tmp/w538-eonapp-production-proof.json`
- `tmp/w541-live-city-proof-20260703/w541-live-city-proof.json`
- `tmp/w541-live-city-proof-20260703/*.png`

## Production/live observations

### eonapp.ch

Passive live-origin proof against `https://eonapp.ch` succeeded for:

- route documents
- CSP collector transport behavior
- safe read-only function matrix
- browser observation

Important boundary:

- this does **not** certify production release approval
- this does **not** prove owner GO / NO-GO
- this does **not** satisfy the full physical-device matrix

### origin/main parity

Codex built a clean detached worktree from:

- `16f5770df21da123dd41e54d8701900fb51aa292`

Observed result:

- current live `https://eonapp.ch` HTML did **not** hash-match that clean `origin/main` build on `/`, `/profile`, `/local-ai`, `/eoncity`, or `/insights/`

So do **not** claim that current production exactly equals current `origin/main` unless independently re-verified with deployment metadata.

### GitHub Actions verification

Required authenticated GitHub Actions verification was **not completed** in this pass.

Reason:

- GitHub MCP startup kept timing out before tools became usable.

Do **not** claim authoritative authenticated Actions verification from this pass.

## W539-W542 blocker status

### W539 Google Drive controlled proof

Blocked in this pass.

- `EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID` was not configured in this machine environment.

### W540 local AI real-runtime proof

No reachable runtime detected in this pass.

Loopback probe results:

- Ollama: `probe-error`
- LM Studio: `probe-error`
- Jan: `probe-error`

Do not claim real local runtime proof from this pass.

### W541 EON City production proof

Live route sweep was captured for:

- `/eoncity`
- `/eoncity/lite`
- `/eoncity/tour`
- `/eoncity/3d`

Desktop and `390px` mobile both loaded the canonical City surface.

Observed:

- no page errors
- canonicalization to `/eoncity`
- canvas present
- mobile landscape hint present

Low-severity issue list:

1. Desktop `/eoncity` emitted warning-level console noise during the captured run.

### W542 Dodo billing readiness

Still approval-gated only.

Validated:

- `npm run qa:w450-dodo-approval-readiness` passed

Not done and not allowed to claim:

- live checkout
- webhooks
- cancellation proof
- refund proof
- production billing activation

## EON.HUB urgent follow-up

Owner reports new Trust Hub CID:

- `QmYQ4YgwYGr8QgkjkLRi66dfNywrryYDAxPGyUWBSKJkrt`
- `https://ipfs.io/ipfs/QmYQ4YgwYGr8QgkjkLRi66dfNywrryYDAxPGyUWBSKJkrt`

Owner also reports that the uploaded page is not working correctly.

### Instructions for ChatGPT

Please rebuild the EON.HUB static page files so the published package works cleanly from IPFS gateways.

Focus on:

1. Relative static routing and asset references that work under IPFS path gateways and subdomain gateways.
2. `index.html`, `status/`, `verify/`, `recover/`, and `gateway/` page behavior.
3. The signed-share verifier copy, layout, and any truncated or broken rendering.
4. Avoid introducing app behavior, storage mirroring, accounts, or non-static runtime claims.
5. Keep EON.HUB a small static Trust & Rescue layer only.

Do not assume the current uploaded Hub pages are correct just because the CID resolves.

## Recommended next steps

1. Review and package W537 source changes as a separate commit.
2. Re-run authenticated GitHub Actions verification with a working GitHub client/session.
3. Reconcile production deployment identity versus `origin/main`.
4. Repair EON.HUB static files for the new CID upload flow.
5. Wait for owner Google Drive client configuration before W539.
6. Run W540 only on a machine with a real reachable local runtime.
7. Keep W542 disabled until Dodo approvals and credentials exist.

## Build/test commands for ChatGPT

Run from project root:

```powershell
npm run qa:w537-consumer-ux-compression
npm run qa:w537-consumer-ux-compression:browser
npm run test:unit
npm run lint -- --max-warnings=0
npm run qa:w517-source-syntax
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm audit --omit=dev
```

## Honesty boundary

This package is source-ready and evidence-improved, but it is **not** a final launch certification package yet.

Still unresolved or blocked:

- authenticated GitHub Actions verification
- exact production-to-`origin/main` parity proof
- full Trust Hub gateway confirmation on the new CID
- Google Drive owner-configured proof
- real local AI runtime proof
- full physical-device/PWA/update matrix
- Dodo merchant-approved billing lifecycle proof
