This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP CI / Deploy Handover

Date: 2026-06-13
Repo: `EONAPP`
Workspace: `C:\Users\credi\WORKSPACE\EONAPP.CH`

## Current situation

GitHub Actions CI was failing before Cloudflare Pages deploy could trigger.

We fixed several earlier issues:

- merged the W135-W148 handover safely into the repo
- fixed stale test drift after the merge
- made 9 late-wave proof tests self-healing in clean CI environments
- changed Cloudflare deploy to trigger from successful `workflow_run` after CI
- moved CI and deploy from Node 20 to Node 22
- forced devDependencies to install in CI so `eslint` is available

## Important root cause found

The biggest package-install problem was not just Node versioning.

`package-lock.json` had many `resolved` URLs pointing at a private Artifactory mirror:

`https://packages.applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public/...`

That is unsafe for public GitHub Actions runners and likely caused the earlier npm install crashes.

The lockfile has now been normalized back to public npm registry URLs:

`https://registry.npmjs.org/...`

## Latest code changes already pushed

Latest relevant commit:

- `a322759c5` — `normalize npm lockfile and pin CI npm toolchain`

This commit:

- adds `"packageManager": "npm@11.12.1"` to `package.json`
- normalizes `package-lock.json` resolved URLs to public npm registry
- updates GitHub Actions CI to:
  - use Node 22
  - cache npm
  - upgrade npm to `11.12.1`
  - run strict `npm ci --include=dev --no-audit --no-fund`
- updates Cloudflare deploy workflow to use the same Node/npm toolchain

## Local verification completed

These commands passed locally after the lockfile/toolchain fix:

```bash
npm ci --include=dev --no-audit --no-fund
npm run lint -- --max-warnings=50
```

## Current GitHub Actions symptom

The newest CI failure is:

```text
npm error code ECONNRESET
npm error network aborted
npm error network This is a problem related to network connectivity.
```

This is different from the earlier npm CLI crash.

## Interpretation of the current failure

Most likely:

- transient GitHub runner network failure while downloading packages from npm
- not a proof that Node 22 is wrong
- not a reason to go back to Node 20

The deprecation warnings shown during install are not the main blocker:

- `lodash.isequal@4.5.0`
- multiple older `glob` versions
- `inflight@1.0.6`

These are dependency-tree hygiene warnings. They should be cleaned up later, but they do not explain the deploy gate being blocked right now.

## Files most relevant to inspect

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `package.json`
- `package-lock.json`
- `tests/unit/w135-live-hotfix.test.mjs`
- `tests/unit/w136-live-browser-proof.test.mjs`
- `tests/unit/w137-workstation-consolidation.test.mjs`
- `tests/unit/w138-market-nft-generation-proof.test.mjs`
- `tests/unit/w139-vault-persistence-backup-proof.test.mjs`
- `tests/unit/w140-eoncity-command-center-redesign.test.mjs`
- `tests/unit/w141-npc-device-quality.test.mjs`
- `tests/unit/w142-creator-studio-safety-copy.test.mjs`
- `tests/unit/w145-update-safe-user-data-survival.test.mjs`
- `tests/unit/ai-runtime.test.js`
- `assets/js/realm3d/engine/EonCityWorkstationRuntime.js`

## Recommended questions for ChatGPT 5.5

1. Does the current CI/deploy strategy look correct for Node 22 plus npm 11.12.1?
2. Is there any safer retry/caching strategy for `npm ci` on GitHub Actions when npm registry requests return `ECONNRESET`?
3. Should the workflow use npm retries, `fetch-retries`, or a mirrored registry strategy?
4. Are any of the transitive deprecated packages high-priority to remove now, or can they wait until CI/deploy is stable?
5. Is there a better minimal-risk GitHub Actions install block for this repo than the current one?

## Assumption for this bundle

This zip is a clean project handoff bundle for analysis.

It excludes bulky/generated/runtime-only content such as:

- `.git`
- `node_modules`
- `output`
- `tmp`
- `.tmp*`

That keeps the archive small enough to upload while preserving the code and workflow state needed for diagnosis.
