This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W394–W404 + W388A.1 Implementation Handover

Date: 2026-06-28
Status: runnable continuation source. This handover advances the lean W393 baseline through City mobile polish, safe chat file viewers, multilingual voice preference, creator architecture, asset provenance, lean-media policy, City Creator Atrium, and the first EON Share Pack.

## Current source truth

- Canonical public home remains the ChatGPT-like EONBOT chat shell at `/`.
- EON City remains Babylon-based. Three.js is not restored as a separate public product.
- EON Forge remains the native coding/build destination.
- Creator capability is consolidated into canonical Workspace + Local AI surfaces; legacy Creator Studio / Video Lab / Music Lab are not restored as public products.
- Referrals, reward grants, Collection ownership, social OAuth, direct publishing, scheduling, payment, marketplace/NFT/blockchain language, automatic cloud backup, and account-backed entitlements remain inactive.

## Completed waves

### W393A — Lean handover integrity repair

- Restored required root deploy assets from checked-in `public/` mirrors.
- Added explicit historical-evidence diagnostic boundaries.
- Current product tests certify runnable source only; 12 historical tests requiring omitted release boards/handoff archives are listed in a separate informational diagnostic and do not become a false current-product failure.

### W394 — City mobile/touch/HUD polish

- Direct City HUD is reduced to **Command Deck** and **City controls**.
- Direct entry starts with the minimap closed.
- Touch is analogue-joystick first; the D-pad is opt-in from City controls.
- Command Deck and control sheets respect narrow widths, safe-area insets, and short landscape viewports.
- This is source-level proof only. Real-device/manual visual proof is still required later.

### W382B/W383B — Local chat file viewers

- Local pre-send preview for images, PDF, plain text, Markdown, code, JSON, CSV/TSV, audio, and video.
- DOCX/XLSX/PPTX are recognized as metadata-only until a dedicated safe parser is added.
- No file execution, OCR claim, automatic upload, blob persistence, or raw file body in chat history.

### W394B — Multilingual voice foundation

- Local recognition-language preference: Auto, English, Hindi, Spanish, Portuguese, French, German, Arabic, Bengali, Russian, Indonesian, Japanese, Korean.
- Browser capability is shown truthfully; manual locale does not silently fall back to English.
- Only a local locale preference and user-sent locale metadata exist. No audio recording, transcript archive, or cloud transport was added.
- Real microphone/browser proof is still required later.

### W400/W402 — Creator truth + local/BYOK adapter architecture

- Creator Engine is integrated in Workspace and Local AI.
- Clear modes: local runtime guidance, future user-configured API path through Vault, or draft-only.
- Device-aware recommendation logic is declarative only: no installer, hidden model download, direct provider call, or media-generation promise.
- RTX-class desktop can be offered a local image-oriented route; low-tier/mobile devices are not promised local full video generation.

### W401 — Asset rights/provenance receipts

- Creators can make local, exportable source-context receipts for user-owned, licensed, public-domain, provider-generated, permission-granted, or unknown assets.
- The system does not clear rights, label assets as fair use, or approve publication.

### W403 — Lean media lifecycle

- Source media, preview proxies, and render cache are temporary work metadata only.
- No media blobs/data URLs are silently kept in local storage, IndexedDB, or cloud.
- A real final output is retained only after a future renderer/export path receives an explicit user save action.

### W404 — City Creator Atrium + Forge Bay

- Creator Atrium is a Babylon City destination, reachable from City controls and represented in-world.
- It links, after a visible user click, to Creator Engine, Forge Bay, local media planning, and provenance receipts.
- City shows no project/file/key/media/private chat/account/model/provider data and contains no editor or generator.

### W388A.1 — EON Share Pack

- Local Share Pack produces vertical, square, wide, and story drafts: captions, visual direction, video beats, CTA, optional credit, and disclosure reminder.
- Only explicit copy, local JSON export, and native device share are supported.
- No platform OAuth, posting, scheduling, analytics, tracking, referral reward, media rendering, or publishing claim.

## Validation completed

Use Node 22.

```bash
npm run lint -- --max-warnings=0
npm run security:secret-scan:ci -- --allow-no-history
npm run test:unit
npm run qa:w393a-lean-handover-integrity
npm run qa:w394-city-mobile-hud
npm run qa:w382b-w383b-local-file-viewers
npm run qa:w394b-multilingual-voice
npm run qa:w400-w402-creator-adapter-foundation
npm run qa:w401-asset-provenance
npm run qa:w403-lean-media-lifecycle
npm run qa:w404-city-creator-atrium
npm run qa:w388a1-eon-share-pack
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

Latest result in this handover:

- Strict lint: pass.
- Secret scan, source-only package mode: pass with no detected secret; Git history cannot be checked in a lean ZIP with no `.git` directory.
- Current unit suite: **302/302 test cases pass**, from 85 runnable current-product test files.
- Historical diagnostic: 12 release-board/handoff-evidence tests are explicitly **not certified** because their evidence was deliberately omitted from the lean handover.
- W393A, W394, W382B/W383B, W394B, W400/W402, W401, W403, W404, W388A.1: pass.
- Production build, smoke check, site audit, and launch readiness: pass.

## Dependency-audit note

`npm audit` reports 6 findings: 1 low, 1 moderate, 4 high. High-path packages include `miniflare`, `undici`, `wrangler`, and `ws`; all report an available fix. No blind `npm audit fix` was run because that can change the Cloudflare/Wrangler dependency chain. Triage and a reviewed lockfile update are required before a production security sign-off.

## Important non-claims

This package does **not** prove:

- real-device City visual/play proof;
- browser microphone permission/recognition proof;
- local image/video model installation or real inference;
- BYOK API calls or key retrieval;
- asset-rights clearance;
- social OAuth, posting, scheduling, or platform review;
- cloud account restore, referral grants, Collection entitlement, payment, or deployment;
- historic release-board, security, accessibility, operations, or independent-red-team certification.

## Next approved build sequence

1. W388A.2 — Remix Cards: public-safe, bounded starter payloads with no private chat/files/keys/source; local first.
2. W388A.3 — EONBOT “Make it shareable”: explicit review flow into Share Pack/Remix Card, no automatic sharing.
3. W395 — Google identity + Cloudflare D1 proof before persistent identities, social tokens, referral ledger, or Collection ownership.
4. W396 — update/rollback/restore proof.
5. W397 — human release audit with actual mobile/narrow desktop screenshots and manual device evidence.
6. W390A/B — account-bound Collection + deterministic Vault Reveal.
7. W391A/B/C — policy/legal packet, immutable ledger design, capped Relay pilot.
8. W406/W407 — action gateway/durable execution.
9. W388B/C/D — official OAuth/publishing connectors platform by platform, approval-first.
10. W389 — GitHub/Cloudflare user-owned deployment.
11. W398/W399 — creator/remix metrics and pilot refinement.
