# W301–W304 implementation status — 2026-06-26

## Scope decision

This patch implements **W301–W304 only** from the institutional Chat-first plan. It deliberately does **not** begin W305 or later work.

No OAuth, account system, token vault, Cloudflare Worker/D1 mutation, preview/production deployment, social publishing, scheduler, durable job, wallet, referral, reward, or value-system activation occurred.

## Delivered

### W301 — Git-history secret remediation boundary

- Added an owner-gated remediation runbook at `docs/W301_GIT_HISTORY_SECRET_REMEDIATION_RUNBOOK_2026-06-26.md`.
- Added a source gate and focused test that require a remote-history rewrite to remain explicit, credential rotation to precede rewrite when applicable, and post-rewrite CI scanning to be retained.
- The supplied source archive has no `.git` history. Therefore this patch **does not claim the historical CI finding is fixed**. Draft PR #2 must remain unmerged until the repository owner completes the remote procedure and CI proves the reachable history clean.

### W302 — Capability Truth Registry

- Added `assets/js/capabilities/capability-truth-registry.js`.
- The registry uses `active-local`, `active-connected`, `draft-only`, `manual-composer`, `planned`, `retired`, and `blocked` lifecycle states.
- Every record declares an ID, canonical surface, connection/approval/effect boundary, evidence owner/test, and truthful user-facing note.
- Chat, Workspace, Automations, and the City prepared-action boundary consume the same registry.
- Action-specific existing safety warnings remain visible; registry wording supplements rather than replaces those warnings.

### W303 — Legacy salvage manifest

- Added `config/w303-legacy-salvage-manifest.json`.
- It classifies `agent-executor`, `video-lab`, `music-lab`, `social-publisher`, `workbench-ai`, `eon-browser-page`, retired Creator Studio, and `platform-backend` as `keep-pure`, `extract-after-test`, `rewrite`, or `archive-forever`.
- The manifest explicitly forbids active imports of legacy network, token/browser-storage, wallet, reward, referral, browser-attachment, and publishing behavior.

### W304 — Local Chat Action Cards and Review Inbox

- Added local-only Mission Draft, connection-required, provider-required, review-required, approval-packet-preview, and blocked/retired cards.
- A request to publish, schedule, connect, or run an agent becomes a non-executable local plan and optional local Review Inbox entry.
- Cards retain no raw chat message, credential, token, cookie, OAuth material, provider key, URL callback, or executable server packet.
- A preview is explicitly `local-draft-not-server-issued`, expires after 24 hours, and can be reviewed or dismissed only. It cannot publish, schedule, start OAuth, create a background job, deploy, or mutate Cloudflare.
- Workspace shows the local Review Inbox. City remains a local visual mirror and rejects non-local truth states.

## Validation actually performed

| Check | Result |
| --- | --- |
| Supplied source ZIP SHA-256 / extraction | Pass: `5cd8444c32665192a57965e16cff995d637331575e09db05596c67559ca248de`; 3,184 original files recorded |
| Fresh `npm ci --include=dev --no-audit --no-fund` | Pass on Node 22.16.0 / npm 10.9.0 |
| `npm run lint -- --max-warnings=0` | Pass |
| `npm run qa:w301-w304-foundation` | Pass: W301 gate, W302–W304 gate, 7 focused tests |
| Related existing Chat/local boundaries | Pass: 20 tests covering W230, W232, W233, W256 |
| Workspace secret scan | Pass: no potential secrets in current workspace scan |
| `npm run build` | Pass; 196 distribution files in the validation build |
| `npm run test:unit` | **Blocked by inherited source-package evidence defects**: 261/278 pass, 17 fail |

## Inherited full-suite blockers, independently proven

The untouched supplied source archive was checked separately before this patch. It has the same two underlying failures:

1. The original archive does not include a `release-evidence/` directory. Eleven checked-in gates expect source-readiness boards there. That absence causes 15 full-suite test failures across W260, W263, W264, W267, W268, W271, W272, W281, W285, W287, and W288.
2. The untouched archive's `archive/retired-value-systems` integrity check reports 25 archived-file hash mismatches. That causes the R3-F1 test and the dependent W242 test to fail.

These are provenance and packaging failures, not W301–W304 behavior failures. This patch does **not** fabricate release boards, alter archived files, or rewrite archived hash records to make tests green.

## Required next owner actions before merge or W305

1. Retrieve the canonical `release-evidence/` directory and the matching R3-F1 archive hash manifest from the authoritative repository commit recorded by the original handoff (`dd118b069144131c5ddc1bfe842fbe36ff7f540d`), or issue a corrected authoritative source archive.
2. Verify the restored evidence and archive-manifest bytes against the authoritative commit; do not author substitute board JSON or recalculate archived hashes without provenance approval.
3. In a clean clone of the actual draft-PR repository, perform W301 credential rotation where applicable, then the approved history rewrite, force-push only with the named owner’s decision, and rerun CI secret scanning against reachable history.
4. Re-run the entire validation matrix. Only after the history scan and the two package-integrity defects are green may PR #2 be reconsidered for merge. W305 remains blocked until then.
