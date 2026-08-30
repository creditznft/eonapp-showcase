# W624D — Current Test Contract Alignment

Date: 2026-07-11  
Status: stable certification authority aligned through W625H source tooling; historical exact-copy assertions are explicit and non-certifying

## Why Codex kept stopping before GitHub deployment

The old `test:unit` path mixed current invariants with assertions written for superseded product states. Later canonical waves intentionally changed those states:

- W623E established the beginner-facing **Create-first** information architecture.
- W621 and W623C established live, server-authoritative Dodo billing instead of approval-pending catalogue assumptions.
- W624B established one protected `/eoncity` runtime owner and retired alternate renderer documents.
- W624C and W624D established the Command District, Wayfinder, camera, recovery and evidence-boundary contracts.

The resulting failures were contract drift, not permission to weaken current safety checks.

## Frozen policy from W624D onward

1. Current invariants remain mandatory and certifying.
2. A superseded exact historical assertion remains visible as `test.skip` with an explicit archive marker.
3. The untouched pre-W624D file is preserved in a checksum manifest under the non-certifying archive.
4. Every archived assertion names its current replacement coverage.
5. Historical diagnostics cannot approve deployment, security, accessibility, commercial truth, visual quality or launch readiness.
6. Every future handover includes the maintained runner, current-suite manifest, archive manifest, reports and one Codex predeploy command.

## Exact classification

- Maintained test files: **239**
- Maintained run: **909 assertions total**
- Current assertions passed: **862**
- Superseded assertions explicitly skipped: **47**
- Current failures: **0**
- Untouched historical source files archived: **36**
- Evidence-dependent historical diagnostic files excluded from certification: **12**

The 47 assertions remain in their current `tests/unit/` files as named `test.skip` entries. Their untouched originals are stored beneath:

`archive/tests/superseded-exact-copy/W624D_2026-07-11/`

The archive is governed by:

- `archive/tests/superseded-exact-copy/W624D_2026-07-11/MANIFEST.json`
- `config/w624d-current-contract-alignment-contract.mjs`
- `config/w624d-current-unit-test-manifest.json`
- `scripts/w624d-current-contract-alignment-gate.mjs`
- `scripts/w624d-test-archive-gate.mjs`

## Deterministic execution

The maintained suite defaults to one worker. A small set of older tamper-detection tests temporarily modifies a shared source file and restores it in `finally`; running those tests concurrently can create false failures. `EONAPP_TEST_CONCURRENCY` remains available from 1 to 8 for isolated diagnostics, while release certification uses the serial default.

The full Codex runner uses a repository lock and a resumable source-fingerprinted checkpoint:

`.eonapp-codex-predeploy.lock`

A second overlapping certification run is blocked. A stale lock is removed only when its recorded process no longer exists. After every successful stage the runner writes `reports/w624d-codex-predeploy/checkpoint.json`. Re-running the same command resumes only an exact successful stage prefix and only when the SHA-256 certifying-source fingerprint is unchanged. Any source change invalidates the checkpoint and forces a fresh run.

## Codex commands

Fast maintained unit check:

```bash
npm run test:unit
```

Classification and archive integrity:

```bash
npm run qa:w624d-current-contract-alignment
npm run qa:w624d-test-archive
```

Only supported predeploy command:

```bash
npm run verify:codex-predeploy
```

The predeploy runner executes the maintained unit suite, live Dodo/current commercial/referral/City gates including the current W624E–W624L City gates and W625A–W625H local creator gates, lint, secret scan, production build, build smoke and build-dependent W623F certification in a fixed serial order. The stable W624D filenames are deliberately retained so Codex never needs a new release command or archive authority for each wave. It writes:

`reports/w624d-codex-predeploy/receipt.json`

## Evidence boundary

An archived assertion is neither a pass nor a failure. It is a named non-certifying historical snapshot with maintained replacement coverage. Browser, authenticated-production, physical-device, GPU, performance, thermal and owner-visual evidence remain separate proof lanes.
