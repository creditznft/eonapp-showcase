# Infinite Themed Lootbox Generation System

## Current State Analysis

### Existing System
- **Lootbox.js**: Fixed catalog of 15 items (DEFAULT_CATALOG)
- **SOURCE_THEMES**: 6 themes (racing, oracle, market, memory, void, social)
- **EONLiteLoot.sol**: ERC1155 contract with IPFS metadata URIs
- **mintClaimableTrophy()**: Stores claimable trophies in localStorage

### Problem
- No infinite procedural generation
- Limited to 15 hardcoded items
- No game-specific themed collections
- No visual art generation for unique items

## Design Solution

### 1. Procedural Item Generation System

#### Game Theme Definitions
Each game has a theme configuration:
```javascript
const GAME_THEMES = {
  'neon-dungeon': {
    category: 'dungeon',
    palette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
    motifs: ['skull', 'sword', 'potion', 'scroll', 'key', 'chest'],
    prefixes: ['Ancient', 'Cursed', 'Shadow', 'Blood', 'Void', 'Crystal'],
    suffixes: ['of Doom', 'of Shadows', 'the Eternal', 'from the Deep'],
    shapes: ['hexagon', 'diamond', 'circle', 'star', 'shield']
  },
  'cosmic-arena': {
    category: 'space',
    palette: ['#0f0f23', '#1a1a3e', '#2d2d5e', '#00ffff', '#ff00ff'],
    motifs: ['star', 'nebula', 'planet', 'asteroid', 'comet', 'blackhole'],
    prefixes: ['Cosmic', 'Stellar', 'Nebular', 'Quantum', 'Astral', 'Void'],
    suffixes: ['of the Stars', 'from Beyond', 'the Infinite', 'of the Cosmos'],
    shapes: ['hexagon', 'triangle', 'circle', 'starburst', 'meteor']
  },
  'neon-rally': {
    category: 'racing',
    palette: ['#ff6b35', '#f7c59f', '#2ec4b6', '#e71d36'],
    motifs: ['wheel', 'engine', 'nitro', 'trophy', 'flag', 'gear'],
    prefixes: ['Turbo', 'Nitro', 'Velocity', 'Apex', 'Drift', 'Blitz'],
    suffixes: ['of Speed', 'the Fast', 'of Victory', 'the Champion'],
    shapes: ['diamond', 'chevron', 'lightning', 'arrow', 'circle']
  }
  // ... more games
}
```

#### Procedural Generation Algorithm
```javascript
function generateThemedItem(gameId, rarity, seed) {
  const theme = GAME_THEMES[gameId] || DEFAULT_THEME;
  const rng = seededRandom(seed);
  
  // Select components based on rarity
  const prefix = theme.prefixes[Math.floor(rng() * theme.prefixes.length)];
  const motif = theme.motifs[Math.floor(rng() * theme.motifs.length)];
  const suffix = theme.suffixes[Math.floor(rng() * theme.suffixes.length)];
  const shape = theme.shapes[Math.floor(rng() * theme.shapes.length)];
  
  // Generate colors based on rarity
  const colors = selectColors(theme.palette, rarity, rng);
  
  // Generate visual art (SVG)
  const svg = generateSVGArt(shape, motif, colors, rng);
  
  // Generate unique ID
  const itemId = `${gameId}-${rarity}-${hash(seed).toString(16)}`;
  
  return {
    id: itemId,
    name: `${prefix} ${motif} ${suffix}`,
    rarity,
    category: theme.category,
    source: gameId,
    description: generateDescription(prefix, motif, suffix, rarity),
    visual: {
      svg,
      colors,
      shape,
      motif
    },
    metadata: {
      seed,
      generatedAt: Date.now(),
      generationVersion: '1.0'
    }
  };
}
```

### 2. Visual Art Generation (SVG)

#### SVG Generation System
- Use procedural SVG generation for unique visuals
- Combine shapes, patterns, and colors
- Rarity affects complexity and glow effects
- All items are mathematically unique based on seed

