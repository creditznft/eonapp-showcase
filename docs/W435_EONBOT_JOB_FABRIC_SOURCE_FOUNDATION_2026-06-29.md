# W435 — EONBOT job fabric source foundation

**Date:** 29 June 2026  
**Status:** Source-level, local-only foundation. It is not a live agent, provider, Action Gateway, City NPC, deployment or external-action release.

## What this wave adds

- One bounded local lifecycle: **Answer → Draft → Ready for review → Awaiting approval → Completed / Failed / Cancelled**.
- A safe intent router that uses the existing local role classifier to choose Chat, Forge, Studio, Insight, Flow, City or a clear unavailable state. Original text is inspected only for routing and is never stored by the fabric.
- Capability truth derived from the existing EONBOT capability registry; no credential enters Chat or the job fabric.
- A local receipt/event stream with opaque job IDs, safe labels, state, timestamps and evidence hashes.
- Explicit user-action requirements for creating a job, draft transition, review transition, approval, completion, cancellation and retry.
- Explicit evidence requirements: a draft hash before review and a result receipt hash before a local completion state.
- Update-safe localStorage preservation coverage for `eon:eonbot:job-fabric:v1`.

## What it does not do

- It does **not** start a provider call, background process, browser permission prompt, scheduled job, publish/send/deploy action, account connection, payment, reward, referral, social post, file upload or external execution.
- It does **not** store prompts, raw outputs, credentials, API keys, provider endpoints, user files or Vault material.
- It does **not** create real active City NPC work. W439 remains the later, receipt-driven AgentSignal/NPC work and must use only verified job receipts with redaction.

## Verification

- Static W435 contract and gate.
- Unit coverage for routing privacy, explicit lifecycle transitions, evidence requirements, cancellation/retry and truth boundaries.
- This source milestone requires later UI integration and live evidence before any product copy says EONBOT agents are working.
