# W268 — Operations readiness runbook

**Current state:** source-controlled runbooks are ready; operations are **not ready** until observed drills and named owners are recorded in the W268 board. W260 remains **NO-GO**.

This runbook is intentionally conservative. It does not activate referrals, milestones, rewards, wallets, payments, chain runtime, D1 migrations, Pages Functions or background automation. No Lighthouse collection is required for this wave.

## 1. Incident triage and support routing

1. A named support owner records the issue time, app route, build/deployment identity, device/browser class, observed impact and safe reproduction steps. Do not record API keys, seed phrases, passwords, raw prompts, chat history, full URLs with query strings or browser storage exports in a support ticket.
2. Classify impact: **P0** security/data-loss/exposed secret, **P1** blocked work or unsafe misleading action, **P2** degraded route or recoverable defect, **P3** cosmetic/documentation issue.
3. For P0/P1, stop promoting the affected route. The release owner and rollback owner decide whether to remove the entry route or restore the prior verified deployment. Preserve the user report and local export only with the user’s informed consent.
4. Record a minimal public status/update only after facts are verified. Never claim a root cause before evidence exists.

## 2. Browser-local data export and restore

1. On a non-sensitive test profile, record the application version/build identity and create representative Chat, Vault-safe metadata, Projects, Workspace and City state. Do not use real credentials or recovery material.
2. Use the product’s export/backup mechanism to create a redacted local export. Verify the export is not shared publicly.
3. Test the planned upgrade or rollback route on the same device. **Do not clear browser-local data** as a rollback shortcut.
4. Restore the redacted export only into the controlled test profile. Record before/after keys and expected user-visible result. Any loss, mutation, duplicate, stale data or secret-like field is a blocking finding for W260.
5. Keep raw exports outside Git, handover ZIPs and chat transcripts. Store only a redacted receipt/reference in the evidence board.

## 3. PWA update and rollback

1. On a real device, install the existing PWA from the verified Preview/live build. Record browser/device version, install state and service-worker version without identifiers.
2. Exercise a basic offline/online return route, then update to a new Preview build. Observe update prompt/refresh behavior, City fallback and retained test state.
3. For a rollback drill, restore the immediately prior verified deployment or route entry configuration. **Do not clear browser-local data** to make the test pass.
4. Record whether the device recovered, whether the previous route rendered, whether cached assets updated safely and whether the support instructions were understandable.

## 4. Cloudflare Preview/live deployment rollback

1. The authenticated owner runs read-only deployment inspection and saves redacted output outside Git:

```bash
npx wrangler pages deployment list --project-name=eonapp-ch
```

2. Identify the candidate Preview deployment, its Git commit/deployment identity and the immediately previous known-good deployment. Confirm who has rollback authority.
3. Run the approved static source gates from the same clean checkout before a Preview deploy. The source freeze has no authority to deploy.
4. If a P0/P1 issue appears, use the owner-approved Cloudflare rollback procedure. Preserve data; do not substitute a cache purge or local-storage wipe for a rollback. Record the deployment identity and observed result.
5. This runbook intentionally contains no deployment command. Deploy and rollback actions require owner authentication and an independently reviewed decision.

## 5. Provider change and BYOK incident

1. Treat vendor deprecation emails, model removal, authentication changes, quota errors and regional endpoint changes as a provider-change incident, not an automatic source patch.
2. Compare official provider documentation against `config/ai-api-contracts.mjs`, then run `npm run qa:r3a1-ai-api-contracts` after any scoped change.
3. Use a user-owned, non-production key only after the user chooses to verify it. Do not paste keys into tickets, commits, logs or this runbook.
4. If discovery or inference cannot be verified, show the provider as unavailable/pending and retain Local AI/typed fallback. Do not claim a model is working from a stored key or old model name.

## 6. Security disclosure and secret rotation boundary

1. For suspected secret exposure, stop sharing the affected material immediately. Treat values as compromised until the account owner rotates/revokes them through the original provider.
2. Run the workspace secret scan and review Git history in the canonical repository with an authorised owner. This source freeze excludes `.git` and cannot perform the history review.
3. Do not paste secret values, account IDs, D1 contents or Cloudflare environment values into issue trackers, screenshots, handovers or chat.
4. Do not alter Cloudflare bindings, D1 schemas, Workers, Pages Functions or user-facing referral settings as part of a security drill unless a separate owner-approved change exists.

## Evidence rules and owners

Before the W268 board can move from `NOT_READY_PENDING_OBSERVED_DRILLS`, the release owner, support owner and rollback owner must be named and six required drills must have redacted, independently reviewable evidence. A source test, local build or documentation edit is not a drill.

Recommended read-only preparation commands from a clean local checkout:

```bash
npm ci --include=dev --no-audit --no-fund
npm run test:unit
npm run qa:current-static-certification:core
npm run qa:current-static-certification:tail
npm run lint -- --max-warnings=0
npm run build
npm run qa:w267-red-team-source-audit
npm run qa:w268-operations-readiness
npm run qa:w260-release-board
npx wrangler pages deployment list --project-name=eonapp-ch
```

Keep screenshots, device logs, PWA state and deployment records redacted and outside Git. Do not run Lighthouse as part of W268; its whole-site score program remains W282.
