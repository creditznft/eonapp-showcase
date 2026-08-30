# W624I Execution Brief — Genuine Agent Theatre

Date: 2026-07-11  
Prerequisite: W624H Truthful Command Center

## Mission

Turn Agent Theatre into a truthful projection of genuine job receipts. Theatre animation may reflect actual lifecycle state, but it must never simulate workers or invent progress.

## Required lifecycle

`queued · preparing · waiting-for-user · running · paused · failed · cancelled · completed`

## Required job detail

- Bounded job identifier and created/updated timestamps.
- User-visible job type and explicit source surface.
- Execution rail: Local, Direct BYOK, Guide/proposal, or unavailable.
- Privacy boundary and what leaves the device.
- Progress only when authoritative progress exists.
- Display-safe logs only; no prompts, secrets, provider keys, full files or raw responses.
- Explicit review, retry, pause/resume where genuinely supported, cancel and result handoff.

## Truth boundaries

- Empty means no genuine receipt.
- No moving avatar, glowing workstation or “working” label without matching real state.
- Browser-local proposal/draft is not a running provider job.
- No automatic execution when Theatre opens.
- No billing/referral/reward mutation.
- Preserve W624B–W624H and the Command District expansion block.

## Acceptance

- Focused lifecycle/source/privacy tests.
- Real local job adapter and real user-approved Direct BYOK adapter boundaries.
- At least one real local job and one real Direct BYOK job must eventually be observed end to end before live certification; source work may remain proof-pending when unavailable.
- Failure, cancellation, timeout, retry and result handoff remain truthful.
- Stable `npm run verify:codex-predeploy` extended without renaming.
