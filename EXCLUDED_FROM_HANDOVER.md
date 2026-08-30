This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Intentional exclusions

This source handover excludes only material that is unsafe, generated or not
needed to install/build/test the source tree:

- `.git`, `node_modules`, `dist`, coverage, test/playwright output and logs
- `.env*`, local Cloudflare/Google secrets, cookies, tokens, browser storage
  and the local IPNS configuration file
- editor/agent machine state and cached Lighthouse/Playwright artifacts
- historical QA screenshots, audio/video and other bulky non-source proof media
- old generated patch/audit packs that are not required by the current build or
  test runner

All current source, package manifests, functions, tests, scripts, configs,
archives needed by source checks, and text planning/runbook documents are
included.
