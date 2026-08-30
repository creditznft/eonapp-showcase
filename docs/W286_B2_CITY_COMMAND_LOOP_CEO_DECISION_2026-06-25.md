# W286-B2 — EON City live-work command loop: CEO decision

**Decision date:** 25 June 2026  
**Status:** source-ready only; external evidence is still required.  
**Release state:** W260 remains **NO-GO**.

## Product decision

EON City is EONAPP's optional *visual command layer*.

- **Chat/EONBOT and native app routes remain the fastest controls and only results surfaces.**
- **City Lite** is the canonical accessible, low-device work map.
- **Three.js Visual Tour** is a spatial overview on capable devices.
- **Babylon City Play** is the flagship original RPG-style command district: a memorable way to explore destinations, understand active work, and see real local work cues.

No City mode may become a second automation runtime, a fake mission simulator, a reward loop, an economy, a combat game, a wallet, or a provider control plane.

## What W286-B2 adds

The existing bounded Agent Presence Bridge now derives a *work huddle* from real recorded local lifecycle status:

- **Focused local work:** one recorded local status cue.
- **Live work crew:** two or more recorded local status cues are active together.
- **Checked handoff:** a recorded step is handing off to the next checked step.
- **Review needed:** a recorded step is waiting for an explicit user review.

This is **not NPC dialogue**. It exposes no prompt, model output, transcript, tool activity, model name, provider account, credential, Vault value, wallet, balance, referral, payment, or personal data.

## Useful flagship behavior

1. A user starts or reviews real work in Chat or a native surface.
2. Existing mission/agent lifecycle facts create minimal local visual presence.
3. City Lite, Three.js, and Babylon show the same crew/handoff state immediately.
4. Babylon displays a readable live-crew HUD and NPC labels without requiring an NPC click.
5. The user chooses **Manage in Chat** or a review-first City destination to control work or see the actual result.
6. City never starts, sends, approves, cancels, or publishes work.

## Babylon quality bar

Babylon City Play is a public flagship only after external evidence confirms all of the following:

- City-native task awareness helps users understand work faster; it does not slow their work compared with Chat.
- Agent presence appears only during genuine local lifecycle states; empty states show no invented busy crew.
- NPC bubbles are readable at normal desktop distance and remain understandable on supported touch devices.
- A low-end or accessibility fallback always reaches City Lite cleanly.
- Route actions remain review-first and never trigger sensitive state.
- Original procedural art, reduced motion, keyboard, touch, optional controller, performance governor, and privacy boundaries remain intact.

## Explicit non-goals

No autonomous swarm, remote task queue, network streaming, live transcript, background provider/tool call, persistent NPC memory, multi-user play, combat, gambling, loot, token, wallet, transfer, trade, referral activation, reward grant, payment, Cloudflare mutation, or deployment is introduced by this phase.
