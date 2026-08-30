# Institutional score reconciliation — W485

## Why the earlier 46.2/100 number cannot be reused as the current source score

The W484 deep audit was valuable as a risk scan, but it was based partly on two generated artifacts that were already stale in the W484 tree:

- `artifacts/W238_LEGACY_CONSOLIDATION_REPORT_2026-06-25.json` said `ok: false` because an old archive manifest/README expectation was absent.
- `artifacts/W235_ACCESS_MILESTONES_DISABLED_GATE_2026-06-25.json` said `ok: false` because an earlier Rewards-page copy check was not aligned with the current disabled-only implementation.

On the reconciled W485 source, the executable current-product tests are the controlling evidence:

- W235 disabled Access Milestones: **2/2 pass**.
- W238 active-source legacy fence: **2/2 pass**.
- Current runnable-product suite: **548/548 pass**.
- W479-R through W484 targeted gates: **all pass**.
- Strict lint, release verification, build, smoke, static site audit, launch-readiness, secret scan, full npm audit and production npm audit: **all pass**.

Therefore `46.2/100` is retained only as a historic risk observation. It is not the current source-quality score and must not be used as a launch verdict.

## Current institutional posture

| Dimension | Current status | Evidence |
|---|---|---|
| Source integration | Green | W485 reconciliation and 548/548 suite |
| Static release readiness | Green | lint, release verifier, build, smoke, audit, readiness, secret scan, dependency audit |
| Public live deployment | Amber | W485 is not yet rebased/deployed onto the actual remote main |
| City runtime certification | Red / Fix Required | latest live City evidence at `output/w479-city-live-2026-07-02/` |
| Physical devices | Red / unproven | Android, iPhone Safari, tablet proof missing |
| External activation | Intentionally blocked | payment, direct posting, local media adapters, automatic sync and IoT remain inactive |

## How to reach a defensible 95%+ readiness position

Do not use an average to hide a missing category. A 95%+ institutional claim requires all required launch gates to have current evidence:

1. W485 is cleanly rebased on the then-current remote `main`.
2. The full validation matrix is green after rebase.
3. The deployed City has zero bad-image and zero zero-size-mipmap WebGL warnings.
4. The 90-second desktop witness meets its stated pacing limit with no repeated post-load hitch above 100 ms.
5. Portrait, landscape and tablet UI are visually reviewed without overlap or clipped actions.
6. Android, iPhone Safari and tablet results are captured, or the release is explicitly scoped to supported environments without claiming all-device certification.
7. Browser/CSP/PWA/recovery/OAuth route proof is complete for launch surfaces.
8. Owner performs the final GO/NO-GO review.

No code-only result can substitute for those live/device proofs.
