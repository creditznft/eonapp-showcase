This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# START HERE — EONAPP W380–W393 Continuation Handover

Date: 2026-06-27

This is the lean runnable source handover for the next ChatGPT/Codex window. It continues the product reset from W380 through W393 and preserves the newest source state from the W393 Babylon Command Deck snapshot.

## Current source of truth

Use this folder/ZIP as the source baseline:

- `EONAPP_NEXT_CHAT_W380_W393_CONTINUATION_HANDOVER_2026-06-27.zip`
- Latest completed implementation wave: **W393 — Babylon Command Deck**
- Latest source state includes W380, W381, W382/W383, W384, W385, W386, W387, W392 and W393.

This is a lean runnable package. It excludes `node_modules`, `dist`, `.git`, screenshots, browser profiles, env files, external credentials, production secrets, generated reports, and legacy evidence bundles.

## What is done

### W380 — Root Chat + theme foundation
- `eonapp.ch` root is the canonical EONBOT chat home.
- `/chat` and `/chat.html` redirect to `/`.
- Graphite/Obsidian/Neon Night dark theme foundation exists.
- Old Classic/System theme choices migrate safely to Graphite.

### W381 — Guest shell + Share foundation
- Guest sidebar utilities: Plans/future pricing, Install EONAPP, Help/support.
- Compact profile/account popover.
- Local pinned chats.
- Chat header Share is a small truthful popover, not a full-page overlay.
- EON Share remains draft/native-share only. No automatic social publishing.

### W382/W383 — Local chat attachments
- Local chat attachment/drop flow exists.
- Attachment handling is local-first and bounded.
- File viewer expansion is still planned, not complete for every file type.

### W384 — Simplified Apps hub
- Apps is reduced to clear product entry points.
- Build opens EON Forge.
- Old Workspace/Cockpit style wording is not primary.

### W385 — EON Forge Quick Build
- `/forge` exists.
- User can create a starter static website project.
- Project saves locally.
- Preview runs inside sandboxed iframe.
- Source export works and pauses on likely secrets.

### W386 — EON Forge Developer Workspace
- Developer editing surface exists.
- Source checks and revision concepts are in place.
- Forge is becoming the standalone coding/build product.

### W387 — Forge integrity + change review
- Controlled import/local image assets/change receipts/source checks were added.
- Forge remains local-first: no fake GitHub, no fake deploy, no fake AI coding.

### W390/W391 — Collection + viral-growth decision
- Planning document is included.
- Collection/referral rewards/social publishing are **not active**.
- Future model: deterministic, non-transferable cosmetic progression first; no cash, no NFT, no downline, no sale, no chance reward.

### W392 — Direct EON City entry
- Public EON City flow moves toward direct Babylon entry.
- Portal-style friction is removed from the primary path.

### W393 — Babylon Command Deck
- Command Deck is now an in-world Babylon destination, not a separate public Three.js route.
- User explicitly chooses EONBOT, Forge, Projects, Library or City Map.
- No private prompt/source/Vault/reward/social data is rendered in the Deck.

## Validation completed in latest completed waves

From W393 handover:

```bash
npm run lint -- --max-warnings=0
npm run qa:w392-direct-eoncity-entry
npm run qa:w393-command-deck
npm run qa:w366-neon-command-district
npm run qa:w249-babylon-play-proof-spike
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
node scripts/w249-babylon-play-proof-spike-gate.mjs --require-dist
```

W393 reported:

- Unit tests: 332 passed.
- Build/smoke/audit/readiness passed.

## Run after extracting

Use Node 22.

```bash
npm ci
npm run lint -- --max-warnings=0
npm run test:unit
npm run qa:w385-eon-forge-quick-build
npm run qa:w386-eon-forge-developer-workspace
npm run qa:w387-eon-forge-integrity-change-review
npm run qa:w392-direct-eoncity-entry
npm run qa:w393-command-deck
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

If a script name is missing in a future merged repo, inspect `package.json` and run the closest existing wave gate. Do not claim green unless the actual script exists and passes.

## Important user decisions locked

- Root domain is ChatGPT-like EONBOT chat home.
- Dark themes only: Graphite default, Obsidian, Neon Night.
- EON Forge is the coding/build product.
- Essential source export stays free.
- Babylon is the public EON City engine.
- Three.js/Spatial Space is not a separate public product; best ideas are folded into Command Deck.
- Market/NFT/store language is paused.
- Collection is progression/reward, not investment, NFT, exchange, or marketplace.
- Referral rewards remain disabled until identity, anti-abuse, legal/policy, and support gates are complete.
- Social connectors are required for global users, but only through official OAuth/API, user consent, visible draft review, per-post approval and revocation.
- TikTok should not be globally removed merely because the founder is located in India; connector availability must respect user geography and platform policy.
- Multilingual voice is important: non-English users should be able to speak their local language to EONBOT.

## Current urgent next work

1. **W394 — City mobile/touch/HUD proof**
   - Reduce HUD clutter.
   - Improve touch controls.
   - Test narrow desktop and actual mobile.
   - Capture screenshots/video before any flagship claim.

2. **W394B — Multilingual voice audit and implementation plan**
   - Detect browser speech-recognition support.
   - Add language selector for speech recognition.
   - Persist preferred voice language.
   - Route recognized text through EONBOT with language intent.
   - In Guide Mode, respond with safe built-in guidance in the detected/preferred language where possible.

3. **W382B/W383B — File viewer expansion**
   - PDF viewer.
   - Text/Markdown/code viewers.
   - Image/audio/video previews.
   - Spreadsheet/document handling should be import-summary first unless a safe viewer is implemented.

4. **W388A — EON Share drafts/export/native share**
   - Generate post copy, image/video briefs, disclosure reminders and native-share/export packages.
   - No platform OAuth yet.

5. **W388B — Social connector architecture**
   - Official OAuth per platform.
   - Server-side token storage only after account/privacy work.
   - No localStorage tokens.
   - Per-post user approval.
   - Connectors: TikTok, Instagram, Facebook Pages, YouTube, LinkedIn, X/Twitter, Pinterest, Reddit, Telegram, WhatsApp share/export.

6. **W395 — Google identity/D1 proof**
   - Required before server-side entitlements, referrals, social tokens or account-backed Collection.

7. **W390A/W390B — Collection visual progression**
   - Local visual Collection display.
   - Deterministic Vault Reveal for product milestones.
   - No referral reward active.

## Do not do in the next chat until foundations exist

- Do not enable random paid lootboxes.
- Do not use NFT/blockchain wording.
- Do not make items transferable/sellable.
- Do not reward clicks/signups/shares.
- Do not store platform tokens in the browser.
- Do not silently post on social media.
- Do not claim TikTok/Instagram/YouTube posting works until official app/API review and live proof pass.
- Do not claim account backup unless Google/D1 and explicit backup proofs are implemented.

## Suggested next prompt for Codex/new ChatGPT

Continue from `EONAPP_NEXT_CHAT_W380_W393_CONTINUATION_HANDOVER_2026-06-27.zip`. First run `npm ci`, lint, unit, W392/W393 City gates, build, smoke, audit and launch readiness. Then implement W394 City mobile/touch/HUD proof. Keep source lean under 20 MB after packaging. Do not enable referrals, Collection entitlements, social OAuth or automated posting yet. Also add a planning/update doc for multilingual voice and file viewers, then proceed to W388A EON Share drafts/native-share only.
