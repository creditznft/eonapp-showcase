# EONAPP Wave 09 — Lootbox Economy + RealmWorld MVP Audit

Date: 2026-06-02  
Workspace base: Wave 08 NFT/metaverse lean workspace plus RealmWorld MVP architecture patch  
Mode: coding + CEO architecture audit, no full deploy/build in chat

## Executive decision

EONAPP should ship one flagship metaverse-style game as **EON RealmWorld**.

This should not start as a moderation-heavy MMO. The launch-safe design is a deterministic, local-first realm explorer where each user owns a generated map, NFTs become buildings/monuments, lootboxes become world events, EONBOT becomes an AI/NPC guide, and realm snapshots can be exported to Arweave for permanent public hosting.

## CEO product direction

### What RealmWorld is
- A beautiful generated map for every user.
- A local-first game/workspace surface.
- A showroom for NFT utility, Realm products, referrals, and AI workflows.
- A place where EONBOT can act as a non-boring AI guide.
- A bridge between Vault, Market, Realm, WorkBench, lootboxes, and NFTs.

### What RealmWorld is not at launch
- Not a public chat MMO.
- Not a free user-upload world builder.
- Not a central-server multiplayer platform.
- Not an unmoderated content feed.
- Not a VR-first project.

## Moderation-free safety model

Launch rules:
- no public free-text chat
- no user asset uploads
- ghost visitors only
- preset emotes only
- 2–4 peer max later
- public realms list only owner-approved snapshot metadata
- all visual objects generated from safe deterministic code
- EON Team and user realms show product cards, not arbitrary HTML

This keeps the world interesting while avoiding heavy moderation obligations.

## Decentralized hosting model

The correct data model is:

1. Realm generated on user device.
2. Snapshot exported as JSON.
3. Snapshot + NFT media/metadata bundle uploaded to Arweave later.
4. Public visitors load realm data from Arweave/gateway, not from the owner device.
5. Owner can update by publishing a new snapshot version.
6. Smart-contract land ownership can point to the latest permanent metadata path later.

## Coding completed in this wave

New files:
- `realmworld.html`
- `assets/css/realmworld.css`
- `assets/js/realmworld-page.js`
- `assets/js/utils/realmworld-generator.js`
- `assets/js/utils/realmworld-lootbox-economy.js`
- `tests/unit/realmworld-generator.test.mjs`
- `tests/unit/realmworld-lootbox-economy.test.mjs`

Updated files:
- `index.html`
- `realm.html`
- `market.html`
- `marketplace.html`
- `vault.html`
- `sitemap.xml`

## Implemented MVP behavior

RealmWorld now supports:
- deterministic map snapshot generation
- terrain types
- districts
- monuments from NFT/utility objects
- NPCs including EONBOT guide, market host, and loot keeper
- product NPCs from EON Team catalog
- portals to Chat, AI Cockpit, Market, and Vault
- safe presence modes: solo, invite-only, public-listed
- no-chat/no-upload safety profile
- Arweave-ready manifest export
- lootbox claim cooldown
- daily claim caps by plan
- paid-tier odds boost without investment claims
- reward mapping to creator, referral, workflow, builder, operator, and realmlord reward types

## Lootbox economy launch rules

Free plan:
- 2 daily claims
- 45-minute cooldown
- low rarity odds

Paid plans:
- higher daily cap
- small rarity boost
- bonus chance

Important: paid boosts should be framed as entertainment/utility access, not investment or profit opportunity.

## NFT-to-world mapping

NFT utility type → RealmWorld object:
- `land` → Realm Gate
- `realmlord` → Sovereign Hall
- `builder` → Builder Forge
- `operator` → Operator Nexus
- `signal` → Signal Observatory
- `compute` → Compute Forge
- `workflow` → Workflow Loom
- `dataset` → Data Vault
- `prompt_pack` → Prompt Library
- `agent_profile` → Agent Shrine
- `skill_pack` → Skill Dojo
- `referral` → Growth Beacon
- `nft` → Relic Gallery

## Validation completed here

Passed:
- `node --check assets/js/realmworld-page.js`
- `node --check assets/js/utils/realmworld-generator.js`
- `node --check assets/js/utils/realmworld-lootbox-economy.js`
- `node --test tests/unit/realmworld-generator.test.mjs tests/unit/realmworld-lootbox-economy.test.mjs`
- `node scripts/site-audit.mjs`
- `node scripts/launch-page-invariants.mjs`
- `node scripts/launch-readiness.mjs`

Results:
- RealmWorld tests: 7/7 passed
- Site audit: passed
- Page invariants: 0 blockers, 0 warnings
- Launch readiness: 0 blockers, 0 warnings

## Current score

RealmWorld MVP architecture: **7.6 / 10**

Strong enough as a first coded prototype and strategic direction. Not yet a finished flagship game.

## Remaining blockers before calling it flagship-ready

1. Needs visual QA in browser.
2. Needs mobile touch usability pass.
3. Needs better 2.5D/3D rendering later.
4. Needs Arweave upload integration wired to current uploader.
5. Needs smart-contract land metadata mapping reviewed.
6. Needs public realm directory design.
7. Needs P2P ghost visitor implementation later.
8. Needs EONBOT in-world chat panel integration.
9. Needs ownership/visitor permission UX.
10. Needs performance testing on mobile.

## CEO decision

Keep RealmWorld in the codebase as a **beta flagship surface**, but do not market it as a finished metaverse yet. Market it as:

> “A local-first AI realm where your NFTs, tools, products, and EONBOT become an interactive world.”

## Next wave recommendation

Because this chat is long and file uploads started failing, the next wave should happen in a new chat window.

Recommended next wave:

**Wave 10 — PWA, SEO, Accessibility, Mobile, and Performance Audit**

Scope:
- manifest
- service worker
- mobile navigation
- realmworld mobile UX
- SEO metadata
- sitemap/robots
- a11y skip links and headings
- cache safety for payments/admin
- page weight and route polish
