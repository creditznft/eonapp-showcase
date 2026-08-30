# Codex Handover — W476-B Production Browser Proof Controls

## Scope

Use this clean W476-B source package on top of W476-A6. Merge only the listed W476-B changes. Do not activate Dodo/payment/checkout/trial/entitlements, OAuth social features, rewards, wallets/tokens/NFT, referral grants, trading execution, provider credentials, cloud Vault custody or local image/video adapters.

## Local source validation

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

Expected source truth: all commands pass; production/Dodo/payment/media remain blocked.

## Reviewed Cloudflare preview proof

Deploy through the existing reviewed Pages/Workers path. Then run the observer from a clean environment with Chromium available:

```bash
node scripts/w476-b-production-proof.mjs \
  --allow-network \
  --browser \
  --base-url=https://YOUR-REVIEWED-PREVIEW \
  --chromium-path=/usr/bin/chromium \
  --out=../w476-b-preview-redacted.json
```

The output may contain only the redacted fields described in the W476-B protocol. Keep it out of source control until owner review.

## Mandatory manual work

1. Browser CSP delivery plus authorised redacted-log review.
2. Full preview-only conditional/API negative matrix. Do not delete a real account or write live Sync/Relay records.
3. Real browser/device proof for Ollama, LM Studio and Jan including CORS/PNA and no-cloud-fallback outcomes.
4. Analytics consent/no-request proof, installed PWA update/rollback/data survival, desktop/Android/iOS matrix, accessibility/locale/voice and optional Google identity lifecycle if configured.
5. Owner evidence review. Missing evidence is a NOT PASS result.

## Important CSP rule

`/csp-report` OPTIONS now derives `access-control-allow-origin` from its own endpoint URL. Do not replace this with `*` or an attacker-supplied Origin header. It must remain narrow for both production and reviewed preview origins.

## Next permitted work

After reviewed W476-B evidence is captured, start **W477**: canonical route/SEO/legacy cleanup, origin classification and evidence-based CSP tightening. Do not delete legacy material before quarantine, revalidation and independent review.
