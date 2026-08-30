# Codex Handover — W378 Merge, Preview and Controlled Production Readiness

## Goal

Merge the latest W378 source safely, preserve all W301–W377 work, run the
current gates, and prepare a Preview-first deployment. Do not set Cloudflare or
Google secret values in source, local files, commits, terminal output or
handover notes.

## Source of truth

Use the latest W378 runnable handover ZIP. It supersedes W377 and all older
W359–W376 bundles for continuing development.

Read in order:

1. `CURRENT_HANDOFF_2026-06-26/R4_W378_START_HERE.md`
2. `CURRENT_HANDOFF_2026-06-26/R4_W378_CONTINUATION_PROMPT.md`
3. `CURRENT_HANDOFF_2026-06-26/R4_W378_FULL_SOURCE_HANDOVER_STATUS.md`
4. `docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`
5. `docs/CLOUDFLARE_AI_W378_GOOGLE_AUTH_SETUP_PROMPT_2026-06-26.md`
6. `docs/R4_W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_2026-06-26.md`
7. `docs/R4_COMM02_GLOBAL_COMMERCE_EON_INVITE_AND_PRICING_DECISION_2026-06-26.md`

## Strict non-goals

- Do not invent or ask for Google, Cloudflare, payment or provider secrets.
- Do not add `.env`, `.dev.vars`, `wrangler` credentials, browser storage,
  token exports or Cloudflare configuration snapshots to Git.
- Do not activate payment, checkout, subscription, entitlement, paid Pack,
  EON Invite, provider, ad, CPA, wallet, reward, payout, broker, trading or
  execution code.
- Do not convert optional Google Login into cloud backup or account-required
  product access.
- Do not claim device, Preview, production, rollback or live OAuth proof that
  has not been captured.

## Local merge commands

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

Expected source state: all commands pass, while external evidence blockers
remain explicit.

## Required code review points

1. `functions/` stays at repository root. Do not move it into `dist/`.
2. `identity/migrations/0001_eon_identity.sql` is the only identity migration.
3. The GitHub CI, Preview and Production workflows invoke
   `npm run qa:r4-current-program` before test/build/deploy work.
4. Google OAuth accepts identity-only scope `openid email profile` and remains
   fail-closed if bindings, variables or secrets are missing/mismatched.
5. Production deployment still uses the existing Cloudflare Pages project
   `eonapp-ch`; run `wrangler pages deploy dist --project-name=eonapp-ch` from
   repository root so the root `functions/` directory remains part of the
   Pages project structure.

## Preview-first deployment

1. Create a new branch from the reviewed merge.
2. Push it and wait for GitHub CI to complete green.
3. Use the Preview workflow with a neutral branch label such as
   `r4-w378-preview`.
4. Confirm core routes and `/api/auth/session` show only safe guest state until
   the operator has manually completed the Cloudflare identity configuration.
5. Do not configure Preview OAuth. Preview stays disabled without its own exact
   Google OAuth client.
6. Capture redacted proof for Apps, Blueprint workroom handoff, Graphite
   default, guest mode and static routes.

## Production is still blocked by

- W276 real update-and-rollback restoration proof;
- a controlled Google OAuth Testing proof after manual Cloudflare setup;
- device/browser visual certification for Apps and City;
- no provider/payment/invite proof because those systems remain inactive.

## Cloudflare operator ownership

The owner, not Codex, manually handles D1 bindings and variables/secrets in
Cloudflare. Use `docs/CLOUDFLARE_AI_W378_GOOGLE_AUTH_SETUP_PROMPT_2026-06-26.md`
for an infrastructure-only assistant and then the manual checklist in
`docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`.
