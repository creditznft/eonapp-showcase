# Codex Execution and Deploy Runbook — W419

## Local validation

```bash
npm ci
npm run verify:w419-city-original-vector-art
```

Expected high-level result:

- lint passes;
- W405, W406B–W419, Share-2, W411/W412 and language gates pass;
- 382/382 current unit tests pass;
- build, smoke, site audit and launch readiness pass;
- no potential secrets are found.

## Preview deployment procedure

1. Create a preview deployment from the W419 source only.
2. Do not add `.env`, secret values, OAuth secrets, D1 exports, R2 credentials, user data, `node_modules`, `dist` or cache folders to source control or handover archives.
3. Verify `https://<preview>/assets/city/art/texture-wet-street.svg` and the other 17 SVG files return same-origin assets.
4. Visit `/eoncity`, select Balanced and Cinematic, then record the manual proof matrix.
5. Keep W412 disabled unless the dedicated D1/OAuth/manual-proof conditions are met.

## Final binary-art intake procedure

Use W417 only after obtaining actual original/commissioned or properly licensed source assets. Every binary asset needs:

- provenance and licence record;
- immutable SHA-256;
- same-origin path;
- optimized GLB;
- KTX2/Basis textures and mipmaps;
- LOD0/LOD1/LOD2;
- human art review;
- visual and performance proof on target devices.

Do not add remote CDN art or unreviewed marketplace assets.
