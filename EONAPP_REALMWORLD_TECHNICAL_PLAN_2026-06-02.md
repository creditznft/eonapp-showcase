# EON RealmWorld Technical Plan

Date: 2026-06-02

## Product thesis

EON RealmWorld is the missing flagship game/metaverse layer for EONAPP. It turns the app from a collection of tools into a world: Vault becomes identity, NFTs become buildings, lootboxes become events, Market becomes a showroom, WorkBench becomes an AI control room, and EONBOT becomes an in-world guide.

## Architecture

### MVP architecture
- Browser-only HTML/CSS/JS.
- Deterministic map generation.
- LocalStorage for draft realm state.
- JSON snapshot export.
- Arweave manifest export.
- No backend required for solo mode.

### Durable public realm architecture
- User generates realm locally.
- User exports snapshot JSON.
- User uploads snapshot and media bundle to Arweave.
- Public visitors load snapshot from Arweave/gateway.
- Smart-contract land NFT metadata can point to the Arweave snapshot later.

### P2P architecture later
- WebRTC data channel.
- Invite link first.
- Public-listed mode later.
- Ghost avatars only.
- Preset emotes only.
- No chat.
- No user asset uploads.
- Max 4 peers.

## Realm snapshot schema

Current schema: `eon.realmworld.snapshot.v1`

Core fields:
- owner wallet
- username
- display name
- seed
- terrain
- palette
- districts
- monuments
- NPCs
- portals
- safety profile
- permanence rail

## NPC design

MVP NPCs:
- EONBOT Guide: routes owner/visitor to Chat and WorkBench.
- Market Host: presents product cards and utility NFTs.
- Loot Keeper: explains drops and claim rules.
- Product Curators: one per selected realm product.

NPCs should use preset cards and safe scripted copy first. Later, EONBOT can generate contextual summaries from the owner-approved realm snapshot.

## NFT/utility object mapping

- Land → Realm Gate
- Realm Lord → Sovereign Hall
- Builder → Builder Forge
- Operator → Operator Nexus
- Signal → Signal Observatory
- Compute → Compute Forge
- Workflow → Workflow Loom
- Dataset → Data Vault
- Prompt Pack → Prompt Library
- Agent Profile → Agent Shrine
- Skill Pack → Skill Dojo
- Referral → Growth Beacon
- Collectible NFT → Relic Gallery

## Visual roadmap

Phase 1:
- 2D/2.5D CSS map
- animated SVG NFT cards
- node-based world navigation

Phase 2:
- canvas/WebGL map renderer
- parallax terrain
- camera movement
- minimap

Phase 3:
- Three.js/Babylon-style 3D mode
- avatars as ghosts
- portal transitions

Phase 4:
- WebXR optional mode
- VR/AR viewing only, not required for launch

## Economy rules

- Free users get limited daily lootbox claims.
- Paid users get more daily claims and small rarity boost.
- Rewards are entertainment/utility collectibles, not investment products.
- Lootboxes must not promise resale value.
- Paid lootbox boosts should stay inside subscription utility, not gambling-like direct purchase loops.

## Public discovery

The safest public discovery model is:
- public realm cards show only snapshot metadata
- no public chat
- no free uploads
- no arbitrary profile HTML
- visitors enter a generated safe viewer
- owners can hide/unlist their public realm

## Future files to add

- `assets/js/utils/realmworld-arweave.js`
- `assets/js/utils/realmworld-directory.js`
- `assets/js/utils/realmworld-p2p.js`
- `assets/js/utils/realmworld-land-contracts.js`
- `tests/unit/realmworld-arweave.test.mjs`
- `tests/unit/realmworld-directory.test.mjs`

## CEO launch status

RealmWorld is now directionally correct and has a coded MVP shell. It should remain beta until mobile UX, browser QA, Arweave upload, and smart-contract land mapping are verified.
