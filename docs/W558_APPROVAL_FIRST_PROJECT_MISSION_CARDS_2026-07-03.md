# W558 — Approval-first Project mission cards

## Delivered local source foundation

A signed-in user can link a local Project to a deterministic private City portal and, only after deliberate review, add a short City-safe mission label with a coarse state. The City renderer receives only the reviewed label and state.

## Boundaries that remain enforced

- A raw task title is never copied automatically into City.
- Project IDs, summaries, prompts, files, provider output, credentials and Vault data never enter the 3D render plan.
- Every card requires an explicit user action and separate City-safe approval checkbox.
- Cards are local-only, capped at six per portal, deduplicated by reviewed label/state and removal requires confirmation.
- City uses at most three cards in non-lite rendering and one in lite mode.
- No route, publish action, agent task, reward, entitlement, network request or background generator is created.

## Evidence boundary

This is source/build/unit proof only. It does not prove a production City session, Cloudflare deployment, Google sign-in, device rendering, visual acceptance or multi-device project sync.
