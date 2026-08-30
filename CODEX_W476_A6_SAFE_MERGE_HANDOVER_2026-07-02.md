This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex Handover — W476-A6 API/CSP/SBOM/Release Evidence

## Source-of-truth and scope

Use this package as the W476-A6 source continuation on top of W476-A5. Do not merge unrelated legacy code or activate payment/Dodo, wallets, tokens/NFT, rewards, referrals, checkout, social posting, remote provider credentials, local media adapters, or Cloudflare secrets.

## Required merge procedure

```bash
npm ci --ignore-scripts --no-audit --fund=false
npm run lint -- --max-warnings=0
npm run release:verify
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run audit:w476-a6
```

Do not treat a pass above as a production approval. It proves only the checked source/local environment.

## What must remain unchanged

- W476-A1 through A5 truthful boundaries.
- Local text runtime allowlist: user-triggered Ollama, LM Studio and Jan only.
- Local image/video is **not connected**. The W479-M creator media programme is a future roadmap, not an active UI claim.
- Payment/Dodo stays blocked until W479.5 has real non-payment certification evidence.
- Root `_headers` and `public/_headers` must remain byte-identical.
- CSP global `upgrade-insecure-requests` stays absent only from the dedicated Local AI overrides; do not break the approved HTTP loopback exception.

## W476-A6 review points

1. Confirm `EVIDENCE/W476_A6/API_SURFACE_CONTRACT.json` lists exactly 18 Functions.
2. Confirm `/csp-report` accepts `application/csp-report` and `application/reports+json`, rejects a foreign document URL, and logs only redacted data.
3. Confirm `Reporting-Endpoints: csp-endpoint="/csp-report"`, `Report-To`, `report-to csp-endpoint` and `report-uri /csp-report` remain in built output.
4. Confirm final audit is zero for full and `--omit=dev` scopes.
5. Review the external-origin evidence as a backlog input, not a proof of live requests. It contains unreviewed/legacy candidates that need W476-B/W477 action.

## After a controlled preview/production deploy: W476-B manual evidence

Capture redacted evidence only. Do not store cookies, OAuth codes, secrets, API keys, account IDs, full console logs, raw CSP payloads or personal content in the repo.

- Verify response headers for `/`, `/chat`, `/local-ai` and `/csp-report` include expected CSP reporting directives.
- From a safe browser test page/session, trigger one harmless synthetic CSP violation on the same deployed origin; confirm a 204 response and that stored/logged data excludes query strings/fragments/blocked-resource path.
- Exercise every Function route’s allowed/denied method and its contract negative case against preview before production. Record status/error class only.
- Capture production browser Network/Console evidence for external origins and then classify/remove the inventory backlog in W477.
- Test real browser user-triggered Ollama, LM Studio and Jan connection/discovery/self-test/one response; record CSP/CORS/PNA result and no-cloud-fallback proof.
- Continue physical-device, update/rollback/data-survival, optional OAuth lifecycle and City playable proof without changing the release truth until each is evidenced.

## Next implementation order

1. **W476-B** — preview/production browser and Function evidence.
2. **W477** — route/SEO/legacy cleanup, including external/local origin retirement and CSP reduction based on real network evidence.
3. **W478** — accessibility, OAuth lifecycle and device proof.
4. **W479** — City/Realm playable vertical slice proof.
5. **W479-M0 onwards** — local creator media onboarding, image adapter, lightweight image-to-video, advanced video and local library in the recorded gated order.
6. **W479.5** — final non-payment certification.
7. **W480** — Dodo only after all gates actually pass.
