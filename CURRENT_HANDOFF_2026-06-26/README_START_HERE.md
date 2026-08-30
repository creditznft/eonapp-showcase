# EONAPP full runnable source handover — R4 W379

## Use this file first

This is the **current source snapshot** for a fresh ChatGPT/Codex window. It
supersedes W377 and all earlier W250–W376 handovers for ongoing work.

This snapshot contains the W301–W358 source baseline plus the cumulative
W359–W374B changes in one runnable tree. It has **no Git metadata**, so treat
it as a source handover, not as proof of a particular Git commit, deployment,
or Cloudflare configuration.

Read in this order:

1. `CURRENT_HANDOFF_2026-06-26/R4_W379_START_HERE.md`
2. `CURRENT_HANDOFF_2026-06-26/R4_W379_CONTINUATION_PROMPT.md`
3. `CURRENT_HANDOFF_2026-06-26/R4_W379_FULL_SOURCE_HANDOVER_STATUS.md`
4. `docs/R4_COMM03_SOLO_PRICING_AND_CATALOGUE_DECISION_2026-06-26.md`
5. `docs/CODEX_W379_FINAL_MERGE_AND_RETURN_EVIDENCE_2026-06-26.md`
6. `docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`

## Start locally

```bash
node --version                 # Node 22 expected
npm ci
npm run qa:r4-current-program
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run dev
```

Run the full focused W359–W374B command list from
`BUILD_TEST_DEPLOY_RUNBOOK_W359_W374B.md` before making a deployment decision.

## What is in this handover

- Vite/Pages source, package manifests, tests, scripts, functions, configs,
  route contracts, local-first state code and current project docs.
- W359–W372 City/App Deck source program.
- W373–W374 optional Google identity code and W374B onboarding/surface links.
- W375 Market Intelligence, W376–W377 Apps/Blueprint workrooms, W378
  Cloudflare/Codex deployment readiness, and W379 solo pricing/return-evidence
  governance.
- Historic source, archives and test fixtures needed by the current test suite.

## What is deliberately absent

- `.git`, `node_modules`, `dist`, coverage, generated test output and logs.
- `.env*`, Cloudflare Secrets, Google OAuth values, browser storage, tokens,
  cookies, provider keys and payment credentials.
- Historical screenshots/media that are not required to build or test source.
- Actual approved character GLB/GLTF, texture, animation, music or SFX packs.

## Truth before continuing

- Guest mode remains usable.
- Google Login is optional, identity-only and **not a backup**. Every relevant
  surface routes to Profile / Account & Backup; only Profile can begin OAuth
  after explicit acknowledgement.
- Google Cloud is staged in Testing mode by the operator, but Cloudflare D1,
  bindings, Secrets, Preview/live OAuth proof and public consent publishing are
  not completed by this source handover. W378 adds exact operator/Codex runbooks
  but does not claim these actions occurred.
- EON City source programs are complete through W372, but final art, device
  proof and live visual certification are still outstanding.
- C-00 Cloudflare production truth repair remains mandatory. Do not claim
  production current or activate payments/automation until it is complete.
