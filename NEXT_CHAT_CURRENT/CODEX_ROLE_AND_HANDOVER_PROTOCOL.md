# Codex role and handover protocol

## Codex may do

- fetch current `main` and confirm exact commit;
- create a clean isolated worktree;
- apply/rebase the ChatGPT-produced patch;
- run `npm ci`, lint, tests, build, smoke, audit, readiness, security scan;
- correct merge conflicts mechanically without changing product decisions;
- deploy only after source validation;
- capture raw browser/device evidence;
- report failures honestly with artifacts.

## Codex may not do without a new written instruction

- redesign City visuals or change performance thresholds;
- weaken/delete a test to get green;
- suppress browser/WebGL warnings;
- replace source with an older archive;
- activate Dodo;
- activate direct social connectors;
- activate local image/video adapters;
- claim production/device certification without captured evidence;
- commit credentials, `.env`, `node_modules`, build output, screenshots/traces, or cache.

## Required merge protocol for W479-R

1. Verify package checksum and source manifest.
2. Fetch `origin/main`; record the exact current SHA.
3. Compare the current main against `CURRENT_LIVE_BASELINE_AND_DELTA.md`.
4. Apply only the W479-R patch in a clean worktree.
5. Preserve current W228/W210 compatibility and six City E2E contract files.
6. Run source gates and the full current suite.
7. Commit source and tests separately from generated evidence.
8. Push review branch; fast-forward main only after validation.
9. Wait for actual deploy identity; do not infer it from push success.
10. Capture fresh live evidence on eonapp.ch using the same witness thresholds.
11. Return one evidence ZIP plus `CITY_CERTIFICATION_STATUS.md` with PASS / FIX REQUIRED / ENVIRONMENT BLOCKED only.
