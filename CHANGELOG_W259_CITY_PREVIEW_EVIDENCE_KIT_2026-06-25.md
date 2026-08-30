# W259 — City Preview evidence kit

## Status

**LOCAL-STATIC COMPLETE / EXTERNAL DEVICE DECISION BLOCKED.**

## Delivered

- Exact opt-in local tester mode at `/eoncity/play?preview=1`.
- Finite task and event schema with bounded local session retention.
- Local frame summary, task observations, context-loss/performance signals and
  redacted user-tapped JSON export.
- Responsive Preview log drawer without app-shell, account, credential,
  provider, chain, wallet, reward or commerce behavior.
- Corrected renderer-mount callback safety: inert preview controller exists
  before any renderer callback can fire.
- More truthful task semantics: pause/resume completes only after resume;
  returned mission and actual context-loss fallback record their own finite
  observations; both City Lite exit controls record the local return action.
- Device matrix, abort/rollback rules, evidence template and Codex runbook.

## Local proof

- 198/198 current-product tests.
- Zero-warning lint and fresh production build.
- W239–W259, R3-F1/R3-F2, site/PWA/readiness/identity/quality/policy/secret and
  production dependency gates pass.
- W259 marker exists in one deferred City Play output chunk; normal primary
  route HTML is free of preview tooling.

## Remaining blockers

No Android/iPhone/desktop/PWA/thermal/video/context-loss/human task evidence
has been captured in this sandbox. W259 cannot recommend a live Preview until
the finite matrix is performed through the runbook. W260 remains NO-GO board
work; C0-I remains blocked and chain runtime remains disabled.

## Final continuity replay

During final W259 validation, an inconsistent working copy had restored five
R3-F1 value-surface pages and eight R3-F2 Tier-3 redirect-only root documents.
They were removed again from the active root and retained only in their existing
hash-verified archives. This did not change W259 runtime behavior; it restored
the binding source-reduction contract before output proof.

Fresh final replay after that repair:

- 198/198 approved current-product tests.
- Zero-warning lint, clean 193-file production build and W239–W259/R3-F1/R3-F2
  gates all pass.
- Smoke passed; site audit passed across 40 emitted HTML files.
- PWA, readiness, page, identity, quality, current-policy, public-trust,
  workspace secret scan and production dependency audit passed.
