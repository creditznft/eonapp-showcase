# R4 W378 Start Here — Cloudflare Google Auth and Codex Deployment Readiness

W378 adds an honest Cloudflare Google identity operator handover and makes the
latest R4 gates mandatory in GitHub CI, Preview and Production deploy workflows.

This is **source-only**. No Cloudflare change, secret, Google sign-in, payment,
subscription, entitlement, referral benefit or provider integration has been
activated.

## Read next

1. `R4_W378_CONTINUATION_PROMPT.md`
2. `R4_W378_FULL_SOURCE_HANDOVER_STATUS.md`
3. `docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`
4. `docs/CODEX_W378_MERGE_PREVIEW_PRODUCTION_HANDOFF_2026-06-26.md`
5. `docs/CLOUDFLARE_AI_W378_GOOGLE_AUTH_SETUP_PROMPT_2026-06-26.md`

## Verify locally

```bash
node --version
npm ci
npm run qa:r4-current-program
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run security:secret-scan
npm run launch:readiness
```

## Operator truth

The Google Cloud web client is already in Testing mode with the exact production
callback. Cloudflare is still pending. Use `EON_AUTH_ROLLOUT=testing` only in
Production after the dedicated D1 binding and secrets are added manually. Preview
remains disabled until it has a separate Google OAuth client with an exact
callback. Guest-first use remains available and Google Login is not a backup.
