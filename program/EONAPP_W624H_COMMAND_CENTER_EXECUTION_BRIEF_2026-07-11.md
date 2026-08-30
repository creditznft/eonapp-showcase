# W624H Execution Brief — Truthful Command Center

Date: 2026-07-11  
Prerequisite: W624G productive mission loop  
Constraint: remain inside the existing Command District; W624C visual expansion gate remains active

## Mission

Turn the Command Center into a read-only, traceable status surface for real EONAPP state. Every visible value must name its source, authority, freshness and next explicit user action.

## Required status families

1. Projects: bounded count, recent local outcome and canonical Projects route.
2. AI runtime: Local AI readiness and user-owned BYOK verification state without exposing endpoints, keys, prompts or responses.
3. Jobs: genuine locally persisted/authoritative job receipts only; otherwise explicit empty or unavailable state.
4. Billing: server-authoritative entitlement summary and freshness, never inferred from client storage.
5. Backup/recovery: local Capsule/Drive readiness and latest bounded receipt without secrets or file contents.
6. Recent productive outcomes: W624G bounded receipts only.

## State and freshness contract

Each status card must support:

`loading · current · empty · stale · offline · unavailable · error`

Show source label, local/server authority, observed timestamp, age/freshness and a truthful explanation. Stale or unavailable data must never be painted as current.

## Interaction boundary

- Read-only overview by default.
- Every route/action requires a visible review and separate confirmation.
- No hidden navigation, provider call, job execution, billing mutation, backup, restore or referral action.
- No private project names, prompts, files, provider credentials, payment records or account identifiers in City storage.
- Preserve W624B–W624G lifecycle, paths, Wayfinder, Orbit, NPC LOD and mission contracts.

## Acceptance

- Focused source contract and tests for all six status families and seven states.
- Traceable source/timestamp/freshness on every card.
- Explicit empty/stale/offline/error behavior.
- Server-authoritative billing cannot be replaced by local claims.
- Genuine job absence remains empty—not simulated workers.
- Real-browser evidence where available; otherwise exact owner/Codex command and BLOCKED receipt.
- Stable checkpointed `npm run verify:codex-predeploy` extended without renaming.
