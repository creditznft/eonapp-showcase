# W624G — Productive RPG Loop

Date: 2026-07-11  
Status: source-complete; real-browser/device/outcome-lifecycle proof pending  
Canonical City route: `/eoncity`

## Purpose

W624G connects the existing Command District to truthful EONAPP outcomes. The mission layer guides users toward real product surfaces, but it cannot execute work, invent progress or award value.

## Six mission families

1. **Orientation** — records one local controls-reviewed receipt after explicit review.
2. **Project** — completes only after a real project shell is created or an existing project is explicitly resumed.
3. **Local AI / Direct BYOK** — completes only after a passed local-runtime self-test or a verified user-owned provider rail.
4. **Creator** — saves a reviewable image/video guide artifact with `proposal-only` execution truth.
5. **Automation** — completes only after a real local workflow proposal/draft is saved.
6. **Vault recovery** — completes only after an encrypted backup action or successful explicit restore writes a bounded receipt.

## State contract

The finite mission states are:

`empty · review · ready · active · unavailable · cancelled · failed · resumed · completed`

A mission can become `completed` only from an allowlisted, verified receipt whose route and source match the mission contract. Review, start, cancel, resume and orientation completion require explicit user actions.

## Privacy and commercial boundary

The City mission store contains only:

- mission id and state;
- review/start/update/completion timestamps;
- a bounded outcome kind, route, source, opaque receipt id and verification timestamp;
- an optional finite failure code.

It never stores project titles, prompts, files, provider keys, endpoints, model responses, passphrases, backup contents, restored values, wallet data, email addresses or account identity. The mission module performs no fetch, WebSocket, navigation, billing, referral or checkout mutation.

No mission awards money, tokens, discounts, EONKEYS, subscription value or speculative ownership.

## Cross-surface outcome writers

- `assets/js/eon-workspace-pages.js` writes bounded project-create/project-resume receipts.
- `assets/js/local-ai/local-ai-page.js` writes only after a passed runtime self-test.
- `assets/js/vault/eon-vault-page.js` writes only after verified direct-provider readiness.
- `assets/js/create/eon-create-hub.js` persists a local proposal-only review guide.
- `assets/js/eon-automations-page.js` writes after a real workflow proposal is saved.
- `assets/js/local-first/eon-workspace-capsule-page.js` writes after real encrypted backup or restore actions.

## City integration

The City station owns one disposable mission panel with:

- six visible review cards;
- source, required action, privacy boundary and proof boundary;
- explicit Start/Resume, Cancel, Stay and route-confirmation controls;
- local orientation completion;
- explicit “Check real outcomes” refresh;
- truthful completed-outcome display.

W624B runtime ownership, W624C paths/spawn/collision/Unstuck, W624D Wayfinder/camera, W624E Orbit and W624F guide/LOD systems remain separate and intact.

## Test and deployment contract

- W624G source gate: **31/31**.
- Focused W624G tests: **6/6**.
- Maintained suite: **226 files / 832 assertions / 785 current passes / 47 explicit historical skips / 0 failures**.
- `test:unit` now runs in nine serial checkpointed chunks when invoked through the certifying source fingerprint, so an interrupted Codex shell can resume without weakening serial test safety.
- The stable external command remains `npm run verify:codex-predeploy`.

## Evidence boundary

The loopback Vite fixture started, but managed Playwright Chromium was unavailable. The browser receipt is `BLOCKED`; no screenshot, production-authentication, provider execution, generation, automation execution, backup execution, commercial event, physical-device quality or owner visual approval is claimed.
