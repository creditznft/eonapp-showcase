# NFT Art Engine World-Class Plan (EONAPP.CH)

Date: 2026-05-08
Scope: Team Realm, Market, Marketplace, Lootbox NFT visual quality only
Owner: EON Team Product + Frontend + Art Systems

## 1. Vision

Build a deterministic, code-only NFT art engine that produces premium relic/object visuals with enough depth, rarity expression, and stylistic consistency to compete with top marketplace collections.

Non-goals:
- No emoji-centered NFT compositions.
- No dependency on external image assets for core generation.

## 2. Quality Standard

A generated NFT is accepted only if it passes all checks:
- Distinct silhouette: primary object readable at thumbnail size.
- Rarity readability: common to god-tier difference visible in 1 second.
- No obvious duplicates in a 100-card sample with same collection profile.
- Metadata-art coherence: traits shown on card match visual motifs.
- Render performance target: generation under 120ms on mid-range desktop.

## 3. Engine Architecture

### 3.1 Rendering Stack
1. Atmosphere layer
- Gradient fields, radial meshes, local bloom pockets.

2. Structural layer
- Geometry pack per style family (rings, prisms, pillars, fracture arcs, totems).

3. Relic core layer
- Deterministic archetype-driven object geometry:
  - core-monolith
  - arc-crown
  - void-prism
  - aegis-shard
  - signal-spindle
  - orbital-relic

4. Surface detail layer
- Etching grid, micro-lines, edge traces, and interior seams.

5. FX layer
- Particle field + ambient pattern.
- Hollow variants with mode animation signatures.

6. Collector frame layer
- Multi-ring frame, rarity glow, serial line, style labels.

### 3.2 Trait Model (Deterministic)
Input seed creates a stable trait profile:
- rarity
- archetype
- family
- material
- engraving
- aura
- sigilCode
- stylePack

Trait profile drives both visual geometry and label text.

### 3.3 Collection-Aware Archetype Hints
Map collection types to stronger defaults:
- realmlord -> arc-crown
- signal -> void-prism
- operator/compute -> signal-spindle
- builder/template -> core-monolith

This keeps identity coherent across pages while preserving variation per seed.

## 4. Rarity Direction

- common: lower contrast, fewer micro-details, soft edge lighting.
- uncommon/rare: stronger accent contrast, richer interior structures.
- epic/legendary: denser etching, brighter glow channels, stronger frame energy.
- ultra/god-tier: highest contrast, denser ambient field, sharper relic silhouette and border intensity.

## 5. Product Surfaces

### 5.1 Team Realm
- NFT cards must show generated image + hollow preview.
- Card metadata should display archetype/style/sigil, not emoji tags.

### 5.2 Market
- Generated art used for all NFT/template/agent style cards.
- Type badge can remain textual (NFT, AGT, TPL), no emoji requirement.

### 5.3 Marketplace
- Fallback preview must use collectionType + rarity seed.
- Collection badges should be compact text symbols (LAND, NFT, OPS, etc).

### 5.4 Lootbox
- Lootbox output must call the same renderer profile family.
- Paid hollow upgrades must render visually distinct hollow outputs.

## 6. Anti-Duplication Strategy

- Multi-factor seed: id + title + collectionType + rarity + price + variant.
- Style pack and archetype derived from independent hash channels.
- Add micro-detail variance channels:
  - etching density
  - ambient arc spread
  - particle distribution
  - frame line offsets

## 7. Performance and Safety

- Keep SVG output deterministic and bounded.
- Avoid unbounded loops; fixed maximum element counts.
- Keep data URI size practical for card rendering.

## 8. Rollout Plan

Phase A (done in this session)
- Remove emoji-centered core composition.
- Ship procedural relic core geometry.
- Surface archetype/sigil/style metadata in Team Realm cards.
- Replace emoji collection/type icon chips with text tags on Market/Marketplace NFT contexts.

Phase B
- Add per-theme archetype families (game, AI, finance, social, compute).
- Add foil channels by material (obsidian/alloy/glass/plasma/ether).
- Add rarity-specific frame motifs and corner signatures.

Phase C
- Add acceptance harness:
  - 100-sample visual uniqueness checker
  - contrast/readability checks
  - render-time benchmark

## 9. Release Gate

Before main promotion push, require:
- Visual QA pass on Team Realm + Market + Marketplace + Lootbox.
- Duplicate scan on 500 generated samples per major collectionType.
- Manual art direction sign-off for top 20 hero outputs.

## 10. Success Metrics

- Marketplace card CTR uplift for NFT cards.
- Increase in time-on-grid for Team Realm and Market.
- Reduced user complaints about repeated/cheap-looking visuals.
- Increased conversion from lootbox reveal to mint/purchase intent.
