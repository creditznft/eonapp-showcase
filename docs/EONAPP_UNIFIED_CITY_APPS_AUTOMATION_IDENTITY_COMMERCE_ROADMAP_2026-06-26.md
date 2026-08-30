# EONAPP Unified City, Apps, Automation, Identity and Commerce Roadmap

## Locked product sentence

EONAPP is a guest-first, local-first AI work environment: users choose an
outcome, work with reviewable AI, optionally enter EON City, and explicitly
connect services or create an account only when they need them.

## Non-negotiable boundaries

- City visualisation is never proof that AI is working unless a local, bounded
  foreground receipt exists.
- Chat and local work remain usable without Google sign-in.
- Google identity is optional and uses identity-only scope at first. It is not a backup or automatic sync service; local recovery remains an explicit encrypted export.
- External service connections are separate from identity.
- No wallet, token, referral, reward, payout or high-risk commercial system is
  activated through these waves.
- Payments use processor-hosted checkout and verified webhooks only.
- Every changed-code backup stays under 20 MB and excludes secrets, build
  output, dependencies, screenshots and binary art packs.

## City / Game lane

| Wave | Program | Deliverable |
|---|---|---|
| W359–W361 | Foundation | truthful AI character director, Portal migration, shared City state |
| W362 | Apps + A-01 | App Deck and action taxonomy |
| W363 | C-04 City Lite | illustrated 2.5D overview, visual profiles, city landmarks |
| W364 | C-05 controls | analogue touch joystick, keyboard, click-to-move, gamepad, minimap, accessibility |
| W365 | C-06 asset pipeline | authored GLB character/prop/architecture kit, PBR/LOD/provenance rules |
| W366 | C-07 district | Neon Command District exterior/interior, hero avatar, EONBOT, NPCs, work loop |
| W367 | C-08 Three.js | premium Spatial Command Space and visual task overview |
| W368 | C-09 EONBOT | proximity interaction, review cards, Chat/Workspace handoff, truthful receipts |
| W369 | C-10 sound | adaptive score, ambience, spatial sound, voice/sensory controls |
| W370 | C-11 Realm | local cryptographic Realm identity, style, landmark and portable config |
| W371 | C-12 performance | device budgets, LOD, memory lifecycle and weak-device fallback |
| W372 | C-13 certification | route, control, mobile, accessibility, visual and lifecycle proof |

## Apps / Automation lane

| Wave | Program | Deliverable |
|---|---|---|
| W362 / A-01 | taxonomy | read, draft, write, publish, spend, delete, admin classes |
| A-02 | connection broker | scoped OAuth/API key connection lifecycle and revocation |
| A-03 | execution boundary | local runner vs cloud scheduler contract |
| A-04 | integrations | high-value native connections and reviewed MCP adapters |
| A-05 | policy | approval, budget, rate, time and destination controls |
| A-06 | reliability | idempotency, retry, cancellation, dead-letter and receipts |
| A-07 | handoff | Chat, Apps and City workflow path |
| A-08 | beta | read/draft beta before controlled low-risk writes |

## Identity / Commerce lane

| Wave | Program | Deliverable |
|---|---|---|
| W364A | data custody | guest-first data-custody disclosure, pre-auth Google identity contract, encrypted-backup warning — complete locally |
| W373 | identity contract | D1 schema, deletion model, session retention rules, capability migration, no live auth |
| W374 | Google identity | OAuth code/PKCE callback, opaque sessions, D1 identity record, Preview proof |
| W375 | account UX | Google entry, safe account page, deletion and local-data boundary proof |
| W376 | merchant boundary | hosted-checkout and entitlement contract, provider evaluation, no live charge |
| W377 | PayU proof | verified webhook and entitlement flow after merchant approval/KYC |
| W378 | recovery options | passkeys and/or magic link; Google never becomes the only recovery method |

## Production lane

C-00 production truth repair is deferred by CEO choice, but it remains a hard
release gate before any public identity or payment launch:

1. reconcile Cloudflare production commit/output;
2. repair `/automations` and verify all canonical routes;
3. deploy Preview first;
4. run route, session and checkout-negative tests;
5. promote only after real evidence.

## Current sequence

W364A is complete. Continue W364–W372 in game order while W373 planning and
operator setup run in parallel. Do not enable W374 or W377 until the Google/Cloudflare
and merchant prerequisites are configured by the operator and C-00 is complete.
