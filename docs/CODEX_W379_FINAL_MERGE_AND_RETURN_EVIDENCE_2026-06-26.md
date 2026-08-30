# Codex Handover — W379 Final Merge and Return Evidence

## Mission

Merge the latest W379 source as the full cumulative source of truth, preserve
all W301–W378 work, run the exact current quality gates, and return a concise,
redacted evidence packet. Do not activate a service merely because source code
is ready.

## Read first

1. `CURRENT_HANDOFF_2026-06-26/R4_W379_START_HERE.md`
2. `CURRENT_HANDOFF_2026-06-26/R4_W379_CONTINUATION_PROMPT.md`
3. `CURRENT_HANDOFF_2026-06-26/R4_W379_FULL_SOURCE_HANDOVER_STATUS.md`
4. `docs/R4_COMM03_SOLO_PRICING_AND_CATALOGUE_DECISION_2026-06-26.md`
5. `docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`
6. `docs/CODEX_W378_MERGE_PREVIEW_PRODUCTION_HANDOFF_2026-06-26.md`

## Non-negotiable safety boundaries

- Do not add or ask for Google, Cloudflare, payment-provider or any other
  secret in source, git, markdown, terminal output, screenshot or chat.
- Do not create `.env`, `.dev.vars`, credential snapshots, browser data, token
  exports, test-user passwords or database dumps in the repository.
- Do not activate Google Login, D1, payment, Pack sales, subscription,
  entitlement, EON Invite, coupon, referral benefit, ads, CPA, wallet, token,
  broker, market-data feed or trade execution.
- Keep guest use available and Google Login identity-only. It is not a backup.
- Keep W276 update-and-rollback evidence as NO-GO until it is actually captured.
- Keep Team, Scale and Enterprise absent from the current product roadmap.
- No paid claim, checkout or entitlement may be shown as live.

## Local merge and validation

Run from the repository root on Node 22:

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

If any command fails, do not bypass, delete, silence or weaken a gate. Return
the exact command, exit code, concise error and the smallest safe proposed fix.

## Preview-first work order

1. Merge into a fresh branch such as `r4-w379-final-readiness`.
2. Push the branch and wait for GitHub CI green.
3. Deploy Preview only. Do not promote Production from a source handover.
4. With no Cloudflare identity configuration, confirm guest-safe state on
   `/api/auth/session`, Apps, Workspace, Profile and `/trade`.
5. After the owner completes manual Cloudflare configuration, use only the
   approved Google Testing user for controlled OAuth proof. Preview OAuth stays
   disabled without a separate stable exact Google client/callback.
6. Capture redacted browser proof for Graphite default, Apps, one Blueprint
   workroom handoff, guest mode and one City return loop.
7. Follow W276 with harmless local test records only: update Preview, rollback,
   restore and confirm the expected local records survive. Never use secrets,
   personal data or real payment records.

## What Codex must return to the owner

Return a short packet containing:

1. Branch name and final commit SHA.
2. `git status --short` and `git diff --stat` after merge.
3. Node and npm versions.
4. One PASS/FAIL line plus captured exit code for every mandatory command.
5. GitHub CI run URL/status, if available.
6. Preview URL/status, if deployed.
7. A redacted route checklist: `/`, `/apps`, `/workspace`, `/projects`,
   `/automations`, `/profile`, `/trade`, `/eoncity`, `/billing`, `/api/auth/session`.
8. A redacted identity result only after owner configuration: guest state,
   OAuth Testing state, logout state and confirmation that local work did not
   become cloud-synced. No auth code, token, cookie, raw email, database row or
   secret may be attached.
9. W276 evidence location or an explicit statement that it remains NO-GO.
10. Exact unresolved blockers, without a green launch claim.

## Owner-only Cloudflare actions

The owner performs D1 bindings and variables/secrets manually using
`docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`.

Codex may tell the owner where to click, but must not receive, print, store or
paste a secret value.
