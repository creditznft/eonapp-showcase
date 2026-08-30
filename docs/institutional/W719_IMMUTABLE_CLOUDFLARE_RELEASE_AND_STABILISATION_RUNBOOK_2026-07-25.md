# W719 Immutable Cloudflare Release and Stabilisation Runbook

W719 reuses the proven W641 candidate builder, W660L complete Pages-root staging and W655 guarded Cloudflare deploy helper. It adds W718 owner-acceptance and identical-root controls. None of the source gates deploys anything.

## Prerequisites

- exact W718 certification receipt is `ok: true`;
- `config/w718-owner-scorecard.json` evaluates to accepted;
- clean exact source commit;
- passing permanent predeploy receipt and one production build;
- Cloudflare credentials available only in the controlled release environment.

## Freeze

```text
npm run release:w719-freeze-candidate
```

This creates `artifacts/w719-release-candidate` and `artifacts/w719-pages-root`, records candidate and complete Pages-root SHA-256, and refuses to run without W718 acceptance. It never deploys.

## Preview

```text
npm run release:w719-preview-plan
```

The default is a dry-run plan. After reviewing the plan, the operator may invoke the underlying script with `--execute`. Verify every route in `W719_PREVIEW_VERIFICATION_ROUTES`, OAuth/session behavior, Functions, Projects, NEXUS, City, Expanse, billing read paths, service-worker activation and rollback identity.

## Production owner GO

Complete `config/w719-owner-go.json` with the exact source commit, candidate digest, Pages-root digest, Preview URL/deployment ID, rollback deployment ID, accepted W718 scores and zero P0/P1 defects. Then generate the production dry-run:

```text
npm run release:w719-production-plan
```

Execution remains explicit. Production must use the same frozen Pages root and must not run a build.

## Verification and rollback

Verify `eonapp.ch`, release provenance, critical routes, Functions APIs and cache activation. Rollback uses the recorded previous Cloudflare deployment and never rebuilds. Keep the release branch draft/unmerged until owner live acceptance.

## Stabilisation

Observe at 24 hours and seven days. Collect only bounded client-visible failure metadata—not prompts, projects or provider keys. During stabilisation fix only P0/P1 regressions; defer features. Preserve source ZIP, Git bundle, evidence, checksums, deployment IDs, rollback runbook and owner handover.

## Current truth

At this source checkpoint W719 release machinery is ready, but the candidate is not frozen and no Preview or production deployment has run because W718 exact dependency/browser/device/owner acceptance is still pending.
