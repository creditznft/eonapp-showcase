# Codex Execution, Deploy and Proof Runbook — W421

## Validate cleanly

```bash
npm ci
npm run verify:w421-city-art-review
```

Expected core outcome:

- W405, Share-2, W411/W412, W406B–W421 and language gates pass;
- **388/388** current runnable-product unit tests pass;
- source art hashes and 18 SVG inventory pass;
- build, smoke, site audit, launch readiness and secret scan pass;
- `npm audit --omit=dev --audit-level=high` returns zero production vulnerabilities.

## Preview deployment

1. Deploy only from this W421 source archive.
2. Never stage `.env`, OAuth secrets, Cloudflare tokens, D1/R2 data, browser profiles, `node_modules`, `dist`, report caches or user data.
3. Verify these same-origin examples at preview:
   - `/assets/city/art/texture-wet-street.svg`
   - `/assets/city/art/horizon-neon-skyline.svg`
   - `/assets/city/art/decal-eonbot-halo.svg`
4. Open `/eoncity`, then City controls → Art review. Review all three profiles and all six local compositions.
5. Use Validation Lab and Device Lab to record human observations; do not call those exports an automatic certification.

## Do not activate without separate proof

- EON Sync Basic;
- social posting/connectors;
- payment/referral/reward systems;
- user deployment/Action Gateway;
- unreviewed final binary art.

## Final 3D art intake

Use W417 only after real source art exists. Every entry needs local same-origin GLB, SHA-256, provenance evidence, KTX2/Basis texture declaration, LOD0/1/2, budget metrics, human rights/art review, and device proof. Do not use remote CDN art or unreviewed marketplace downloads.