```javascript
function generateSVGArt(shape, motif, colors, rng) {
  const complexity = getComplexityByRarity(rarity);
  const svg = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    ${generateBackground(colors, rng)}
    ${generateShape(shape, colors, complexity, rng)}
    ${generateMotif(motif, colors, complexity, rng)}
    ${generateGlow(colors, rarity)}
    ${generatePattern(complexity, rng)}
  </svg>`;
  return svg;
}
```

### 3. NFT Metadata Structure

#### ERC1155 Metadata Format
```json
{
  "name": "Cosmic Star of the Stars",
  "description": "A legendary cosmic artifact from beyond the void",
  "image": "ipfs://<CID>",
  "attributes": [
    { "trait_type": "Rarity", "value": "legendary" },
    { "trait_type": "Shape", "value": "hexagon" },
    { "trait_type": "Motif", "value": "star" },
    { "trait_type": "Primary Color", "value": "#00ffff" },
    { "trait_type": "Seed", "value": "1234567890" },
    { "trait_type": "Game", "value": "cosmic-arena" },
    { "trait_type": "Generation", "value": "1.0" }
  ],
  "external_url": "https://eonapp.ch/loot/cosmic-arena-legendary-1234567890"
}
```

### 4. Integration with Existing System

#### Extended lootbox.js Functions
```javascript
// Replace pickItem() with procedural generation
function pickItem(rarity, options = {}) {
  const sourceHint = normalizeSource(options.sourceHint || "system");
  const gameId = extractGameId(sourceHint);
  
  // Generate unique seed
  const seed = generateSeed(gameId, rarity, Date.now());
  
  // Procedurally generate item
  const item = generateThemedItem(gameId, rarity, seed);
  
  // Generate and upload SVG to IPFS
  const ipfsCID = uploadToIPFS(item.visual.svg);
  item.metadataUri = `ipfs://${ipfsCID}`;
  item.image = `https://dweb.link/ipfs/${ipfsCID}`;
  
  return normalizeCatalogItem(item);
}
```

### 5. IPFS Integration

#### SVG Upload Flow
1. Generate SVG string
2. Create metadata JSON
3. Upload to local IPFS node (localhost:5001)
4. Store CID in item metadata
5. Use public gateway for display

### 6. Smart Contract Integration

#### Token ID Strategy
- Use deterministic token IDs based on item properties
- Format: `[gameIdHash][rarity][seedHash]`
- Allows infinite unique tokens per game

```solidity
// Example token ID generation
// gameId: cosmic-arena → hash: 12345
// rarity: legendary → 3
// seed: 9876543210
// tokenId: 1234539876543210
```

### 7. Caching Strategy

#### localStorage Cache
- Cache generated items to avoid regeneration
- Key: `eon:generated-item:${itemId}`
- TTL: 24 hours
- Reduces IPFS uploads for common items

## Implementation Plan

### Phase 1: Core Generation System
1. Create `assets/js/utils/procedural-lootbox.js`
2. Implement game theme definitions
3. Implement procedural name generation
4. Implement SVG art generation
5. Implement description generation

### Phase 2: IPFS Integration
1. Create SVG to IPFS upload function
2. Create metadata JSON generation
3. Integrate with existing ipfs-gateway.js
4. Test IPFS uploads

### Phase 3: Lootbox Integration
1. Extend lootbox.js with procedural generation
2. Replace fixed catalog with dynamic generation
3. Add caching layer
4. Test with existing games

### Phase 4: NFT Minting
1. Update smart contract token ID strategy
2. Implement metadata URI generation
3. Add claim flow for generated items
4. Test on-chain minting

### Phase 5: Game-Specific Themes
1. Define themes for all current games
2. Add visual motif libraries per game
3. Test generation per game
4. Ensure theme consistency

## Benefits

1. **Infinite Unique Items**: Every item can be unique
2. **Game-Specific Themes**: Dungeon games get dungeon items, space games get space items
3. **Scalable**: No hardcoded item limits
4. **NFT-Ready**: All items have unique metadata and visual art
5. **Tradeable**: Each item is unique and distinguishable
6. **Collectible**: Rarity and visual variety encourage collecting
7. **Merge-Friendly**: Procedural attributes can influence merge outcomes

## Technical Considerations

### Performance
- Cache generated items
- Lazy load SVG generation
- Use Web Workers for generation
- Batch IPFS uploads

### Storage
- SVG strings are small (~2-5KB)
- Metadata JSON is small (~1KB)
- IPFS deduplicates identical content
- Local cache reduces network calls

### Uniqueness
- Seed-based generation ensures reproducibility
- 64-bit seeds provide 18 quintillion possibilities
- Game + rarity + seed = unique item

### Rarity Balancing
- Common: 73% base rate
- Rare: 20% base rate
- Epic: 6% base rate
- Legendary: 1% base rate
- Subscription boosts increase rare+ rates
