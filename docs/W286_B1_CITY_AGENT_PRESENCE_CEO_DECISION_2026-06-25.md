# W286-B1 — EON City as the truthful live-work layer

**Decision date:** 25 June 2026  
**Decision:** source-ready only; external device, privacy, security, and workflow evidence is still required.  
**Release state:** W260 remains **NO-GO**.

## CEO decision

EON City is not a second app, a decorative fake simulation, or a game that competes with productive work. It is the optional visual layer over the same EONAPP workspace:

- **Chat/EONBOT is the fastest control surface.** A user starts, reviews, approves, and receives work in native app routes.
- **City Lite is canonical.** It must remain quick, accessible, low-device friendly, and useful without WebGL.
- **Three.js Visual Tour is the optional desktop spatial overview.** It exposes the same City state and a bounded visual work layer.
- **Babylon City Play is the flagship showpiece.** It is an original procedural RPG-style command district where users can explore, understand their work, and review app destinations. It must remain a productive route-review layer—not a combat loop, marketplace, economy, reward loop, or autonomous agent runtime.

## What is real in W286-B1

The shared Agent Presence Bridge consumes only existing local lifecycle facts from:

1. `mission-engine` — a user-requested EONBOT mission is routed, completed, waiting for approval, or failed.
2. `agent-executor` — a local approved workflow is queued, running a step, handing off, waiting for approval, completed, or failed.
3. `operator-activity` — only eligible local chat, Local AI, and automation activity. City navigation never creates an agent signal.

A signal is deliberately minimal: local work reference, finite role, finite action category, lifecycle status, and optional **local/cloud category**. It never contains prompts, replies, source files, tool output, model names, provider-account labels, credentials, Vault values, identity, wallet, balances, referral state, or payment data.

## User experience contract

A user can see up to four active agent characters/cues at once:

- **Coordinator:** routing and checked handoff visibility.
- **Research agent:** planning/research category.
- **Build agent:** code/creative/automation category.
- **Review agent:** publication-preparation review category.
- **Local runtime:** device-local AI category.
- **Guide mode:** local fallback, explicitly not a cloud/provider run.

NPC bubbles are status explanations, not transcripts. Examples: “working on a real local task,” “handing work to the next checked step,” “waiting for your review,” and “finished a recorded step.” The app must show **no active cue** rather than fabricate a crowd.

The user can hide the visual layer or optionally show only local/cloud provider category. These preferences are local and do not start, cancel, or alter a task.

## Babylon flagship standard

Babylon City Play should evolve as the main public demonstration only when it remains useful:

- Enter only after an explicit user tap and device gate.
- Preserve City Lite fallbacks at every stage.
- Present live work cues as readable NPCs with immediate bubbles, without requiring a click.
- Make destination actions review-first: approaching a landmark and tapping Interact may prepare a native route, but never opens it automatically.
- Keep the city original/procedural and source-controlled; do not ship copied/copyrighted assets.
- Use performance governor, quality profiles, reduced-motion, touch, keyboard, and optional controller support.
- Keep the “game” purpose focused on orientation, task awareness, collaboration visibility, and safe progress—not grinding, loot, gambling, rewards, trading, or real-world value.

## Explicit non-goals

W286-B1 does **not** add multi-agent autonomy, remote queues, network streaming, tool execution, provider calls, background automation, model download, transcript display, persistent NPC memory, multiplayer, combat, coin/token, wallet, signing, transaction, marketplace, reward, referral activation, Cloudflare mutation, or deployment.

## Evidence required before public flagship claims

1. Live task provenance: video/screenshot and redacted receipts show an agent appears only for a real user-initiated lifecycle event.
2. Device evidence: desktop, mid-range mobile, low-end mobile, reduced-motion, keyboard, touch, and controller walkthroughs.
3. Performance evidence: raw frame-time/memory observations and fallback behavior for City Lite/Visual Tour/City Play.
4. Accessibility review: focus order, dialogs, bubbles, contrast, motion, and screen-reader review.
5. Privacy/security review: independent confirmation that stored signals never expose sensitive work data or create a new remote transport.
6. Product review: users must be able to complete work faster in Chat/native routes than in the City; City must add understanding, not friction.
