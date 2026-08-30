This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex Prompt — Continue EONAPP After W404 + W388A.1

Use this source folder as baseline. It contains a lean runnable EONAPP continuation through W404 City Creator Atrium and W388A.1 EON Share Pack.

## Required first validation

Use Node 22.

```bash
npm ci
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

Do not say historic release-board evidence is certified. The lean archive intentionally excludes 12 historical handoff/release-board test lanes. `npm run test:unit:legacy-diagnostic` is informational only, not release certification.

## Continue next: W388A.2 Remix Cards

Build a public-safe Remix Card format that a creator can deliberately export/share after reviewing it.

Required boundaries:

- No private chat, uploaded file body, Vault data, API key, raw Forge project, model/provider status, or account data in a card.
- No remote database, analytics, server resolver, OAuth, or automatic post.
- Bounded fields only: title, intended audience, safe template/brief, goal, optional creator credit, safe CTA, and one reviewable route/format identifier.
- Recipient can start their own local draft/remix; no ownership or referral reward is granted yet.
- Keep local/export/native-share-only behavior.
- Add schema, source gate, unit tests, Workspace integration, and an honest truth/status note.

## Then: W388A.3 EONBOT Make It Shareable

Create an explicit EONBOT/Workspace action that converts a user-reviewed public-safe brief into an EON Share Pack or Remix Card. It must not auto-share or imply posting.

## Locked boundaries

Do not enable or claim:

- Referral rewards or Collection entitlements.
- OAuth/direct platform publishing, scheduling, stored social tokens, analytics, auto-DMs, or auto-posting.
- Image/video inference, local model install/download, direct BYOK provider calls, or hidden key retrieval.
- Fair-use permission, generic downloader, rights clearance, or raw-media cloud persistence.
- A separate Creator Studio/Video Lab/Music Lab public product.
- A separate Three.js public City route.
- Payment, marketplace, NFT, blockchain, transferable assets, resale, cashout, or crypto.

## Source truths to preserve

- `/` is canonical EONBOT chat home.
- Dark Graphite default/Obsidian/Neon Night only.
- Forge is the real coding/build surface.
- Babylon is public EON City.
- City is a launch/status/preview place, not an editor or private-data surface.
- Creator use modes must remain explicit: local runtime guidance, future Vault-backed BYOK, or draft-only.
- Local creator source/proxy/cache handling is temporary by default; final media needs explicit save once rendering exists.

Before packaging a next handover, run build, smoke, audit, readiness, all new gates, and the current unit suite. Keep the source package lean and exclude `node_modules`, `dist`, secrets, browser profiles, screenshots, and generated reports.
