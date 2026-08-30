# EONAPP — Next Chat Continuation Bundle

**Bundle date:** 2026-06-28  
**Baseline:** W405 source, then validated UX-1, UX-2, UX-3, W411 local Sync Basic foundation, Share-2 completed-output actions, W406B City art intake, W408 Creator Atrium + Forge Bay, W409 local living systems and W410 manual City validation readiness  
**Purpose:** Continue product work from the newest safe source without losing the accepted UX, sync, voice, creator, viral and City decisions.

## First rule

This bundle is the source of truth for the next ChatGPT coding session. Do not merge older W393/W399/W400 archives over it. Preserve the W405 rescue behavior, then implement the approved next waves in order.

## What is in this bundle

- Lean runnable source: no `node_modules`, `dist`, `.env`, Cloudflare secrets, D1 data, tokens, or browser artifacts.
- W405 source and previous W399/W400 handover material needed to understand the baseline.
- New master decisions for simple Google login, EON Sync, multilingual voice, share/remix and the two-stage EON City flagship.
- Curated screenshots from the user’s current manual review.
- A Codex return-evidence checklist for the final deployment phase.

## Current truth — do not over-claim

- `eonapp.ch` was deployed from W399 and later W405 source preparation exists in this bundle; the live W405 UI itself still needs a real deployment and human verification.
- Google OAuth/D1 infrastructure was configured, but live Google sign-in, logout, account deletion and session persistence still require controlled proof with a Google test account.
- Guest work remains device-local. W411 contains only a local safe-record and migration-preview foundation; cross-device Sync is **not built, connected or enabled**. Share-2 adds only an explicit short-lived browser-session handoff from completed Creator/Forge outputs into local Share Pack or Remix Card forms. W406B adds an authored-art intake policy, but ships zero binary City assets. W407 adds an original-procedural Arrival Gate, wet-street path and local first-mission cue. W408 adds distinct Creator Atrium and Forge Bay exteriors that reuse the visible W404 launch board. W409 adds local decorative NPC cues, a virtual visual cycle, optional atmosphere and a non-rewarding Mission Board under the existing quality governor. W410 adds a local manual Validation Lab with a separate Device Lab handoff; it does not inspect or upload visual/device evidence. None of these waves is final art, deployed visual proof or device proof.
- Collection, Relay attribution/rewards, external Action Gateway, social OAuth/posting, GitHub/Cloudflare user deployment and commerce are present only as locked/pre-launch foundations. They must not be activated accidentally.
- The Babylon City is the one canonical City route. The current scene is a rescue baseline, **not** a finished high-art game.

## Start here in the next chat

1. Read `NEXT_CHAT/01_START_HERE_NEXT_CHAT_PROMPT.md`.
2. Read `NEXT_CHAT/02_UNIFIED_PRODUCT_MASTERPLAN.md`.
3. Review `NEXT_CHAT/USER_REVIEW_SCREENSHOTS/README.md`.
4. Read `NEXT_CHAT/46_START_HERE_AFTER_W410_2026-06-28.md`.
5. Verify the baseline before code:

```bash
npm ci
npm run verify:w410-city-validation-lab
```

6. W406A live OAuth/City evidence remains mandatory. Do not activate Sync, claim cross-device behavior or build a public Sync flow from the W411 local foundation. W410 is source-only and remains under the W406B no-binary/provenance boundary; W407/W408/W409/W410 manual device proof is still pending.

## Source package boundaries

Intentionally excluded: `.git`, `node_modules`, `dist`, `.wrangler`, `.env*`, `.ipns-config`, temporary logs, test captures, local browser profiles and any secret-bearing or obsolete blockchain/IPFS configuration.

The source includes some historical documentation. The controlling current documents are under `NEXT_CHAT/` and `HANDOVER_DOCS/`.
