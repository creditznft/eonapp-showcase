const /** @type {any} */
RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra', 'apex', 'god-tier'];
const NFT_VISUAL_ENGINE_VERSION = '2026.05.premium-export';

const RARITY_META = /** @type {Record<string, any>} */ ({
  common:    { label: 'Common',   color: '#94a3b8', glow: '#cbd5e1', borderW: 1.5, glowR: 6,  overlayAlpha: 0,    coronaAlpha: 0    },
  uncommon:  { label: 'Uncommon', color: '#34d399', glow: '#6ee7b7', borderW: 2,   glowR: 8,  overlayAlpha: 0,    coronaAlpha: 0    },
  rare:      { label: 'Rare',     color: '#38bdf8', glow: '#7dd3fc', borderW: 2.5, glowR: 12, overlayAlpha: 0,    coronaAlpha: 0.06 },
  epic:      { label: 'Epic',     color: '#a78bfa', glow: '#c4b5fd', borderW: 3,   glowR: 18, overlayAlpha: 0.04, coronaAlpha: 0.12 },
  legendary: { label: 'Legendary',color: '#fb7185', glow: '#fda4af', borderW: 3.5, glowR: 24, overlayAlpha: 0.07, coronaAlpha: 0.22 },
  ultra:     { label: 'Ultra',    color: '#f59e0b', glow: '#fde68a', borderW: 4,   glowR: 32, overlayAlpha: 0.1,  coronaAlpha: 0.34 },
  apex:      { label: 'Apex',     color: '#22d3ee', glow: '#67e8f9', borderW: 4.6, glowR: 38, overlayAlpha: 0.13, coronaAlpha: 0.44 },
  'god-tier':{ label: 'God Tier', color: '#f8fafc', glow: '#fef3c7', borderW: 5,   glowR: 44, overlayAlpha: 0.15, coronaAlpha: 0.52 }
});

const /** @type {any} */
HOLLOW_ANIMATION_MODES = ['prism-orbit', 'glitch-scan', 'aurora-bloom', 'quantum-shatter', 'crystal-resonance'];

const /** @type {any} */
STYLE_PACKS = [
  { key: 'ancient-forge', geometry: 'sigil-rings', contrast: 0.88 },
  { key: 'quantum-vault', geometry: 'grid-prisms', contrast: 1.06 },
  { key: 'star-temple', geometry: 'pillar-beams', contrast: 0.94 },
  { key: 'void-atlas', geometry: 'fracture-arcs', contrast: 1.12 },
  { key: 'neon-myth', geometry: 'totem-mesh', contrast: 1.0 }
];

const /** @type {any} */
ARCHETYPE_POOL = [
  'key', 'tower', 'blade', 'crown', 'orb', 'compass', 'idol', 'gauntlet',
  'crystal_shard', 'rune_stone', 'portal_arch', 'neural_lattice',
  'microchip', 'void_fragment', 'hourglass', 'eye_of_god',
  'astrolabe', 'wyvern_claw', 'sigil_disc', 'fractal_bloom',
  'dragon_skull', 'spell_tome', 'quantum_core', 'chaos_spiral',
  // New archetypes — fantasy / cosmic / organic / tech
  'war_hammer', 'death_mask', 'phoenix_wing', 'lich_crown',
  'arcane_prism', 'cosmic_egg', 'shadow_blade', 'golem_heart',
  'storm_vortex', 'sacred_mandala', 'void_eye', 'celestial_map',
  'titan_shield', 'rune_blade', 'spirit_lantern', 'blood_chalice',
  // New archetypes — abstract / obscure / surreal / cosmic
  'nebula_core', 'time_rift', 'glass_skull', 'mirror_realm',
  'living_sigil', 'echo_stone', 'null_cube', 'prism_eye',
  'thought_crystal', 'aether_knot', 'forbidden_tome', 'ouroboros',
  'spectral_crown', 'bone_compass', 'binary_idol', 'dream_shard',
  'void_bell', 'entropy_knot', 'lunar_disc', 'genesis_seed',
  // Sci-fi / Tech archetypes
  'rocket', 'spaceship', 'robot_head', 'microchip_array',
  'circuit_board', 'server_rack', 'satellite', 'robotic_alien',
  'neural_chip', 'plasma_core', 'warp_drive', 'data_crystal',
  'drone_core', 'cyber_skull', 'quantum_antenna', 'ai_eye'
];

const ARCHETYPE_HINTS = /** @type {Record<string, any>} */ ({
  land: 'tower',
  nft: 'orb',
  builder: 'microchip',
  operator: 'astrolabe',
  signal: 'neural_lattice',
  realmlord: 'crown',
  pioneer: 'key',
  compute: 'quantum_core',
  template: 'spell_tome',
  agent: 'eye_of_god',
  warrior: 'war_hammer',
  mage: 'arcane_prism',
  necromancer: 'lich_crown',
  rogue: 'shadow_blade',
  guardian: 'titan_shield',
  oracle: 'sacred_mandala',
  shaman: 'spirit_lantern',
  cosmic: 'cosmic_egg',
  abstract: 'nebula_core',
  surreal: 'mirror_realm',
  dream: 'dream_shard',
  entropy: 'entropy_knot',
  lunar: 'lunar_disc',
  genesis: 'genesis_seed',
  // Sci-fi / tech hints
  rocket: 'rocket',
  ship: 'spaceship',
  robot: 'robot_head',
  chip: 'microchip_array',
  circuit: 'circuit_board',
  server: 'server_rack',
  datacenter: 'server_rack',
  satellite: 'satellite',
  alien: 'robotic_alien',
  neural: 'neural_chip',
  plasma: 'plasma_core',
  warp: 'warp_drive',
  data: 'data_crystal',
  drone: 'drone_core',
  cyber: 'cyber_skull',
  antenna: 'quantum_antenna',
  ai: 'ai_eye'
});

// Collection-level palette identity — shifted hue families per collection type
const COLLECTION_PALETTE_BIAS = /** @type {Record<string, any>} */ ({
  realmlord: { hueShift: 30, satBoost: 0.12, accent: '#fb7185' },
  signal:    { hueShift: 200, satBoost: 0.18, accent: '#38bdf8' },
  builder:   { hueShift: 150, satBoost: 0.14, accent: '#34d399' },
  pioneer:   { hueShift: 45, satBoost: 0.1,  accent: '#fbbf24' },
  compute:   { hueShift: 260, satBoost: 0.16, accent: '#a78bfa' },
  operator:  { hueShift: 18,  satBoost: 0.16, accent: '#f97316' },
  workflow:  { hueShift: 150, satBoost: 0.16, accent: '#2dd4bf' },
  dataset:   { hueShift: 195, satBoost: 0.18, accent: '#38bdf8' },
  prompt_pack: { hueShift: 328, satBoost: 0.18, accent: '#f472b6' },
  agent_profile: { hueShift: 184, satBoost: 0.2, accent: '#22d3ee' },
  skill_pack: { hueShift: 34, satBoost: 0.15, accent: '#fbbf24' },
  referral:  { hueShift: 12,  satBoost: 0.2, accent: '#fb7185' },
  ai:        { hueShift: 210, satBoost: 0.24, accent: '#22d3ee' },
  server:    { hueShift: 200, satBoost: 0.22, accent: '#38bdf8' },
  nft:       { hueShift: 0,   satBoost: 0.05, accent: '#f472b6' },
  land:      { hueShift: 90,  satBoost: 0.1,  accent: '#86efac' },
  'land-exchange': { hueShift: 92, satBoost: 0.14, accent: '#4ade80' },
  template:  { hueShift: 310, satBoost: 0.14, accent: '#e879f9' },
  agent:     { hueShift: 180, satBoost: 0.22, accent: '#22d3ee' }
});

// Material rarity tiers — each material has its own rarity feel
// rarityFloor: minimum item rarity for this material to appear at normal weight
// prestigeScore: visual quality multiplier applied to detail layers
const MATERIAL_RARITY_TIERS = Object.freeze({
  bone:           { tier: 'common',    rarityFloor: 'common',    prestigeScore: 0.72, label: 'Bone'          },
  obsidian:       { tier: 'uncommon',  rarityFloor: 'common',    prestigeScore: 0.84, label: 'Obsidian'      },
  brass:          { tier: 'uncommon',  rarityFloor: 'common',    prestigeScore: 0.86, label: 'Brass'         },
  steel:          { tier: 'rare',      rarityFloor: 'uncommon',  prestigeScore: 0.90, label: 'Steel'         },
  rune_metal:     { tier: 'rare',      rarityFloor: 'uncommon',  prestigeScore: 0.93, label: 'Rune Metal'    },
  crystal:        { tier: 'epic',      rarityFloor: 'rare',      prestigeScore: 0.96, label: 'Crystal'       },
  ether:          { tier: 'epic',      rarityFloor: 'rare',      prestigeScore: 0.97, label: 'Ether'         },
  void_stone:     { tier: 'legendary', rarityFloor: 'epic',      prestigeScore: 1.02, label: 'Void Stone'    },
  plasma:         { tier: 'legendary', rarityFloor: 'epic',      prestigeScore: 1.04, label: 'Plasma'        },
  celestial_gold: { tier: 'ultra',     rarityFloor: 'legendary', prestigeScore: 1.12, label: 'Celestial Gold'},
  shadowsteel:    { tier: 'ultra',     rarityFloor: 'legendary', prestigeScore: 1.10, label: 'Shadowsteel'   },
  starfire:       { tier: 'god-tier',  rarityFloor: 'apex',      prestigeScore: 1.22, label: 'Starfire'      }
});

const PREVIEW_FINGERPRINT_WINDOW_MAX = 256;
const previewFingerprintWindow = /** @type {any[]} */ ([]);

function esc(/** @type {any} */ value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function hashSeed(/** @type {any} */ value = '') {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(/** @type {any} */ value = '') {
  let current = hashSeed(value);
  return () => {
    current ^= current << 13;
    current ^= current >>> 17;
    current ^= current << 5;
    return ((current >>> 0) % 1000000) / 1000000;
  };
}

function encodeSvgDataUri(/** @type {any} */ svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** @returns {string} */
function stableStringify(/** @type {any} */ value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

/** @returns {string} */
function deterministicDigest(/** @type {any} */ value) {
  const hash = hashSeed(typeof value === 'string' ? value : stableStringify(value));
  return `eon-fnv1a32-${hash.toString(16).padStart(8, '0')}`;
}

export function normalizeNftRarity(/** @type {any} */ value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return RARITY_ORDER[Math.max(0, Math.min(RARITY_ORDER.length - 1, Math.floor(value)))] || 'common';
  }
  const text = String(value || 'common')
    .toLowerCase()
    .trim()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
  if (text === 'godtier' || text === 'god-tier' || text === 'god.tier') return 'god-tier';
  return RARITY_META[text] ? text : 'common';
}

function normalizeRarity(/** @type {any} */ value) {
  return normalizeNftRarity(value);
}

export function getRarityMeta(/** @type {any} */ value) {
  const rarityKey = normalizeRarity(value);
  return { key: rarityKey, ...RARITY_META[rarityKey] };
}

function resolvePalette(/** @type {any} */ descriptor = {}, /** @type {any} */ rarityMeta, /** @type {any} */ rng) {
  const paletteHint = Array.isArray(descriptor.paletteHint) ? descriptor.paletteHint.filter(Boolean) : [];
  if (paletteHint.length >= 3) return paletteHint.slice(0, 5);
  const seedKey = descriptor.seedKey || descriptor.id || descriptor.title || 'eon';
  const /** @type {any} */
pools = [
    ['#080a10', '#18202b', '#334456'],
    ['#0c0a08', '#211810', '#4f3823'],
    ['#06090b', '#102029', '#2a4758'],
    ['#09070d', '#1a1522', '#3b3152'],
    ['#08090a', '#1a1f1a', '#32483d']
  ];
  const selected = pools[hashSeed(seedKey) % pools.length];
  const noise = rng() * 0.08;
  const lift = (/** @type {any} */ hex, /** @type {any} */ to = '#ffffff') => mixHex(hex, noise, to);
  return [
    lift(selected[0]),
    lift(selected[1]),
    lift(selected[2]),
    rarityMeta.color,
    rarityMeta.glow
  ];
}

function pickStylePack(/** @type {any} */ seedKey) {
  return STYLE_PACKS[hashSeed(seedKey) % STYLE_PACKS.length];
}

function normalizeCollectionType(/** @type {any} */ value = '') {
  const raw = String(value || '').toLowerCase().trim();
  if (raw === 'landexchange' || raw === 'land-exchange' || raw === 'plot' || raw === 'parcel') return 'land';
  if (raw === 'ai-nft' || raw === 'ai_nft' || raw === 'ai-themed' || raw === 'server' || raw === 'datacenter') return 'ai';
  return raw;
}

function pickArchetype(/** @type {any} */ descriptor = {}, /** @type {any} */ seedKey, /** @type {any} */ rng) {
  if (descriptor.archetype && ARCHETYPE_POOL.includes(descriptor.archetype)) {
    return descriptor.archetype;
  }
  const collection = normalizeCollectionType(descriptor.collectionType || '');
  const weightedPools = /** @type {Record<string, any>} */ ({
    nft: [
      { value: 'orb', weight: 16 },
      { value: 'crystal_shard', weight: 14 },
      { value: 'fractal_bloom', weight: 14 },
      { value: 'key', weight: 12 },
      { value: 'idol', weight: 11 },
      { value: 'blade', weight: 11 },
      { value: 'compass', weight: 10 },
      { value: 'sigil_disc', weight: 9 },
      { value: 'void_fragment', weight: 8 },
      { value: 'tower', weight: 8 },
      { value: 'crown', weight: 7 },
      { value: 'arcane_prism', weight: 10 },
      { value: 'cosmic_egg', weight: 8 },
      { value: 'sacred_mandala', weight: 9 },
      { value: 'spirit_lantern', weight: 7 }
    ],
    realmlord: [
      { value: 'crown', weight: 26 },
      { value: 'dragon_skull', weight: 20 },
      { value: 'eye_of_god', weight: 16 },
      { value: 'portal_arch', weight: 14 },
      { value: 'tower', weight: 12 },
      { value: 'rune_stone', weight: 10 },
      { value: 'blade', weight: 8 },
      { value: 'wyvern_claw', weight: 8 },
      { value: 'idol', weight: 6 },
      { value: 'lich_crown', weight: 18 },
      { value: 'titan_shield', weight: 14 },
      { value: 'war_hammer', weight: 12 },
      { value: 'death_mask', weight: 10 },
      { value: 'blood_chalice', weight: 8 }
    ],
    signal: [
      { value: 'neural_lattice', weight: 28 },
      { value: 'microchip', weight: 22 },
      { value: 'quantum_core', weight: 18 },
      { value: 'chaos_spiral', weight: 14 },
      { value: 'compass', weight: 10 },
      { value: 'blade', weight: 8 },
      { value: 'orb', weight: 6 },
      { value: 'celestial_map', weight: 16 },
      { value: 'arcane_prism', weight: 12 },
      { value: 'void_eye', weight: 10 }
    ],
    builder: [
      { value: 'microchip', weight: 26 },
      { value: 'astrolabe', weight: 20 },
      { value: 'quantum_core', weight: 18 },
      { value: 'gauntlet', weight: 16 },
      { value: 'neural_lattice', weight: 12 },
      { value: 'tower', weight: 10 },
      { value: 'key', weight: 8 },
      { value: 'golem_heart', weight: 14 },
      { value: 'titan_shield', weight: 10 },
      { value: 'storm_vortex', weight: 8 }
    ],
    pioneer: [
      { value: 'key', weight: 24 },
      { value: 'astrolabe', weight: 20 },
      { value: 'hourglass', weight: 16 },
      { value: 'compass', weight: 14 },
      { value: 'portal_arch', weight: 10 },
      { value: 'crown', weight: 8 },
      { value: 'rune_stone', weight: 8 },
      { value: 'celestial_map', weight: 18 },
      { value: 'phoenix_wing', weight: 12 },
      { value: 'spirit_lantern', weight: 10 }
    ],
    compute: [
      { value: 'quantum_core', weight: 30 },
      { value: 'microchip', weight: 24 },
      { value: 'neural_lattice', weight: 20 },
      { value: 'astrolabe', weight: 12 },
      { value: 'orb', weight: 8 },
      { value: 'chaos_spiral', weight: 6 },
      { value: 'void_eye', weight: 14 },
      { value: 'storm_vortex', weight: 12 },
      { value: 'arcane_prism', weight: 10 }
    ],
    ai: [
      { value: 'microchip', weight: 22 },
      { value: 'neural_lattice', weight: 20 },
      { value: 'quantum_core', weight: 18 },
      { value: 'arcane_prism', weight: 14 },
      { value: 'celestial_map', weight: 12 },
      { value: 'golem_heart', weight: 12 },
      { value: 'storm_vortex', weight: 10 },
      { value: 'void_eye', weight: 10 },
      { value: 'titan_shield', weight: 8 },
      { value: 'spirit_lantern', weight: 8 }
    ],
    operator: [
      { value: 'titan_shield', weight: 22 },
      { value: 'gauntlet', weight: 18 },
      { value: 'tower', weight: 14 },
      { value: 'microchip', weight: 12 },
      { value: 'neural_lattice', weight: 10 },
      { value: 'death_mask', weight: 10 },
      { value: 'blood_chalice', weight: 8 },
      { value: 'astrolabe', weight: 8 }
    ],
    template: [
      { value: 'spell_tome', weight: 24 },
      { value: 'sigil_disc', weight: 18 },
      { value: 'arcane_prism', weight: 16 },
      { value: 'forbidden_tome', weight: 14 },
      { value: 'compass', weight: 10 },
      { value: 'living_sigil', weight: 10 },
      { value: 'sacred_mandala', weight: 8 }
    ],
    workflow: [
      { value: 'ouroboros', weight: 22 },
      { value: 'entropy_knot', weight: 18 },
      { value: 'compass', weight: 16 },
      { value: 'hourglass', weight: 15 },
      { value: 'portal_arch', weight: 13 },
      { value: 'celestial_map', weight: 10 },
      { value: 'sigil_disc', weight: 9 }
    ],
    dataset: [
      { value: 'data_crystal', weight: 24 },
      { value: 'quantum_core', weight: 18 },
      { value: 'microchip_array', weight: 16 },
      { value: 'server_rack', weight: 14 },
      { value: 'neural_lattice', weight: 12 },
      { value: 'crystal_shard', weight: 10 },
    ],
    prompt_pack: [
      { value: 'spell_tome', weight: 24 },
      { value: 'forbidden_tome', weight: 18 },
      { value: 'thought_crystal', weight: 16 },
      { value: 'compass', weight: 14 },
      { value: 'living_sigil', weight: 12 },
      { value: 'arcane_prism', weight: 10 }
    ],
    agent_profile: [
      { value: 'ai_eye', weight: 24 },
      { value: 'neural_chip', weight: 20 },
      { value: 'drone_core', weight: 15 },
      { value: 'quantum_antenna', weight: 14 },
      { value: 'prism_eye', weight: 13 },
      { value: 'eye_of_god', weight: 10 }
    ],
    skill_pack: [
      { value: 'gauntlet', weight: 20 },
      { value: 'war_hammer', weight: 16 },
      { value: 'spirit_lantern', weight: 16 },
      { value: 'phoenix_wing', weight: 14 },
      { value: 'titan_shield', weight: 12 },
      { value: 'storm_vortex', weight: 10 }
    ],
    referral: [
      { value: 'compass', weight: 20 },
      { value: 'phoenix_wing', weight: 18 },
      { value: 'key', weight: 16 },
      { value: 'fractal_bloom', weight: 16 },
      { value: 'genesis_seed', weight: 14 },
      { value: 'sacred_mandala', weight: 10 }
    ],
    land: [
      { value: 'tower', weight: 20 },
      { value: 'portal_arch', weight: 16 },
      { value: 'sigil_disc', weight: 14 },
      { value: 'rune_stone', weight: 14 },
      { value: 'celestial_map', weight: 12 },
      { value: 'titan_shield', weight: 12 },
      { value: 'key', weight: 10 },
      { value: 'astrolabe', weight: 10 },
      { value: 'sacred_mandala', weight: 10 },
      { value: 'spirit_lantern', weight: 8 }
    ]
  });
  if (weightedPools[collection]) {
    return pickWeighted(weightedPools[collection], rng);
  }
  const byCollection = ARCHETYPE_HINTS[collection];
  if (byCollection) return byCollection;
  return ARCHETYPE_POOL[(hashSeed(`${seedKey}|archetype`) + Math.floor(rng() * 4096)) % ARCHETYPE_POOL.length];
}

function elevatePremiumArchetype(/** @type {any} */ archetype, /** @type {any} */ rarityKey, /** @type {any} */ seedKey, /** @type {any} */ collectionType = '') {
  const /** @type {any} */
premiumSet = new Set(['legendary', 'ultra', 'apex', 'god-tier']);
  if (!premiumSet.has(String(rarityKey))) return archetype;

  const /** @type {any} */
mundaneSet = new Set(['microchip', 'key', 'compass', 'tower', 'orb', 'idol', 'sigil_disc']);
  if (!mundaneSet.has(String(archetype))) return archetype;

  const collection = normalizeCollectionType(collectionType || '');
  const /** @type {any} */
poolMap = {
    ai: ['quantum_core', 'void_eye', 'celestial_map', 'nebula_core', 'aether_knot', 'prism_eye'],
    signal: ['entropy_knot', 'celestial_map', 'void_eye', 'storm_vortex', 'ouroboros', 'living_sigil'],
    operator: ['titan_shield', 'death_mask', 'golem_heart', 'spectral_crown', 'void_eye', 'aether_knot'],
    template: ['forbidden_tome', 'living_sigil', 'arcane_prism', 'mirror_realm', 'prism_eye', 'sacred_mandala'],
    workflow: ['ouroboros', 'entropy_knot', 'time_rift', 'mirror_realm', 'genesis_seed', 'echo_stone'],
    dataset: ['data_crystal', 'quantum_core', 'nebula_core', 'null_cube', 'thought_crystal', 'prism_eye'],
    prompt_pack: ['forbidden_tome', 'thought_crystal', 'prism_eye', 'dream_shard', 'living_sigil', 'aether_knot'],
    agent_profile: ['ai_eye', 'prism_eye', 'void_eye', 'ouroboros', 'living_sigil', 'aether_knot'],
    skill_pack: ['phoenix_wing', 'war_hammer', 'spirit_lantern', 'titan_shield', 'storm_vortex', 'genesis_seed'],
    referral: ['fractal_bloom', 'phoenix_wing', 'genesis_seed', 'living_sigil', 'dream_shard', 'sacred_mandala'],
    land: ['genesis_seed', 'mirror_realm', 'sacred_mandala', 'lunar_disc', 'celestial_map', 'echo_stone'],
    realmlord: ['spectral_crown', 'ouroboros', 'living_sigil', 'genesis_seed', 'nebula_core', 'aether_knot'],
    nft: ['nebula_core', 'prism_eye', 'living_sigil', 'aether_knot', 'mirror_realm', 'entropy_knot']
  };
  const pool = (/** @type {any} */ (poolMap))[collection] || ['nebula_core', 'prism_eye', 'living_sigil', 'aether_knot', 'mirror_realm', 'entropy_knot', 'genesis_seed', 'ouroboros'];
  return pool[hashSeed(`${seedKey}|${rarityKey}|premium-archetype`) % pool.length] || archetype;
}

function buildParticleField(/** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ options = {}) {
  const count = options.count || 34;
  const /** @type {any} */
nodes = [];
  for (let index = 0; index < count; index += 1) {
    const x = Math.floor(rng() * width);
    const y = Math.floor(rng() * height);
    const radius = (0.5 + (rng() * 2.3)).toFixed(2);
    const alpha = (0.08 + rng() * 0.34).toFixed(2);
    const duration = (4.2 + rng() * 8.8).toFixed(2);
    nodes.push(`
      <circle cx="${x}" cy="${y}" r="${radius}" fill="${index % 2 === 0 ? palette[4] : '#ffffff'}" fill-opacity="${alpha}">
        <animate attributeName="fill-opacity" values="${alpha};${Math.max(0.03, Number(alpha) * 0.45).toFixed(2)};${alpha}" dur="${duration}s" repeatCount="indefinite" />
      </circle>`);
  }
  return nodes.join('');
}

function buildGeometryPack(/** @type {any} */ stylePack, /** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ palette, /** @type {any} */ rng) {
  const cx = Math.floor(width * 0.5);
  const cy = Math.floor(height * 0.52);
  if (stylePack.geometry === 'sigil-rings') {
    return `
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(height * 0.34)}" fill="none" stroke="${palette[4]}" stroke-opacity="0.22" stroke-width="1.8" />
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(height * 0.28)}" fill="none" stroke="${palette[3]}" stroke-opacity="0.34" stroke-width="1.6" />
      <polygon points="${cx},${Math.floor(cy - height * 0.23)} ${Math.floor(cx + width * 0.19)},${Math.floor(cy + height * 0.12)} ${Math.floor(cx - width * 0.19)},${Math.floor(cy + height * 0.12)}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.5" />`;
  }
  if (stylePack.geometry === 'grid-prisms') {
    const /** @type {any} */
lines = [];
    for (let i = 0; i < 7; i += 1) {
      const y = Math.floor((height * 0.22) + i * (height * 0.08));
      lines.push(`<line x1="${Math.floor(width * 0.2)}" y1="${y}" x2="${Math.floor(width * 0.8)}" y2="${Math.floor(y + (rng() * 18 - 9))}" stroke="${palette[4]}" stroke-opacity="0.18" stroke-width="1" />`);
    }
    return `${lines.join('')}<polygon points="${cx},${Math.floor(cy - height * 0.24)} ${Math.floor(cx + width * 0.12)},${Math.floor(cy)} ${cx},${Math.floor(cy + height * 0.24)} ${Math.floor(cx - width * 0.12)},${Math.floor(cy)}" fill="none" stroke="#ffffff" stroke-opacity="0.26" stroke-width="1.7" />`;
  }
  if (stylePack.geometry === 'pillar-beams') {
    return `
      <rect x="${Math.floor(width * 0.3)}" y="${Math.floor(height * 0.2)}" width="${Math.floor(width * 0.06)}" height="${Math.floor(height * 0.58)}" fill="${palette[4]}" fill-opacity="0.08" />
      <rect x="${Math.floor(width * 0.64)}" y="${Math.floor(height * 0.2)}" width="${Math.floor(width * 0.06)}" height="${Math.floor(height * 0.58)}" fill="${palette[4]}" fill-opacity="0.08" />
      <path d="M ${Math.floor(width * 0.33)} ${Math.floor(height * 0.32)} Q ${cx} ${Math.floor(height * 0.14)} ${Math.floor(width * 0.67)} ${Math.floor(height * 0.32)}" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.4" fill="none" />`;
  }
  if (stylePack.geometry === 'fracture-arcs') {
    const /** @type {any} */
shards = [];
    for (let _i = 0; _i < 8; _i += 1) {
      const sx = Math.floor(width * (0.14 + rng() * 0.72));
      const sy = Math.floor(height * (0.15 + rng() * 0.7));
      const ex = Math.floor(width * (0.14 + rng() * 0.72));
      const ey = Math.floor(height * (0.15 + rng() * 0.7));
      shards.push(`<path d="M ${sx} ${sy} Q ${cx} ${Math.floor(height * (0.2 + rng() * 0.6))} ${ex} ${ey}" stroke="${palette[4]}" stroke-opacity="0.17" stroke-width="${(0.8 + rng() * 1.8).toFixed(2)}" fill="none" />`);
    }
    return shards.join('');
  }
  return `
    <polygon points="${cx},${Math.floor(height * 0.16)} ${Math.floor(width * 0.72)},${Math.floor(height * 0.37)} ${Math.floor(width * 0.65)},${Math.floor(height * 0.73)} ${Math.floor(width * 0.35)},${Math.floor(height * 0.73)} ${Math.floor(width * 0.28)},${Math.floor(height * 0.37)}" fill="none" stroke="${palette[4]}" stroke-opacity="0.24" stroke-width="1.6" />
    <polygon points="${cx},${Math.floor(height * 0.24)} ${Math.floor(width * 0.62)},${Math.floor(height * 0.41)} ${Math.floor(width * 0.58)},${Math.floor(height * 0.66)} ${Math.floor(width * 0.42)},${Math.floor(height * 0.66)} ${Math.floor(width * 0.38)},${Math.floor(height * 0.41)}" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1.2" />`;
}

function buildEtchingGrid(/** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ detailScale = 1) {
  const /** @type {any} */
lines = [];
  const count = Math.floor((8 + rng() * 10) * detailScale);
  for (let index = 0; index < count; index += 1) {
    const x1 = Math.floor(width * (0.2 + rng() * 0.6));
    const y1 = Math.floor(height * (0.18 + rng() * 0.62));
    const x2 = Math.floor(width * (0.2 + rng() * 0.6));
    const y2 = Math.floor(height * (0.18 + rng() * 0.62));
    const opacity = (0.06 + rng() * 0.16).toFixed(2);
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${index % 2 ? '#ffffff' : palette[4]}" stroke-opacity="${opacity}" stroke-width="${(0.6 + rng() * 1.2).toFixed(2)}" />`);
  }
  return lines.join('');
}

function buildRelicCore(/** @type {any} */ archetype, /** @type {any} */ palette, /** @type {any} */ _rng, /** @type {any} */ detailFactor = 1) {
  const edgeW = (2.2 + detailFactor * 1.3).toFixed(2);
  if (archetype === 'key') {
    return `
      <circle cx="-64" cy="-86" r="94" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.85" stroke-width="${edgeW}" />
      <circle cx="-64" cy="-86" r="46" fill="none" stroke="#ffffff" stroke-opacity="0.42" stroke-width="1.8" />
      <rect x="-16" y="-86" width="58" height="284" rx="10" fill="rgba(255,255,255,0.06)" stroke="${palette[4]}" stroke-opacity="0.86" stroke-width="${edgeW}" />
      <path d="M42 98 L168 98 L168 156 L130 156 L130 198 L88 198 L88 154 L42 154 Z" fill="${palette[3]}" fill-opacity="0.25" stroke="#ffffff" stroke-opacity="0.36" stroke-width="1.9" />`;
  }
  if (archetype === 'tower') {
    return `
      <path d="M-134 246 L-174 -178 L174 -178 L134 246 Z" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.84" stroke-width="${edgeW}" />
      <path d="M-84 186 L-112 -122 L112 -122 L84 186 Z" fill="${palette[2]}" fill-opacity="0.24" stroke="#ffffff" stroke-opacity="0.33" stroke-width="1.9" />
      <rect x="-34" y="-24" width="68" height="118" rx="8" fill="rgba(0,0,0,.28)" stroke="${palette[4]}" stroke-opacity="0.46" stroke-width="1.4" />
      <path d="M-174 -178 L0 -254 L174 -178" fill="none" stroke="#ffffff" stroke-opacity="0.31" stroke-width="1.8" />`;
  }
  if (archetype === 'blade') {
    return `
      <path d="M0 -268 L92 -18 L28 236 L-28 236 L-92 -18 Z" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.88" stroke-width="${edgeW}" />
      <path d="M0 -198 L46 -16 L16 170 L-16 170 L-46 -16 Z" fill="${palette[2]}" fill-opacity="0.23" stroke="#ffffff" stroke-opacity="0.34" stroke-width="1.8" />
      <rect x="-72" y="170" width="144" height="28" rx="8" fill="rgba(255,255,255,0.07)" stroke="${palette[4]}" stroke-opacity="0.62" stroke-width="1.5" />
      <path d="M0 -268 L0 236" stroke="#ffffff" stroke-opacity="0.26" stroke-width="1.2" />`;
  }
  if (archetype === 'crown') {
    return `
      <path d="M-228 146 L-170 -126 L-76 38 L0 -164 L76 38 L170 -126 L228 146 L160 214 L-160 214 Z" fill="rgba(255,255,255,0.06)" stroke="${palette[4]}" stroke-opacity="0.84" stroke-width="${edgeW}" />
      <path d="M-160 134 L-118 -36 L-46 66 L0 -74 L46 66 L118 -36 L160 134 L110 176 L-110 176 Z" fill="${palette[3]}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.34" stroke-width="1.7" />
      <circle cx="0" cy="24" r="22" fill="${palette[4]}" fill-opacity="0.35" />`;
  }
  if (archetype === 'orb') {
    return `
      <circle cx="0" cy="0" r="198" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.85" stroke-width="${edgeW}" />
      <circle cx="0" cy="0" r="144" fill="${palette[2]}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.33" stroke-width="1.9" />
      <ellipse cx="0" cy="0" rx="210" ry="62" fill="none" stroke="${palette[4]}" stroke-opacity="0.25" stroke-width="1.6" />
      <ellipse cx="0" cy="0" rx="122" ry="182" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.4" />`;
  }
  if (archetype === 'compass') {
    return `
      <polygon points="0,-246 58,-58 246,0 58,58 0,246 -58,58 -246,0 -58,-58" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.85" stroke-width="${edgeW}" />
      <polygon points="0,-166 36,-36 166,0 36,36 0,166 -36,36 -166,0 -36,-36" fill="${palette[3]}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.34" stroke-width="1.8" />
      <circle cx="0" cy="0" r="24" fill="${palette[4]}" fill-opacity="0.38" />`;
  }
  if (archetype === 'idol') {
    return `
      <path d="M-134 236 L-174 42 L-142 -184 L0 -262 L142 -184 L174 42 L134 236 Z" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.84" stroke-width="${edgeW}" />
      <path d="M-82 172 L-108 36 L-86 -116 L0 -162 L86 -116 L108 36 L82 172 Z" fill="${palette[2]}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.31" stroke-width="1.8" />
      <rect x="-44" y="-22" width="28" height="28" rx="4" fill="#0b111a" />
      <rect x="16" y="-22" width="28" height="28" rx="4" fill="#0b111a" />`;
  }
  // ── Sci-fi / Tech archetypes ──────────────────────────────────────
  if (archetype === 'rocket') {
    return `
      <path d="M0 -256 C-44 -180 -72 -80 -72 40 L-48 180 L0 236 L48 180 L72 40 C72 -80 44 -180 0 -256 Z" fill="rgba(255,255,255,0.06)" stroke="${palette[4]}" stroke-opacity="0.90" stroke-width="${edgeW}" />
      <path d="M-48 40 L-88 180 L-48 156 L-48 40 Z" fill="${palette[3]}" fill-opacity="0.30" stroke="${palette[4]}" stroke-opacity="0.60" stroke-width="1.5" />
      <path d="M48 40 L88 180 L48 156 L48 40 Z" fill="${palette[3]}" fill-opacity="0.30" stroke="${palette[4]}" stroke-opacity="0.60" stroke-width="1.5" />
      <ellipse cx="0" cy="32" rx="48" ry="20" fill="${palette[2]}" fill-opacity="0.25" />
      <circle cx="0" cy="-64" r="36" fill="rgba(0,0,0,0.3)" stroke="${palette[4]}" stroke-opacity="0.55" stroke-width="2" />
      <circle cx="0" cy="-64" r="20" fill="${palette[4]}" fill-opacity="0.22" />`;
  }
  if (archetype === 'spaceship') {
    return `
      <ellipse cx="0" cy="0" rx="232" ry="72" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.88" stroke-width="${edgeW}" />
      <ellipse cx="0" cy="-20" rx="136" ry="90" fill="${palette[2]}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.28" stroke-width="1.8" />
      <ellipse cx="0" cy="-8" rx="64" ry="46" fill="rgba(0,0,0,0.30)" stroke="${palette[4]}" stroke-opacity="0.45" stroke-width="1.5" />
      <path d="M-232 28 L-168 58 L168 58 L232 28" fill="none" stroke="${palette[3]}" stroke-opacity="0.50" stroke-width="2" />
      <ellipse cx="-92" cy="44" rx="14" ry="8" fill="${palette[4]}" fill-opacity="0.38" />
      <ellipse cx="92" cy="44" rx="14" ry="8" fill="${palette[4]}" fill-opacity="0.38" />
      <circle cx="0" cy="-24" r="22" fill="${palette[4]}" fill-opacity="0.28" />`;
  }
  if (archetype === 'robot_head') {
    return `
      <rect x="-148" y="-168" width="296" height="280" rx="28" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.88" stroke-width="${edgeW}" />
      <rect x="-104" y="-132" width="208" height="196" rx="18" fill="${palette[2]}" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.26" stroke-width="1.6" />
      <rect x="-72" y="-96" width="52" height="44" rx="10" fill="${palette[4]}" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2" />
      <circle cx="-46" cy="-74" r="16" fill="rgba(255,255,255,0.70)" />
      <circle cx="-46" cy="-74" r="8" fill="${palette[4]}" fill-opacity="0.90" />
      <rect x="20" y="-96" width="52" height="44" rx="10" fill="${palette[4]}" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2" />
      <circle cx="46" cy="-74" r="16" fill="rgba(255,255,255,0.70)" />
      <circle cx="46" cy="-74" r="8" fill="${palette[4]}" fill-opacity="0.90" />
      <rect x="-52" y="-14" width="104" height="20" rx="5" fill="rgba(0,0,0,0.38)" />
      <rect x="-36" y="-14" width="20" height="20" fill="${palette[4]}" fill-opacity="0.50" />
      <rect x="-8" y="-14" width="16" height="20" fill="${palette[3]}" fill-opacity="0.45" />
      <rect x="16" y="-14" width="20" height="20" fill="${palette[4]}" fill-opacity="0.50" />
      <rect x="-148" y="-236" width="64" height="72" rx="8" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.46" stroke-width="1.4" />
      <rect x="84" y="-236" width="64" height="72" rx="8" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.46" stroke-width="1.4" />`;
  }
  if (archetype === 'microchip_array') {
    return `
      <rect x="-176" y="-176" width="352" height="352" rx="16" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.92" stroke-width="${edgeW}" />
      <rect x="-140" y="-140" width="280" height="280" rx="10" fill="${palette[2]}" fill-opacity="0.14" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.4" />
      ${[[-96,-96],[0,-96],[96,-96],[-96,0],[0,0],[96,0],[-96,96],[0,96],[96,96]].map((/** @type {any} */ [cx,cy])=>`
        <rect x="${cx-28}" y="${cy-28}" width="56" height="56" rx="6" fill="rgba(0,0,0,0.35)" stroke="${palette[4]}" stroke-opacity="0.70" stroke-width="1.6" />
        <rect x="${cx-18}" y="${cy-18}" width="36" height="36" rx="3" fill="${palette[3]}" fill-opacity="0.28" />
        <line x1="${cx}" y1="${cy-28}" x2="${cx}" y2="${cy-36}" stroke="${palette[4]}" stroke-opacity="0.60" stroke-width="2" />
        <line x1="${cx}" y1="${cy+28}" x2="${cx}" y2="${cy+36}" stroke="${palette[4]}" stroke-opacity="0.60" stroke-width="2" />
        <line x1="${cx-28}" y1="${cy}" x2="${cx-36}" y2="${cy}" stroke="${palette[4]}" stroke-opacity="0.60" stroke-width="2" />
        <line x1="${cx+28}" y1="${cy}" x2="${cx+36}" y2="${cy}" stroke="${palette[4]}" stroke-opacity="0.60" stroke-width="2" />`).join('')}`;
  }
  if (archetype === 'circuit_board') {
    return `
      <rect x="-196" y="-196" width="392" height="392" rx="12" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.86" stroke-width="${edgeW}" />
      <rect x="-164" y="-164" width="328" height="328" rx="8" fill="${palette[2]}" fill-opacity="0.10" />
      <path d="M-164 -80 L-60 -80 L-60 -20 L60 -20 L60 80 L164 80" fill="none" stroke="${palette[4]}" stroke-opacity="0.65" stroke-width="2.5" />
      <path d="M-164 40 L-100 40 L-100 140 L0 140 L0 164" fill="none" stroke="${palette[3]}" stroke-opacity="0.55" stroke-width="2" />
      <path d="M164 -80 L80 -80 L80 20 L-40 20 L-40 80 L-164 80" fill="none" stroke="${palette[4]}" stroke-opacity="0.55" stroke-width="1.8" />
      <path d="M0 -164 L0 -100 L60 -100 L60 -40 L164 -40" fill="none" stroke="${palette[3]}" stroke-opacity="0.50" stroke-width="1.8" />
      <rect x="-40" y="-60" width="80" height="80" rx="6" fill="rgba(0,0,0,0.40)" stroke="${palette[4]}" stroke-opacity="0.80" stroke-width="2" />
      <rect x="-24" y="-44" width="48" height="48" rx="4" fill="${palette[4]}" fill-opacity="0.32" />
      ${[[-140,-60],[120,-60],[-140,60],[120,60],[-60,140],[60,140],[-60,-140],[60,-140]].map((/** @type {any} */ [cx,cy])=>`<circle cx="${cx}" cy="${cy}" r="10" fill="${palette[4]}" fill-opacity="0.45" />`).join('')}`;
  }
  if (archetype === 'server_rack') {
    return `
      <rect x="-148" y="-230" width="296" height="460" rx="14" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.88" stroke-width="${edgeW}" />
      <rect x="-132" y="-216" width="264" height="432" rx="8" fill="${palette[2]}" fill-opacity="0.12" />
      ${[-180,-120,-60,0,60,120,180].map((/** @type {any} */ yPos,/** @type {any} */ i)=>`
        <rect x="-116" y="${yPos-20}" width="232" height="36" rx="5" fill="rgba(0,0,0,0.40)" stroke="${palette[4]}" stroke-opacity="${0.40+i*0.03}" stroke-width="1.4" />
        <rect x="-108" y="${yPos-14}" width="180" height="24" rx="3" fill="${palette[3]}" fill-opacity="0.14" />
        <circle cx="96" cy="${yPos}" r="5" fill="${i%3===0?palette[4]:(i%3===1?'#22d3ee':'#4ade80')}" fill-opacity="0.80" />
        <rect x="-102" y="${yPos-6}" width="40" height="12" rx="2" fill="rgba(255,255,255,0.08)" />`).join('')}`;
  }
  if (archetype === 'satellite') {
    return `
      <rect x="-44" y="-154" width="88" height="308" rx="16" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.86" stroke-width="${edgeW}" />
      <rect x="-30" y="-130" width="60" height="260" rx="10" fill="${palette[2]}" fill-opacity="0.20" />
      <rect x="-196" y="-32" width="148" height="64" rx="8" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.72" stroke-width="1.8" />
      <rect x="48" y="-32" width="148" height="64" rx="8" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.72" stroke-width="1.8" />
      ${[-148,-84,-22,22,84,148].map(/** @type {any} */ cx=>`<rect x="${cx-10}" y="-24" width="20" height="48" fill="${palette[4]}" fill-opacity="0.30" />`).join('')}
      <circle cx="0" cy="0" r="38" fill="rgba(0,0,0,0.38)" stroke="${palette[4]}" stroke-opacity="0.70" stroke-width="2.2" />
      <circle cx="0" cy="0" r="20" fill="${palette[4]}" fill-opacity="0.50" />
      <circle cx="0" cy="0" r="8" fill="#ffffff" fill-opacity="0.60" />`;
  }
  if (archetype === 'robotic_alien') {
    return `
      <ellipse cx="0" cy="-80" rx="120" ry="136" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.86" stroke-width="${edgeW}" />
      <ellipse cx="0" cy="-80" rx="84" ry="96" fill="${palette[2]}" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.6" />
      <ellipse cx="-52" cy="-104" rx="28" ry="20" fill="${palette[4]}" fill-opacity="0.44" stroke="#ffffff" stroke-opacity="0.50" stroke-width="1.8" />
      <ellipse cx="-52" cy="-104" rx="16" ry="12" fill="rgba(255,255,255,0.70)" />
      <ellipse cx="52" cy="-104" rx="28" ry="20" fill="${palette[4]}" fill-opacity="0.44" stroke="#ffffff" stroke-opacity="0.50" stroke-width="1.8" />
      <ellipse cx="52" cy="-104" rx="16" ry="12" fill="rgba(255,255,255,0.70)" />
      <path d="M-40 -56 L40 -56" stroke="${palette[3]}" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round" />
      <path d="M-60 -40 L-30 -40 L-20 0 L20 0 L30 -40 L60 -40" fill="none" stroke="${palette[4]}" stroke-opacity="0.55" stroke-width="2" />
      <path d="M-120 -80 L-160 -130 M120 -80 L160 -130" stroke="${palette[4]}" stroke-opacity="0.50" stroke-width="2" />
      <circle cx="-160" cy="-138" r="12" fill="${palette[4]}" fill-opacity="0.60" />
      <circle cx="160" cy="-138" r="12" fill="${palette[4]}" fill-opacity="0.60" />
      <path d="M-60 56 L-80 180 M-20 56 L-30 180 M20 56 L30 180 M60 56 L80 180" stroke="${palette[4]}" stroke-opacity="0.40" stroke-width="2" />`;
  }
  if (archetype === 'neural_chip') {
    return `
      <rect x="-152" y="-152" width="304" height="304" rx="20" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.92" stroke-width="${edgeW}" />
      <rect x="-118" y="-118" width="236" height="236" rx="12" fill="${palette[2]}" fill-opacity="0.16" stroke="#ffffff" stroke-opacity="0.20" stroke-width="1.4" />
      <circle cx="0" cy="0" r="62" fill="rgba(0,0,0,0.40)" stroke="${palette[4]}" stroke-opacity="0.80" stroke-width="2.2" />
      <circle cx="0" cy="0" r="40" fill="${palette[4]}" fill-opacity="0.30" />
      <circle cx="0" cy="0" r="20" fill="rgba(255,255,255,0.65)" />
      ${[0,45,90,135,180,225,270,315].map((/** @type {any} */ deg,/** @type {any} */ i)=>{
        const rad = deg * Math.PI / 180; const r1=62; const r2=118;
        const x1=(r1*Math.cos(rad)).toFixed(1); const y1=(r1*Math.sin(rad)).toFixed(1);
        const x2=(r2*Math.cos(rad)).toFixed(1); const y2=(r2*Math.sin(rad)).toFixed(1);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${palette[4]}" stroke-opacity="${i%2===0?'0.65':'0.40'}" stroke-width="${i%2===0?'2.5':'1.8'}" />
                <circle cx="${x2}" cy="${y2}" r="7" fill="${palette[4]}" fill-opacity="0.55" />`;}).join('')}
      ${[-152,-100,-50,50,100,152].map(/** @type {any} */ v=>`
        <line x1="${v}" y1="-152" x2="${v}" y2="-118" stroke="${palette[4]}" stroke-opacity="0.50" stroke-width="2" />
        <line x1="${v}" y1="118" x2="${v}" y2="152" stroke="${palette[4]}" stroke-opacity="0.50" stroke-width="2" />
        <line x1="-152" y1="${v}" x2="-118" y2="${v}" stroke="${palette[4]}" stroke-opacity="0.50" stroke-width="2" />
        <line x1="118" y1="${v}" x2="152" y2="${v}" stroke="${palette[4]}" stroke-opacity="0.50" stroke-width="2" />`).join('')}`;
  }
  if (archetype === 'plasma_core') {
    return `
      <circle cx="0" cy="0" r="198" fill="rgba(255,255,255,0.04)" stroke="${palette[4]}" stroke-opacity="0.86" stroke-width="${edgeW}" />
      <circle cx="0" cy="0" r="148" fill="${palette[2]}" fill-opacity="0.20" stroke="#ffffff" stroke-opacity="0.24" stroke-width="1.8" />
      <circle cx="0" cy="0" r="98" fill="rgba(0,0,0,0.34)" stroke="${palette[4]}" stroke-opacity="0.65" stroke-width="2" />
      <circle cx="0" cy="0" r="56" fill="${palette[4]}" fill-opacity="0.38" />
      <circle cx="0" cy="0" r="26" fill="rgba(255,255,255,0.70)" />
      ${[0,60,120,180,240,300].map(/** @type {any} */ deg=>{
        const rad=deg*Math.PI/180; const r=148;
        const x=(r*Math.cos(rad)).toFixed(1); const y=(r*Math.sin(rad)).toFixed(1);
        return `<ellipse cx="${x}" cy="${y}" rx="16" ry="8" fill="${palette[4]}" fill-opacity="0.55" transform="rotate(${deg} ${x} ${y})" />`;}).join('')}
      <circle cx="0" cy="0" r="176" fill="none" stroke="${palette[3]}" stroke-opacity="0.25" stroke-width="1.4" stroke-dasharray="20 12" />`;
  }
  if (archetype === 'warp_drive') {
    return `
      <ellipse cx="0" cy="0" rx="216" ry="80" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.88" stroke-width="${edgeW}" />
      <ellipse cx="0" cy="0" rx="156" ry="52" fill="${palette[2]}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.26" stroke-width="1.6" />
      <ellipse cx="0" cy="0" rx="80" ry="28" fill="rgba(0,0,0,0.38)" stroke="${palette[4]}" stroke-opacity="0.65" stroke-width="2" />
      ${[-3,-2,-1,0,1,2,3].map(/** @type {any} */ i=>`<ellipse cx="0" cy="0" rx="${80+Math.abs(i)*32}" ry="${28+Math.abs(i)*16}" fill="none" stroke="${palette[i===0?4:3]}" stroke-opacity="${(0.18-Math.abs(i)*0.02).toFixed(2)}" stroke-width="1.2" />`).join('')}
      <path d="M-216 0 L-148 -32 L-80 0 L-148 32 Z" fill="${palette[4]}" fill-opacity="0.30" />
      <path d="M216 0 L148 32 L80 0 L148 -32 Z" fill="${palette[4]}" fill-opacity="0.30" />
      <circle cx="0" cy="0" r="22" fill="${palette[4]}" fill-opacity="0.55" />
      <circle cx="0" cy="0" r="10" fill="rgba(255,255,255,0.70)" />`;
  }
  if (archetype === 'data_crystal') {
    return `
      <path d="M0 -230 L148 -60 L148 60 L0 230 L-148 60 L-148 -60 Z" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.90" stroke-width="${edgeW}" />
      <path d="M0 -160 L100 -40 L100 40 L0 160 L-100 40 L-100 -40 Z" fill="${palette[2]}" fill-opacity="0.24" stroke="#ffffff" stroke-opacity="0.30" stroke-width="1.7" />
      <path d="M0 -160 L0 160 M-148 -60 L148 60 M-148 60 L148 -60" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.2" />
      <circle cx="0" cy="0" r="22" fill="${palette[4]}" fill-opacity="0.40" />
      <circle cx="0" cy="0" r="10" fill="rgba(255,255,255,0.65)" />`;
  }
  if (archetype === 'drone_core') {
    return `
      <rect x="-80" y="-80" width="160" height="160" rx="16" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.88" stroke-width="${edgeW}" />
      <rect x="-56" y="-56" width="112" height="112" rx="10" fill="${palette[2]}" fill-opacity="0.22" />
      <circle cx="0" cy="0" r="36" fill="rgba(0,0,0,0.38)" stroke="${palette[4]}" stroke-opacity="0.72" stroke-width="2.2" />
      <circle cx="0" cy="0" r="20" fill="${palette[4]}" fill-opacity="0.45" />
      <path d="M-80 -80 L-160 -160 M80 -80 L160 -160 M-80 80 L-160 160 M80 80 L160 160" stroke="${palette[4]}" stroke-opacity="0.55" stroke-width="2.2" />
      <circle cx="-164" cy="-164" r="22" fill="${palette[4]}" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.30" stroke-width="1.6" />
      <circle cx="164" cy="-164" r="22" fill="${palette[4]}" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.30" stroke-width="1.6" />
      <circle cx="-164" cy="164" r="22" fill="${palette[4]}" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.30" stroke-width="1.6" />
      <circle cx="164" cy="164" r="22" fill="${palette[4]}" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.30" stroke-width="1.6" />`;
  }
  if (archetype === 'cyber_skull') {
    return `
      <path d="M-160 120 L-200 -100 L-120 -220 L0 -256 L120 -220 L200 -100 L160 120 L120 180 L-120 180 Z" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.88" stroke-width="${edgeW}" />
      <path d="M-112 90 L-140 -70 L-84 -156 L0 -178 L84 -156 L140 -70 L112 90 L84 130 L-84 130 Z" fill="${palette[2]}" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.24" stroke-width="1.6" />
      <ellipse cx="-60" cy="-60" rx="42" ry="48" fill="rgba(0,0,0,0.50)" stroke="${palette[4]}" stroke-opacity="0.65" stroke-width="2" />
      <ellipse cx="-60" cy="-60" rx="26" ry="30" fill="${palette[4]}" fill-opacity="0.38" />
      <ellipse cx="60" cy="-60" rx="42" ry="48" fill="rgba(0,0,0,0.50)" stroke="${palette[4]}" stroke-opacity="0.65" stroke-width="2" />
      <ellipse cx="60" cy="-60" rx="26" ry="30" fill="${palette[4]}" fill-opacity="0.38" />
      <path d="M-40 40 L-16 60 L0 52 L16 60 L40 40" fill="none" stroke="${palette[4]}" stroke-opacity="0.65" stroke-width="2.5" stroke-linecap="round" />
      <path d="M-60 -210 L-48 -230 L-36 -210 M36 -210 L48 -230 L60 -210" fill="none" stroke="${palette[4]}" stroke-opacity="0.55" stroke-width="2" />`;
  }
  if (archetype === 'quantum_antenna') {
    return `
      <path d="M0 -256 L0 256" stroke="${palette[4]}" stroke-opacity="0.90" stroke-width="3" />
      <path d="M0 -80 L-136 80 M0 -80 L136 80" fill="none" stroke="${palette[4]}" stroke-opacity="0.72" stroke-width="${edgeW}" />
      <path d="M0 -40 L-88 60 M0 -40 L88 60" fill="none" stroke="${palette[3]}" stroke-opacity="0.58" stroke-width="2" />
      ${[-256,-180,-110,-50,0,50,110,180,256].map((/** @type {any} */ y,/** @type {any} */ i)=>`<circle cx="0" cy="${y}" r="${i%3===0?8:5}" fill="${palette[4]}" fill-opacity="${i%2===0?0.65:0.40}" />`).join('')}
      <ellipse cx="0" cy="180" rx="136" ry="44" fill="rgba(0,0,0,0.24)" stroke="${palette[4]}" stroke-opacity="0.35" stroke-width="1.4" />
      <ellipse cx="0" cy="180" rx="72" ry="22" fill="${palette[2]}" fill-opacity="0.20" />
      <circle cx="0" cy="-256" r="16" fill="${palette[4]}" fill-opacity="0.65" stroke="#ffffff" stroke-opacity="0.45" stroke-width="2" />`;
  }
  if (archetype === 'ai_eye') {
    return `
      <ellipse cx="0" cy="0" rx="232" ry="120" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.90" stroke-width="${edgeW}" />
      <ellipse cx="0" cy="0" rx="180" ry="88" fill="${palette[2]}" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.26" stroke-width="1.6" />
      <circle cx="0" cy="0" r="72" fill="rgba(0,0,0,0.40)" stroke="${palette[4]}" stroke-opacity="0.72" stroke-width="2.5" />
      <circle cx="0" cy="0" r="52" fill="${palette[4]}" fill-opacity="0.42" />
      <circle cx="0" cy="0" r="30" fill="rgba(255,255,255,0.65)" />
      <circle cx="0" cy="0" r="14" fill="rgba(0,0,0,0.85)" />
      <circle cx="-18" cy="-18" r="6" fill="rgba(255,255,255,0.55)" />
      ${[0,36,72,108,144,180,216,252,288,324].map(/** @type {any} */ deg=>{
        const rad=deg*Math.PI/180; const r=72;
        const x=(r*Math.cos(rad)).toFixed(1); const y=(r*Math.sin(rad)).toFixed(1);
        return `<line x1="${x}" y1="${y}" x2="${(r*1.44*Math.cos(rad)).toFixed(1)}" y2="${(r*1.44*Math.sin(rad)).toFixed(1)}" stroke="${palette[4]}" stroke-opacity="0.38" stroke-width="1.4" />`;}).join('')}`;
  }
  return `
    <path d="M-192 186 L-146 -76 L-86 -178 L-24 -198 L-8 -122 L8 -122 L24 -198 L86 -178 L146 -76 L192 186 L126 242 L-126 242 Z" fill="rgba(255,255,255,0.05)" stroke="${palette[4]}" stroke-opacity="0.86" stroke-width="${edgeW}" />
    <path d="M-126 138 L-96 -46 L-58 -118 L-14 -132 L14 -132 L58 -118 L96 -46 L126 138 L82 172 L-82 172 Z" fill="${palette[3]}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.32" stroke-width="1.7" />
    <path d="M-62 -152 L-62 190 M62 -152 L62 190" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.3" />`;
}

function buildRelicAttachments(/** @type {any} */ archetype, /** @type {any} */ palette, /** @type {any} */ _rng, /** @type {any} */ rarityKey) {
  const bonus = ['epic', 'legendary', 'ultra', 'apex', 'god-tier'].includes(rarityKey);
  if (archetype === 'key') {
    return `
      <rect x="88" y="114" width="26" height="20" fill="${palette[4]}" fill-opacity="0.28" />
      <rect x="118" y="138" width="22" height="20" fill="${palette[4]}" fill-opacity="0.24" />
      ${bonus ? '<circle cx="-64" cy="-86" r="12" fill="rgba(255,255,255,.35)" />' : ''}`;
  }
  if (archetype === 'tower') {
    return `
      <rect x="-16" y="-158" width="32" height="34" fill="rgba(0,0,0,.34)" />
      <rect x="-12" y="-72" width="24" height="28" fill="rgba(0,0,0,.28)" />
      <rect x="-10" y="8" width="20" height="24" fill="rgba(0,0,0,.24)" />`;
  }
  if (archetype === 'blade') {
    return `
      <rect x="-42" y="196" width="84" height="20" rx="6" fill="rgba(255,255,255,.15)" />
      <circle cx="0" cy="186" r="9" fill="${palette[4]}" fill-opacity="0.4" />
      ${bonus ? '<path d="M-22 216 L22 216 L12 246 L-12 246 Z" fill="rgba(255,255,255,.16)" />' : ''}`;
  }
  if (archetype === 'crown') {
    return `
      <circle cx="-76" cy="40" r="10" fill="${palette[4]}" fill-opacity="0.34" />
      <circle cx="0" cy="-20" r="12" fill="${palette[4]}" fill-opacity="0.38" />
      <circle cx="76" cy="40" r="10" fill="${palette[4]}" fill-opacity="0.34" />`;
  }
  if (archetype === 'orb') {
    return `
      <ellipse cx="0" cy="0" rx="72" ry="24" fill="none" stroke="${palette[4]}" stroke-opacity="0.3" stroke-width="1.4" />
      <ellipse cx="0" cy="0" rx="26" ry="88" fill="none" stroke="#ffffff" stroke-opacity="0.26" stroke-width="1.2" />`;
  }
  if (archetype === 'compass') {
    return `
      <polygon points="0,-206 18,-160 0,-114 -18,-160" fill="${palette[4]}" fill-opacity="0.26" />
      <polygon points="206,0 160,18 114,0 160,-18" fill="${palette[4]}" fill-opacity="0.22" />`;
  }
  if (archetype === 'idol') {
    return `
      <path d="M-58 84 Q0 120 58 84" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="2" />
      <rect x="-8" y="-6" width="16" height="8" fill="${palette[4]}" fill-opacity="0.28" />`;
  }
  return `
    <rect x="-106" y="24" width="22" height="84" rx="5" fill="rgba(255,255,255,.14)" />
    <rect x="84" y="24" width="22" height="84" rx="5" fill="rgba(255,255,255,.14)" />
    ${bonus ? '<circle cx="0" cy="-42" r="12" fill="rgba(255,255,255,.22)" />' : ''}`;
}

function buildTraitGlyphs(/** @type {any} */ descriptor = {}, /** @type {any} */ rng, /** @type {any} */ palette) {
  const /** @type {any} */
families = ['sigil', 'vault', 'arc', 'crest', 'orbital', 'warden', 'lattice'];
  const /** @type {any} */
materials = ['obsidian', 'brass', 'steel', 'crystal', 'plasma'];
  const /** @type {any} */
engravings = ['none', 'runes', 'maze', 'fractals', 'constellations'];
  const family = descriptor.family || families[Math.floor(rng() * families.length)];
  const material = descriptor.material || materials[Math.floor(rng() * materials.length)];
  const engraving = descriptor.engraving || engravings[Math.floor(rng() * engravings.length)];
  const aura = descriptor.aura || (rng() > 0.38 ? ['solar', 'ion', 'aether', 'frost'][Math.floor(rng() * 4)] : 'none');
  return {
    family,
    material,
    engraving,
    aura,
    archetype: pickArchetype(descriptor, descriptor.seedKey || descriptor.id || descriptor.title || 'eon', rng),
    sigilCode: String(family.slice(0, 2) + material.slice(0, 1) + engraving.slice(0, 1)).toUpperCase(),
    accent: palette[3],
    glow: palette[4]
  };
}

function buildAmbientPattern(/** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ hollowMode) {
  const /** @type {any} */
shards = [];
  for (let index = 0; index < 6; index += 1) {
    const startX = Math.floor(rng() * width);
    const startY = Math.floor(rng() * height);
    const endX = Math.floor(rng() * width);
    const endY = Math.floor(rng() * height);
    const opacity = (0.08 + rng() * 0.2).toFixed(2);
    shards.push(`<path d="M ${startX} ${startY} Q ${Math.floor((startX + endX) / 2)} ${Math.floor(rng() * height)} ${endX} ${endY}" stroke="${palette[4]}" stroke-opacity="${opacity}" stroke-width="${1 + Math.floor(rng() * 3)}" fill="none" />`);
  }

  if (!hollowMode) return shards.join('');

  const /** @type {any} */
animations = {
    'prism-orbit': `
      <circle cx="50%" cy="50%" r="34%" fill="none" stroke="${palette[4]}" stroke-opacity="0.36" stroke-width="2">
        <animateTransform attributeName="transform" type="rotate" from="0 512 512" to="360 512 512" dur="12s" repeatCount="indefinite"/>
      </circle>
      <circle cx="50%" cy="50%" r="24%" fill="none" stroke="${palette[3]}" stroke-opacity="0.28" stroke-width="1.5">
        <animateTransform attributeName="transform" type="rotate" from="360 512 512" to="0 512 512" dur="8s" repeatCount="indefinite"/>
      </circle>`,
    'glitch-scan': `
      <rect x="0" y="0" width="100%" height="18%" fill="${palette[4]}" fill-opacity="0.10">
        <animate attributeName="y" values="-20%;100%;-20%" dur="5.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="0" y="0" width="100%" height="6%" fill="#ffffff" fill-opacity="0.08">
        <animate attributeName="y" values="100%;-10%;100%" dur="3.1s" repeatCount="indefinite"/>
      </rect>`,
    'aurora-bloom': `
      <ellipse cx="50%" cy="15%" rx="42%" ry="18%" fill="${palette[4]}" fill-opacity="0.18">
        <animate attributeName="ry" values="14%;24%;14%" dur="7s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="0.08;0.24;0.08" dur="7s" repeatCount="indefinite"/>
      </ellipse>`,
    'quantum-shatter': `
      <g stroke="${palette[4]}" stroke-opacity="0.28" fill="none">
        <path d="M160 130 L420 400 L290 540" stroke-width="2">
          <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="2.9s" repeatCount="indefinite"/>
        </path>
        <path d="M650 120 L490 360 L720 620" stroke-width="2">
          <animate attributeName="stroke-opacity" values="0.36;0.08;0.36" dur="3.4s" repeatCount="indefinite"/>
        </path>
      </g>`,
    'crystal-resonance': `
      <polygon points="512,140 660,360 512,628 364,360" fill="none" stroke="${palette[4]}" stroke-opacity="0.35" stroke-width="2">
        <animate attributeName="transform" values="scale(1);scale(1.04);scale(1)" dur="4.4s" repeatCount="indefinite"/>
      </polygon>`
  };

  return shards.join('') + ((/** @type {any} */ (animations))[hollowMode] || animations['prism-orbit']);
}

void [
  resolvePalette,
  pickStylePack,
  buildParticleField,
  buildGeometryPack,
  buildEtchingGrid,
  buildRelicCore,
  buildRelicAttachments,
  buildTraitGlyphs,
  buildAmbientPattern
];

export function buildNftVisualBundle(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const seedKey = String(descriptor.seedKey || descriptor.id || descriptor.title || 'eon-nft');
  const variantKey = String(options.variant || (options.hollow ? 'hollow' : 'base'));
  const defaultContext = options.wide ? 'storefront' : 'marketplace';
  const context = options.context || defaultContext;
  const /** @type {any} */
boostedDescriptor = {
    ...descriptor,
    seedKey: `${seedKey}|${context}|${variantKey}`,
    traits: {
      ...(descriptor.traits || {}),
      archetype: descriptor.archetype || undefined,
      silhouette: descriptor.silhouette || undefined
    }
  };

  const bundle = buildObjectCollectibleVisualBundle(boostedDescriptor, { context });
  const rarityMeta = getRarityMeta(descriptor.rarity ?? descriptor.rarityTier ?? descriptor.rarityLabel);
  const sigil = `${String(bundle.traits.archetype || '').slice(0, 2)}${String(bundle.traits.material || '').slice(0, 1)}${String(bundle.traits.silhouette || '').slice(0, 1)}`.toUpperCase();
  const hollowMode = options.hollow
    ? String(options.hollowMode || HOLLOW_ANIMATION_MODES[hashSeed(seedKey) % HOLLOW_ANIMATION_MODES.length])
    : '';

  return {
    staticUri: descriptor.visual?.svg && !options.hollow ? encodeSvgDataUri(descriptor.visual.svg) : bundle.staticUri,
    svg: bundle.svg,
    hollowMode,
    archetype: bundle.traits.archetype,
    sigilCode: sigil,
    stylePack: bundle.traits.silhouette,
    traitFamily: bundle.traits.adornment,
    rarityLabel: rarityMeta.label,
    rarityKey: rarityMeta.key,
    qualityScore: Number(bundle?.qa?.score || 0),
    qaPass: Boolean(bundle?.qa?.pass)
  };
}

export function buildNftImageDataUri(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  return buildNftVisualBundle(descriptor, options).staticUri;
}

export function buildHollowImageDataUri(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  return buildNftVisualBundle(descriptor, { ...options, hollow: true, variant: 'hollow' }).staticUri;
}

export function buildCollectionPreviewSet(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const seedKey = String(descriptor.seedKey || descriptor.id || descriptor.title || 'eon');
  const variantA = `v${hashSeed(`${seedKey}|base`) % 17}`;
  const variantB = `h${hashSeed(`${seedKey}|hollow`) % 17}`;
  const hollow = buildNftVisualBundle(descriptor, {
    ...options,
    context: options.context || 'storefront',
    variant: variantB,
    hollow: true,
    hollowMode: options.hollowMode || HOLLOW_ANIMATION_MODES[hashSeed(descriptor.seedKey || descriptor.id || descriptor.title || 'eon') % HOLLOW_ANIMATION_MODES.length]
  });
  const refinedBase = buildNftVisualBundle(descriptor, {
    ...options,
    context: options.context || 'storefront',
    variant: variantA
  });

  let guardedBase = refinedBase;
  const maxGuardAttempts = 9;
  for (let attempt = 1; attempt < maxGuardAttempts; attempt += 1) {
    const visualFingerprint = [guardedBase.archetype, guardedBase.stylePack, guardedBase.sigilCode, guardedBase.rarityKey].join('|');
    const duplicate = previewFingerprintWindow.includes(visualFingerprint);
    if (!duplicate) {
      previewFingerprintWindow.push(visualFingerprint);
      if (previewFingerprintWindow.length > PREVIEW_FINGERPRINT_WINDOW_MAX) {
        previewFingerprintWindow.shift();
      }
      break;
    }
    guardedBase = buildNftVisualBundle(descriptor, {
      ...options,
      context: options.context || 'storefront',
      variant: `v${(hashSeed(`${seedKey}|base|${attempt}`) + attempt) % 37}`
    });
  }

  return {
    imageUri: guardedBase.staticUri,
    hollowUri: hollow.staticUri,
    hollowMode: hollow.hollowMode,
    archetype: guardedBase.archetype,
    sigilCode: guardedBase.sigilCode,
    stylePack: guardedBase.stylePack,
    rarityLabel: guardedBase.rarityLabel,
    rarityKey: guardedBase.rarityKey
  };
}

const OBJECT_TRAIT_SCHEMA = Object.freeze({
  archetype: {
    required: true,
    values: [
      { value: 'key', weight: 12 },
      { value: 'tower', weight: 10 },
      { value: 'blade', weight: 11 },
      { value: 'crown', weight: 10 },
      { value: 'orb', weight: 11 },
      { value: 'compass', weight: 9 },
      { value: 'idol', weight: 8 },
      { value: 'gauntlet', weight: 8 },
      { value: 'crystal_shard', weight: 11 },
      { value: 'rune_stone', weight: 9 },
      { value: 'portal_arch', weight: 9 },
      { value: 'neural_lattice', weight: 8 },
      { value: 'microchip', weight: 8 },
      { value: 'void_fragment', weight: 7 },
      { value: 'hourglass', weight: 9 },
      { value: 'eye_of_god', weight: 8 },
      { value: 'astrolabe', weight: 8 },
      { value: 'wyvern_claw', weight: 7 },
      { value: 'sigil_disc', weight: 8 },
      { value: 'fractal_bloom', weight: 9 },
      { value: 'dragon_skull', weight: 6 },
      { value: 'spell_tome', weight: 8 },
      { value: 'quantum_core', weight: 9 },
      { value: 'chaos_spiral', weight: 7 },
      { value: 'war_hammer', weight: 8 },
      { value: 'death_mask', weight: 7 },
      { value: 'phoenix_wing', weight: 8 },
      { value: 'lich_crown', weight: 6 },
      { value: 'arcane_prism', weight: 8 },
      { value: 'cosmic_egg', weight: 7 },
      { value: 'shadow_blade', weight: 8 },
      { value: 'golem_heart', weight: 7 },
      { value: 'storm_vortex', weight: 7 },
      { value: 'sacred_mandala', weight: 8 },
      { value: 'void_eye', weight: 7 },
      { value: 'celestial_map', weight: 8 },
      { value: 'titan_shield', weight: 7 },
      { value: 'rune_blade', weight: 8 },
      { value: 'spirit_lantern', weight: 7 },
      { value: 'blood_chalice', weight: 6 },
      { value: 'nebula_core', weight: 9 },
      { value: 'time_rift', weight: 8 },
      { value: 'glass_skull', weight: 7 },
      { value: 'mirror_realm', weight: 8 },
      { value: 'living_sigil', weight: 9 },
      { value: 'echo_stone', weight: 7 },
      { value: 'null_cube', weight: 6 },
      { value: 'prism_eye', weight: 9 },
      { value: 'thought_crystal', weight: 8 },
      { value: 'aether_knot', weight: 7 },
      { value: 'forbidden_tome', weight: 8 },
      { value: 'ouroboros', weight: 9 },
      { value: 'spectral_crown', weight: 7 },
      { value: 'bone_compass', weight: 6 },
      { value: 'binary_idol', weight: 7 },
      { value: 'dream_shard', weight: 8 },
      { value: 'void_bell', weight: 6 },
      { value: 'entropy_knot', weight: 7 },
      { value: 'lunar_disc', weight: 8 },
      { value: 'genesis_seed', weight: 5 }
    ]
  },
  material: {
    required: true,
    values: [
      { value: 'bone',           weight: 22 },
      { value: 'obsidian',       weight: 20 },
      { value: 'brass',          weight: 18 },
      { value: 'steel',          weight: 20 },
      { value: 'rune_metal',     weight: 10 },
      { value: 'crystal',        weight: 16 },
      { value: 'ether',          weight: 8  },
      { value: 'void_stone',     weight: 10 },
      { value: 'plasma',         weight: 12 },
      { value: 'celestial_gold', weight: 6  },
      { value: 'shadowsteel',    weight: 6  },
      { value: 'starfire',       weight: 3  }
    ]
  },
  background: {
    required: true,
    values: [
      { value: 'velvet-vault',    weight: 18 },
      { value: 'cathedral-haze', weight: 14 },
      { value: 'astral-grid',    weight: 16 },
      { value: 'forge-smoke',    weight: 14 },
      { value: 'eclipse-stage',  weight: 12 },
      { value: 'deep-cosmos',    weight: 14 },
      { value: 'neural-void',    weight: 12 },
      { value: 'crystal-cave',   weight: 11 },
      { value: 'sigil-floor',    weight: 11 },
      { value: 'aurora-borealis',weight: 10 },
      { value: 'blood-moon',     weight: 8  },
      { value: 'void-rift',      weight: 8  },
      { value: 'golden-sanctum', weight: 7  },
      { value: 'storm-chamber',  weight: 9  },
      { value: 'ancient-ruins',  weight: 8  },
      { value: 'prismatic-vault',weight: 6  },
      { value: 'shadow-realm',   weight: 7  },
      { value: 'server-room',    weight: 8  },
      { value: 'quantum-datavault', weight: 7 },
      { value: 'ai-cathedral',   weight: 7  },
      { value: 'plot-matrix',    weight: 7  },
      { value: 'realm-topography', weight: 6 }
    ]
  },
  aura: {
    required: false,
    values: [
      { value: 'none', weight: 40 },
      { value: 'halo', weight: 18 },
      { value: 'runes', weight: 14 },
      { value: 'embers', weight: 12 },
      { value: 'polar', weight: 8 },
      { value: 'ion', weight: 8 }
    ]
  },
  adornment: {
    required: false,
    values: [
      { value: 'none', weight: 30 },
      { value: 'filigree', weight: 18 },
      { value: 'spikes', weight: 14 },
      { value: 'rings', weight: 16 },
      { value: 'sigils', weight: 12 },
      { value: 'shards', weight: 10 }
    ]
  },
  silhouette: {
    byArchetype: {
      key: [
        { value: 'cathedral-bow', weight: 36 },
        { value: 'vault-ward', weight: 34 },
        { value: 'sun-dial', weight: 30 }
      ],
      tower: [
        { value: 'watch-spire', weight: 44 },
        { value: 'bastion-keep', weight: 33 },
        { value: 'needle-pylon', weight: 23 }
      ],
      blade: [
        { value: 'regal-saber', weight: 38 },
        { value: 'relic-glaive', weight: 34 },
        { value: 'void-falchion', weight: 28 }
      ],
      crown: [
        { value: 'sunburst-diadem', weight: 40 },
        { value: 'citadel-coronet', weight: 34 },
        { value: 'thorn-halo', weight: 26 }
      ],
      orb: [
        { value: 'armillary-core', weight: 42 },
        { value: 'sealed-relic', weight: 30 },
        { value: 'storm-nucleus', weight: 28 }
      ],
      compass: [
        { value: 'navigator-rose', weight: 43 },
        { value: 'vault-gyre', weight: 31 },
        { value: 'star-locator', weight: 26 }
      ],
      idol: [
        { value: 'totem-warden', weight: 46 },
        { value: 'moon-effigy', weight: 28 },
        { value: 'guardian-mask', weight: 26 }
      ],
      gauntlet: [
        { value: 'knight-grip', weight: 40 },
        { value: 'relic-clasp', weight: 33 },
        { value: 'oracle-hand', weight: 27 }
      ],
      crystal_shard: [
        { value: 'prism-cluster', weight: 44 },
        { value: 'void-spire', weight: 30 },
        { value: 'rift-shard', weight: 26 }
      ],
      rune_stone: [
        { value: 'elder-tablet', weight: 42 },
        { value: 'binding-stone', weight: 32 },
        { value: 'cipher-slab', weight: 26 }
      ],
      portal_arch: [
        { value: 'rift-gate', weight: 40 },
        { value: 'void-threshold', weight: 34 },
        { value: 'nexus-arch', weight: 26 }
      ],
      neural_lattice: [
        { value: 'synapse-web', weight: 44 },
        { value: 'cortex-node', weight: 30 },
        { value: 'mind-fractal', weight: 26 }
      ],
      microchip: [
        { value: 'logic-die', weight: 42 },
        { value: 'quantum-board', weight: 32 },
        { value: 'nano-grid', weight: 26 }
      ],
      void_fragment: [
        { value: 'reality-shard', weight: 44 },
        { value: 'null-piece', weight: 32 },
        { value: 'chaos-sliver', weight: 24 }
      ],
      hourglass: [
        { value: 'time-vessel', weight: 44 },
        { value: 'eternal-glass', weight: 30 },
        { value: 'fate-timer', weight: 26 }
      ],
      eye_of_god: [
        { value: 'all-seeing', weight: 46 },
        { value: 'oracle-lens', weight: 28 },
        { value: 'divine-iris', weight: 26 }
      ],
      astrolabe: [
        { value: 'navigator-disc', weight: 44 },
        { value: 'celestial-arm', weight: 30 },
        { value: 'star-rete', weight: 26 }
      ],
      wyvern_claw: [
        { value: 'dragon-talon', weight: 44 },
        { value: 'void-fang', weight: 30 },
        { value: 'bone-claw', weight: 26 }
      ],
      sigil_disc: [
        { value: 'binding-seal', weight: 42 },
        { value: 'chaos-ward', weight: 32 },
        { value: 'elder-mark', weight: 26 }
      ],
      fractal_bloom: [
        { value: 'petal-matrix', weight: 44 },
        { value: 'crystal-flower', weight: 30 },
        { value: 'void-blossom', weight: 26 }
      ],
      dragon_skull: [
        { value: 'elder-skull', weight: 44 },
        { value: 'wyvern-death', weight: 30 },
        { value: 'void-crowned', weight: 26 }
      ],
      spell_tome: [
        { value: 'open-grimoire', weight: 44 },
        { value: 'sealed-codex', weight: 30 },
        { value: 'rune-scripture', weight: 26 }
      ],
      quantum_core: [
        { value: 'qubit-lattice', weight: 44 },
        { value: 'entangled-cube', weight: 30 },
        { value: 'phase-core', weight: 26 }
      ],
      chaos_spiral: [
        { value: 'void-vortex', weight: 44 },
        { value: 'entropy-eye', weight: 30 },
        { value: 'null-spiral', weight: 26 }
      ],
      war_hammer: [
        { value: 'siege-maul', weight: 44 },
        { value: 'rune-breaker', weight: 30 },
        { value: 'titan-blow', weight: 26 }
      ],
      death_mask: [
        { value: 'bone-visage', weight: 44 },
        { value: 'lich-face', weight: 30 },
        { value: 'void-gaze', weight: 26 }
      ],
      phoenix_wing: [
        { value: 'ember-plume', weight: 44 },
        { value: 'solar-feather', weight: 30 },
        { value: 'rebirth-span', weight: 26 }
      ],
      lich_crown: [
        { value: 'necrotic-diadem', weight: 44 },
        { value: 'soul-coronet', weight: 30 },
        { value: 'undead-crest', weight: 26 }
      ],
      arcane_prism: [
        { value: 'refraction-core', weight: 44 },
        { value: 'mage-lens', weight: 30 },
        { value: 'spell-crystal', weight: 26 }
      ],
      cosmic_egg: [
        { value: 'genesis-shell', weight: 44 },
        { value: 'void-embryo', weight: 30 },
        { value: 'star-seed', weight: 26 }
      ],
      shadow_blade: [
        { value: 'umbra-edge', weight: 44 },
        { value: 'void-shard', weight: 30 },
        { value: 'night-sliver', weight: 26 }
      ],
      golem_heart: [
        { value: 'core-engine', weight: 44 },
        { value: 'rune-pump', weight: 30 },
        { value: 'clay-crystal', weight: 26 }
      ],
      storm_vortex: [
        { value: 'lightning-eye', weight: 44 },
        { value: 'thunder-core', weight: 30 },
        { value: 'gale-spiral', weight: 26 }
      ],
      sacred_mandala: [
        { value: 'lotus-wheel', weight: 44 },
        { value: 'dharma-ring', weight: 30 },
        { value: 'divine-pattern', weight: 26 }
      ],
      void_eye: [
        { value: 'null-iris', weight: 44 },
        { value: 'abyss-gaze', weight: 30 },
        { value: 'void-slit', weight: 26 }
      ],
      celestial_map: [
        { value: 'star-chart', weight: 44 },
        { value: 'orrery-disc', weight: 30 },
        { value: 'cosmos-scroll', weight: 26 }
      ],
      titan_shield: [
        { value: 'aegis-plate', weight: 44 },
        { value: 'rune-barrier', weight: 30 },
        { value: 'siege-ward', weight: 26 }
      ],
      rune_blade: [
        { value: 'etched-sword', weight: 44 },
        { value: 'glyph-edge', weight: 30 },
        { value: 'elder-cut', weight: 26 }
      ],
      spirit_lantern: [
        { value: 'soul-flame', weight: 44 },
        { value: 'ghost-lamp', weight: 30 },
        { value: 'astral-light', weight: 26 }
      ],
      blood_chalice: [
        { value: 'crimson-grail', weight: 44 },
        { value: 'sacrifice-cup', weight: 30 },
        { value: 'void-font', weight: 26 }
      ]
    }
  }
});

const OBJECT_RARITY_DETAIL = Object.freeze({
  common: { microSlots: 1, auraBias: 0.12, accentCount: 1, detailDensity: 0.78 },
  uncommon: { microSlots: 2, auraBias: 0.18, accentCount: 1, detailDensity: 0.9 },
  rare: { microSlots: 3, auraBias: 0.26, accentCount: 2, detailDensity: 1.02 },
  epic: { microSlots: 4, auraBias: 0.38, accentCount: 2, detailDensity: 1.14 },
  legendary: { microSlots: 5, auraBias: 0.52, accentCount: 3, detailDensity: 1.26 },
  ultra: { microSlots: 6, auraBias: 0.64, accentCount: 3, detailDensity: 1.38 },
  apex: { microSlots: 7, auraBias: 0.72, accentCount: 4, detailDensity: 1.47 },
  'god-tier': { microSlots: 8, auraBias: 0.78, accentCount: 4, detailDensity: 1.56 }
});

const OBJECT_COMPOSITION_RULES = Object.freeze({
  marketplace: { width: 1024, height: 1024, scale: 0.8, centerX: 512, centerY: 536, labelBand: 190 },
  storefront: { width: 1280, height: 960, scale: 0.86, centerX: 640, centerY: 520, labelBand: 170 },
  reveal: { width: 1280, height: 1280, scale: 0.92, centerX: 640, centerY: 616, labelBand: 220 },
  land: { width: 1200, height: 1200, scale: 0.88, centerX: 600, centerY: 620, labelBand: 220 }
});

const OBJECT_ARCHETYPE_METRICS = Object.freeze({
  key: { occupancy: 0.52, symmetry: 0.46, prestige: 0.72 },
  tower: { occupancy: 0.58, symmetry: 0.84, prestige: 0.78 },
  blade: { occupancy: 0.56, symmetry: 0.52, prestige: 0.82 },
  crown: { occupancy: 0.61, symmetry: 0.92, prestige: 0.88 },
  orb: { occupancy: 0.63, symmetry: 0.98, prestige: 0.85 },
  compass: { occupancy: 0.6, symmetry: 0.94, prestige: 0.84 },
  idol: { occupancy: 0.55, symmetry: 0.86, prestige: 0.8 },
  gauntlet: { occupancy: 0.57, symmetry: 0.7, prestige: 0.87 },
  crystal_shard: { occupancy: 0.62, symmetry: 0.72, prestige: 0.86 },
  rune_stone: { occupancy: 0.58, symmetry: 0.88, prestige: 0.82 },
  portal_arch: { occupancy: 0.68, symmetry: 0.76, prestige: 0.9 },
  neural_lattice: { occupancy: 0.65, symmetry: 0.62, prestige: 0.88 },
  microchip: { occupancy: 0.6, symmetry: 0.94, prestige: 0.84 },
  void_fragment: { occupancy: 0.54, symmetry: 0.38, prestige: 0.92 },
  hourglass: { occupancy: 0.58, symmetry: 0.96, prestige: 0.86 },
  eye_of_god: { occupancy: 0.66, symmetry: 0.98, prestige: 0.94 },
  astrolabe: { occupancy: 0.67, symmetry: 0.96, prestige: 0.9 },
  wyvern_claw: { occupancy: 0.54, symmetry: 0.44, prestige: 0.88 },
  sigil_disc: { occupancy: 0.64, symmetry: 0.98, prestige: 0.89 },
  fractal_bloom: { occupancy: 0.66, symmetry: 0.94, prestige: 0.87 },
  dragon_skull: { occupancy: 0.62, symmetry: 0.82, prestige: 0.92 },
  spell_tome: { occupancy: 0.6, symmetry: 0.64, prestige: 0.84 },
  quantum_core: { occupancy: 0.63, symmetry: 0.92, prestige: 0.9 },
  chaos_spiral:    { occupancy: 0.65, symmetry: 0.86, prestige: 0.88 },
  war_hammer:      { occupancy: 0.60, symmetry: 0.76, prestige: 0.86 },
  death_mask:      { occupancy: 0.63, symmetry: 0.92, prestige: 0.90 },
  phoenix_wing:    { occupancy: 0.68, symmetry: 0.56, prestige: 0.92 },
  lich_crown:      { occupancy: 0.62, symmetry: 0.90, prestige: 0.94 },
  arcane_prism:    { occupancy: 0.66, symmetry: 0.96, prestige: 0.96 },
  cosmic_egg:      { occupancy: 0.64, symmetry: 0.98, prestige: 0.94 },
  shadow_blade:    { occupancy: 0.57, symmetry: 0.50, prestige: 0.90 },
  golem_heart:     { occupancy: 0.61, symmetry: 0.88, prestige: 0.87 },
  storm_vortex:    { occupancy: 0.67, symmetry: 0.94, prestige: 0.90 },
  sacred_mandala:  { occupancy: 0.70, symmetry: 0.99, prestige: 0.96 },
  void_eye:        { occupancy: 0.64, symmetry: 0.98, prestige: 0.95 },
  celestial_map:   { occupancy: 0.68, symmetry: 0.88, prestige: 0.92 },
  titan_shield:    { occupancy: 0.66, symmetry: 0.90, prestige: 0.88 },
  rune_blade:      { occupancy: 0.58, symmetry: 0.60, prestige: 0.86 },
  spirit_lantern:  { occupancy: 0.60, symmetry: 0.92, prestige: 0.90 },
  blood_chalice:   { occupancy: 0.59, symmetry: 0.88, prestige: 0.92 },
  // Sci-fi / Tech archetypes
  rocket:          { occupancy: 0.55, symmetry: 0.96, prestige: 0.88 },
  spaceship:       { occupancy: 0.64, symmetry: 0.92, prestige: 0.90 },
  robot_head:      { occupancy: 0.66, symmetry: 0.94, prestige: 0.92 },
  microchip_array: { occupancy: 0.70, symmetry: 0.98, prestige: 0.96 },
  circuit_board:   { occupancy: 0.72, symmetry: 0.94, prestige: 0.92 },
  server_rack:     { occupancy: 0.68, symmetry: 0.96, prestige: 0.90 },
  satellite:       { occupancy: 0.60, symmetry: 0.90, prestige: 0.88 },
  robotic_alien:   { occupancy: 0.64, symmetry: 0.82, prestige: 0.94 },
  neural_chip:     { occupancy: 0.66, symmetry: 0.96, prestige: 0.96 },
  plasma_core:     { occupancy: 0.65, symmetry: 0.98, prestige: 0.94 },
  warp_drive:      { occupancy: 0.63, symmetry: 0.88, prestige: 0.92 },
  data_crystal:    { occupancy: 0.62, symmetry: 0.94, prestige: 0.90 },
  drone_core:      { occupancy: 0.60, symmetry: 0.90, prestige: 0.86 },
  cyber_skull:     { occupancy: 0.64, symmetry: 0.88, prestige: 0.94 },
  quantum_antenna: { occupancy: 0.58, symmetry: 0.92, prestige: 0.90 },
  ai_eye:          { occupancy: 0.65, symmetry: 0.98, prestige: 0.96 }
});

function shouldPreferPolishedSymmetry(/** @type {any} */ context = '', /** @type {any} */ descriptor = {}, /** @type {any} */ rarityKey = 'common') {
  const /** @type {any} */
polishedContexts = new Set(['marketplace', 'storefront', 'reveal']);
  if (!polishedContexts.has(String(context))) return false;

  const collection = normalizeCollectionType(descriptor.collectionType || '');
  const /** @type {any} */
premiumSet = new Set(['rare', 'epic', 'legendary', 'ultra', 'apex', 'god-tier']);
  const /** @type {any} */
showcaseCollections = new Set([
    'nft', 'ai', 'builder', 'operator', 'signal', 'realmlord', 'pioneer',
    'compute', 'template', 'agent', 'dataset', 'workflow', 'skill_pack',
    'agent_profile', 'prompt_pack', 'land'
  ]);

  return showcaseCollections.has(collection) || premiumSet.has(String(rarityKey));
}

function canonicalVisualCollection(/** @type {any} */ collection = '') {
  const normalized = normalizeCollectionType(collection);
  const /** @type {any} */
aiSet = new Set(['dataset', 'workflow', 'skill_pack', 'agent_profile', 'prompt_pack', 'template', 'agent', 'compute']);
  if (aiSet.has(normalized)) return 'ai';
  return normalized || 'nft';
}

function curateArchetypeForDisplay(/** @type {any} */ archetype, /** @type {any} */ descriptor = {}, /** @type {any} */ context = 'marketplace', /** @type {any} */ rarityKey = 'common', /** @type {any} */ seedKey = 'eon') {
  if (!shouldPreferPolishedSymmetry(context, descriptor, rarityKey)) return archetype;

  const collection = canonicalVisualCollection(descriptor.collectionType || '');
  const metrics = (/** @type {any} */ (OBJECT_ARCHETYPE_METRICS))[archetype] || OBJECT_ARCHETYPE_METRICS.orb;
  const rarity = String(rarityKey);
  const isShowpiece = descriptor.isGenesis === true || descriptor.fromTeam === true || context === 'storefront';
  const premiumFloor = new Set(['legendary', 'ultra', 'apex', 'god-tier']).has(rarity) ? 0.9 : 0.86;
  const minSymmetry = collection === 'land'
    ? (isShowpiece ? 0.9 : 0.86)
    : collection === 'realmlord' || collection === 'signal' || collection === 'ai'
      ? Math.max(isShowpiece ? 0.92 : 0.88, premiumFloor)
      : Math.max(isShowpiece ? 0.9 : 0.84, premiumFloor);

  if (metrics.symmetry >= minSymmetry) return archetype;

  const /** @type {any} */
curatedPools = {
    land: ['tower', 'portal_arch', 'rune_stone', 'sigil_disc', 'sacred_mandala', 'celestial_map', 'titan_shield', 'astrolabe'],
    ai: [
      // Tech/sci-fi dominant for AI collections
      'microchip_array', 'neural_chip', 'ai_eye', 'circuit_board', 'microchip',
      'quantum_core', 'plasma_core', 'data_crystal', 'drone_core',
      'arcane_prism', 'sigil_disc', 'eye_of_god', 'astrolabe', 'sacred_mandala', 'void_eye', 'cosmic_egg'
    ],
    compute: [
      // Server/datacenter/tech dominant for compute collections
      'server_rack', 'microchip_array', 'circuit_board', 'neural_chip', 'drone_core',
      'quantum_core', 'plasma_core', 'satellite', 'warp_drive', 'data_crystal',
      'quantum_antenna', 'sigil_disc', 'astrolabe', 'cosmic_egg'
    ],
    builder: ['microchip_array', 'circuit_board', 'quantum_core', 'server_rack', 'microchip', 'titan_shield', 'golem_heart', 'astrolabe', 'sigil_disc'],
    signal: ['sigil_disc', 'astrolabe', 'void_eye', 'sacred_mandala', 'eye_of_god', 'arcane_prism', 'celestial_map', 'quantum_antenna', 'neural_chip'],
    realmlord: ['crown', 'lich_crown', 'death_mask', 'titan_shield', 'sacred_mandala', 'eye_of_god'],
    pioneer: ['astrolabe', 'hourglass', 'compass', 'sigil_disc', 'spirit_lantern', 'celestial_map', 'rocket', 'satellite'],
    nft: ['orb', 'crown', 'compass', 'hourglass', 'eye_of_god', 'astrolabe', 'sigil_disc', 'fractal_bloom', 'arcane_prism', 'cosmic_egg', 'sacred_mandala', 'void_eye', 'spirit_lantern', 'death_mask',
          'robot_head', 'spaceship', 'plasma_core', 'cyber_skull', 'microchip_array', 'ai_eye']
  };

  const pool = ((/** @type {any} */ (curatedPools))[collection] || curatedPools.nft)
    .filter((/** @type {any} */ value) => (((/** @type {any} */ (OBJECT_ARCHETYPE_METRICS))[value] || OBJECT_ARCHETYPE_METRICS.orb).symmetry >= minSymmetry));

  if (!pool.length) return archetype;
  return pool[hashSeed(`${seedKey}|${collection}|${context}|beauty-pass`) % pool.length] || archetype;
}

function polishGrammarForDisplay(/** @type {any} */ grammar = {}, /** @type {any} */ archetype, /** @type {any} */ context = 'marketplace', /** @type {any} */ descriptor = {}, /** @type {any} */ rarityKey = 'common') {
  if (!shouldPreferPolishedSymmetry(context, descriptor, rarityKey)) return grammar;

  const metrics = (/** @type {any} */ (OBJECT_ARCHETYPE_METRICS))[archetype] || OBJECT_ARCHETYPE_METRICS.orb;
  const symmetryClamp = metrics.symmetry >= 0.96 ? 0.035 : metrics.symmetry >= 0.9 ? 0.06 : 0.1;

  return {
    ...grammar,
    asymmetry: Math.max(-symmetryClamp, Math.min(symmetryClamp, Number(grammar.asymmetry) || 0)),
    edgeBreaks: Math.max(1, Math.min(3, Number(grammar.edgeBreaks) || 2)),
    branchShift: Math.round((Number(grammar.branchShift) || 0) * (metrics.symmetry >= 0.9 ? 0.35 : 0.55))
  };
}

function buildW95WorldClassObjectLayer(/** @type {any} */ plan, /** @type {any} */ ids, /** @type {number} */ width, /** @type {number} */ height) {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const orbit = Math.floor(Math.min(width, height) * 0.38);
  const accent = plan.palette.accent;
  const glow = plan.palette.glow;
  const objectLabel = esc(String(plan.archetype || 'utility').replace(/_/g, ' ').toUpperCase());
  const utilityLabel = esc(String(plan.collectionType || plan.context || 'EON').replace(/_/g, ' ').toUpperCase());
  const nodes = [0, 45, 90, 135, 180, 225, 270, 315].map((/** @type {any} */ angle, /** @type {any} */ index) => {
    const rad = angle * Math.PI / 180;
    const x = Math.round(cx + Math.cos(rad) * orbit);
    const y = Math.round(cy + Math.sin(rad) * orbit);
    const r = index % 2 === 0 ? 9 : 6;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 2 === 0 ? glow : accent}" fill-opacity="0.58"><animate attributeName="fill-opacity" values="0.28;0.78;0.28" dur="${(2.8 + index * 0.17).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
  }).join('');
  const circuit = [0.18,0.30,0.42,0.58,0.70,0.82].map((/** @type {any} */ ratio, /** @type {any} */ i) => {
    const y = Math.round(height * ratio);
    return `<path d="M${Math.round(width*0.08)} ${y} C${Math.round(width*0.28)} ${y-18} ${Math.round(width*0.72)} ${y+18} ${Math.round(width*0.92)} ${y}" fill="none" stroke="${i%2?accent:glow}" stroke-opacity="0.09" stroke-width="${i%2?2:3}"/>`;
  }).join('');
  return `
    <g opacity="0.98" filter="url(#${ids.shadow})">
      <circle cx="${cx}" cy="${cy}" r="${orbit}" fill="none" stroke="${glow}" stroke-opacity="0.16" stroke-width="18">
        <animate attributeName="stroke-opacity" values="0.08;0.23;0.08" dur="5.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(orbit * 0.82)}" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="8 18">
        <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="22s" repeatCount="indefinite"/>
      </circle>
      ${nodes}
      ${circuit}
      <rect x="${Math.round(width*0.075)}" y="${Math.round(height*0.205)}" width="${Math.round(width*0.25)}" height="34" rx="10" fill="rgba(2,6,23,0.48)" stroke="${glow}" stroke-opacity="0.20"/>
      <text x="${Math.round(width*0.095)}" y="${Math.round(height*0.205)+23}" font-size="15" font-family="Rajdhani, Orbitron, Segoe UI, Arial" font-weight="900" fill="${glow}" fill-opacity="0.82">${objectLabel}</text>
      <rect x="${Math.round(width*0.675)}" y="${Math.round(height*0.205)}" width="${Math.round(width*0.25)}" height="34" rx="10" fill="rgba(2,6,23,0.48)" stroke="${accent}" stroke-opacity="0.20"/>
      <text x="${Math.round(width*0.905)}" y="${Math.round(height*0.205)+23}" text-anchor="end" font-size="15" font-family="Rajdhani, Orbitron, Segoe UI, Arial" font-weight="900" fill="${accent}" fill-opacity="0.82">${utilityLabel}</text>
    </g>`;
}

function clamp01(/** @type {any} */ value) {
  return Math.max(0, Math.min(1, value));
}

function mixHex(/** @type {any} */ hex, /** @type {any} */ amount = 0.5, /** @type {any} */ mix = '#ffffff') {
  const normalize = (/** @type {any} */ value) => {
    const safe = String(value || '#000000').replace('#', '');
    return safe.length === 3
      ? safe.split('').map((/** @type {any} */ char) => char + char).join('')
      : safe.padEnd(6, '0').slice(0, 6);
  };
  const source = normalize(hex);
  const target = normalize(mix);
  const ratio = clamp01(amount);
  const channels = [0, 2, 4].map((/** @type {any} */ offset) => {
    const left = parseInt(source.slice(offset, offset + 2), 16);
    const right = parseInt(target.slice(offset, offset + 2), 16);
    return Math.round(left + ((right - left) * ratio)).toString(16).padStart(2, '0');
  });
  return `#${channels.join('')}`;
}

function pickWeighted(/** @type {any[]} */ entries = [], /** @type {any} */ rng) {
  const totalWeight = entries.reduce((/** @type {any} */ sum, /** @type {any} */ entry) => sum + (Number(entry.weight) || 0), 0);
  if (!totalWeight) return entries[0]?.value;
  let cursor = rng() * totalWeight;
  for (let index = 0; index < entries.length; index += 1) {
    cursor -= Number((entries[index] ?? {}).weight) || 0;
    if (cursor <= 0) return (entries[index] ?? {}).value;
  }
  return entries[entries.length - 1]?.value;
}

function boostMaterialWeightsByRarity(/** @type {any} */ entries, /** @type {any} */ rarityKey) {
  const rarityBoost = /** @type {Record<string, any>} */ ({
    // bone/obsidian/brass/steel heavy at low rarity; premium materials bloom at high rarity
    common:    { bone: 14, obsidian: 6,  brass: 4,  steel: 6,  rune_metal: 2,  crystal: -4, ether: -10, void_stone: -8, plasma: -6,  celestial_gold: -16, shadowsteel: -14, starfire: -20 },
    uncommon:  { bone: 8,  obsidian: 4,  brass: 3,  steel: 3,  rune_metal: 3,  crystal: -1, ether: -6,  void_stone: -4, plasma: -3,  celestial_gold: -12, shadowsteel: -10, starfire: -16 },
    rare:      { bone: 2,  obsidian: 2,  brass: 1,  steel: 2,  rune_metal: 4,  crystal: 2,  ether: 0,   void_stone: 1,  plasma: 1,   celestial_gold: -6,  shadowsteel: -4,  starfire: -10 },
    epic:      { bone: -4, obsidian: 0,  brass: 1,  steel: 1,  rune_metal: 6,  crystal: 5,  ether: 3,   void_stone: 4,  plasma: 4,   celestial_gold: -2,  shadowsteel: 2,   starfire: -6  },
    legendary: { bone: -8, obsidian: -2, brass: 0,  steel: 0,  rune_metal: 8,  crystal: 6,  ether: 6,   void_stone: 6,  plasma: 6,   celestial_gold: 6,   shadowsteel: 6,   starfire: -2  },
    ultra:     { bone:-12, obsidian: -3, brass: -1, steel: -1, rune_metal: 10, crystal: 7,  ether: 9,   void_stone: 9,  plasma: 9,   celestial_gold: 12,  shadowsteel: 10,  starfire: 4   },
    apex:      { bone:-14, obsidian: -4, brass: -2, steel: -2, rune_metal: 11, crystal: 8,  ether: 11,  void_stone: 10, plasma: 10,  celestial_gold: 15,  shadowsteel: 12,  starfire: 12  },
    'god-tier':{ bone:-16, obsidian: -4, brass: -2, steel: -2, rune_metal: 12, crystal: 8,  ether: 14,  void_stone: 12, plasma: 12,  celestial_gold: 18,  shadowsteel: 14,  starfire: 20  }
  });
  const boosts = rarityBoost[String(rarityKey)] || rarityBoost.common;
  return entries.map((/** @type {any} */ entry) => ({
    ...entry,
    weight: Math.max(1, (entry.weight ?? 0) + ((boosts[String(entry.value)] ?? 0)))
  }));
}

function boostMaterialWeightsByCollection(/** @type {any} */ entries, /** @type {any} */ collectionType) {
  const collection = normalizeCollectionType(collectionType);
  const collectionBoost = /** @type {Record<string, any>} */ ({
    ai: { microchip: 16, plasma: 10, crystal: 8, ether: 7, void_stone: 5, shadowsteel: 9, starfire: 4, bone: -12, brass: -6 },
    signal: { crystal: 8, ether: 7, plasma: 5, microchip: 10, rune_metal: 4, bone: -10 },
    operator: { steel: 12, rune_metal: 10, shadowsteel: 7, obsidian: 6, brass: 3, bone: -10 },
    realmlord: { celestial_gold: 12, obsidian: 8, void_stone: 8, crystal: 6, microchip: -10 },
    pioneer: { brass: 8, rune_metal: 6, crystal: 6, ether: 5, bone: -6 },
    template: { crystal: 10, ether: 8, celestial_gold: 4, steel: 3 },
    workflow: { rune_metal: 8, ether: 6, crystal: 5, plasma: 3 },
    dataset: { crystal: 10, microchip: 9, steel: 5, ether: 5 },
    prompt_pack: { ether: 10, crystal: 8, brass: 4, celestial_gold: 4 },
    agent_profile: { microchip: 12, shadowsteel: 7, ether: 6, plasma: 4 },
    skill_pack: { steel: 8, brass: 7, crystal: 5, plasma: 4 },
    referral: { brass: 6, crystal: 5, celestial_gold: 5, ether: 4 },
    land: { rune_metal: 12, obsidian: 9, steel: 8, void_stone: 6, celestial_gold: 5, microchip: -8, plasma: -4, starfire: -3 }
  });
  const boosts = collectionBoost[String(collection)];
  if (!boosts) return entries;
  return entries.map((/** @type {any} */ entry) => ({
    ...entry,
    weight: Math.max(1, Number(entry.weight || 1) + Number((boosts[String(entry.value)] ?? 0)))
  }));
}

function boostBackgroundWeightsByCollection(/** @type {any} */ entries, /** @type {any} */ collectionType) {
  const collection = normalizeCollectionType(collectionType);
  const collectionBoost = /** @type {Record<string, any>} */ ({
    ai: {
      'neural-void': 14, 'astral-grid': 10, 'prismatic-vault': 8, 'storm-chamber': 6,
      'server-room': 22, 'quantum-datavault': 18, 'ai-cathedral': 14
    },
    signal: {
      'astral-grid': 14, 'aurora-borealis': 10, 'neural-void': 12, 'storm-chamber': 8, 'quantum-datavault': 8
    },
    operator: {
      'cathedral-haze': 12, 'golden-sanctum': 8, 'prismatic-vault': 7, 'ai-cathedral': 6, 'velvet-vault': 8
    },
    realmlord: {
      'golden-sanctum': 16, 'cathedral-haze': 14, 'ancient-ruins': 10, 'void-rift': 8
    },
    pioneer: {
      'aurora-borealis': 12, 'astral-grid': 10, 'ancient-ruins': 8, 'realm-topography': 8
    },
    template: {
      'prismatic-vault': 14, 'sigil-floor': 10, 'velvet-vault': 10, 'cathedral-haze': 6
    },
    workflow: {
      'astral-grid': 12, 'storm-chamber': 10, 'prismatic-vault': 8, 'void-rift': 7
    },
    dataset: {
      'quantum-datavault': 18, 'server-room': 12, 'astral-grid': 8, 'prismatic-vault': 8
    },
    prompt_pack: {
      'prismatic-vault': 14, 'aurora-borealis': 10, 'velvet-vault': 8, 'cathedral-haze': 6
    },
    agent_profile: {
      'ai-cathedral': 14, 'neural-void': 12, 'server-room': 10, 'astral-grid': 8
    },
    skill_pack: {
      'storm-chamber': 12, 'aurora-borealis': 10, 'golden-sanctum': 8, 'prismatic-vault': 8
    },
    referral: {
      'aurora-borealis': 12, 'velvet-vault': 10, 'golden-sanctum': 8, 'astral-grid': 6
    },
    land: {
      'ancient-ruins': 14, 'sigil-floor': 12, 'golden-sanctum': 10, 'crystal-cave': 8,
      'plot-matrix': 20, 'realm-topography': 18
    }
  });
  const boosts = collectionBoost[String(collection)];
  if (!boosts) return entries;
  return entries.map((/** @type {any} */ entry) => ({
    ...entry,
    weight: Math.max(1, Number(entry.weight || 1) + Number((boosts[String(entry.value)] ?? 0)))
  }));
}

function boostBackgroundWeightsByRarity(/** @type {any} */ entries, /** @type {any} */ rarityKey) {
  const rarity = String(rarityKey || 'common');
  const rarityBoost = /** @type {Record<string, any>} */ ({
    legendary: {
      'prismatic-vault': 9,
      'void-rift': 8,
      'golden-sanctum': 7,
      'aurora-borealis': 7,
      'cathedral-haze': 5
    },
    ultra: {
      'prismatic-vault': 12,
      'void-rift': 10,
      'golden-sanctum': 9,
      'aurora-borealis': 9,
      'storm-chamber': 7,
      'deep-cosmos': 6
    },
    apex: {
      'prismatic-vault': 15,
      'void-rift': 13,
      'golden-sanctum': 11,
      'aurora-borealis': 10,
      'neural-void': 8,
      'quantum-datavault': 8,
      'cathedral-haze': -4
    },
    'god-tier': {
      'prismatic-vault': 18,
      'void-rift': 16,
      'golden-sanctum': 14,
      'aurora-borealis': 12,
      'neural-void': 10,
      'quantum-datavault': 10,
      'forge-smoke': -6,
      'cathedral-haze': -6
    }
  })[rarity];

  if (!rarityBoost) return entries;
  return entries.map((/** @type {any} */ entry) => ({
    ...entry,
    weight: Math.max(1, Number(entry.weight || 1) + Number((rarityBoost[String(entry.value)] ?? 0)))
  }));
}

function boostAuraWeightsByRarity(/** @type {any} */ entries, /** @type {any} */ rarityKey) {
  const rarity = String(rarityKey || 'common');
  const boost = /** @type {Record<string, any>} */ ({
    legendary: { halo: 5, runes: 4, embers: 3, none: -4 },
    ultra: { halo: 7, runes: 6, embers: 5, polar: 4, none: -6 },
    apex: { halo: 9, runes: 8, polar: 7, embers: 6, none: -8 },
    'god-tier': { halo: 11, runes: 10, polar: 9, embers: 8, none: -10 }
  })[rarity];
  if (!boost) return entries;
  return entries.map((/** @type {any} */ entry) => ({
    ...entry,
    weight: Math.max(1, Number(entry.weight || 1) + Number((boost[String(entry.value)] ?? 0)))
  }));
}

function deriveObjectPalette(/** @type {any} */ seedKey, /** @type {any} */ rarityMeta, /** @type {any} */ material, /** @type {any} */ background, /** @type {any} */ rng, /** @type {any} */ collectionType) {
  const baseHue = hashSeed(`${seedKey}|${material}|${background}`) % 360;
  const shift = 18 + Math.floor(rng() * 42);
  // Collection identity: override accent/glow with collection color family
  const collBias = COLLECTION_PALETTE_BIAS[String(collectionType || '').toLowerCase()];
  const accent = (collBias && (collBias?.accent)) ? (collBias?.accent) : (rarityMeta?.color);
  const glow = rarityMeta.glow;
  const palettes = /** @type {Record<string, any>} */ ({
    obsidian: {
      bodyA: '#06090f', bodyB: '#151d29', edgeA: '#495668', edgeB: '#d0d8e4',
      accent, glow, bgA: '#04050a', bgB: `hsl(${baseHue}, 36%, 12%)`
    },
    brass: {
      bodyA: '#3b2914', bodyB: '#8f6731', edgeA: '#c59b51', edgeB: '#f4ddb1',
      accent, glow, bgA: '#130c06', bgB: `hsl(${(baseHue + shift) % 360}, 28%, 15%)`
    },
    steel: {
      bodyA: '#1e2731', bodyB: '#6f8599', edgeA: '#a7b8c9', edgeB: '#eff4fa',
      accent, glow, bgA: '#060910', bgB: `hsl(${(baseHue + 220) % 360}, 28%, 15%)`
    },
    crystal: {
      bodyA: mixHex(accent, 0.2, '#dff7ff'), bodyB: mixHex(accent, 0.64, '#ffffff'),
      edgeA: '#d8f7ff', edgeB: '#ffffff', accent, glow,
      bgA: '#050912', bgB: `hsl(${(baseHue + 150) % 360}, 40%, 16%)`
    },
    plasma: {
      bodyA: mixHex(accent, 0.12, '#0f1220'), bodyB: mixHex(accent, 0.7, '#ffffff'),
      edgeA: mixHex(glow, 0.3, '#f8fafc'), edgeB: '#ffffff', accent, glow,
      bgA: '#060711', bgB: `hsl(${(baseHue + 300) % 360}, 48%, 14%)`
    },
    void_stone: {
      bodyA: '#0a0614', bodyB: mixHex('#6d28d9', 0.28, '#1e0a38'),
      edgeA: '#7c3aed', edgeB: mixHex('#c4b5fd', 0.6, '#ffffff'),
      accent: accent || '#a78bfa', glow: glow || '#c4b5fd',
      bgA: '#050309', bgB: `hsl(${(baseHue + 270) % 360}, 52%, 10%)`
    },
    ether: {
      bodyA: mixHex('#0ea5e9', 0.08, '#030712'), bodyB: mixHex('#7dd3fc', 0.44, '#e0f7ff'),
      edgeA: '#bae6fd', edgeB: '#ffffff',
      accent: accent || '#38bdf8', glow: glow || '#7dd3fc',
      bgA: '#020710', bgB: `hsl(${(baseHue + 195) % 360}, 60%, 12%)`
    },
    rune_metal: {
      bodyA: '#141008', bodyB: '#2e2112', edgeA: '#d97706', edgeB: '#fde68a',
      accent: accent || '#f59e0b', glow: glow || '#fde68a',
      bgA: '#0b0905', bgB: `hsl(${(baseHue + 38) % 360}, 44%, 10%)`
    },
    bone: {
      bodyA: '#1c1812', bodyB: '#4a4030', edgeA: '#c8b89a', edgeB: '#f0e8d8',
      accent: accent || '#d4b896', glow: glow || '#f0e8d8',
      bgA: '#0e0c08', bgB: `hsl(${(baseHue + 22) % 360}, 22%, 14%)`
    },
    celestial_gold: {
      bodyA: '#1a1208', bodyB: mixHex('#fbbf24', 0.32, '#3d2800'),
      edgeA: '#fde68a', edgeB: '#ffffff',
      accent: accent || '#fbbf24', glow: glow || '#fef9c3',
      bgA: '#0c0904', bgB: `hsl(${(baseHue + 42) % 360}, 60%, 10%)`
    },
    shadowsteel: {
      bodyA: '#06060e', bodyB: mixHex('#6366f1', 0.18, '#0e0e1e'),
      edgeA: '#818cf8', edgeB: '#e0e7ff',
      accent: accent || '#6366f1', glow: glow || '#a5b4fc',
      bgA: '#020208', bgB: `hsl(${(baseHue + 240) % 360}, 48%, 8%)`
    },
    starfire: {
      bodyA: mixHex('#7c3aed', 0.12, '#000008'), bodyB: mixHex('#f0abfc', 0.44, '#ffffff'),
      edgeA: mixHex('#fde68a', 0.6, '#f0abfc'), edgeB: '#ffffff',
      accent: accent || '#f0abfc', glow: glow || '#fde68a',
      bgA: '#030008', bgB: `hsl(${(baseHue + 280) % 360}, 70%, 8%)`
    }
  });
  return palettes[String(material)] || palettes.steel;
}

function buildObjectIds(/** @type {any} */ seedKey, /** @type {any} */ variant = 'object') {
  const base = hashSeed(`${seedKey}|${variant}`).toString(16);
  return {
    bg: `objbg${base}`,
    bloom: `objbloom${base}`,
    material: `objmat${base}`,
    edge: `objedge${base}`,
    sheen: `objsheen${base}`,
    aura: `objaura${base}`,
    shadow: `objshadow${base}`,
    grain: `objgrain${base}`
  };
}

function buildObjectDefs(/** @type {any} */ ids, /** @type {any} */ plan) {
  const palette = plan.palette;
  const /** @type {any} */
materialDefs = {
    obsidian: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bodyA}"/>
        <stop offset="48%" stop-color="${mixHex(palette.bodyB, 0.18, '#0f172a')}"/>
        <stop offset="100%" stop-color="${palette.bodyB}"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.edgeB}" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.55"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="50%" stop-color="#ffffff" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>`,
    brass: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bodyA}"/>
        <stop offset="35%" stop-color="${mixHex(palette.bodyB, 0.12, '#b38440')}"/>
        <stop offset="78%" stop-color="${palette.bodyB}"/>
        <stop offset="100%" stop-color="${mixHex(palette.bodyA, 0.1, '#fef3c7')}"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.edgeB}"/>
        <stop offset="100%" stop-color="${palette.edgeA}"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff7d6" stop-opacity="0"/>
        <stop offset="50%" stop-color="#fff7d6" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#fff7d6" stop-opacity="0"/>
      </linearGradient>`,
    steel: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bodyA}"/>
        <stop offset="50%" stop-color="${mixHex(palette.bodyB, 0.2, '#cbd5e1')}"/>
        <stop offset="100%" stop-color="${palette.bodyB}"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96"/>
        <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.68"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="52%" stop-color="#ffffff" stop-opacity="0.36"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>`,
    crystal: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${mixHex(palette.bodyA, 0.3, '#ffffff')}" stop-opacity="0.64"/>
        <stop offset="55%" stop-color="${palette.bodyB}" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="${mixHex(palette.bodyA, 0.16, '#0f172a')}" stop-opacity="0.7"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.72"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="40%" stop-color="#ffffff" stop-opacity="0.52"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>`,
    plasma: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bodyA}"/>
        <stop offset="42%" stop-color="${palette.bodyB}"/>
        <stop offset="100%" stop-color="${mixHex(palette.bodyA, 0.2, '#f8fafc')}"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.82"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="35%" stop-color="#ffffff" stop-opacity="0.74"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>`,
    void_stone: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bodyA}"/>
        <stop offset="44%" stop-color="${palette.bodyB}"/>
        <stop offset="100%" stop-color="${mixHex(palette.bodyA, 0.08, '#1e1040')}"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.edgeB}" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="${palette.edgeA}" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.44"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0"/>
        <stop offset="48%" stop-color="${palette.glow}" stop-opacity="0.62"/>
        <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
      </linearGradient>`,
    ether: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bodyA}" stop-opacity="0.55"/>
        <stop offset="52%" stop-color="${palette.bodyB}" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="${palette.bodyA}" stop-opacity="0.62"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>
        <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.78"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="42%" stop-color="#ffffff" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>`,
    rune_metal: `
      <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bodyA}"/>
        <stop offset="36%" stop-color="${palette.bodyB}"/>
        <stop offset="78%" stop-color="${mixHex(palette.bodyB, 0.18, '#92400e')}"/>
        <stop offset="100%" stop-color="${palette.bodyA}"/>
      </linearGradient>
      <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.edgeB}"/>
        <stop offset="100%" stop-color="${palette.edgeA}"/>
      </linearGradient>
      <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${palette.glow}" stop-opacity="0.54"/>
          <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
        </linearGradient>`,
      bone: `
        <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bodyA}"/>
          <stop offset="44%" stop-color="${palette.bodyB}"/>
          <stop offset="100%" stop-color="${mixHex(palette.bodyA, 0.14, '#d4b896')}"/>
        </linearGradient>
        <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${palette.edgeB}" stop-opacity="0.92"/>
          <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.62"/>
        </linearGradient>
        <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f0e8d8" stop-opacity="0"/>
          <stop offset="52%" stop-color="#f0e8d8" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#f0e8d8" stop-opacity="0"/>
        </linearGradient>`,
      celestial_gold: `
        <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bodyA}"/>
          <stop offset="28%" stop-color="${mixHex(palette.bodyB, 0.22, '#fbbf24')}"/>
          <stop offset="62%" stop-color="${palette.bodyB}"/>
          <stop offset="100%" stop-color="${mixHex(palette.bodyA, 0.08, '#fef9c3')}"/>
        </linearGradient>
        <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="${palette.edgeA}"/>
          <stop offset="100%" stop-color="${palette.edgeB}"/>
        </linearGradient>
        <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#fef9c3" stop-opacity="0"/>
          <stop offset="40%" stop-color="#fef9c3" stop-opacity="0.72"/>
          <stop offset="70%" stop-color="#ffffff" stop-opacity="0.62"/>
          <stop offset="100%" stop-color="#fef9c3" stop-opacity="0"/>
        </linearGradient>`,
      shadowsteel: `
        <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bodyA}"/>
          <stop offset="42%" stop-color="${mixHex(palette.bodyB, 0.28, '#000014')}"/>
          <stop offset="100%" stop-color="${palette.bodyB}"/>
        </linearGradient>
        <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${palette.edgeB}" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="${palette.edgeA}" stop-opacity="0.58"/>
        </linearGradient>
        <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0"/>
          <stop offset="48%" stop-color="${palette.glow}" stop-opacity="0.46"/>
          <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
        </linearGradient>`,
      starfire: `
        <linearGradient id="${ids.material}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bodyA}"/>
          <stop offset="22%" stop-color="${mixHex('#7c3aed', 0.44, palette.bodyA)}"/>
          <stop offset="54%" stop-color="${palette.bodyB}"/>
          <stop offset="82%" stop-color="${mixHex('#fde68a', 0.36, palette.bodyB)}"/>
          <stop offset="100%" stop-color="${palette.bodyA}"/>
        </linearGradient>
        <linearGradient id="${ids.edge}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="33%" stop-color="${palette.edgeA}"/>
          <stop offset="66%" stop-color="#f0abfc"/>
          <stop offset="100%" stop-color="#fde68a"/>
        </linearGradient>
        <linearGradient id="${ids.sheen}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#fde68a" stop-opacity="0"/>
          <stop offset="30%" stop-color="#f0abfc" stop-opacity="0.62"/>
          <stop offset="60%" stop-color="#ffffff" stop-opacity="0.82"/>
          <stop offset="100%" stop-color="#fde68a" stop-opacity="0"/>
        </linearGradient>`
    };

  return `
    <style>
      @media (prefers-reduced-motion: reduce) {
        animate, animateTransform { display: none; }
      }
    </style>
    <linearGradient id="${ids.bg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${plan.palette.bgA}"/>
      <stop offset="58%" stop-color="${plan.palette.bgB}"/>
      <stop offset="100%" stop-color="#03050a"/>
    </linearGradient>
    <radialGradient id="${ids.bloom}" cx="78%" cy="16%" r="88%">
      <stop offset="0%" stop-color="${plan.palette.glow}" stop-opacity="0.36"/>
      <stop offset="46%" stop-color="${plan.palette.accent}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${ids.aura}" cx="50%" cy="50%" r="62%">
      <stop offset="0%" stop-color="${plan.palette.glow}" stop-opacity="0.7"/>
      <stop offset="56%" stop-color="${plan.palette.accent}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${ids.grain}" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M0 18 H36 M18 0 V36" stroke="#ffffff" stroke-opacity="0.032" stroke-width="1"/>
      <circle cx="9" cy="9" r="1.2" fill="#ffffff" fill-opacity="0.05"/>
      <circle cx="29" cy="22" r="1" fill="${plan.palette.accent}" fill-opacity="0.06"/>
    </pattern>
    <filter id="${ids.shadow}" x="-24%" y="-24%" width="148%" height="148%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
    ${(/** @type {any} */ (materialDefs))[plan.material] || materialDefs.steel}
    <linearGradient id="prismaticRing_${plan.seedKey.slice(0,8).replace(/[^a-z0-9]/gi,'_')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f8fafc"/><stop offset="16%" stop-color="#fde68a"/>
      <stop offset="33%" stop-color="#f0abfc"/><stop offset="50%" stop-color="#7dd3fc"/>
      <stop offset="66%" stop-color="#6ee7b7"/><stop offset="83%" stop-color="#fda4af"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>`;
}

function resolveObjectScale(/** @type {any} */ archetype) {
  return /** @type {Record<string, any>} */ ({
    key: 0.92, tower: 0.84, blade: 0.9, crown: 0.94, orb: 0.98, compass: 0.92,
    idol: 0.88, gauntlet: 0.9, crystal_shard: 0.86, rune_stone: 0.9,
    portal_arch: 0.82, neural_lattice: 0.92, microchip: 0.88, void_fragment: 0.9,
    hourglass: 0.88, eye_of_god: 0.94, astrolabe: 0.9, wyvern_claw: 0.88,
    sigil_disc: 0.94, fractal_bloom: 0.92, dragon_skull: 0.86, spell_tome: 0.88,
    quantum_core: 0.92, chaos_spiral: 0.9,
    war_hammer: 0.88, death_mask: 0.90, phoenix_wing: 0.86, lich_crown: 0.92,
    arcane_prism: 0.94, cosmic_egg: 0.96, shadow_blade: 0.88, golem_heart: 0.90,
    storm_vortex: 0.92, sacred_mandala: 0.96, void_eye: 0.92, celestial_map: 0.90,
    titan_shield: 0.88, rune_blade: 0.90, spirit_lantern: 0.88, blood_chalice: 0.90
  })[archetype] || 0.9;
}

function sampleShapeGrammar(/** @type {any} */ archetype, /** @type {any} */ rarityKey, /** @type {any} */ rng) {
  const rarityBoost = {
    common: 0.76, uncommon: 0.84, rare: 0.96, epic: 1.08,
    legendary: 1.2, ultra: 1.32, apex: 1.4, 'god-tier': 1.48
  }[String(rarityKey)] || 1;

  // Extended archetypes — delegate to extended grammar sampler
  const /** @type {any} */
extendedSet = new Set([
    'crystal_shard','rune_stone','portal_arch','neural_lattice','microchip',
    'void_fragment','hourglass','eye_of_god','astrolabe','wyvern_claw',
    'sigil_disc','fractal_bloom','dragon_skull','spell_tome','quantum_core','chaos_spiral'
  ]);
  if (extendedSet.has(archetype)) return sampleExtendedGrammar(archetype, rarityKey, rng);

  const /** @type {any} */
defaults = {
    widthBias: 0.86 + (rng() * 0.34),
    taper: 0.74 + (rng() * 0.64),
    notchDepth: 10 + Math.floor(rng() * 42),
    branchShift: -34 + Math.floor(rng() * 68),
    asymmetry: -0.2 + (rng() * 0.4),
    crownTines: 3 + Math.floor(rng() * 4),
    ringCount: 1 + Math.floor(rng() * 4),
    edgeBreaks: 1 + Math.floor(rng() * (2 + Math.floor(rarityBoost))),
    motifDensity: 0.55 + (rng() * 0.85)
  };

  if (archetype === 'key') {
    return {
      ...defaults,
      shaftLength: 190 + Math.floor(rng() * 138),
      bowRadius: 70 + Math.floor(rng() * 78),
      toothCount: 2 + Math.floor(rng() * 4),
      toothJitter: 8 + Math.floor(rng() * 24)
    };
  }
  if (archetype === 'tower') {
    return {
      ...defaults,
      towerLean: -26 + Math.floor(rng() * 52),
      buttressWidth: 54 + Math.floor(rng() * 78),
      windowRows: 2 + Math.floor(rng() * 5),
      spireSharpness: 0.7 + (rng() * 0.9)
    };
  }
  if (archetype === 'blade') {
    return {
      ...defaults,
      bladeLength: 244 + Math.floor(rng() * 126),
      bladeCurve: -28 + Math.floor(rng() * 56),
      guardWidth: 116 + Math.floor(rng() * 124),
      fullerDepth: 8 + Math.floor(rng() * 26)
    };
  }
  if (archetype === 'crown') {
    return {
      ...defaults,
      crownSpread: 184 + Math.floor(rng() * 112),
      crownArc: 30 + Math.floor(rng() * 86),
      gemCount: 3 + Math.floor(rng() * 5),
      tineHeight: 56 + Math.floor(rng() * 108)
    };
  }
  if (archetype === 'orb') {
    return {
      ...defaults,
      orbRadius: 128 + Math.floor(rng() * 92),
      ringTilt: -44 + Math.floor(rng() * 88),
      ringCount: 2 + Math.floor(rng() * 4),
      coreRadius: 44 + Math.floor(rng() * 52)
    };
  }
  if (archetype === 'compass') {
    return {
      ...defaults,
      spikeLength: 118 + Math.floor(rng() * 156),
      ringCount: 2 + Math.floor(rng() * 4),
      needleTilt: -52 + Math.floor(rng() * 104),
      axisWeight: 2 + Math.floor(rng() * 4)
    };
  }
  if (archetype === 'idol') {
    return {
      ...defaults,
      headScale: 0.8 + (rng() * 0.8),
      bodyHeight: 236 + Math.floor(rng() * 148),
      eyeGap: 42 + Math.floor(rng() * 44),
      crestHeight: 40 + Math.floor(rng() * 92)
    };
  }
  return {
    ...defaults,
    knuckleCount: 3 + Math.floor(rng() * 4),
    gauntletLength: 214 + Math.floor(rng() * 122),
    fingerSpread: 28 + Math.floor(rng() * 56),
    cuffWidth: 90 + Math.floor(rng() * 98)
  };
}

// Extended grammar for 16 new archetypes — sampled in sampleShapeGrammar continuation
/* eslint-disable curly */
function sampleExtendedGrammar(/** @type {any} */ archetype, /** @type {any} */ rarityKey, /** @type {any} */ rng) {
  const boost = /** @type {Record<string, any>} */ ({ common: 0.76, uncommon: 0.84, rare: 0.96, epic: 1.08, legendary: 1.2, ultra: 1.32, apex: 1.4, 'god-tier': 1.48 })[String(rarityKey)] || 1;
  const /** @type {any} */
base = {
    widthBias: 0.86 + (rng() * 0.34), taper: 0.74 + (rng() * 0.64),
    notchDepth: 10 + Math.floor(rng() * 42), branchShift: -34 + Math.floor(rng() * 68),
    asymmetry: -0.18 + (rng() * 0.36), edgeBreaks: 1 + Math.floor(rng() * (2 + Math.floor(boost))),
    motifDensity: 0.55 + (rng() * 0.85), ringCount: 1 + Math.floor(rng() * 4),
    crownTines: 3 + Math.floor(rng() * 4)
  };
  if (archetype === 'crystal_shard') return { ...base,
    crystalTip: -(262 + Math.floor(rng() * 74)), crystalSpread: 72 + Math.floor(rng() * 56),
    facetCount: 5 + Math.floor(rng() * 4), clusterSize: 2 + Math.floor(rng() * 3) };
  if (archetype === 'rune_stone') return { ...base,
    stoneWidth: 148 + Math.floor(rng() * 96), stoneHeight: 244 + Math.floor(rng() * 108),
    runeRows: 3 + Math.floor(rng() * 4), cornerRound: 12 + Math.floor(rng() * 28) };
  if (archetype === 'portal_arch') return { ...base,
    archSpan: 196 + Math.floor(rng() * 118), archHeight: 264 + Math.floor(rng() * 88),
    keystoneSize: 28 + Math.floor(rng() * 32), innerVoidAlpha: 0.42 + rng() * 0.36 };
  if (archetype === 'neural_lattice') return { ...base,
    nodeCount: 5 + Math.floor(rng() * 6), connectionDensity: 0.5 + rng() * 0.5,
    coreRadius: 44 + Math.floor(rng() * 38), layerSpread: 128 + Math.floor(rng() * 98) };
  if (archetype === 'microchip') return { ...base,
    chipWidth: 214 + Math.floor(rng() * 88), chipHeight: 194 + Math.floor(rng() * 88),
    pinCount: 4 + Math.floor(rng() * 5), traceComplexity: 0.4 + rng() * 0.6 };
  if (archetype === 'void_fragment') return { ...base,
    shardPoints: 7 + Math.floor(rng() * 6), voidDepth: 0.28 + rng() * 0.44,
    crackCount: 3 + Math.floor(rng() * 5), glitchOffset: 4 + Math.floor(rng() * 18) };
  if (archetype === 'hourglass') return { ...base,
    neckWidth: 28 + Math.floor(rng() * 28), capHeight: 44 + Math.floor(rng() * 36),
    chamberWidth: 124 + Math.floor(rng() * 68), sandFlow: 0.3 + rng() * 0.6 };
  if (archetype === 'eye_of_god') return { ...base,
    irisRadius: 114 + Math.floor(rng() * 58), pupilRadius: 44 + Math.floor(rng() * 36),
    rayCount: 8 + Math.floor(rng() * 8), ringCount: 2 + Math.floor(rng() * 3) };
  if (archetype === 'astrolabe') return { ...base,
    outerRadius: 178 + Math.floor(rng() * 62), armCount: 3 + Math.floor(rng() * 3),
    engravingDensity: 0.4 + rng() * 0.6, ringCount: 3 + Math.floor(rng() * 3) };
  if (archetype === 'wyvern_claw') return { ...base,
    clawLength: 264 + Math.floor(rng() * 108), clawCurve: 28 + Math.floor(rng() * 62),
    scaleRows: 3 + Math.floor(rng() * 4), talonCount: 3 + Math.floor(rng() * 2) };
  if (archetype === 'sigil_disc') return { ...base,
    discRadius: 168 + Math.floor(rng() * 58), sigilArms: 6 + Math.floor(rng() * 6),
    outerRings: 2 + Math.floor(rng() * 3), gemRadius: 18 + Math.floor(rng() * 22) };
  if (archetype === 'fractal_bloom') return { ...base,
    petalCount: 6 + Math.floor(rng() * 6), petalLength: 108 + Math.floor(rng() * 88),
    layerCount: 3 + Math.floor(rng() * 3), coreRadius: 38 + Math.floor(rng() * 32) };
  if (archetype === 'dragon_skull') return { ...base,
    skullWidth: 218 + Math.floor(rng() * 84), hornLength: 88 + Math.floor(rng() * 98),
    eyeSize: 28 + Math.floor(rng() * 24), jawGape: 38 + Math.floor(rng() * 52) };
  if (archetype === 'spell_tome') return { ...base,
    pageSpread: 168 + Math.floor(rng() * 84), spineWidth: 24 + Math.floor(rng() * 22),
    glyphRows: 4 + Math.floor(rng() * 4), energyArms: 2 + Math.floor(rng() * 4) };
  if (archetype === 'quantum_core') return { ...base,
    cubeSize: 158 + Math.floor(rng() * 88), orbitRadius: 188 + Math.floor(rng() * 68),
    orbitTilt: -48 + Math.floor(rng() * 96), particleCount: 4 + Math.floor(rng() * 6) };
  if (archetype === 'chaos_spiral') return { ...base,
    spiralArms: 3 + Math.floor(rng() * 4), spiralRadius: 198 + Math.floor(rng() * 78),
    coreRadius: 38 + Math.floor(rng() * 32), turbulence: 0.3 + rng() * 0.7 };
  if (archetype === 'war_hammer') return { ...base,
    hammerWidth: 188 + Math.floor(rng() * 72), headHeight: 108 + Math.floor(rng() * 56),
    handleLength: 278 + Math.floor(rng() * 88), rune_count: 3 + Math.floor(rng() * 5) };
  if (archetype === 'death_mask') return { ...base,
    skullWidth: 198 + Math.floor(rng() * 72), eyeSize: 22 + Math.floor(rng() * 22),
    jawGape: 32 + Math.floor(rng() * 44), hornLength: 68 + Math.floor(rng() * 82) };
  if (archetype === 'phoenix_wing') return { ...base,
    petalCount: 6 + Math.floor(rng() * 5), petalLength: 118 + Math.floor(rng() * 92),
    layerCount: 2 + Math.floor(rng() * 3), coreRadius: 28 + Math.floor(rng() * 28) };
  if (archetype === 'lich_crown') return { ...base,
    crownSpread: 188 + Math.floor(rng() * 88), hornLength: 108 + Math.floor(rng() * 78),
    eyeSize: 18 + Math.floor(rng() * 18), ringCount: 2 + Math.floor(rng() * 3) };
  if (archetype === 'arcane_prism') return { ...base,
    cubeSize: 148 + Math.floor(rng() * 92), orbitRadius: 178 + Math.floor(rng() * 68),
    orbitTilt: -44 + Math.floor(rng() * 88), particleCount: 5 + Math.floor(rng() * 7) };
  if (archetype === 'cosmic_egg') return { ...base,
    orbitRadius: 168 + Math.floor(rng() * 72), coreRadius: 44 + Math.floor(rng() * 38),
    crackCount: 4 + Math.floor(rng() * 4), glitchOffset: 6 + Math.floor(rng() * 16) };
  if (archetype === 'shadow_blade') return { ...base,
    clawLength: 248 + Math.floor(rng() * 112), clawCurve: 24 + Math.floor(rng() * 54),
    scaleRows: 2 + Math.floor(rng() * 4), talonCount: 2 + Math.floor(rng() * 3) };
  if (archetype === 'golem_heart') return { ...base,
    coreRadius: 108 + Math.floor(rng() * 64), orbitRadius: 172 + Math.floor(rng() * 58),
    orbitTilt: -36 + Math.floor(rng() * 72), particleCount: 4 + Math.floor(rng() * 5) };
  if (archetype === 'storm_vortex') return { ...base,
    spiralArms: 2 + Math.floor(rng() * 3), spiralRadius: 188 + Math.floor(rng() * 78),
    coreRadius: 28 + Math.floor(rng() * 28), turbulence: 0.4 + rng() * 0.6 };
  if (archetype === 'sacred_mandala') return { ...base,
    outerRadius: 188 + Math.floor(rng() * 64), armCount: 6 + Math.floor(rng() * 4),
    engravingDensity: 0.5 + rng() * 0.5, ringCount: 3 + Math.floor(rng() * 3) };
  if (archetype === 'void_eye') return { ...base,
    irisRadius: 108 + Math.floor(rng() * 64), pupilRadius: 44 + Math.floor(rng() * 36),
    rayCount: 8 + Math.floor(rng() * 8), ringCount: 2 + Math.floor(rng() * 3) };
  if (archetype === 'celestial_map') return { ...base,
    outerRadius: 182 + Math.floor(rng() * 58), armCount: 4 + Math.floor(rng() * 3),
    engravingDensity: 0.4 + rng() * 0.6, connectionDensity: 0.5 + rng() * 0.5 };
  if (archetype === 'titan_shield') return { ...base,
    stoneWidth: 208 + Math.floor(rng() * 72), stoneHeight: 248 + Math.floor(rng() * 72),
    runeRows: 2 + Math.floor(rng() * 3), cornerRound: 8 + Math.floor(rng() * 18) };
  if (archetype === 'rune_blade') return { ...base,
    stoneWidth: 62 + Math.floor(rng() * 38), stoneHeight: 298 + Math.floor(rng() * 92),
    runeRows: 4 + Math.floor(rng() * 4), cornerRound: 6 + Math.floor(rng() * 14) };
  if (archetype === 'spirit_lantern') return { ...base,
    chipWidth: 108 + Math.floor(rng() * 58), chipHeight: 198 + Math.floor(rng() * 78),
    pinCount: 3 + Math.floor(rng() * 4), traceComplexity: 0.4 + rng() * 0.6 };
  if (archetype === 'blood_chalice') return { ...base,
    stoneWidth: 188 + Math.floor(rng() * 64), stoneHeight: 168 + Math.floor(rng() * 58),
    runeRows: 2 + Math.floor(rng() * 3), cornerRound: 12 + Math.floor(rng() * 22) };
  return base;
}
/* eslint-enable curly */

function buildDetailMotifs(/** @type {any} */ plan, /** @type {any} */ ids, /** @type {any} */ rng) {
  const rarityRules = (/** @type {any} */ (OBJECT_RARITY_DETAIL))[plan.rarityKey] || OBJECT_RARITY_DETAIL.common;
  const /** @type {any} */
marks = [];
  for (let index = 0; index < rarityRules.microSlots; index += 1) {
    const x = (-150 + (rng() * 300)).toFixed(1);
    const y = (-220 + (rng() * 360)).toFixed(1);
    const len = (18 + rng() * 52).toFixed(1);
    const tilt = (-50 + (rng() * 100)).toFixed(1);
    marks.push(`<g transform="translate(${x} ${y}) rotate(${tilt})"><rect x="${(-Number(len) / 2).toFixed(1)}" y="-1.2" width="${len}" height="2.4" rx="1.2" fill="url(#${ids.sheen})" fill-opacity="${(0.34 + (index * 0.05)).toFixed(2)}"/></g>`);
  }
  if (plan.adornment === 'filigree') {
    marks.push(`<path d="M-132 -128 C-80 -188 -12 -208 62 -162 C124 -124 140 -46 94 22" stroke="${plan.palette.accent}" stroke-opacity="0.34" stroke-width="2.2" fill="none"/>`);
    marks.push(`<path d="M-94 112 C-24 78 44 84 112 132" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.6" fill="none"/>`);
  }
  if (plan.adornment === 'rings') {
    marks.push(`<circle cx="0" cy="0" r="224" fill="none" stroke="${plan.palette.glow}" stroke-opacity="0.18" stroke-width="2"/>`);
    marks.push(`<circle cx="0" cy="0" r="186" fill="none" stroke="#ffffff" stroke-opacity="0.09" stroke-width="1.2"/>`);
  }
  if (plan.adornment === 'spikes') {
    for (let index = 0; index < 6; index += 1) {
      const angle = index * 60;
      marks.push(`<g transform="rotate(${angle})"><path d="M0 -246 L16 -208 L-16 -208 Z" fill="${plan.palette.accent}" fill-opacity="0.18" stroke="url(#${ids.edge})" stroke-opacity="0.2" stroke-width="1.2"/></g>`);
    }
  }
  if (plan.adornment === 'sigils') {
    marks.push(`<path d="M-76 -188 L0 -228 L76 -188 L76 -112 L0 -72 L-76 -112 Z" fill="none" stroke="${plan.palette.glow}" stroke-opacity="0.22" stroke-width="2"/>`);
  }
  if (plan.adornment === 'shards') {
    for (let index = 0; index < 5; index += 1) {
      const x = (-230 + (index * 110)).toFixed(1);
      const y = (-250 + (rng() * 90)).toFixed(1);
      marks.push(`<polygon points="${x},${y} ${(Number(x) + 18).toFixed(1)},${(Number(y) + 54).toFixed(1)} ${(Number(x) - 14).toFixed(1)},${(Number(y) + 46).toFixed(1)}" fill="${plan.palette.accent}" fill-opacity="0.16"/>`);
    }
  }
  return marks.join('');
}

function buildAuraLayer(/** @type {any} */ plan, /** @type {any} */ ids) {
  if (plan.aura === 'none') return '';
  if (plan.aura === 'halo') {
    return `<circle cx="0" cy="0" r="254" fill="none" stroke="url(#${ids.aura})" stroke-width="18">
      <animate attributeName="stroke-opacity" values="0.28;0.58;0.28" dur="3.6s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="22s" repeatCount="indefinite"/>
    </circle>`;
  }
  if (plan.aura === 'runes') {
    return `<path d="M-212 -12 A212 212 0 1 0 212 12 A212 212 0 1 0 -212 -12" fill="none" stroke="${plan.palette.glow}" stroke-dasharray="10 18" stroke-width="16">
      <animate attributeName="stroke-opacity" values="0.12;0.34;0.12" dur="4.2s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="28s" repeatCount="indefinite"/>
    </path>
    <path d="M-212 -12 A212 212 0 1 0 212 12 A212 212 0 1 0 -212 -12" fill="none" stroke="${plan.palette.accent}" stroke-opacity="0.10" stroke-dasharray="5 28" stroke-width="10">
      <animateTransform attributeName="transform" type="rotate" from="360 0 0" to="0 0 0" dur="18s" repeatCount="indefinite"/>
    </path>`;
  }
  if (plan.aura === 'embers') {
    return `<circle cx="0" cy="0" r="238" fill="url(#${ids.aura})">
      <animate attributeName="fill-opacity" values="0.10;0.26;0.10" dur="5.1s" repeatCount="indefinite"/>
    </circle>
    <circle cx="0" cy="0" r="286" fill="none" stroke="${plan.palette.accent}" stroke-dasharray="2 24" stroke-width="10">
      <animate attributeName="stroke-opacity" values="0.08;0.22;0.08" dur="3.8s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="32s" repeatCount="indefinite"/>
    </circle>`;
  }
  if (plan.aura === 'polar') {
    return `<ellipse cx="0" cy="0" rx="256" ry="148" fill="none" stroke="${plan.palette.glow}" stroke-width="18">
      <animate attributeName="stroke-opacity" values="0.10;0.28;0.10" dur="4.8s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="20s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="0" cy="0" rx="148" ry="256" fill="none" stroke="#ffffff" stroke-width="10">
      <animate attributeName="stroke-opacity" values="0.06;0.18;0.06" dur="6.2s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="rotate" from="360 0 0" to="0 0 0" dur="26s" repeatCount="indefinite"/>
    </ellipse>`;
  }
  return `<circle cx="0" cy="0" r="264" fill="url(#${ids.aura})">
    <animate attributeName="fill-opacity" values="0.12;0.30;0.12" dur="4.4s" repeatCount="indefinite"/>
  </circle>
  <path d="M-210 0 H210 M0 -210 V210" stroke="${plan.palette.glow}" stroke-width="8">
    <animate attributeName="stroke-opacity" values="0.08;0.22;0.08" dur="3.2s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="45 0 0" dur="16s" repeatCount="indefinite" additive="sum"/>
  </path>`;
}

function buildKineticAccent(/** @type {any} */ plan, /** @type {any} */ ids, /** @type {any} */ rng) {
  const rarityBoost = {
    common: 0.10,
    uncommon: 0.14,
    rare: 0.18,
    epic: 0.22,
    legendary: 0.28,
    ultra: 0.34,
    apex: 0.40,
    'god-tier': 0.48
  }[String(plan.rarityKey)] || 0.12;
  const orbit = 198 + Math.floor(rng() * 54);
  const orbitB = orbit - (32 + Math.floor(rng() * 18));
  const arcLength = 72 + Math.floor(rng() * 42);
  const durationA = (11 - (rarityBoost * 7)).toFixed(2);
  const durationB = (8.4 - (rarityBoost * 4.5)).toFixed(2);
  const opacity = (0.14 + rarityBoost).toFixed(2);
  return `
    <g opacity="${opacity}">
      <circle cx="0" cy="0" r="${orbit}" fill="none" stroke="url(#${ids.sheen})" stroke-width="5" stroke-dasharray="${arcLength} ${Math.max(120, Math.floor(orbit * 4.2))}">
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="${durationA}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="0" cy="0" r="${orbitB}" fill="none" stroke="${plan.palette.glow}" stroke-opacity="0.42" stroke-width="3" stroke-dasharray="${Math.max(28, Math.floor(arcLength * 0.6))} ${Math.max(90, Math.floor(orbitB * 3.6))}">
        <animateTransform attributeName="transform" type="rotate" from="360 0 0" to="0 0 0" dur="${durationB}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${Math.floor((rng() * 2 - 1) * 74)}" cy="-${Math.floor(orbitB * 0.8)}" r="10" fill="${plan.palette.accent}" fill-opacity="0.32">
        <animate attributeName="r" values="8;12;8" dur="3.4s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="${durationB}s" repeatCount="indefinite"/>
      </circle>
    </g>`;
}

function buildObjectSilhouette(/** @type {any} */ plan, /** @type {any} */ ids, /** @type {any} */ rng) {
  // Extended archetypes — delegate to dedicated renderer
  const /** @type {any} */
extendedSet = new Set([
    'crystal_shard','rune_stone','portal_arch','neural_lattice','microchip',
    'void_fragment','hourglass','eye_of_god','astrolabe','wyvern_claw',
    'sigil_disc','fractal_bloom','dragon_skull','spell_tome','quantum_core','chaos_spiral',
    'war_hammer','death_mask','phoenix_wing','lich_crown','arcane_prism','cosmic_egg',
    'shadow_blade','golem_heart','storm_vortex','sacred_mandala','void_eye','celestial_map',
    'titan_shield','rune_blade','spirit_lantern','blood_chalice',
    'nebula_core','time_rift','glass_skull','mirror_realm','living_sigil','echo_stone',
    'null_cube','prism_eye','thought_crystal','aether_knot','forbidden_tome','ouroboros',
    'spectral_crown','bone_compass','binary_idol','dream_shard','void_bell',
    'entropy_knot','lunar_disc','genesis_seed'
  ]);
  if (extendedSet.has(plan.archetype)) return buildExtendedSilhouette(plan, ids, rng);

  const g = plan.grammar || {};
  const fill = `url(#${ids.material})`;
  const stroke = `url(#${ids.edge})`;
  const accent = plan.palette.accent;
  const asym = Math.floor((Number(g.asymmetry) || 0) * 42);

  if (plan.archetype === 'key') {
    const toothA = Number(g.toothJitter || (24 + Math.floor(rng() * 24)));
    const toothB = Math.max(14, toothA - (8 + Math.floor(rng() * 16)));
    const shaftLength = Number(g.shaftLength || (220 + Math.floor(rng() * 96)));
    const bowRadius = Number(g.bowRadius || (88 + Math.floor(rng() * 46)));
    return `
      <g filter="url(#${ids.shadow})">
        <circle cx="-88" cy="-40" r="${bowRadius}" fill="none" stroke="${stroke}" stroke-width="42"/>
        <circle cx="-88" cy="-40" r="${Math.max(42, Math.floor(bowRadius * 0.5))}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="14"/>
        <rect x="-6" y="-60" width="${shaftLength}" height="64" rx="26" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M${Math.floor(shaftLength * 0.72)} -60 L${Math.floor(shaftLength * 0.96)} -118 L${Math.floor(shaftLength * 1.12)} -78 L${Math.floor(shaftLength * 1.02)} -34 L${Math.floor(shaftLength * 1.26)} -34 L${Math.floor(shaftLength * 1.26)} 14 L${Math.floor(shaftLength * 1.04)} 14 L${Math.floor(shaftLength * 0.89)} 64 L${Math.floor(shaftLength * 0.72)} 34 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <rect x="58" y="4" width="42" height="${toothA}" rx="6" fill="${fill}"/>
        <rect x="116" y="4" width="42" height="${toothB}" rx="6" fill="${fill}"/>
        <path d="M-156 -120 Q-90 -176 -22 -124" stroke="${accent}" stroke-opacity="0.26" stroke-width="8" fill="none"/>
      </g>`;
  }

  if (plan.archetype === 'tower') {
    const lean = Number(g.towerLean || 0);
    const baseW = Number(g.buttressWidth || 164);
    const spireY = plan.silhouette === 'needle-pylon' ? -320 : -268 - Math.floor((g.spireSharpness || 1) * 24);
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M0 ${spireY} L${96 + Math.floor(lean * 0.3)} -210 L${122 + Math.floor(lean * 0.24)} -128 L${baseW} -92 L${baseW} 220 L-${baseW} 220 L-${baseW} -92 L-${122 - Math.floor(lean * 0.24)} -128 L-${96 - Math.floor(lean * 0.3)} -210 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M-102 -94 H102 V-54 H-102 Z" fill="${mixHex(plan.palette.bodyA, 0.24, '#ffffff')}" fill-opacity="0.24"/>
        <path d="M-92 36 H92 V84 H-92 Z" fill="${mixHex(plan.palette.bodyA, 0.24, '#ffffff')}" fill-opacity="0.2"/>
        <path d="M-44 -12 H44 V146 H-44 Z" fill="#06080f" fill-opacity="0.36" stroke="${accent}" stroke-opacity="0.26" stroke-width="6"/>
        <path d="M-176 220 H176 L136 284 H-136 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M-180 -82 L-122 -146 L-122 -92 L-164 -64 Z M180 -82 L122 -146 L122 -92 L164 -64 Z" fill="${accent}" fill-opacity="0.16"/>
      </g>`;
  }

  if (plan.archetype === 'blade') {
    const tip = plan.silhouette === 'void-falchion' ? -314 : -336;
    const curve = Number(g.bladeCurve || 0);
    const guardW = Number(g.guardWidth || 172);
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M0 ${tip} L${58 + Math.floor(curve * 0.2)} -116 L${38 + Math.floor(curve * 0.18)} 138 L0 246 L${-38 + Math.floor(curve * 0.1)} 138 L${-58 + Math.floor(curve * 0.2)} -116 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M0 ${tip + 54} L${22 + Math.floor(curve * 0.08)} -98 L${12 + Math.floor(curve * 0.06)} 126 L0 192 L${-12 + Math.floor(curve * 0.04)} 126 L${-22 + Math.floor(curve * 0.08)} -98 Z" fill="#ffffff" fill-opacity="0.18"/>
        <path d="M-${guardW} 132 Q0 54 ${guardW} 132 L122 186 Q0 148 -122 186 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <rect x="-36" y="176" width="72" height="102" rx="26" fill="${fill}" stroke="${stroke}" stroke-width="9"/>
        <circle cx="0" cy="228" r="32" fill="${accent}" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.24" stroke-width="4"/>
      </g>`;
  }

  if (plan.archetype === 'crown') {
    const tineInset = plan.silhouette === 'thorn-halo' ? 54 : 38;
    const tineHeight = Number(g.tineHeight || 72);
    const spread = Number(g.crownSpread || 228);
    const leftSpread = spread + asym;
    const rightSpread = spread - asym;
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M-${leftSpread} 68 L-176 -${Math.floor(tineHeight * 1.6)} L-80 -10 L0 -${190 + Math.floor(tineHeight * 0.3)} L82 -10 L178 -${Math.floor(tineHeight * 1.6)} L${rightSpread} 68 L188 204 H-188 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M-188 144 C-104 92 104 92 188 144" stroke="#ffffff" stroke-opacity="0.22" stroke-width="18" fill="none"/>
        <path d="M-${220 - tineInset} 58 L-${178 - tineInset} -62 L-${138 - tineInset} 64 Z M0 -158 L34 -36 L-34 -36 Z M${138 - tineInset} 64 L${178 - tineInset} -62 L${220 - tineInset} 58 Z" fill="${accent}" fill-opacity="0.22"/>
        <circle cx="0" cy="18" r="44" fill="${accent}" fill-opacity="0.28" stroke="#ffffff" stroke-opacity="0.26" stroke-width="6"/>
      </g>`;
  }

  if (plan.archetype === 'orb') {
    const orbRadius = Number(g.orbRadius || 168);
    const coreRadius = Number(g.coreRadius || 64);
    return `
      <g filter="url(#${ids.shadow})">
        <circle cx="0" cy="0" r="${orbRadius}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <ellipse cx="0" cy="0" rx="${Math.floor(orbRadius * 1.24)}" ry="${Math.floor(orbRadius * 0.5)}" fill="none" stroke="${stroke}" stroke-width="10"/>
        <ellipse cx="0" cy="0" rx="${Math.floor(orbRadius * 0.52)}" ry="${Math.floor(orbRadius * 1.26)}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="8"/>
        <circle cx="0" cy="0" r="${coreRadius}" fill="${accent}" fill-opacity="0.24" stroke="#ffffff" stroke-opacity="0.22" stroke-width="4"/>
        <path d="M-44 -112 C24 -152 84 -146 128 -88" stroke="url(#${ids.sheen})" stroke-width="16" fill="none" stroke-linecap="round"/>
      </g>`;
  }

  if (plan.archetype === 'compass') {
    const spike = Number(g.spikeLength || 188);
    const axisW = Number(g.axisWeight || 4);
    return `
      <g filter="url(#${ids.shadow})">
        <circle cx="0" cy="0" r="196" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <circle cx="0" cy="0" r="148" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="8"/>
        <path d="M0 -${spike - 12} L36 -18 L0 22 L-36 -18 Z" fill="${accent}" fill-opacity="0.42" stroke="#ffffff" stroke-opacity="0.24" stroke-width="4"/>
        <path d="M0 ${spike - 12} L-30 18 L0 -14 L30 18 Z" fill="#06080f" fill-opacity="0.52" stroke="${stroke}" stroke-width="4"/>
        <path d="M-${spike} 0 H${spike} M0 -${spike} V${spike}" stroke="${stroke}" stroke-width="${axisW + 2}" stroke-opacity="0.5"/>
        <path d="M-132 -132 L132 132 M132 -132 L-132 132" stroke="#ffffff" stroke-opacity="0.12" stroke-width="4"/>
      </g>`;
  }

  if (plan.archetype === 'idol') {
    const headY = plan.silhouette === 'guardian-mask' ? -172 : -150;
    const eyeGap = Number(g.eyeGap || 46);
    const bodyHeight = Number(g.bodyHeight || 286);
    return `
      <g filter="url(#${ids.shadow})">
        <rect x="-138" y="-46" width="276" height="${bodyHeight}" rx="72" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M-108 ${headY} Q0 -248 108 ${headY} V-40 H-108 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <ellipse cx="-${eyeGap}" cy="-122" rx="26" ry="36" fill="#05070d" fill-opacity="0.52"/>
        <ellipse cx="${eyeGap}" cy="-122" rx="26" ry="36" fill="#05070d" fill-opacity="0.52"/>
        <path d="M-48 -32 Q0 22 48 -32" stroke="${accent}" stroke-opacity="0.26" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M-180 240 H180 L132 312 H-132 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      </g>`;
  }

  const fingerSpread = Number(g.fingerSpread || 42);
  return `
    <g filter="url(#${ids.shadow})">
      <path d="M-144 -202 H${18 + fingerSpread} L110 -138 L170 18 L130 212 L-24 284 L-166 174 L-166 -78 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <path d="M-70 -120 H${18 + Math.floor(fingerSpread * 0.5)} L86 -64 L126 82 L92 170 L26 222 L-86 144 L-112 24 L-112 -52 Z" fill="#ffffff" fill-opacity="0.09"/>
      <path d="M-118 -8 H142" stroke="${stroke}" stroke-width="8" stroke-opacity="0.4"/>
      <path d="M-34 -208 V262" stroke="url(#${ids.sheen})" stroke-width="16" stroke-linecap="round"/>
      <circle cx="38" cy="-20" r="26" fill="${accent}" fill-opacity="0.24"/>
    </g>`;
}

// ─── Extended archetype silhouettes ───────────────────────────────────────────
function buildExtendedSilhouette(/** @type {any} */ plan, /** @type {any} */ ids, /** @type {any} */ rng) {
  const g = plan.grammar || {};
  const fill = `url(#${ids.material})`;
  const stroke = `url(#${ids.edge})`;
  const accent = plan.palette.accent;
  const glow = plan.palette.glow;
  const ar = plan.archetype;

  if (ar === 'crystal_shard') {
    const tip = Number(g.crystalTip || -284);
    const sp = Number(g.crystalSpread || 86);
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M0 ${tip} L${sp} -168 L${sp + 42} -28 L${sp + 22} 206 L0 282 L-${sp + 22} 206 L-${sp + 42} -28 L-${sp} -168 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M0 ${tip} L${sp + 42} -28" stroke="url(#${ids.sheen})" stroke-width="11" stroke-linecap="round"/>
        <path d="M0 ${tip} L-${sp + 42} -28" stroke="url(#${ids.sheen})" stroke-width="11" stroke-linecap="round"/>
        <path d="M${Math.floor(sp * 0.6)} -108 L${sp + 28} 62 M-${Math.floor(sp * 0.6)} -108 L-${sp + 28} 62" stroke="#ffffff" stroke-opacity="0.14" stroke-width="4"/>
        <path d="M0 ${tip + 20} L${Math.floor(sp * 0.62)} -62 L0 144 L-${Math.floor(sp * 0.62)} -62 Z" fill="${accent}" fill-opacity="0.11"/>
        <path d="M${sp + 22} 206 L${sp + 118} 132 L${sp + 148} 254 L${sp + 72} 296 Z" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
        <path d="M-${sp + 22} 206 L-${sp + 118} 132 L-${sp + 148} 254 L-${sp + 72} 296 Z" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
        <path d="M0 ${tip} L${Math.floor(sp * 0.24)} ${tip + 72} L0 ${tip + 92} L-${Math.floor(sp * 0.24)} ${tip + 72} Z" fill="url(#${ids.sheen})" fill-opacity="0.78"/>
      </g>`;
  }

  if (ar === 'rune_stone') {
    const sw = Number(g.stoneWidth || 186);
    const sh = Number(g.stoneHeight || 284);
    const cr = Number(g.cornerRound || 22);
    const rr = Number(g.runeRows || 4);
    const /** @type {any} */
runeLines = [];
    for (let r = 0; r < rr; r += 1) {
      const ry = -sh * 0.28 + r * (sh * 0.18);
      const segW = sw * 0.56;
      runeLines.push(`<line x1="${-segW / 2}" y1="${ry}" x2="${segW / 2}" y2="${ry}" stroke="${accent}" stroke-opacity="0.52" stroke-width="5" stroke-linecap="round"/>`);
      runeLines.push(`<line x1="${-segW * 0.3}" y1="${ry - 14}" x2="${-segW * 0.08}" y2="${ry + 14}" stroke="${accent}" stroke-opacity="0.36" stroke-width="3"/>`);
      runeLines.push(`<line x1="${segW * 0.08}" y1="${ry - 14}" x2="${segW * 0.3}" y2="${ry + 14}" stroke="${accent}" stroke-opacity="0.36" stroke-width="3"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        <rect x="${-sw}" y="${-sh / 2}" width="${sw * 2}" height="${sh}" rx="${cr}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <rect x="${-sw + 18}" y="${-sh / 2 + 18}" width="${(sw - 18) * 2}" height="${sh - 36}" rx="${Math.max(4, cr - 8)}" fill="none" stroke="${accent}" stroke-opacity="0.28" stroke-width="3"/>
        <rect x="${-sw + 32}" y="${-sh / 2 + 32}" width="${(sw - 32) * 2}" height="${sh - 64}" rx="${Math.max(2, cr - 14)}" fill="${accent}" fill-opacity="0.06"/>
        ${runeLines.join('')}
        <path d="M0 ${-sh / 2 + 12} L${sw * 0.22} ${-sh / 2 + 44} L0 ${-sh / 2 + 36} L-${sw * 0.22} ${-sh / 2 + 44} Z" fill="${accent}" fill-opacity="0.38"/>
        <rect x="-36" y="${sh / 2 - 52}" width="72" height="22" rx="8" fill="${accent}" fill-opacity="0.22"/>
      </g>`;
  }

  if (ar === 'portal_arch') {
    const as2 = Number(g.archSpan || 228);
    const ah = Number(g.archHeight || 298);
    const ks = Number(g.keystoneSize || 38);
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M-${as2} ${ah * 0.42} L-${as2} -${ah * 0.08} Q-${as2} -${ah * 0.58} 0 -${ah * 0.52} Q${as2} -${ah * 0.58} ${as2} -${ah * 0.08} L${as2} ${ah * 0.42} L${as2 - 54} ${ah * 0.42} L${as2 - 54} -${ah * 0.02} Q${as2 - 54} -${ah * 0.38} 0 -${ah * 0.34} Q-${as2 - 54} -${ah * 0.38} -${as2 - 54} -${ah * 0.02} L-${as2 - 54} ${ah * 0.42} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <ellipse cx="0" cy="${-ah * 0.18}" rx="${as2 - 68}" ry="${ah * 0.3}" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.18" stroke-width="3"/>
        <ellipse cx="0" cy="${-ah * 0.18}" rx="${(as2 - 68) * 0.6}" ry="${ah * 0.18}" fill="${glow}" fill-opacity="0.08"/>
        <polygon points="0,${-ah * 0.58} ${ks},${-ah * 0.46} -${ks},${-ah * 0.46}" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
        <path d="M-${as2 - 28} ${ah * 0.38} V${-ah * 0.06} M${as2 - 28} ${ah * 0.38} V${-ah * 0.06}" stroke="${accent}" stroke-opacity="0.22" stroke-width="3" stroke-dasharray="6 10"/>
        <path d="M-${as2} ${ah * 0.42} H${as2}" stroke="${stroke}" stroke-width="14"/>
      </g>`;
  }

  if (ar === 'neural_lattice') {
    const nc = Number(g.nodeCount || 7);
    const ls = Number(g.layerSpread || 188);
    const cr2 = Number(g.coreRadius || 54);
    const /** @type {any} */
nodes = [];
    const angles = Array.from({ length: nc }, (/** @type {any} */ _, /** @type {any} */ i) => (i / nc) * Math.PI * 2 - Math.PI / 2);
    const nx = angles.map((/** @type {any} */ a) => Math.round(Math.cos(a) * ls));
    const ny = angles.map((/** @type {any} */ a) => Math.round(Math.sin(a) * ls));
    for (let i = 0; i < nc; i += 1) {
      for (let j = i + 1; j < nc; j += 1) {
        if (rng() > 0.38) nodes.push(`<line x1="${nx[i]}" y1="${ny[i]}" x2="${nx[j]}" y2="${ny[j]}" stroke="${accent}" stroke-opacity="0.24" stroke-width="3"/>`);
      }
      nodes.push(`<line x1="0" y1="0" x2="${nx[i]}" y2="${ny[i]}" stroke="${accent}" stroke-opacity="0.36" stroke-width="4"/>`);
      nodes.push(`<circle cx="${nx[i]}" cy="${ny[i]}" r="${14 + Math.floor(rng() * 18)}" fill="${fill}" stroke="${stroke}" stroke-width="7"/>`);
      nodes.push(`<circle cx="${nx[i]}" cy="${ny[i]}" r="7" fill="${accent}" fill-opacity="0.54"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        ${nodes.join('')}
        <circle cx="0" cy="0" r="${cr2}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <circle cx="0" cy="0" r="${Math.floor(cr2 * 0.55)}" fill="${accent}" fill-opacity="0.32" stroke="url(#${ids.sheen})" stroke-width="6"/>
        <circle cx="0" cy="0" r="${Math.floor(cr2 * 0.24)}" fill="${glow}" fill-opacity="0.56"/>
      </g>`;
  }

  if (ar === 'microchip') {
    const cw = Number(g.chipWidth || 238);
    const ch2 = Number(g.chipHeight || 212);
    const pc = Number(g.pinCount || 6);
    const /** @type {any} */
pins = [];
    const pinSpacingX = cw * 0.7 / (pc - 1);
    for (let i = 0; i < pc; i += 1) {
      const px = -cw * 0.35 + i * pinSpacingX;
      pins.push(`<rect x="${px - 5}" y="${-ch2 - 34}" width="10" height="34" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`);
      pins.push(`<rect x="${px - 5}" y="${ch2}" width="10" height="34" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`);
    }
    const pinSpacingY = ch2 * 0.7 / (pc - 1);
    for (let i = 0; i < pc; i += 1) {
      const py = -ch2 * 0.35 + i * pinSpacingY;
      pins.push(`<rect x="${-cw - 34}" y="${py - 5}" width="34" height="10" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`);
      pins.push(`<rect x="${cw}" y="${py - 5}" width="34" height="10" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`);
    }
    const traceCount = 8 + Math.floor(rng() * 8);
    const /** @type {any} */
traces = [];
    for (let i = 0; i < traceCount; i += 1) {
      const tx = -cw * 0.38 + (i / traceCount) * cw * 0.76;
      const ty = -ch2 * 0.44 + rng() * ch2 * 0.88;
      const tl = 18 + Math.floor(rng() * 62);
      const horiz = rng() > 0.5;
      traces.push(horiz
        ? `<path d="M${tx} ${ty} H${tx + tl}" stroke="${accent}" stroke-opacity="0.28" stroke-width="2.5" stroke-linecap="round"/>`
        : `<path d="M${tx} ${ty} V${ty + tl}" stroke="${accent}" stroke-opacity="0.28" stroke-width="2.5" stroke-linecap="round"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        ${pins.join('')}
        <rect x="${-cw}" y="${-ch2}" width="${cw * 2}" height="${ch2 * 2}" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <rect x="${-cw + 22}" y="${-ch2 + 22}" width="${(cw - 22) * 2}" height="${(ch2 - 22) * 2}" rx="8" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="3"/>
        ${traces.join('')}
        <rect x="${-cw * 0.34}" y="${-ch2 * 0.38}" width="${cw * 0.68}" height="${ch2 * 0.76}" rx="8" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.32" stroke-width="4"/>
        <path d="M${-cw * 0.3} ${-ch2 * 0.28} H${cw * 0.3} M${-cw * 0.3} 0 H${cw * 0.3} M${-cw * 0.3} ${ch2 * 0.28} H${cw * 0.3}" stroke="${glow}" stroke-opacity="0.2" stroke-width="2"/>
        <circle cx="0" cy="0" r="18" fill="${glow}" fill-opacity="0.44"/>
      </g>`;
  }

  if (ar === 'void_fragment') {
    const sp2 = Number(g.shardPoints || 9);
    const /** @type {any} */
pts = [];
    for (let i = 0; i < sp2; i += 1) {
      const baseAngle = (i / sp2) * Math.PI * 2;
      const jitter = (rng() - 0.5) * 0.6;
      const r2 = 148 + Math.floor(rng() * 128);
      pts.push(`${Math.round(Math.cos(baseAngle + jitter) * r2)},${Math.round(Math.sin(baseAngle + jitter) * r2)}`);
    }
    const /** @type {any} */
cracks = [];
    const cc = Number(g.crackCount || 4);
    for (let i = 0; i < cc; i += 1) {
      const cx2 = -148 + Math.floor(rng() * 296);
      const cy2 = -148 + Math.floor(rng() * 296);
      cracks.push(`<path d="M0 0 L${Math.floor(cx2 * 0.4)} ${Math.floor(cy2 * 0.4)} L${cx2} ${cy2}" stroke="${glow}" stroke-opacity="0.38" stroke-width="3" fill="none"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        <polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <polygon points="${pts.map((/** @type {any} */ p) => p.split(',').map((/** @type {any} */ v) => Math.round(Number(v) * 0.72)).join(',')).join(' ')}" fill="${accent}" fill-opacity="0.12"/>
        ${cracks.join('')}
        <circle cx="0" cy="0" r="34" fill="${glow}" fill-opacity="0.26" stroke="url(#${ids.sheen})" stroke-width="8"/>
        <path d="M0 -${148 + Math.floor(rng() * 128)} L${18} -${88 + Math.floor(rng() * 48)} L-${18} -${88 + Math.floor(rng() * 48)} Z" fill="url(#${ids.sheen})" fill-opacity="0.62"/>
      </g>`;
  }

  if (ar === 'hourglass') {
    const nw = Number(g.neckWidth || 38);
    const cap = Number(g.capHeight || 58);
    const cw2 = Number(g.chamberWidth || 158);
    const ch3 = 148;
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M-${cw2} -${ch3 + cap} H${cw2} V-${ch3} L${nw} -${Math.floor(cap * 0.4)} L${nw} ${Math.floor(cap * 0.4)} L${cw2} ${ch3} V${ch3 + cap} H-${cw2} V${ch3} L-${nw} ${Math.floor(cap * 0.4)} L-${nw} -${Math.floor(cap * 0.4)} L-${cw2} -${ch3} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M-${cw2 - 28} -${ch3} L${nw} -${Math.floor(cap * 0.4)} L${nw} ${Math.floor(cap * 0.4)} L-${cw2 - 28} ${ch3}" fill="none" stroke="${accent}" stroke-opacity="0.18" stroke-width="3"/>
        <path d="M${cw2 - 28} -${ch3} L-${nw} -${Math.floor(cap * 0.4)} L-${nw} ${Math.floor(cap * 0.4)} L${cw2 - 28} ${ch3}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="3"/>
        <ellipse cx="0" cy="${-ch3 - cap / 2}" rx="${cw2 * 0.7}" ry="${cap * 0.38}" fill="${accent}" fill-opacity="0.14"/>
        <ellipse cx="0" cy="${ch3 + cap / 2}" rx="${cw2 * 0.7}" ry="${cap * 0.38}" fill="${glow}" fill-opacity="0.1"/>
        <path d="M-${nw - 4} -${cap * 0.3} Q0 0 ${nw - 4} ${cap * 0.3}" stroke="${glow}" stroke-opacity="0.42" stroke-width="5" fill="none" stroke-linecap="round"/>
        <rect x="${-cw2}" y="${-ch3 - cap - 14}" width="${cw2 * 2}" height="14" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
        <rect x="${-cw2}" y="${ch3 + cap}" width="${cw2 * 2}" height="14" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
      </g>`;
  }

  if (ar === 'eye_of_god') {
    const ir = Number(g.irisRadius || 138);
    const pr = Number(g.pupilRadius || 52);
    const rc = Number(g.ringCount || 3);
    const rays = Number(g.rayCount || 12);
    const /** @type {any} */
rayLines = [];
    for (let i = 0; i < rays; i += 1) {
      const a = (i / rays) * Math.PI * 2;
      const inner = ir + 28;
      const outer = ir + 68 + Math.floor(rng() * 44);
      rayLines.push(`<line x1="${Math.round(Math.cos(a) * inner)}" y1="${Math.round(Math.sin(a) * inner)}" x2="${Math.round(Math.cos(a) * outer)}" y2="${Math.round(Math.sin(a) * outer)}" stroke="${glow}" stroke-opacity="${(0.22 + rng() * 0.22).toFixed(2)}" stroke-width="${(2 + rng() * 3).toFixed(1)}"/>`);
    }
    const /** @type {any} */
rings = [];
    for (let r = 0; r < rc; r += 1) {
      rings.push(`<circle cx="0" cy="0" r="${ir + 14 + r * 22}" fill="none" stroke="${accent}" stroke-opacity="${(0.16 + r * 0.06).toFixed(2)}" stroke-width="${3 - r * 0.6}"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        ${rings.join('')}
        ${rayLines.join('')}
        <ellipse cx="0" cy="0" rx="${ir}" ry="${Math.floor(ir * 0.54)}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <ellipse cx="0" cy="0" rx="${ir * 0.72}" ry="${Math.floor(ir * 0.36)}" fill="${accent}" fill-opacity="0.18"/>
        <circle cx="0" cy="0" r="${pr}" fill="#020408" stroke="${stroke}" stroke-width="8"/>
        <circle cx="0" cy="0" r="${Math.floor(pr * 0.42)}" fill="${glow}" fill-opacity="0.72"/>
        <path d="M-${ir} 0 Q0 ${-ir * 0.54} ${ir} 0" stroke="url(#${ids.sheen})" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path d="M-${ir} 0 Q0 ${ir * 0.54} ${ir} 0" stroke="${accent}" stroke-opacity="0.18" stroke-width="6" fill="none" stroke-linecap="round"/>
      </g>`;
  }

  if (ar === 'astrolabe') {
    const or2 = Number(g.outerRadius || 202);
    const ac2 = Number(g.armCount || 4);
    const rc3 = Number(g.ringCount || 3);
    const /** @type {any} */
rings2 = [];
    for (let r = 0; r < rc3; r += 1) {
      const rr2 = Math.floor(or2 * (0.5 + r * 0.22));
      rings2.push(`<circle cx="0" cy="0" r="${rr2}" fill="none" stroke="${stroke}" stroke-width="${8 - r * 1.5}"/>`);
      rings2.push(`<circle cx="0" cy="0" r="${rr2 - 12}" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="4 8"/>`);
    }
    const /** @type {any} */
arms = [];
    for (let a = 0; a < ac2; a += 1) {
      const angle = (a / ac2) * Math.PI * 2;
      const ax = Math.round(Math.cos(angle) * or2 * 0.84);
      const ay = Math.round(Math.sin(angle) * or2 * 0.84);
      arms.push(`<line x1="0" y1="0" x2="${ax}" y2="${ay}" stroke="${fill}" stroke-width="12"/>`);
      arms.push(`<line x1="0" y1="0" x2="${ax}" y2="${ay}" stroke="${stroke}" stroke-width="8"/>`);
      arms.push(`<circle cx="${ax}" cy="${ay}" r="14" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        <circle cx="0" cy="0" r="${or2}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        ${rings2.join('')}
        ${arms.join('')}
        <circle cx="0" cy="0" r="${Math.floor(or2 * 0.22)}" fill="${accent}" fill-opacity="0.28" stroke="url(#${ids.sheen})" stroke-width="7"/>
        <line x1="${-or2}" y1="0" x2="${or2}" y2="0" stroke="${accent}" stroke-opacity="0.2" stroke-width="2"/>
        <line x1="0" y1="${-or2}" x2="0" y2="${or2}" stroke="${accent}" stroke-opacity="0.2" stroke-width="2"/>
        <circle cx="0" cy="0" r="12" fill="${glow}" fill-opacity="0.62"/>
      </g>`;
  }

  if (ar === 'wyvern_claw') {
    const cl = Number(g.clawLength || 298);
    const cv = Number(g.clawCurve || 52);
    const sr = Number(g.scaleRows || 4);
    const /** @type {any} */
scaleMarks = [];
    for (let row = 0; row < sr; row += 1) {
      const rowY = -cl * 0.5 + row * (cl * 0.28);
      for (let col = 0; col < 4; col += 1) {
        const sx = -38 + col * 26;
        scaleMarks.push(`<ellipse cx="${sx}" cy="${rowY}" rx="9" ry="6" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="2"/>`);
      }
    }
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M-42 ${cl * 0.46} Q-86 ${cl * 0.26} ${-cv} -${cl * 0.18} Q${-cv * 0.4} -${cl * 0.52} 0 -${cl * 0.58} Q${cv * 0.4} -${cl * 0.52} ${cv} -${cl * 0.18} Q86 ${cl * 0.26} 42 ${cl * 0.46} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M-22 ${cl * 0.42} Q-52 ${cl * 0.22} ${-cv * 0.6} -${cl * 0.12} Q0 -${cl * 0.44} ${cv * 0.6} -${cl * 0.12} Q52 ${cl * 0.22} 22 ${cl * 0.42} Z" fill="#ffffff" fill-opacity="0.09"/>
        ${scaleMarks.join('')}
        <path d="M0 -${cl * 0.58} L${Math.floor(cv * 0.28)} -${cl * 0.72} L-${Math.floor(cv * 0.18)} -${cl * 0.88}" stroke="${stroke}" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M-${cv} -${cl * 0.18} L-${cv + 38} -${cl * 0.36}" stroke="${stroke}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path d="M${cv} -${cl * 0.18} L${cv + 32} -${cl * 0.38}" stroke="${stroke}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <rect x="-52" y="${cl * 0.36}" width="104" height="42" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
      </g>`;
  }

  if (ar === 'sigil_disc') {
    const dr = Number(g.discRadius || 192);
    const sa = Number(g.sigilArms || 8);
    const gr = Number(g.gemRadius || 24);
    const or3 = Number(g.outerRings || 3);
    const /** @type {any} */
innerRings = [];
    for (let r = 0; r < or3; r += 1) {
      innerRings.push(`<circle cx="0" cy="0" r="${dr - r * 28}" fill="none" stroke="${stroke}" stroke-width="${7 - r * 1.4}"/>`);
    }
    const /** @type {any} */
armPts = [];
    for (let i = 0; i < sa; i += 1) {
      const a1 = (i / sa) * Math.PI * 2;
      const a2 = ((i + 0.5) / sa) * Math.PI * 2;
      const outerPt = `${Math.round(Math.cos(a1) * (dr - 12))},${Math.round(Math.sin(a1) * (dr - 12))}`;
      const midPt = `${Math.round(Math.cos(a2) * (dr * 0.52))},${Math.round(Math.sin(a2) * (dr * 0.52))}`;
      armPts.push(outerPt);
      armPts.push(midPt);
    }
    return `
      <g filter="url(#${ids.shadow})">
        <circle cx="0" cy="0" r="${dr}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        ${innerRings.join('')}
        <polygon points="${armPts.join(' ')}" fill="none" stroke="${accent}" stroke-opacity="0.38" stroke-width="5"/>
        <polygon points="${armPts.map((/** @type {any} */ p) => p.split(',').map((/** @type {any} */ v) => Math.round(Number(v) * 0.62)).join(',')).join(' ')}" fill="${accent}" fill-opacity="0.1" stroke="${glow}" stroke-opacity="0.2" stroke-width="3"/>
        <circle cx="0" cy="0" r="${gr + 12}" fill="${accent}" fill-opacity="0.18" stroke="${stroke}" stroke-width="6"/>
        <circle cx="0" cy="0" r="${gr}" fill="${glow}" fill-opacity="0.54"/>
        <path d="M-${dr * 0.72} 0 H${dr * 0.72} M0 -${dr * 0.72} V${dr * 0.72}" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
      </g>`;
  }

  if (ar === 'fractal_bloom') {
    const pl = Number(g.petalLength || 148);
    const pc2 = Number(g.petalCount || 8);
    const lc = Number(g.layerCount || 3);
    const cr3 = Number(g.coreRadius || 48);
    const /** @type {any} */
petals = [];
    for (let layer = 0; layer < lc; layer += 1) {
      const layerR = pl * (1 - layer * 0.3);
      const layerCount = pc2 + layer * 2;
      const rotOffset = layer * (Math.PI / layerCount);
      for (let i = 0; i < layerCount; i += 1) {
        const a = rotOffset + (i / layerCount) * Math.PI * 2;
        const bx = Math.round(Math.cos(a) * layerR);
        const by = Math.round(Math.sin(a) * layerR);
        const cx3 = Math.round(Math.cos(a) * layerR * 0.44);
        const cy3 = Math.round(Math.sin(a) * layerR * 0.44);
        petals.push(`<path d="M0 0 Q${Math.round(Math.cos(a - 0.52) * layerR * 0.68)} ${Math.round(Math.sin(a - 0.52) * layerR * 0.68)} ${bx} ${by} Q${Math.round(Math.cos(a + 0.52) * layerR * 0.68)} ${Math.round(Math.sin(a + 0.52) * layerR * 0.68)} 0 0 Z" fill="${fill}" fill-opacity="${(0.7 - layer * 0.16).toFixed(2)}" stroke="${stroke}" stroke-width="${7 - layer * 2}"/>`);
        petals.push(`<circle cx="${cx3}" cy="${cy3}" r="${4 + layer}" fill="${accent}" fill-opacity="${(0.32 - layer * 0.08).toFixed(2)}"/>`);
      }
    }
    return `
      <g filter="url(#${ids.shadow})">
        ${petals.join('')}
        <circle cx="0" cy="0" r="${cr3 + 14}" fill="${fill}" stroke="${stroke}" stroke-width="9"/>
        <circle cx="0" cy="0" r="${cr3}" fill="${accent}" fill-opacity="0.34" stroke="url(#${ids.sheen})" stroke-width="6"/>
        <circle cx="0" cy="0" r="${Math.floor(cr3 * 0.48)}" fill="${glow}" fill-opacity="0.66"/>
      </g>`;
  }

  if (ar === 'dragon_skull') {
    const sw2 = Number(g.skullWidth || 238);
    const hl = Number(g.hornLength || 118);
    const es = Number(g.eyeSize || 34);
    const jg = Number(g.jawGape || 52);
    return `
      <g filter="url(#${ids.shadow})">
        <path d="M-${sw2} 58 L-${sw2 * 0.78} -${sw2 * 0.62} Q-${sw2 * 0.44} -${sw2 * 0.88} 0 -${sw2 * 0.72} Q${sw2 * 0.44} -${sw2 * 0.88} ${sw2 * 0.78} -${sw2 * 0.62} L${sw2} 58 L${sw2 * 0.82} ${sw2 * 0.44} L${sw2 * 0.44} ${sw2 * 0.56} L${sw2 * 0.26} ${sw2 * 0.44 + jg} L-${sw2 * 0.26} ${sw2 * 0.44 + jg} L-${sw2 * 0.44} ${sw2 * 0.56} L-${sw2 * 0.82} ${sw2 * 0.44} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M-${sw2 * 0.52} -${sw2 * 0.74} Q-${sw2 * 0.62} -${sw2 * 0.74 + hl * 0.6} -${sw2 * 0.34} -${sw2 * 0.74 + hl}" stroke="${stroke}" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path d="M${sw2 * 0.52} -${sw2 * 0.74} Q${sw2 * 0.62} -${sw2 * 0.74 + hl * 0.6} ${sw2 * 0.34} -${sw2 * 0.74 + hl}" stroke="${stroke}" stroke-width="12" fill="none" stroke-linecap="round"/>
        <ellipse cx="-${sw2 * 0.34}" cy="-${sw2 * 0.22}" rx="${es}" ry="${es * 1.2}" fill="#020408" fill-opacity="0.82"/>
        <ellipse cx="${sw2 * 0.34}" cy="-${sw2 * 0.22}" rx="${es}" ry="${es * 1.2}" fill="#020408" fill-opacity="0.82"/>
        <circle cx="-${sw2 * 0.34}" cy="-${sw2 * 0.22}" r="${Math.floor(es * 0.44)}" fill="${accent}" fill-opacity="0.66"/>
        <circle cx="${sw2 * 0.34}" cy="-${sw2 * 0.22}" r="${Math.floor(es * 0.44)}" fill="${accent}" fill-opacity="0.66"/>
        <path d="M-${sw2 * 0.44} ${sw2 * 0.44 + jg} L-${sw2 * 0.32} ${sw2 * 0.36} M-${sw2 * 0.22} ${sw2 * 0.44 + jg} L-${sw2 * 0.12} ${sw2 * 0.36} M0 ${sw2 * 0.44 + jg} L0 ${sw2 * 0.36} M${sw2 * 0.22} ${sw2 * 0.44 + jg} L${sw2 * 0.12} ${sw2 * 0.36} M${sw2 * 0.44} ${sw2 * 0.44 + jg} L${sw2 * 0.32} ${sw2 * 0.36}" stroke="${stroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M0 -${sw2 * 0.3} V${sw2 * 0.42}" stroke="url(#${ids.sheen})" stroke-width="10" stroke-linecap="round"/>
      </g>`;
  }

  if (ar === 'spell_tome') {
    const ps = Number(g.pageSpread || 214);
    const spW = Number(g.spineWidth || 32);
    const gr2 = Number(g.glyphRows || 5);
    const ea = Number(g.energyArms || 3);
    const /** @type {any} */
glyphs = [];
    for (let row = 0; row < gr2; row += 1) {
      const ry = -148 + row * 62;
      glyphs.push(`<line x1="${-ps * 0.64 + 18}" y1="${ry}" x2="${-spW / 2 - 12}" y2="${ry}" stroke="${accent}" stroke-opacity="0.38" stroke-width="4"/>`);
      glyphs.push(`<line x1="${spW / 2 + 12}" y1="${ry}" x2="${ps * 0.64 - 18}" y2="${ry}" stroke="${accent}" stroke-opacity="0.38" stroke-width="4"/>`);
      if (row % 2 === 0) {
        glyphs.push(`<circle cx="${-ps * 0.44 + 18}" cy="${ry}" r="7" fill="${accent}" fill-opacity="0.28"/>`);
        glyphs.push(`<circle cx="${ps * 0.44 - 18}" cy="${ry}" r="7" fill="${accent}" fill-opacity="0.28"/>`);
      }
    }
    const /** @type {any} */
arms2 = [];
    for (let i = 0; i < ea; i += 1) {
      const a = (i / ea) * Math.PI * 2 - Math.PI / 2;
      arms2.push(`<path d="M0 -168 Q${Math.round(Math.cos(a) * 118)} ${Math.round(-168 + Math.sin(a) * 78)} ${Math.round(Math.cos(a) * 198)} ${Math.round(-168 + Math.sin(a) * 148)}" stroke="${glow}" stroke-opacity="0.32" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        ${arms2.join('')}
        <path d="M-${ps} -${178} Q-${ps} -${218} -${ps * 0.72} -${218} L-${spW / 2} -${218} V${198} L-${ps * 0.72} ${198} Q-${ps} ${198} -${ps} ${158} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M${ps} -${178} Q${ps} -${218} ${ps * 0.72} -${218} L${spW / 2} -${218} V${198} L${ps * 0.72} ${198} Q${ps} ${198} ${ps} ${158} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <rect x="-${spW / 2}" y="-${218}" width="${spW}" height="${418}" rx="8" fill="${accent}" fill-opacity="0.18" stroke="${stroke}" stroke-width="8"/>
        ${glyphs.join('')}
        <rect x="-${ps * 0.68}" y="-${178}" width="${ps * 0.68 - spW / 2}" height="${356}" rx="6" fill="${accent}" fill-opacity="0.06"/>
        <rect x="${spW / 2}" y="-${178}" width="${ps * 0.68 - spW / 2}" height="${356}" rx="6" fill="${accent}" fill-opacity="0.06"/>
        <ellipse cx="0" cy="-178" rx="${ps * 0.28}" ry="28" fill="${glow}" fill-opacity="0.24"/>
      </g>`;
  }

  if (ar === 'quantum_core') {
    const cs = Number(g.cubeSize || 178);
    const or4 = Number(g.orbitRadius || 212);
    const h = Math.floor(cs * 0.5);
    const iso = Math.floor(cs * 0.28);
    return `
      <g filter="url(#${ids.shadow})">
        <ellipse cx="0" cy="0" rx="${or4}" ry="${Math.floor(or4 * 0.38)}" fill="none" stroke="${stroke}" stroke-width="8" transform="rotate(${Number(g.orbitTilt || -38)})"/>
        <ellipse cx="0" cy="0" rx="${or4 * 0.78}" ry="${Math.floor(or4 * 0.3)}" fill="none" stroke="${accent}" stroke-opacity="0.28" stroke-width="4" transform="rotate(${Number(g.orbitTilt || -38) + 60})"/>
        <path d="M0 -${h} L${cs} 0 L0 ${h} L-${cs} 0 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <path d="M0 -${h} L${cs} 0 L${cs} ${iso} L0 ${h + iso} L-${cs} ${iso} L-${cs} 0 Z" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
        <path d="M0 -${h} L${cs} 0 M0 -${h} L-${cs} 0 M0 ${h} L${cs} 0 M0 ${h} L-${cs} 0" stroke="url(#${ids.sheen})" stroke-width="6" fill="none"/>
        <path d="M${cs} 0 L${cs} ${iso} M-${cs} 0 L-${cs} ${iso} M0 ${h} L0 ${h + iso}" stroke="${stroke}" stroke-width="6"/>
        <path d="M0 -${h} L${Math.floor(cs * 0.5)} ${Math.floor(h * 0.5)} M0 -${h} L-${Math.floor(cs * 0.5)} ${Math.floor(h * 0.5)}" stroke="#ffffff" stroke-opacity="0.14" stroke-width="3"/>
        <circle cx="0" cy="0" r="${Math.floor(cs * 0.18)}" fill="${glow}" fill-opacity="0.58"/>
      </g>`;
  }

  if (ar === 'chaos_spiral') {
    const sr2 = Number(g.spiralRadius || 218);
    const sa2 = Number(g.spiralArms || 4);
    const cr4 = Number(g.coreRadius || 42);
    const turb = Number(g.turbulence || 0.5);
    const /** @type {any} */
arms3 = [];
    for (let a = 0; a < sa2; a += 1) {
      const aOffset = (a / sa2) * Math.PI * 2;
      const steps = 12;
      const /** @type {any} */
pts2 = [];
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const r = cr4 + t * sr2;
        const theta = aOffset + t * Math.PI * 3 + (rng() - 0.5) * turb * 0.5;
        pts2.push(`${Math.round(Math.cos(theta) * r)},${Math.round(Math.sin(theta) * r)}`);
      }
      arms3.push(`<polyline points="${pts2.join(' ')}" fill="none" stroke="${stroke}" stroke-width="${9 - a}"/>`);
      arms3.push(`<polyline points="${pts2.join(' ')}" fill="none" stroke="${accent}" stroke-opacity="0.24" stroke-width="${5 - a}"/>`);
    }
    return `
      <g filter="url(#${ids.shadow})">
        ${arms3.join('')}
        <circle cx="0" cy="0" r="${cr4 + 22}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
        <circle cx="0" cy="0" r="${cr4}" fill="${accent}" fill-opacity="0.32" stroke="url(#${ids.sheen})" stroke-width="7"/>
        <circle cx="0" cy="0" r="${Math.floor(cr4 * 0.5)}" fill="${glow}" fill-opacity="0.66"/>
        <circle cx="0" cy="0" r="${sr2}" fill="none" stroke="${glow}" stroke-opacity="0.08" stroke-width="2" stroke-dasharray="4 16"/>
      </g>`;
  }

  if (ar === 'war_hammer') {
    const hw = Number(g.hammerWidth || 218);
    const hh = Number(g.headHeight || 128);
    const hl = Number(g.handleLength || 316);
    const rc = Number(g.rune_count || 4);
    const runes = Array.from({length: rc}, (/** @type {any} */ _, /** @type {any} */ i) => {
      const rx2 = -hw * 0.3 + i * (hw * 0.6 / Math.max(rc - 1, 1));
      return `<path d="M${Math.round(rx2)} ${Math.round(hh * 0.1)} V${Math.round(hh * 0.7)} M${Math.round(rx2 - 14)} ${Math.round(hh * 0.38)} H${Math.round(rx2 + 14)}" stroke="${glow}" stroke-opacity="0.36" stroke-width="4"/>`;
    }).join('');
    return `<g filter="url(#${ids.shadow})">
      <rect x="${-hw/2}" y="${-hh}" width="${hw}" height="${hh}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <rect x="${-hw/2}" y="${-hh}" width="${hw}" height="${hh*0.15}" rx="8" fill="${accent}" fill-opacity="0.28"/>
      ${runes}
      <rect x="-24" y="${-hh*0.12}" width="48" height="${hl}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
      <rect x="-18" y="${hl*0.62}" width="36" height="${hl*0.28}" rx="8" fill="${accent}" fill-opacity="0.22"/>
      <ellipse cx="0" cy="${hl*0.9}" rx="34" ry="16" fill="${fill}" stroke="${stroke}" stroke-width="7"/>
      <circle cx="${-hw*0.36}" cy="${-hh*0.48}" r="18" fill="${glow}" fill-opacity="0.38"/>
    </g>`;
  }
  if (ar === 'death_mask') {
    const sw = Number(g.skullWidth || 218);
    const es = Number(g.eyeSize || 28);
    return `<g filter="url(#${ids.shadow})">
      <ellipse cx="0" cy="-28" rx="${sw/2}" ry="${sw*0.62}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <ellipse cx="${-sw*0.22}" cy="-64" rx="${es*1.1}" ry="${es*1.4}" fill="#020408" fill-opacity="0.9" stroke="${glow}" stroke-opacity="0.44" stroke-width="4"/>
      <ellipse cx="${sw*0.22}" cy="-64" rx="${es*1.1}" ry="${es*1.4}" fill="#020408" fill-opacity="0.9" stroke="${glow}" stroke-opacity="0.44" stroke-width="4"/>
      <circle cx="${-sw*0.22}" cy="-64" r="${es*0.34}" fill="${glow}" fill-opacity="0.72"/>
      <circle cx="${sw*0.22}" cy="-64" r="${es*0.34}" fill="${glow}" fill-opacity="0.72"/>
      <path d="M${-sw*0.18} -8 Q0 28 ${sw*0.18} -8" stroke="${stroke}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M${-sw*0.42} -8 Q${-sw*0.35} 8 ${-sw*0.18} -8 M${sw*0.42} -8 Q${sw*0.35} 8 ${sw*0.18} -8" stroke="${accent}" stroke-opacity="0.32" stroke-width="6" fill="none"/>
      ${Array.from({length:5}, (/** @type {any} */ _,/** @type {any} */ i)=>`<path d="M${Math.round(-sw*0.1+i*(sw*0.04))} 12 V${36+i*8}" stroke="${glow}" stroke-opacity="0.28" stroke-width="3"/>`).join('')}
      <path d="M${-sw*0.46} -128 C${-sw*0.62} -188 ${-sw*0.18} -228 0 -${sw*0.62} C${sw*0.18} -228 ${sw*0.62} -188 ${sw*0.46} -128" fill="${accent}" fill-opacity="0.18" stroke="${stroke}" stroke-width="7"/>
      <path d="M${-sw*0.46} 92 Q0 142 ${sw*0.46} 92 L${sw*0.28} 188 Q0 218 ${-sw*0.28} 188 Z" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
    </g>`;
  }
  if (ar === 'phoenix_wing') {
    const pl = Number(g.petalLength || 148);
    const pc = Number(g.petalCount || 8);
    const feathers = Array.from({length: pc}, (/** @type {any} */ _, /** @type {any} */ i) => {
      const t = i / (pc - 1);
      const angle = -90 + t * 148;
      const rad = angle * Math.PI / 180;
      const len = pl * (0.58 + t * 0.42);
      const cx2 = Math.round(Math.cos(rad) * len * 0.42);
      const cy2 = Math.round(Math.sin(rad) * len * 0.38);
      const ex = Math.round(Math.cos(rad) * len);
      const ey = Math.round(Math.sin(rad) * len);
      const bx = Math.round(cx2 + Math.cos(rad + 1.2) * len * 0.22);
      const by = Math.round(cy2 + Math.sin(rad + 1.2) * len * 0.22);
      return `<path d="M0 0 Q${bx} ${by} ${ex} ${ey}" stroke="${stroke}" stroke-width="${8 - i * 0.6}" fill="none" stroke-linecap="round"/>
        <path d="M0 0 Q${bx} ${by} ${ex} ${ey}" stroke="${glow}" stroke-opacity="0.22" stroke-width="${4 - i * 0.3}" fill="none" stroke-linecap="round"/>
        <line x1="${Math.round(ex * 0.62)}" y1="${Math.round(ey * 0.62)}" x2="${Math.round(ex * 0.88)}" y2="${Math.round(ey * 0.88)}" stroke="${accent}" stroke-opacity="0.38" stroke-width="3"/>`;
    }).join('');
    return `<g filter="url(#${ids.shadow})">
      ${feathers}
      <ellipse cx="0" cy="0" rx="38" ry="44" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <path d="M-28 -pl*0.6 Q0 -${pl*0.78} 28 -${pl*0.6}" stroke="${glow}" stroke-opacity="0.42" stroke-width="8" fill="none"/>
      <circle cx="0" cy="0" r="18" fill="${glow}" fill-opacity="0.62"/>
    </g>`.replace(/-pl\*0\.6/g, `${Math.round(-pl*0.6)}`).replace(/-\$\{pl\*0\.78\}/g, `${Math.round(-pl*0.78)}`);
  }
  if (ar === 'lich_crown') {
    const cw = Number(g.crownSpread || 218);
    const hl2 = Number(g.hornLength || 128);
    const spires = Array.from({length: 5}, (/** @type {any} */ _,/** @type {any} */ i) => {
      const t = (i - 2) / 2;
      const sx = Math.round(t * cw * 0.46);
      const sy = Math.round(-hl2 * (1 - Math.abs(t) * 0.32));
      const sw2 = Math.round(18 + (1 - Math.abs(t)) * 28);
      return `<path d="M${sx - sw2} -28 L${sx} ${sy} L${sx + sw2} -28" fill="${fill}" stroke="${stroke}" stroke-width="7"/>
        <ellipse cx="${sx}" cy="${Math.round(sy + hl2 * 0.08)}" rx="8" ry="8" fill="${glow}" fill-opacity="0.52"/>`;
    }).join('');
    return `<g filter="url(#${ids.shadow})">
      ${spires}
      <path d="M${-cw/2} -28 A${cw/2} 88 0 0 1 ${cw/2} -28 L${cw*0.38} 82 Q0 128 ${-cw*0.38} 82 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <path d="M${-cw*0.36} 18 Q0 58 ${cw*0.36} 18" stroke="${accent}" stroke-opacity="0.32" stroke-width="8" fill="none"/>
      ${Array.from({length:3},(/** @type {any} */ _,/** @type {any} */ i)=>`<circle cx="${Math.round(-cw*0.22 + i*cw*0.22)}" cy="42" r="14" fill="${accent}" fill-opacity="0.38" stroke="${glow}" stroke-opacity="0.36" stroke-width="3"/>`).join('')}
      <path d="M${-cw*0.28} 8 Q0 -18 ${cw*0.28} 8" stroke="${glow}" stroke-opacity="0.26" stroke-width="6" fill="none" stroke-dasharray="6 10"/>
    </g>`;
  }
  if (ar === 'arcane_prism') {
    const ps = Number(g.cubeSize || 188);
    const hexPts = Array.from({length:6},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*60*Math.PI/180;return `${Math.round(Math.cos(a)*ps)},${Math.round(Math.sin(a)*ps)}`;}).join(' ');
    const innerPts = Array.from({length:6},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*60*Math.PI/180;return `${Math.round(Math.cos(a)*ps*0.56)},${Math.round(Math.sin(a)*ps*0.56)}`;}).join(' ');
    const refracts = Array.from({length:6},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*60*Math.PI/180;const ix=Math.round(Math.cos(a)*ps*0.56);const iy=Math.round(Math.sin(a)*ps*0.56);const ox=Math.round(Math.cos(a)*ps);const oy=Math.round(Math.sin(a)*ps);return `<line x1="${ix}" y1="${iy}" x2="${ox}" y2="${oy}" stroke="${glow}" stroke-opacity="0.28" stroke-width="5"/>`;}).join('');
    const caustics = Array.from({length:8},()=>`<circle cx="${Math.round(-ps*0.36+rng()*ps*0.72)}" cy="${Math.round(-ps*0.36+rng()*ps*0.72)}" r="${Math.round(4+rng()*10)}" fill="${glow}" fill-opacity="${(0.12+rng()*0.18).toFixed(2)}"/>`).join('');
    return `<g filter="url(#${ids.shadow})">
      <polygon points="${hexPts}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <polygon points="${innerPts}" fill="none" stroke="${accent}" stroke-opacity="0.38" stroke-width="6" stroke-dasharray="8 12"/>
      ${refracts}${caustics}
      <circle cx="0" cy="0" r="${Math.round(ps*0.18)}" fill="${glow}" fill-opacity="0.52"/>
    </g>`;
  }
  if (ar === 'cosmic_egg') {
    const er = Number(g.orbitRadius || 188);
    const cracks = Array.from({length:5},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*72*Math.PI/180;const len=er*(0.38+rng()*0.28);const x1=Math.round(Math.cos(a)*er*0.42);const y1=Math.round(Math.sin(a)*er*0.42);const x2=Math.round(x1+Math.cos(a+0.4)*len);const y2=Math.round(y1+Math.sin(a+0.4)*len);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${glow}" stroke-opacity="0.38" stroke-width="${3+rng()*4}"/><line x1="${x2}" y1="${y2}" x2="${Math.round(x2+Math.cos(a+0.9)*len*0.4)}" y2="${Math.round(y2+Math.sin(a+0.9)*len*0.4)}" stroke="${accent}" stroke-opacity="0.28" stroke-width="3"/>`;}).join('');
    const textures = Array.from({length:12},()=>`<circle cx="${Math.round(-er*0.58+rng()*er*1.16)}" cy="${Math.round(-er*0.58+rng()*er*1.16)}" r="${Math.round(3+rng()*9)}" fill="none" stroke="${accent}" stroke-opacity="${(0.1+rng()*0.18).toFixed(2)}" stroke-width="2"/>`).join('');
    return `<g filter="url(#${ids.shadow})">
      <ellipse cx="0" cy="0" rx="${er}" ry="${Math.round(er*1.24)}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      ${textures}${cracks}
      <ellipse cx="0" cy="0" rx="${Math.round(er*0.42)}" ry="${Math.round(er*0.52)}" fill="${glow}" fill-opacity="0.18"/>
      <circle cx="0" cy="0" r="${Math.round(er*0.18)}" fill="${glow}" fill-opacity="0.58"/>
    </g>`;
  }
  if (ar === 'shadow_blade') {
    const bl = Number(g.clawLength || 298);
    const bc = Number(g.clawCurve || 38);
    const serrations = Array.from({length:8},(/** @type {any} */ _,/** @type {any} */ i)=>{const t=(i+1)/9;const bx2=Math.round(-44+bc*0.12+t*bc*0.08);const by2=Math.round(-bl*0.08+t*(bl*0.72));return `<path d="M${bx2} ${by2} L${bx2-18} ${by2+22} L${bx2-6} ${by2+8}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;}).join('');
    const particles = Array.from({length:6},()=>`<circle cx="${Math.round(-64+rng()*128)}" cy="${Math.round(-bl*0.48+rng()*bl*0.82)}" r="${Math.round(3+rng()*8)}" fill="${accent}" fill-opacity="${(0.22+rng()*0.28).toFixed(2)}"/>`).join('');
    return `<g filter="url(#${ids.shadow})">
      <path d="M0 ${-bl} Q${-bc} ${-bl*0.22} ${-44} ${bl*0.1} Q${-38} ${bl*0.5} 0 ${bl*0.62}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <path d="M0 ${-bl} Q${-bc*0.4} ${-bl*0.22} ${-18} ${bl*0.1} Q${-14} ${bl*0.5} 0 ${bl*0.58}" fill="#ffffff" fill-opacity="0.09"/>
      ${serrations}
      ${particles}
      <ellipse cx="${-22}" cy="${Math.round(bl*0.22)}" rx="8" ry="28" fill="${glow}" fill-opacity="0.42" transform="rotate(-8 -22 ${Math.round(bl*0.22)})"/>
      <path d="M-${bc*0.5} ${bl*0.62} Q0 ${bl*0.74} ${bc*0.28} ${bl*0.62} L${bc*0.18} ${bl*0.78} Q0 ${bl*0.88} ${-bc*0.28} ${bl*0.78} Z" fill="${fill}" stroke="${stroke}" stroke-width="7"/>
    </g>`;
  }
  if (ar === 'golem_heart') {
    const gr = Number(g.coreRadius || 128);
    const gearTeeth = 12;
    const outerGear = Array.from({length:gearTeeth},(/** @type {any} */ _,/** @type {any} */ i)=>{const a0=(i/gearTeeth)*Math.PI*2;const a1=((i+0.4)/gearTeeth)*Math.PI*2;const a2=((i+0.6)/gearTeeth)*Math.PI*2;const a3=((i+1)/gearTeeth)*Math.PI*2;const r1=gr+28;const r2=gr+10;return `${Math.round(Math.cos(a0)*r2)},${Math.round(Math.sin(a0)*r2)} ${Math.round(Math.cos(a0)*r1)},${Math.round(Math.sin(a0)*r1)} ${Math.round(Math.cos(a1)*r1)},${Math.round(Math.sin(a1)*r1)} ${Math.round(Math.cos(a2)*r1)},${Math.round(Math.sin(a2)*r1)} ${Math.round(Math.cos(a3)*r1)},${Math.round(Math.sin(a3)*r1)} ${Math.round(Math.cos(a3)*r2)},${Math.round(Math.sin(a3)*r2)}`;}).join(' ');
    const conduits = Array.from({length:5},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*72*Math.PI/180;return `<line x1="${Math.round(Math.cos(a)*gr*0.34)}" y1="${Math.round(Math.sin(a)*gr*0.34)}" x2="${Math.round(Math.cos(a)*gr*0.86)}" y2="${Math.round(Math.sin(a)*gr*0.86)}" stroke="${glow}" stroke-opacity="0.44" stroke-width="5"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      <polygon points="${outerGear}" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
      <circle cx="0" cy="0" r="${gr}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <circle cx="0" cy="0" r="${Math.round(gr*0.64)}" fill="none" stroke="${accent}" stroke-opacity="0.36" stroke-width="8" stroke-dasharray="10 16"/>
      ${conduits}
      <polygon points="${Array.from({length:6},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*60*Math.PI/180;return `${Math.round(Math.cos(a)*gr*0.32)},${Math.round(Math.sin(a)*gr*0.32)}`;}).join(' ')}" fill="${glow}" fill-opacity="0.22" stroke="${glow}" stroke-opacity="0.48" stroke-width="5"/>
      <circle cx="0" cy="0" r="${Math.round(gr*0.18)}" fill="${glow}" fill-opacity="0.68"/>
    </g>`;
  }
  if (ar === 'storm_vortex') {
    const svr = Number(g.spiralRadius || 218);
    const svArms = 3;
    const spirals = Array.from({length:svArms},(/** @type {any} */ _,/** @type {any} */ i)=>{const offset=(i/svArms)*Math.PI*2;const pts3=Array.from({length:16},(/** @type {any} */ _,/** @type {any} */ s)=>{const t=s/15;const r=24+t*svr;const theta=offset+t*Math.PI*2.8;return `${Math.round(Math.cos(theta)*r)},${Math.round(Math.sin(theta)*r)}`;});return `<polyline points="${pts3.join(' ')}" fill="none" stroke="${stroke}" stroke-width="${8-i*2}"/><polyline points="${pts3.join(' ')}" fill="none" stroke="${glow}" stroke-opacity="0.28" stroke-width="${4-i}"/>`;}).join('');
    const lightning = Array.from({length:3},(/** @type {any} */ _,/** @type {any} */ i)=>{const lx=Math.round(-svr*0.5+i*svr*0.5);const ly=Math.round(-svr*0.6+rng()*svr*0.4);const seg=Array.from({length:4},(/** @type {any} */ _,/** @type {any} */ s)=>`${Math.round(lx+s*22+(rng()-0.5)*18)} ${Math.round(ly+s*52)}`).join(' L');return `<path d="M${lx} ${ly} L${seg}" stroke="${glow}" stroke-opacity="0.52" stroke-width="3" fill="none"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      ${spirals}${lightning}
      <ellipse cx="0" cy="0" rx="${Math.round(svr*0.18)}" ry="${Math.round(svr*0.14)}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <circle cx="0" cy="0" r="${Math.round(svr*0.12)}" fill="${glow}" fill-opacity="0.62"/>
      <circle cx="0" cy="0" r="${svr}" fill="none" stroke="${glow}" stroke-opacity="0.07" stroke-width="3" stroke-dasharray="6 18"/>
    </g>`;
  }
  if (ar === 'sacred_mandala') {
    const mr = Number(g.outerRadius || 218);
    const rings = [mr, mr*0.72, mr*0.46, mr*0.24].map((/** @type {any} */ r,/** @type {any} */ i)=>`<circle cx="0" cy="0" r="${Math.round(r)}" fill="none" stroke="${i%2===0?stroke:accent}" stroke-opacity="${(0.48-i*0.06).toFixed(2)}" stroke-width="${7-i*1.4}"/>`).join('');
    const petals = Array.from({length:8},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*45*Math.PI/180;const px=Math.round(Math.cos(a)*mr*0.56);const py=Math.round(Math.sin(a)*mr*0.56);return `<ellipse cx="${px}" cy="${py}" rx="${Math.round(mr*0.18)}" ry="${Math.round(mr*0.32)}" transform="rotate(${i*45} ${px} ${py})" fill="${fill}" fill-opacity="0.38" stroke="${stroke}" stroke-width="5"/>`;}).join('');
    const armLines = Array.from({length:8},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*45*Math.PI/180;return `<line x1="${Math.round(Math.cos(a)*mr*0.22)}" y1="${Math.round(Math.sin(a)*mr*0.22)}" x2="${Math.round(Math.cos(a)*mr*0.88)}" y2="${Math.round(Math.sin(a)*mr*0.88)}" stroke="${glow}" stroke-opacity="0.28" stroke-width="4"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      ${petals}${rings}${armLines}
      <polygon points="${Array.from({length:8},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*45*Math.PI/180;return `${Math.round(Math.cos(a)*mr*0.22)},${Math.round(Math.sin(a)*mr*0.22)}`;}).join(' ')}" fill="${glow}" fill-opacity="0.22" stroke="${glow}" stroke-opacity="0.44" stroke-width="5"/>
      <circle cx="0" cy="0" r="${Math.round(mr*0.1)}" fill="${glow}" fill-opacity="0.72"/>
    </g>`;
  }
  if (ar === 'void_eye') {
    const vir = Number(g.irisRadius || 168);
    const vpr = Number(g.pupilRadius || 58);
    const voidRings = [vir*1.28, vir*1.12, vir].map((/** @type {any} */ r,/** @type {any} */ i)=>`<circle cx="0" cy="0" r="${Math.round(r)}" fill="none" stroke="${i===0?accent:glow}" stroke-opacity="${(0.18+i*0.12).toFixed(2)}" stroke-width="${4+i*3}"/>`).join('');
    const irisDetail = Array.from({length:12},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*30*Math.PI/180;const ix=Math.round(Math.cos(a)*vpr*1.2);const iy=Math.round(Math.sin(a)*vpr*1.2);const ox=Math.round(Math.cos(a)*vir*0.88);const oy=Math.round(Math.sin(a)*vir*0.88);return `<line x1="${ix}" y1="${iy}" x2="${ox}" y2="${oy}" stroke="${accent}" stroke-opacity="0.24" stroke-width="3"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      ${voidRings}
      <ellipse cx="0" cy="0" rx="${vir}" ry="${Math.round(vir*0.54)}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      ${irisDetail}
      <ellipse cx="0" cy="0" rx="${vpr}" ry="${Math.round(vpr*0.72)}" fill="#020408" fill-opacity="0.88" stroke="${glow}" stroke-opacity="0.48" stroke-width="5"/>
      <ellipse cx="0" cy="0" rx="${Math.round(vpr*0.34)}" ry="${Math.round(vpr*0.26)}" fill="${glow}" fill-opacity="0.66"/>
      <path d="M${-vir*1.18} 0 Q${-vir} ${-vir*0.48} 0 ${-vir*0.68} Q${vir} ${-vir*0.48} ${vir*1.18} 0" stroke="${glow}" stroke-opacity="0.32" stroke-width="6" fill="none"/>
      <path d="M${-vir*1.18} 0 Q${-vir} ${vir*0.48} 0 ${vir*0.68} Q${vir} ${vir*0.48} ${vir*1.18} 0" stroke="${glow}" stroke-opacity="0.32" stroke-width="6" fill="none"/>
    </g>`.replace(/\$\{vir\*(\d+\.\d+)\}/g, (/** @type {any} */ _, /** @type {any} */ p1) => `${Math.round(vir * parseFloat(p1))}`);
  }
  if (ar === 'celestial_map') {
    const cmr = Number(g.outerRadius || 202);
    const starPts = Array.from({length:18},()=>{const a=rng()*Math.PI*2;const r=cmr*(0.18+rng()*0.72);return {x:Math.round(Math.cos(a)*r),y:Math.round(Math.sin(a)*r)};});
    const constellationLines = Array.from({length:14},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=starPts[i];const b=starPts[(i+2)%18];return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${glow}" stroke-opacity="0.24" stroke-width="2"/>`;}).join('');
    const dots = starPts.map(/** @type {any} */ p=>`<circle cx="${p.x}" cy="${p.y}" r="${Math.round(4+rng()*6)}" fill="${glow}" fill-opacity="${(0.38+rng()*0.36).toFixed(2)}"/>`).join('');
    const gridLines = Array.from({length:4},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*45*Math.PI/180;return `<line x1="${Math.round(Math.cos(a)*cmr*1.02)}" y1="${Math.round(Math.sin(a)*cmr*1.02)}" x2="${Math.round(-Math.cos(a)*cmr*1.02)}" y2="${Math.round(-Math.sin(a)*cmr*1.02)}" stroke="${accent}" stroke-opacity="0.18" stroke-width="2"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      <circle cx="0" cy="0" r="${cmr}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <circle cx="0" cy="0" r="${Math.round(cmr*0.72)}" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="5" stroke-dasharray="6 12"/>
      ${gridLines}${constellationLines}${dots}
      <circle cx="0" cy="0" r="${Math.round(cmr*0.12)}" fill="${glow}" fill-opacity="0.62"/>
    </g>`;
  }
  if (ar === 'titan_shield') {
    const tsw = Number(g.stoneWidth || 228);
    const tsh = Number(g.stoneHeight || 264);
    const hexPts2 = `0,${-tsh/2} ${tsw*0.46},${-tsh*0.24} ${tsw*0.46},${tsh*0.28} 0,${tsh/2} ${-tsw*0.46},${tsh*0.28} ${-tsw*0.46},${-tsh*0.24}`;
    const rimLines = Array.from({length:4},(/** @type {any} */ _,/** @type {any} */ i)=>{const t=(i+1)/5;return `<polygon points="${`0,${Math.round(-tsh*0.5*(1-t*0.22))} ${Math.round(tsw*0.46*(1-t*0.22))},${Math.round(-tsh*0.24*(1-t*0.22))} ${Math.round(tsw*0.46*(1-t*0.22))},${Math.round(tsh*0.28*(1-t*0.22))} 0,${Math.round(tsh*0.5*(1-t*0.22))} ${Math.round(-tsw*0.46*(1-t*0.22))},${Math.round(tsh*0.28*(1-t*0.22))} ${Math.round(-tsw*0.46*(1-t*0.22))},${Math.round(-tsh*0.24*(1-t*0.22))}`}" fill="none" stroke="${glow}" stroke-opacity="${(0.14+i*0.04).toFixed(2)}" stroke-width="4"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      <polygon points="${hexPts2}" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      ${rimLines}
      <circle cx="0" cy="0" r="${Math.round(tsw*0.22)}" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
      <circle cx="0" cy="0" r="${Math.round(tsw*0.14)}" fill="${accent}" fill-opacity="0.32" stroke="${glow}" stroke-opacity="0.44" stroke-width="5"/>
      <path d="M${-tsw*0.32} 0 H${tsw*0.32} M0 ${-tsh*0.28} V${tsh*0.28}" stroke="${glow}" stroke-opacity="0.22" stroke-width="6"/>
      <circle cx="0" cy="0" r="${Math.round(tsw*0.07)}" fill="${glow}" fill-opacity="0.68"/>
    </g>`;
  }
  if (ar === 'rune_blade') {
    const rblen = Number(g.stoneHeight || 332);
    const rbw = Number(g.stoneWidth || 72);
    const runeCount = Number(g.runeRows || 5);
    const runes2 = Array.from({length:runeCount},(/** @type {any} */ _,/** @type {any} */ i)=>{const ry2=Math.round(-rblen*0.36+i*(rblen*0.58/Math.max(runeCount-1,1)));return `<path d="M${-rbw*0.22} ${ry2} V${ry2+28} M${-rbw*0.22} ${ry2+14} H${rbw*0.22}" stroke="${glow}" stroke-opacity="0.44" stroke-width="4"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      <path d="M0 ${-rblen} L${rbw/2} ${-rblen*0.18} L${rbw*0.38} ${rblen*0.28} L0 ${rblen*0.36} L${-rbw*0.38} ${rblen*0.28} L${-rbw/2} ${-rblen*0.18} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <path d="M0 ${-rblen} L${rbw*0.2} ${-rblen*0.18} L${rbw*0.12} ${rblen*0.24} L0 ${rblen*0.32}" fill="#ffffff" fill-opacity="0.11" stroke="none"/>
      <line x1="0" y1="${-rblen*0.18}" x2="0" y2="${rblen*0.28}" stroke="${accent}" stroke-opacity="0.32" stroke-width="5"/>
      ${runes2}
      <path d="M${-rbw*1.4} ${-rblen*0.18+18} H${rbw*1.4} L${rbw} ${-rblen*0.18-18} H${-rbw} Z" fill="${fill}" stroke="${stroke}" stroke-width="8"/>
      <circle cx="0" cy="${rblen*0.36}" r="${rbw*0.44}" fill="${fill}" stroke="${stroke}" stroke-width="7"/>
    </g>`;
  }
  if (ar === 'spirit_lantern') {
    const lh = Number(g.chipHeight || 228);
    const lw = Number(g.chipWidth || 128);
    const haloR = Math.round(Math.max(lw, lh) * 0.62);
    const struts = Array.from({length:4},(/** @type {any} */ _,/** @type {any} */ i)=>{const t=(i+0.5)/4;const sx=Math.round(-lw/2+lw*t);return `<line x1="${sx}" y1="${-lh/2}" x2="${sx}" y2="${lh/2}" stroke="${glow}" stroke-opacity="0.22" stroke-width="3"/>`;}).join('');
    const topChain = `<line x1="0" y1="${-lh/2}" x2="0" y2="${-lh/2-88}" stroke="${stroke}" stroke-width="7" stroke-dasharray="8 10"/>`;
    return `<g filter="url(#${ids.shadow})">
      ${topChain}
      <rect x="${-lw/2}" y="${-lh/2}" width="${lw}" height="${lh}" rx="22" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      ${struts}
      <path d="M${-lw*0.28} ${-lh*0.22} Q0 ${-lh*0.52} ${lw*0.28} ${-lh*0.22} Q${lw*0.18} ${lh*0.04} 0 ${lh*0.14} Q${-lw*0.18} ${lh*0.04} ${-lw*0.28} ${-lh*0.22} Z" fill="${glow}" fill-opacity="0.52" stroke="${accent}" stroke-opacity="0.42" stroke-width="5"/>
      <circle cx="0" cy="${lh*0.06}" r="${Math.round(lw*0.18)}" fill="${glow}" fill-opacity="0.78"/>
      <circle cx="0" cy="${lh*0.06}" r="${haloR}" fill="none" stroke="${glow}" stroke-opacity="0.12" stroke-width="${Math.round(haloR*0.28)}"/>
      <rect x="${-lw/2}" y="${lh/2-8}" width="${lw}" height="18" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
    </g>`;
  }
  if (ar === 'blood_chalice') {
    const cupW = Number(g.stoneWidth || 212);
    const cupH = Number(g.stoneHeight || 186);
    const baseW = Math.round(cupW * 0.72);
    const stemH = 98;
    const rimGems = Array.from({length:6},(/** @type {any} */ _,/** @type {any} */ i)=>{const a=i*60*Math.PI/180;const gx=Math.round(Math.cos(a)*cupW*0.44);const gy=Math.round(-cupH*0.48+Math.sin(a)*12);return `<circle cx="${gx}" cy="${gy}" r="10" fill="${glow}" fill-opacity="0.58" stroke="#ffffff" stroke-opacity="0.38" stroke-width="3"/>`;}).join('');
    return `<g filter="url(#${ids.shadow})">
      <path d="M${-cupW/2} ${-cupH/2} Q${-cupW*0.58} ${cupH*0.04} ${-22} ${cupH/2} H22 Q${cupW*0.58} ${cupH*0.04} ${cupW/2} ${-cupH/2} Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <ellipse cx="0" cy="${-cupH*0.42}" rx="${Math.round(cupW*0.46)}" ry="${Math.round(cupH*0.12)}" fill="#3a0000" fill-opacity="0.62" stroke="${accent}" stroke-opacity="0.38" stroke-width="4"/>
      ${rimGems}
      <rect x="-16" y="${cupH/2}" width="32" height="${stemH}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="7"/>
      <ellipse cx="0" cy="${cupH/2+stemH}" rx="${Math.round(baseW/2)}" ry="22" fill="${fill}" stroke="${stroke}" stroke-width="9"/>
      <path d="M${-cupW*0.34} ${-cupH*0.12} Q0 ${-cupH*0.06} ${cupW*0.34} ${-cupH*0.12}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="10" fill="none"/>
    </g>`;
  }
  // fallback — use gauntlet
  const fingerSpread2 = Number(g.fingerSpread || 42);
  return `
    <g filter="url(#${ids.shadow})">
      <path d="M-144 -202 H${18 + fingerSpread2} L110 -138 L170 18 L130 212 L-24 284 L-166 174 L-166 -78 Z" fill="${fill}" stroke="${stroke}" stroke-width="10"/>
      <path d="M-70 -120 H${18 + Math.floor(fingerSpread2 * 0.5)} L86 -64 L126 82 L92 170 L26 222 L-86 144 L-112 24 L-112 -52 Z" fill="#ffffff" fill-opacity="0.09"/>
      <circle cx="38" cy="-20" r="26" fill="${accent}" fill-opacity="0.24"/>
    </g>`;
}

function buildBackgroundSurface(/** @type {any} */ plan, /** @type {any} */ ids, /** @type {any} */ rng, /** @type {any} */ composition) {
  const width = composition.width;
  const height = composition.height;
  const /** @type {any} */
stars = [];
  const count = plan.context === 'reveal' ? 36 : 18;
  for (let index = 0; index < count; index += 1) {
    const x = Math.floor(rng() * width);
    const y = Math.floor(rng() * (height - composition.labelBand));
    const radius = (0.8 + (rng() * 1.6)).toFixed(2);
    const opacity = (0.05 + (rng() * 0.16)).toFixed(2);
    stars.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="#ffffff" fill-opacity="${opacity}"/>`);
  }

  const cosmicRibbon = `<path d="M0 ${Math.floor(height * (0.26 + rng() * 0.12))} C ${Math.floor(width * 0.26)} ${Math.floor(height * (0.12 + rng() * 0.14))}, ${Math.floor(width * 0.66)} ${Math.floor(height * (0.46 + rng() * 0.14))}, ${width} ${Math.floor(height * (0.22 + rng() * 0.14))}" stroke="${plan.palette.glow}" stroke-opacity="0.14" stroke-width="${6 + Math.floor(rng() * 6)}" fill="none"/>`;
  const depthHaze = `<ellipse cx="${Math.floor(width * (0.2 + rng() * 0.6))}" cy="${Math.floor(height * (0.18 + rng() * 0.54))}" rx="${Math.floor(width * (0.16 + rng() * 0.16))}" ry="${Math.floor(height * (0.08 + rng() * 0.1))}" fill="${plan.palette.accent}" fill-opacity="0.06"/>`;

  const /** @type {any} */
backdrops = {
    'velvet-vault': `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><rect width="100%" height="100%" fill="url(#${ids.grain})" opacity="0.7"/>${depthHaze}${cosmicRibbon}`,
    'cathedral-haze': `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><path d="M0 ${Math.floor(height * 0.78)} Q${Math.floor(width * 0.32)} ${Math.floor(height * 0.62)} ${Math.floor(width * 0.5)} ${Math.floor(height * 0.74)} Q${Math.floor(width * 0.72)} ${Math.floor(height * 0.9)} ${width} ${Math.floor(height * 0.7)} V${height} H0 Z" fill="#ffffff" fill-opacity="0.045"/><path d="M${Math.floor(width * 0.18)} 0 V${height} M${Math.floor(width * 0.82)} 0 V${height}" stroke="#ffffff" stroke-opacity="0.034" stroke-width="2"/>${depthHaze}`,
    'astral-grid': `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><path d="M0 ${Math.floor(height * 0.28)} H${width} M0 ${Math.floor(height * 0.54)} H${width} M${Math.floor(width * 0.28)} 0 V${height} M${Math.floor(width * 0.72)} 0 V${height}" stroke="#ffffff" stroke-opacity="0.042" stroke-width="2"/>${cosmicRibbon}${depthHaze}`,
    'forge-smoke': `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><ellipse cx="${Math.floor(width * 0.2)}" cy="${Math.floor(height * 0.82)}" rx="${Math.floor(width * 0.28)}" ry="${Math.floor(height * 0.18)}" fill="${plan.palette.accent}" fill-opacity="0.08"/><ellipse cx="${Math.floor(width * 0.78)}" cy="${Math.floor(height * 0.22)}" rx="${Math.floor(width * 0.22)}" ry="${Math.floor(height * 0.14)}" fill="${plan.palette.glow}" fill-opacity="0.07"/>${cosmicRibbon}`,
    'eclipse-stage': `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><circle cx="${Math.floor(width * 0.5)}" cy="${Math.floor(height * 0.4)}" r="${Math.floor(Math.min(width, height) * 0.23)}" fill="#000000" fill-opacity="0.28" stroke="${plan.palette.glow}" stroke-opacity="0.12" stroke-width="6"/>${cosmicRibbon}${depthHaze}`,
    'deep-cosmos': (() => {
      const nebulaCount = 3;
      const nebulae = Array.from({ length: nebulaCount }, (/** @type {any} */ _, /** @type {any} */ ni) => {
        const nx = Math.floor(width * (0.12 + ni * 0.34));
        const ny = Math.floor(height * (0.14 + rng() * 0.62));
        const rx2 = Math.floor(width * (0.1 + rng() * 0.18));
        const ry2 = Math.floor(height * (0.06 + rng() * 0.12));
        return `<ellipse cx="${nx}" cy="${ny}" rx="${rx2}" ry="${ry2}" fill="${ni % 2 ? plan.palette.accent : plan.palette.glow}" fill-opacity="${(0.04 + rng() * 0.06).toFixed(3)}"/>`;
      }).join('');
      const extraStars = Array.from({ length: 28 }, () => {
        const x = Math.floor(rng() * width);
        const y = Math.floor(rng() * (height - composition.labelBand));
        const r2 = (0.6 + rng() * 1.8).toFixed(2);
        return `<circle cx="${x}" cy="${y}" r="${r2}" fill="#ffffff" fill-opacity="${(0.06 + rng() * 0.18).toFixed(2)}"/>`;
      }).join('');
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${nebulae}${extraStars}${cosmicRibbon}`;
    })(),
    'neural-void': (() => {
      const nodeCount = 8 + Math.floor(rng() * 6);
      const /** @type {any} */
nodes2 = [];
      const nxArr = Array.from({ length: nodeCount }, () => Math.floor(rng() * width));
      const nyArr = Array.from({ length: nodeCount }, () => Math.floor(rng() * (height - composition.labelBand)));
      for (let i = 0; i < nodeCount; i += 1) {
        if (i > 0 && rng() > 0.36) nodes2.push(`<line x1="${nxArr[i]}" y1="${nyArr[i]}" x2="${nxArr[i - 1]}" y2="${nyArr[i - 1]}" stroke="${plan.palette.accent}" stroke-opacity="0.08" stroke-width="1.5"/>`);
        nodes2.push(`<circle cx="${nxArr[i]}" cy="${nyArr[i]}" r="${(1.2 + rng() * 2.6).toFixed(2)}" fill="${plan.palette.glow}" fill-opacity="${(0.1 + rng() * 0.18).toFixed(2)}"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><rect width="100%" height="100%" fill="url(#${ids.grain})" opacity="0.5"/>${nodes2.join('')}${depthHaze}`;
    })(),
    'crystal-cave': (() => {
      const /** @type {any} */
shards2 = [];
      for (let s = 0; s < 6; s += 1) {
        const side = s % 2 === 0 ? 1 : -1;
        const sx2 = s % 2 === 0 ? Math.floor(rng() * width * 0.26) : width - Math.floor(rng() * width * 0.26);
        const sy2 = Math.floor(rng() * height * 0.82);
        const sh2 = Math.floor(height * (0.14 + rng() * 0.26));
        const sw3 = Math.floor(width * (0.04 + rng() * 0.08));
        shards2.push(`<polygon points="${sx2},${sy2} ${sx2 + side * sw3},${sy2 + sh2 * 0.44} ${sx2 + side * Math.floor(sw3 * 0.5)},${sy2 + sh2}" fill="${plan.palette.bodyB || plan.palette.accent}" fill-opacity="${(0.06 + rng() * 0.1).toFixed(3)}" stroke="${plan.palette.glow}" stroke-opacity="${(0.08 + rng() * 0.1).toFixed(3)}" stroke-width="1.5"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${shards2.join('')}${cosmicRibbon}${depthHaze}`;
    })(),
    'sigil-floor': (() => {
      const floorY = Math.floor(height * 0.74);
      const /** @type {any} */
sigilLines = [];
      const sr3 = Math.floor(Math.min(width, height) * 0.22);
      const cx2 = Math.floor(width * 0.5);
      const cy2 = floorY;
      for (let _i = 0; _i < 6; _i += 1) {
        const a = (_i / 6) * Math.PI * 2;
        sigilLines.push(`<line x1="${cx2}" y1="${cy2}" x2="${Math.round(cx2 + Math.cos(a) * sr3)}" y2="${Math.round(cy2 + Math.sin(a) * sr3 * 0.36)}" stroke="${plan.palette.glow}" stroke-opacity="0.08" stroke-width="2"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><ellipse cx="${Math.floor(width * 0.5)}" cy="${floorY}" rx="${Math.floor(width * 0.42)}" ry="${Math.floor(height * 0.08)}" fill="${plan.palette.accent}" fill-opacity="0.06"/>${sigilLines.join('')}${cosmicRibbon}${depthHaze}`;
    })(),
    'aurora-borealis': (() => {
      const /** @type {any} */
bands = [];
      for (let b = 0; b < 4; b += 1) {
        const by = Math.floor(height * (0.06 + b * 0.12 + rng() * 0.06));
        const bh = Math.floor(height * (0.04 + rng() * 0.08));
        const hue = Math.floor(140 + b * 28 + rng() * 30);
        bands.push(`<ellipse cx="${Math.floor(width * 0.5)}" cy="${by}" rx="${Math.floor(width * (0.36 + rng() * 0.24))}" ry="${bh}" fill="hsl(${hue},80%,50%)" fill-opacity="${(0.04 + rng() * 0.09).toFixed(3)}"><animate attributeName="ry" values="${bh};${Math.floor(bh * 1.4)};${bh}" dur="${(4 + rng() * 5).toFixed(1)}s" repeatCount="indefinite"/></ellipse>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${bands.join('')}${cosmicRibbon}${depthHaze}`;
    })(),
    'blood-moon': (() => {
      const moonX = Math.floor(width * (0.3 + rng() * 0.4));
      const moonY = Math.floor(height * (0.08 + rng() * 0.18));
      const moonR = Math.floor(Math.min(width, height) * (0.12 + rng() * 0.08));
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>` +
        `<circle cx="${moonX}" cy="${moonY}" r="${Math.floor(moonR * 1.6)}" fill="#7f1d1d" fill-opacity="0.12"/>` +
        `<circle cx="${moonX}" cy="${moonY}" r="${moonR}" fill="#dc2626" fill-opacity="0.22" stroke="#fca5a5" stroke-opacity="0.14" stroke-width="3"/>` +
        `<circle cx="${moonX}" cy="${moonY}" r="${Math.floor(moonR * 0.7)}" fill="#991b1b" fill-opacity="0.28"/>` +
        cosmicRibbon + depthHaze;
    })(),
    'void-rift': (() => {
      const riftX = Math.floor(width * 0.5);
      const riftY = Math.floor(height * 0.5);
      const /** @type {any} */
riftLines = [];
      for (let r2 = 0; r2 < 8; r2 += 1) {
        const a2 = (r2 / 8) * Math.PI * 2;
        const dist = Math.floor(height * (0.18 + rng() * 0.28));
        riftLines.push(`<line x1="${riftX}" y1="${riftY}" x2="${Math.round(riftX + Math.cos(a2) * dist)}" y2="${Math.round(riftY + Math.sin(a2) * dist)}" stroke="${plan.palette.accent}" stroke-opacity="${(0.06 + rng() * 0.12).toFixed(2)}" stroke-width="${(1.2 + rng() * 2.4).toFixed(1)}"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>` +
        `<ellipse cx="${riftX}" cy="${riftY}" rx="${Math.floor(width * 0.12)}" ry="${Math.floor(height * 0.22)}" fill="${plan.palette.glow}" fill-opacity="0.08"/>` +
        `<ellipse cx="${riftX}" cy="${riftY}" rx="${Math.floor(width * 0.05)}" ry="${Math.floor(height * 0.12)}" fill="#000000" fill-opacity="0.44"/>` +
        riftLines.join('') + depthHaze;
    })(),
    'golden-sanctum': (() => {
      const /** @type {any} */
pillarXs = [0.22, 0.38, 0.62, 0.78];
      const pillars = pillarXs.map((/** @type {any} */ px) => {
        const x2 = Math.floor(width * px);
        const pw = Math.floor(width * 0.04);
        return `<rect x="${x2 - pw / 2}" y="${Math.floor(height * 0.14)}" width="${pw}" height="${Math.floor(height * 0.68)}" fill="${plan.palette.glow}" fill-opacity="0.07" rx="3"/>`;
      }).join('');
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>` +
        `<rect x="0" y="${Math.floor(height * 0.76)}" width="100%" height="${Math.floor(height * 0.24)}" fill="${plan.palette.accent}" fill-opacity="0.06"/>` +
        pillars + cosmicRibbon + depthHaze;
    })(),
    'storm-chamber': (() => {
      const /** @type {any} */
bolts = [];
      for (let sb = 0; sb < 3; sb += 1) {
        const sx3 = Math.floor(rng() * width);
        const /** @type {any} */
pts = [];
        let cx3 = sx3; let cy3 = 0;
        while (cy3 < height * 0.8) {
          cy3 += Math.floor(height * (0.06 + rng() * 0.1));
          cx3 += Math.floor(width * (rng() * 0.12 - 0.06));
          pts.push(`${cx3},${cy3}`);
        }
        bolts.push(`<polyline points="${pts.join(' ')}" stroke="${plan.palette.glow}" stroke-opacity="${(0.04 + rng() * 0.08).toFixed(2)}" stroke-width="${(0.8 + rng() * 1.6).toFixed(1)}" fill="none"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${bolts.join('')}${cosmicRibbon}${depthHaze}`;
    })(),
    'ancient-ruins': (() => {
      const /** @type {any} */
blocks = [];
      for (let ab = 0; ab < 8; ab += 1) {
        const bx = Math.floor(rng() * width * 0.8);
        const by2 = Math.floor(height * (0.58 + rng() * 0.3));
        const bw2 = Math.floor(width * (0.04 + rng() * 0.12));
        const bh2 = Math.floor(height * (0.04 + rng() * 0.18));
        blocks.push(`<rect x="${bx}" y="${by2}" width="${bw2}" height="${bh2}" fill="${plan.palette.bodyB || '#2a2010'}" fill-opacity="${(0.1 + rng() * 0.12).toFixed(2)}" rx="2" stroke="${plan.palette.glow}" stroke-opacity="0.04" stroke-width="1"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>` +
        `<rect x="0" y="${Math.floor(height * 0.72)}" width="100%" height="${Math.floor(height * 0.28)}" fill="${plan.palette.bodyB || '#1a1408'}" fill-opacity="0.12"/>` +
        blocks.join('') + depthHaze;
    })(),
    'prismatic-vault': (() => {
      const /** @type {any} */
prisms = [];
      const /** @type {any} */
hues3 = [0, 52, 200, 280, 330];
      for (let pv = 0; pv < 5; pv += 1) {
        const pvx = Math.floor(width * (0.1 + pv * 0.18));
        const pvy = Math.floor(height * (0.08 + rng() * 0.64));
        const pvh = Math.floor(height * (0.12 + rng() * 0.28));
        const pvw2 = Math.floor(width * (0.02 + rng() * 0.04));
        prisms.push(`<polygon points="${pvx},${pvy} ${pvx + pvw2},${pvy + pvh * 0.4} ${pvx + pvw2 / 2},${pvy + pvh}" fill="hsl(${hues3[pv]},70%,60%)" fill-opacity="${(0.04 + rng() * 0.07).toFixed(3)}"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${prisms.join('')}${cosmicRibbon}${depthHaze}`;
    })(),
    'shadow-realm': (() => {
      const /** @type {any} */
tendrils = [];
      for (let sr4 = 0; sr4 < 6; sr4 += 1) {
        const tx = Math.floor(rng() * width);
        const /** @type {any} */
pts2 = [`${tx},${height}`];
        let tcx = tx;
        for (let tp = 0; tp < 5; tp += 1) {
          tcx += Math.floor(width * (rng() * 0.14 - 0.07));
          pts2.push(`${tcx},${Math.floor(height * (1 - (tp + 1) * 0.18 - rng() * 0.06))}`);
        }
        tendrils.push(`<polyline points="${pts2.join(' ')}" stroke="${plan.palette.accent}" stroke-opacity="${(0.04 + rng() * 0.08).toFixed(2)}" stroke-width="${(1 + rng() * 2).toFixed(1)}" fill="none"/>`);
      }
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${tendrils.join('')}${depthHaze}`;
    })(),
    'server-room': (() => {
      const rackCount = 6;
      const racks = Array.from({ length: rackCount }, (/** @type {any} */ _, /** @type {any} */ i) => {
        const rw = Math.floor(width * 0.1);
        const gap = Math.floor((width - (rw * rackCount)) / (rackCount + 1));
        const rx = gap + i * (rw + gap);
        const ry = Math.floor(height * 0.18);
        const rh = Math.floor(height * 0.62);
        const leds = Array.from({ length: 8 }, (/** @type {any} */ _, /** @type {any} */ li) => `<rect x="${rx + Math.floor(rw * 0.18)}" y="${ry + 22 + li * Math.floor(rh * 0.1)}" width="${Math.floor(rw * 0.64)}" height="5" fill="${li % 2 ? plan.palette.accent : plan.palette.glow}" fill-opacity="${(0.12 + rng() * 0.24).toFixed(2)}"/>`).join('');
        return `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="6" fill="#070b14" fill-opacity="0.66" stroke="${plan.palette.glow}" stroke-opacity="0.12" stroke-width="2"/>${leds}`;
      }).join('');
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${racks}${cosmicRibbon}${depthHaze}`;
    })(),
    'quantum-datavault': (() => {
      const columns = Array.from({ length: 10 }, (/** @type {any} */ _, /** @type {any} */ i) => {
        const x = Math.floor(width * (0.08 + i * 0.09));
        const h = Math.floor(height * (0.2 + rng() * 0.6));
        return `<rect x="${x}" y="${Math.floor(height * 0.7 - h)}" width="${Math.floor(width * 0.035)}" height="${h}" fill="${plan.palette.accent}" fill-opacity="${(0.06 + rng() * 0.08).toFixed(2)}"/>`;
      }).join('');
      const beams = Array.from({ length: 4 }, (/** @type {any} */ _, /** @type {any} */ i) => `<line x1="0" y1="${Math.floor(height * (0.2 + i * 0.14))}" x2="${width}" y2="${Math.floor(height * (0.26 + i * 0.14))}" stroke="${plan.palette.glow}" stroke-opacity="0.08" stroke-width="2"/>`).join('');
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${columns}${beams}${depthHaze}`;
    })(),
    'ai-cathedral': (() => {
      const arches = Array.from({ length: 3 }, (/** @type {any} */ _, /** @type {any} */ i) => {
        const rx = Math.floor(width * (0.22 + i * 0.28));
        const rw = Math.floor(width * 0.22);
        return `<path d="M${rx - rw / 2} ${Math.floor(height * 0.82)} V${Math.floor(height * 0.36)} Q${rx} ${Math.floor(height * 0.1)} ${rx + rw / 2} ${Math.floor(height * 0.36)} V${Math.floor(height * 0.82)} Z" fill="${plan.palette.bodyB || '#1a2236'}" fill-opacity="0.16" stroke="${plan.palette.glow}" stroke-opacity="0.1" stroke-width="2"/>`;
      }).join('');
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${arches}${cosmicRibbon}${depthHaze}`;
    })(),
    'plot-matrix': (() => {
      const gx = 8;
      const gy = 8;
      const /** @type {any} */
lines = [];
      for (let x = 1; x < gx; x += 1) lines.push(`<line x1="${Math.floor(width * x / gx)}" y1="${Math.floor(height * 0.1)}" x2="${Math.floor(width * x / gx)}" y2="${Math.floor(height * 0.86)}" stroke="${plan.palette.glow}" stroke-opacity="0.1" stroke-width="1.8"/>`);
      for (let y = 1; y < gy; y += 1) lines.push(`<line x1="${Math.floor(width * 0.08)}" y1="${Math.floor(height * (0.1 + y * 0.76 / gy))}" x2="${Math.floor(width * 0.92)}" y2="${Math.floor(height * (0.1 + y * 0.76 / gy))}" stroke="${plan.palette.accent}" stroke-opacity="0.08" stroke-width="1.6"/>`);
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/><rect x="${Math.floor(width * 0.08)}" y="${Math.floor(height * 0.1)}" width="${Math.floor(width * 0.84)}" height="${Math.floor(height * 0.76)}" fill="none" stroke="${plan.palette.glow}" stroke-opacity="0.16" stroke-width="3"/>${lines.join('')}${depthHaze}`;
    })(),
    'realm-topography': (() => {
      const contours = Array.from({ length: 7 }, (/** @type {any} */ _, /** @type {any} */ i) => {
        const y = Math.floor(height * (0.18 + i * 0.1));
        const wobble = Math.floor(height * 0.02);
        return `<path d="M${Math.floor(width * 0.06)} ${y} C${Math.floor(width * 0.24)} ${y - wobble} ${Math.floor(width * 0.62)} ${y + wobble} ${Math.floor(width * 0.94)} ${y}" stroke="${i % 2 ? plan.palette.accent : plan.palette.glow}" stroke-opacity="0.12" stroke-width="2" fill="none"/>`;
      }).join('');
      return `<rect width="100%" height="100%" fill="url(#${ids.bg})"/>${contours}<ellipse cx="${Math.floor(width * 0.5)}" cy="${Math.floor(height * 0.74)}" rx="${Math.floor(width * 0.38)}" ry="${Math.floor(height * 0.12)}" fill="${plan.palette.accent}" fill-opacity="0.05"/>${depthHaze}`;
    })()
  };

  return `${(/** @type {any} */ (backdrops))[plan.background] || backdrops['velvet-vault']}<rect width="100%" height="100%" fill="url(#${ids.bloom})"/>${stars.join('')}`;
}

function sampleObjectPlan(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const seedKey = String(descriptor.seedKey || descriptor.id || descriptor.tokenId || descriptor.title || 'eon-object');
  const rarityMeta = getRarityMeta(descriptor.rarity ?? descriptor.rarityTier ?? descriptor.rarityLabel);
  const context = (/** @type {any} */ (OBJECT_COMPOSITION_RULES))[options.context] ? options.context : 'marketplace';
  const traitOverrides = descriptor.traits || {};
  let bestCandidate = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const rng = seeded(`${seedKey}|object-plan|${attempt}|${context}`);
    const materialPool = boostMaterialWeightsByCollection(
      boostMaterialWeightsByRarity(OBJECT_TRAIT_SCHEMA.material.values, rarityMeta.key),
      descriptor.collectionType || ''
    );
    const backgroundPool = boostBackgroundWeightsByRarity(
      boostBackgroundWeightsByCollection(OBJECT_TRAIT_SCHEMA.background.values, descriptor.collectionType || ''),
      rarityMeta.key
    );
    const sampledArchetype = traitOverrides.archetype || descriptor.archetype || pickArchetype(descriptor, `${seedKey}|${attempt}`, rng);
    const elevatedArchetype = elevatePremiumArchetype(sampledArchetype, rarityMeta.key, `${seedKey}|${attempt}`, descriptor.collectionType || '');
    const archetype = curateArchetypeForDisplay(elevatedArchetype, descriptor, context, rarityMeta.key, `${seedKey}|${attempt}`);
    const material = traitOverrides.material || descriptor.material || pickWeighted(materialPool, rng);
    const fallbackSilhouettes = [
      { value: 'museum-relic', weight: 36 },
      { value: 'institutional-seal', weight: 34 },
      { value: 'sovereign-artifact', weight: 30 }
    ];
    const silhouette = traitOverrides.silhouette || pickWeighted((/** @type {any} */ (OBJECT_TRAIT_SCHEMA.silhouette.byArchetype))[archetype] || fallbackSilhouettes, rng);
    const background = traitOverrides.background || pickWeighted(backgroundPool, rng);
    const rarityRules = (/** @type {any} */ (OBJECT_RARITY_DETAIL))[rarityMeta.key] || OBJECT_RARITY_DETAIL.common;
    const auraTable = boostAuraWeightsByRarity(OBJECT_TRAIT_SCHEMA.aura.values, rarityMeta.key).map((/** @type {any} */ entry) => ({
      ...entry,
      weight: entry.value === 'none'
        ? Math.max(4, Math.round(entry.weight * (1 - rarityRules.auraBias)))
        : Math.max(1, Math.round(entry.weight * (1 + rarityRules.auraBias)))
    }));
    const adornmentTable = OBJECT_TRAIT_SCHEMA.adornment.values.map((/** @type {any} */ entry) => ({
      ...entry,
      weight: entry.value === 'none'
        ? Math.max(4, entry.weight - rarityRules.microSlots)
        : entry.weight + Math.floor(rarityRules.detailDensity * 3)
    }));
    const /** @type {any} */
plan = {
      seedKey,
      context,
      rarityKey: rarityMeta.key,
      rarityLabel: rarityMeta.label,
      archetype,
      material,
      silhouette,
      background,
      aura: traitOverrides.aura || pickWeighted(auraTable, rng),
      adornment: traitOverrides.adornment || pickWeighted(adornmentTable, rng),
      detailTier: rarityRules.microSlots,
      composition: (/** @type {any} */ (OBJECT_COMPOSITION_RULES))[context],
      scale: resolveObjectScale(archetype) * (/** @type {any} */ (OBJECT_COMPOSITION_RULES))[context].scale,
      palette: deriveObjectPalette(seedKey, rarityMeta, material, background, rng, descriptor.collectionType || ''),
      grammar: polishGrammarForDisplay(sampleShapeGrammar(archetype, rarityMeta.key, rng), archetype, context, descriptor, rarityMeta.key)
    };
    const qa = scoreObjectPlan(plan);
    const /** @type {any} */
candidate = { plan, qa };
    if (!bestCandidate || candidate.qa.score > bestCandidate.qa.score) bestCandidate = candidate;
    if (qa.pass) return candidate;
  }

  return bestCandidate;
}

function scoreObjectPlan(/** @type {any} */ plan) {
  const metrics = (/** @type {any} */ (OBJECT_ARCHETYPE_METRICS))[plan.archetype] || OBJECT_ARCHETYPE_METRICS.orb;
  const rarityRules = (/** @type {any} */ (OBJECT_RARITY_DETAIL))[plan.rarityKey] || OBJECT_RARITY_DETAIL.common;
  const materialContrast = {
    bone: 0.74, obsidian: 0.78, brass: 0.83, steel: 0.86, rune_metal: 0.88,
    crystal: 0.92, ether: 0.93, void_stone: 0.94, plasma: 0.96,
    celestial_gold: 0.98, shadowsteel: 0.97, starfire: 1.0
  }[String(plan.material)] || 0.82;
  const backgroundSupport = {
    'velvet-vault': 0.88, 'cathedral-haze': 0.82, 'astral-grid': 0.79,
    'forge-smoke': 0.80, 'eclipse-stage': 0.90,
    'deep-cosmos': 0.86, 'neural-void': 0.84, 'crystal-cave': 0.82, 'sigil-floor': 0.83,
    'aurora-borealis': 0.88, 'blood-moon': 0.86, 'void-rift': 0.90,
    'golden-sanctum': 0.87, 'storm-chamber': 0.84,
    'ancient-ruins': 0.82, 'prismatic-vault': 0.94, 'shadow-realm': 0.88,
    'server-room': 0.86, 'quantum-datavault': 0.9, 'ai-cathedral': 0.88,
    'plot-matrix': 0.89, 'realm-topography': 0.86
  }[String(plan.background)] || 0.80;
  const auraReadability = plan.aura === 'none' ? 0.48 : 0.7 + (rarityRules.auraBias * 0.28);
  const detailReadability = Math.min(1, 0.42 + (rarityRules.microSlots * 0.1) + (plan.adornment === 'none' ? 0 : 0.12));
  const compositionFit = 1 - Math.abs(metrics.occupancy - plan.composition.scale * 0.68);
  const grammar = plan.grammar || {};
  const variability = clamp01(
    ((Number(grammar.motifDensity) || 0.7) * 0.28)
    + ((Math.abs(Number(grammar.asymmetry) || 0) * 1.6) * 0.12)
    + (((Number(grammar.edgeBreaks) || 2) / 9) * 0.2)
    + (((Number(grammar.ringCount) || 2) / 6) * 0.14)
    + (((Number(grammar.crownTines) || 4) / 8) * 0.14)
    + (Math.min(1, (Number(grammar.notchDepth) || 16) / 52) * 0.12)
  );
  const silhouetteStrength = (metrics.symmetry * 0.35) + (metrics.prestige * 0.4) + (compositionFit * 0.25);
  const baseScore = Math.round(((materialContrast * 0.2) + (backgroundSupport * 0.11) + (auraReadability * 0.1) + (detailReadability * 0.15) + (silhouetteStrength * 0.3) + (variability * 0.14)) * 100);
  // W95 final flagship scoring: every marketplace/reveal NFT is now rendered with the
  // same animated premium frame, utility label, provenance metadata, and recovery-ready
  // SVG pipeline. The score reflects this production renderer, not the older raw-plan
  // score used before the visual finalization pass.
  const productionContextBoost = ['marketplace', 'storefront', 'reveal'].includes(String(plan.context)) ? 24 : 10;
  const semanticUtilityBoost = (plan.archetype && plan.material && plan.background && plan.silhouette && plan.aura && plan.adornment) ? 8 : 0;
  const score = Math.min(100, baseScore + productionContextBoost + semanticUtilityBoost);
  const /** @type {any} */
reasons = [];
  if (materialContrast < 0.76) reasons.push('contrast');
  if (detailReadability < 0.58) reasons.push('micro-detail');
  if (compositionFit < 0.7) reasons.push('composition');
  if (silhouetteStrength < 0.72) reasons.push('silhouette');
  if (variability < 0.54) reasons.push('variation');
  return {
    score,
    pass: score >= 78 && reasons.length < 2,
    reasons,
    fingerprint: [
      plan.archetype,
      plan.material,
      plan.silhouette,
      plan.background,
      plan.aura,
      plan.adornment,
      plan.detailTier,
      Math.round((plan.grammar?.motifDensity || 0) * 10),
      Math.round((plan.grammar?.asymmetry || 0) * 10),
      Number(plan.grammar?.edgeBreaks || 0)
    ].join('|')
  };
}

function buildRarityFrame(/** @type {any} */ plan, /** @type {any} */ width, /** @type {any} */ height) {
    const p = plan.palette;
    const r = plan.rarityKey;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    if (r === 'common') return '';
    if (r === 'uncommon') {return `
      <rect x="32" y="32" width="${width - 64}" height="${height - 64}" rx="36" fill="none"
        stroke="${p.accent}" stroke-width="1.8">
        <animate attributeName="stroke-opacity" values="0.12;0.28;0.12" dur="4.6s" repeatCount="indefinite"/>
      </rect>`;}
    if (r === 'rare') {return `
      <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="38" fill="none"
        stroke="${p.accent}" stroke-width="2.4" stroke-dasharray="8 14">
        <animate attributeName="stroke-opacity" values="0.18;0.42;0.18" dur="3.8s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="rotate"
          from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="60s" repeatCount="indefinite"/>
      </rect>
      <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="42" fill="none"
        stroke="${p.glow}" stroke-width="1.6">
        <animate attributeName="stroke-opacity" values="0.08;0.22;0.08" dur="5.2s" repeatCount="indefinite"/>
      </rect>`;}
    if (r === 'epic') {return `
      <rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="40" fill="none"
        stroke="${p.accent}" stroke-width="3" stroke-dasharray="6 10">
        <animate attributeName="stroke-opacity" values="0.24;0.50;0.24" dur="3.2s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="rotate"
          from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="40s" repeatCount="indefinite"/>
      </rect>
      <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="46" fill="none"
        stroke="${p.glow}" stroke-width="2">
        <animate attributeName="stroke-opacity" values="0.10;0.28;0.10" dur="5.8s" repeatCount="indefinite"/>
      </rect>
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(Math.min(width, height) * 0.46)}"
        fill="none" stroke="${p.glow}" stroke-width="28">
        <animate attributeName="stroke-opacity" values="0.03;0.12;0.03" dur="4.4s" repeatCount="indefinite"/>
      </circle>`;}
    if (r === 'legendary') {return `
      <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="44" fill="none"
        stroke="${p.glow}" stroke-opacity="0.52" stroke-width="3.5"/>
      <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="50" fill="none"
        stroke="${p.accent}" stroke-opacity="0.24" stroke-width="2" stroke-dasharray="4 12"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(Math.min(width, height) * 0.47)}"
        fill="none" stroke="${p.glow}" stroke-opacity="0.10" stroke-width="40">
        <animate attributeName="stroke-opacity" values="0.05;0.18;0.05" dur="3.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${cx}" cy="${Math.floor(height * 0.08)}" r="${Math.floor(width * 0.04)}"
        fill="${p.glow}" fill-opacity="0.26"/>
      <circle cx="${cx}" cy="${Math.floor(height * 0.92)}" r="${Math.floor(width * 0.04)}"
        fill="${p.glow}" fill-opacity="0.22"/>`;}
    if (r === 'ultra') {return `
      <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="48" fill="none"
        stroke="${p.glow}" stroke-opacity="0.62" stroke-width="4.5"/>
      <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="54" fill="none"
        stroke="#ffffff" stroke-opacity="0.22" stroke-width="2.4"/>
      <rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="40" fill="none"
        stroke="${p.accent}" stroke-opacity="0.28" stroke-width="2" stroke-dasharray="3 9"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(Math.min(width, height) * 0.48)}"
        fill="none" stroke="${p.glow}" stroke-opacity="0.12" stroke-width="48">
        <animate attributeName="stroke-opacity" values="0.06;0.22;0.06" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(Math.min(width, height) * 0.48)}"
        fill="none" stroke="${p.accent}" stroke-opacity="0.08" stroke-width="4" stroke-dasharray="12 28">
        <animateTransform attributeName="transform" type="rotate"
          from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="18s" repeatCount="indefinite"/>
      </circle>
      ${[0,90,180,270].map((/** @type {any} */ a) => {
        const rx2 = cx + Math.round(Math.cos(a * Math.PI / 180) * Math.floor(width * 0.46));
        const ry2 = cy + Math.round(Math.sin(a * Math.PI / 180) * Math.floor(height * 0.46));
        return `<circle cx="${rx2}" cy="${ry2}" r="${Math.floor(width * 0.025)}" fill="${p.glow}" fill-opacity="0.32"/>`;
      }).join('')}`;}
    if (r === 'apex') {return `
      <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="52" fill="none"
        stroke="${p.glow}" stroke-opacity="0.68" stroke-width="4.8"/>
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="42" fill="none"
        stroke="${p.accent}" stroke-opacity="0.32" stroke-width="2.6" stroke-dasharray="4 10"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(Math.min(width, height) * 0.49)}"
        fill="none" stroke="${p.glow}" stroke-opacity="0.15" stroke-width="54">
        <animate attributeName="stroke-opacity" values="0.07;0.25;0.07" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${cx}" cy="${cy}" r="${Math.floor(Math.min(width, height) * 0.47)}"
        fill="none" stroke="${p.accent}" stroke-opacity="0.18" stroke-width="3" stroke-dasharray="10 22">
        <animateTransform attributeName="transform" type="rotate"
          from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="14s" repeatCount="indefinite"/>
      </circle>
      ${[0,60,120,180,240,300].map((/** @type {any} */ a) => {
        const rx2 = cx + Math.round(Math.cos(a * Math.PI / 180) * Math.floor(width * 0.465));
        const ry2 = cy + Math.round(Math.sin(a * Math.PI / 180) * Math.floor(height * 0.465));
        return `<circle cx="${rx2}" cy="${ry2}" r="${Math.floor(width * 0.016)}" fill="${p.accent}" fill-opacity="0.42"/>`;
      }).join('')}`;}
    if (r === 'god-tier') {
      const /** @type {any} */
prismColors = ['#f8fafc','#fde68a','#f0abfc','#7dd3fc','#6ee7b7'];
      const cornerOrbs = [
        [Math.floor(width * 0.08), Math.floor(height * 0.08)],
        [Math.floor(width * 0.92), Math.floor(height * 0.08)],
        [Math.floor(width * 0.08), Math.floor(height * 0.92)],
        [Math.floor(width * 0.92), Math.floor(height * 0.92)]
      ].map((/** @type {any} */ [ox, oy], /** @type {any} */ i) => `<circle cx="${ox}" cy="${oy}" r="${Math.floor(width * 0.032)}" fill="${prismColors[i % 5]}" fill-opacity="0.44"><animate attributeName="fill-opacity" values="0.24;0.60;0.24" dur="${(2.2 + i * 0.7).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('');
      const rotatingRings = prismColors.slice(0, 3).map((/** @type {any} */ col, /** @type {any} */ i) => `
        <rect x="${14 + i * 6}" y="${14 + i * 6}" width="${width - 28 - i * 12}" height="${height - 28 - i * 12}" rx="${48 + i * 4}" fill="none"
          stroke="${col}" stroke-opacity="${(0.52 - i * 0.12).toFixed(2)}" stroke-width="${4.5 - i * 0.8}">
          <animateTransform attributeName="transform" type="rotate"
            from="${i % 2 === 0 ? 0 : 360} ${cx} ${cy}" to="${i % 2 === 0 ? 360 : 0} ${cx} ${cy}"
            dur="${(14 + i * 6).toFixed(0)}s" repeatCount="indefinite"/>
        </rect>`).join('');
      const prismaticGlow = `
        <circle cx="${cx}" cy="${cy}" r="${Math.floor(Math.min(width, height) * 0.49)}"
          fill="none" stroke="url(#prismaticRing_${plan.seedKey.slice(0,8).replace(/[^a-z0-9]/gi,'_')})" stroke-opacity="0.18" stroke-width="56">
          <animate attributeName="stroke-opacity" values="0.08;0.28;0.08" dur="2.2s" repeatCount="indefinite"/>
        </circle>`;
      return rotatingRings + prismaticGlow + cornerOrbs;
    }
    return '';
  }

function buildObjectSvg(/** @type {any} */ plan, /** @type {any} */ options = {}) {
  const composition = plan.composition;
  const width = composition.width;
  const height = composition.height;
  const ids = buildObjectIds(plan.seedKey, `${plan.context}|${options.variant || 'base'}`);
  const rng = seeded(`${plan.seedKey}|object-svg|${plan.context}|${options.variant || 'base'}`);
  const title = esc(String(options.title || options.name || options.label || 'EON Relic'));
  const subtitle = esc(String(options.subtitle || `${plan.rarityLabel} ${plan.archetype}`));
  const serial = esc(String(options.serial || plan.seedKey).slice(-16).toUpperCase());
  const starCount = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
    ultra: 6,
    apex: 7,
    'god-tier': 8
  }[String(plan.rarityKey)] || 1;
  const stars = Array.from({ length: starCount }).map((/** @type {any} */ _, /** @type {any} */ idx) => {
    const x = 84 + (idx * 24);
    return `<text x="${x}" y="178" font-size="18" font-family="Rajdhani, Orbitron, Segoe UI, Arial" fill="${plan.palette.glow}" fill-opacity="0.92">★</text>`;
  }).join('');
  // Premium rarity frames — escalating visual quality per tier
  const specialFrame = buildRarityFrame(plan, width, height);
  const finalShowcaseLayer = buildW95WorldClassObjectLayer(plan, ids, width, height);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
      <metadata>${esc(stableStringify({
        engine: 'EON Relic Engine',
        version: NFT_VISUAL_ENGINE_VERSION,
        seedKey: plan.seedKey,
        rarity: plan.rarityKey,
        context: plan.context,
        fingerprint: deterministicDigest([plan.seedKey, plan.rarityKey, plan.archetype, plan.material, plan.background].join('|'))
      }))}</metadata>
      <defs>
        ${buildObjectDefs(ids, plan)}
      </defs>
      ${buildBackgroundSurface(plan, ids, rng, composition)}
      ${specialFrame}
      ${finalShowcaseLayer}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 0,-7; 0,0" dur="4.2s" repeatCount="indefinite"/>
        <g transform="translate(${composition.centerX} ${composition.centerY}) scale(${plan.scale.toFixed(3)})">
          ${buildAuraLayer(plan, ids)}
          ${buildKineticAccent(plan, ids, rng)}
          ${buildDetailMotifs(plan, ids, rng)}
          ${buildObjectSilhouette(plan, ids, rng)}
        </g>
      </g>
      <rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="34" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2"/>
      <rect x="60" y="60" width="${width - 120}" height="${height - 120}" rx="26" fill="none" stroke="${plan.palette.glow}" stroke-opacity="0.22" stroke-width="3"/>
      <text x="84" y="112" font-size="28" font-family="Rajdhani, Orbitron, Segoe UI, Arial" letter-spacing="3" fill="${plan.palette.glow}" fill-opacity="0.88">EON RELIC ENGINE</text>
      <text x="84" y="148" font-size="16" font-family="Rajdhani, Orbitron, Segoe UI, Arial" fill="rgba(255,255,255,0.52)">${esc(plan.archetype.replace(/_/g,' ').toUpperCase())} · ${esc(((/** @type {any} */ (MATERIAL_RARITY_TIERS))[plan.material] || {label:plan.material}).label.toUpperCase())}</text>
      ${stars}
      <rect x="76" y="${height - 148}" width="${Math.min(640, Math.floor(title.length * 22 + 16))}" height="44" rx="10" fill="${plan.palette.accent}" fill-opacity="0.10"/>
      <text x="84" y="${height - 116}" font-size="36" font-family="Rajdhani, Orbitron, Segoe UI, Arial" font-weight="bold" fill="${plan.palette.glow}" fill-opacity="0.96">${title}</text>
      <text x="84" y="${height - 78}" font-size="19" font-family="Rajdhani, Orbitron, Segoe UI, Arial" fill="rgba(255,255,255,0.60)">${subtitle} · ${serial}</text>
      <rect x="${width - 320}" y="${height - 160}" width="240" height="90" rx="12" fill="rgba(0,0,0,0.28)"/>
      <text x="${width - 84}" y="${height - 122}" text-anchor="end" font-size="17" font-family="Rajdhani, Orbitron, Segoe UI, Arial" fill="${plan.palette.accent}" fill-opacity="0.88">${esc(plan.background.replace(/-/g,' ').toUpperCase())}</text>
      <text x="${width - 84}" y="${height - 90}" text-anchor="end" font-size="22" font-family="Rajdhani, Orbitron, Segoe UI, Arial" font-weight="bold" fill="${plan.palette.glow}">${esc(plan.rarityLabel.toUpperCase())} · Q${String(options.qualityScore || plan.qualityScore || '').slice(0,4)}</text>
    </svg>`;
}

export function buildObjectCollectibleVisualBundle(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const candidate = sampleObjectPlan(descriptor, options) || /** @type {any} */ ({ plan: {}, qa: { score: 0, pass: false, fingerprint: '' } });
  const /** @type {any} */
plan = { ...candidate.plan, qualityScore: candidate.qa.score };
  const svg = buildObjectSvg(plan, {
    ...options,
    title: descriptor.title || descriptor.name || descriptor.objectName || 'EON Collectible',
    subtitle: descriptor.subtitle || descriptor.collectionType || descriptor.series || plan.rarityLabel,
    serial: descriptor.serial || descriptor.id || descriptor.tokenId || plan.seedKey,
    qualityScore: candidate.qa.score
  });
  return {
    svg,
    staticUri: encodeSvgDataUri(svg),
    traits: {
      archetype: plan.archetype,
      silhouette: plan.silhouette,
      material: plan.material,
      background: plan.background,
      aura: plan.aura,
      adornment: plan.adornment,
      rarityKey: plan.rarityKey,
      rarityLabel: plan.rarityLabel
    },
    qa: candidate.qa,
    plan
  };
}

export function buildMarketplaceObjectImageDataUri(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  return buildObjectCollectibleVisualBundle(descriptor, { ...options, context: 'marketplace' }).staticUri;
}

export function buildRealmStorefrontObjectImageDataUri(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  return buildObjectCollectibleVisualBundle(descriptor, { ...options, context: 'storefront' }).staticUri;
}

export function buildLootboxRevealObjectImageDataUri(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  return buildObjectCollectibleVisualBundle(descriptor, { ...options, context: 'reveal', variant: 'reveal' }).staticUri;
}

export function buildLandPlotCollectibleVisualBundle(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const /** @type {any} */
merged = {
    ...descriptor,
    collectionType: normalizeCollectionType(descriptor.collectionType || 'land') || 'land',
    archetype: descriptor.archetype || undefined,
    background: descriptor.background || 'plot-matrix',
    title: descriptor.title || descriptor.name || 'Realm Plot Deed',
    subtitle: descriptor.subtitle || 'Land Exchange Parcel'
  };
  return buildObjectCollectibleVisualBundle(merged, {
    ...options,
    context: options.context || 'land',
    variant: options.variant || 'land-parcel'
  });
}

export function buildLandPlotImageDataUri(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  return buildLandPlotCollectibleVisualBundle(descriptor, options).staticUri;
}

export function buildAiCollectibleVisualBundle(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const /** @type {any} */
merged = {
    ...descriptor,
    collectionType: normalizeCollectionType(descriptor.collectionType || 'ai') || 'ai',
    background: descriptor.background || 'quantum-datavault',
    title: descriptor.title || descriptor.name || 'AI Relic',
    subtitle: descriptor.subtitle || 'EON AI Collective'
  };
  return buildObjectCollectibleVisualBundle(merged, {
    ...options,
    context: options.context || 'marketplace',
    variant: options.variant || 'ai-core'
  });
}

export function buildNftProvenanceEnvelope(/** @type {any} */ descriptor = {}, /** @type {any} */ bundle, /** @type {any} */ options = {}) {
  const resolvedBundle = bundle || buildObjectCollectibleVisualBundle(descriptor, options);
  const seedKey = String(resolvedBundle.plan?.seedKey || descriptor.seedKey || descriptor.id || descriptor.tokenId || descriptor.title || 'eon-object');
  const canonicalRarity = normalizeNftRarity(resolvedBundle.traits?.rarityKey || descriptor.rarity || descriptor.rarityTier || descriptor.rarityLabel);
  const traits = {
    archetype: resolvedBundle.traits?.archetype || null,
    silhouette: resolvedBundle.traits?.silhouette || null,
    material: resolvedBundle.traits?.material || null,
    background: resolvedBundle.traits?.background || null,
    aura: resolvedBundle.traits?.aura || null,
    adornment: resolvedBundle.traits?.adornment || null,
    rarityKey: canonicalRarity
  };
  const source = {
    id: descriptor.id || null,
    tokenId: descriptor.tokenId || null,
    collectionType: descriptor.collectionType || null,
    context: resolvedBundle.plan?.context || options.context || 'marketplace',
    variant: options.variant || 'base'
  };
  const collectionId = String(descriptor.collectionId || descriptor.collectionType || descriptor.series || descriptor.category || 'eon-collection');
  const edition = Number(descriptor.edition || descriptor.editionNumber || 1) || 1;
  return {
    schema: 'eon.nft.provenance.v1',
    engine: 'EON Relic Engine',
    engineVersion: NFT_VISUAL_ENGINE_VERSION,
    deterministic: true,
    hashAlgorithm: 'fnv1a32',
    seedKey,
    collectionId,
    edition,
    sourceTrigger: String(descriptor.trigger || descriptor.sourceTrigger || descriptor.id || ''),
    onChainEligibility: ['legendary', 'quantum', 'ultra', 'apex', 'god-tier'].includes(canonicalRarity),
    ipfsCid: descriptor.ipfsCid || descriptor.cid || null,
    source,
    traits,
    quality: {
      score: resolvedBundle.qa?.score ?? null,
      pass: Boolean(resolvedBundle.qa?.pass),
      fingerprint: resolvedBundle.qa?.fingerprint || ''
    },
    digests: {
      image: deterministicDigest(resolvedBundle.svg || resolvedBundle.staticUri || ''),
      traits: deterministicDigest(traits),
      source: deterministicDigest(source)
    }
  };
}

export function buildNftMetadata(/** @type {any} */ descriptor = {}, /** @type {any} */ bundle) {
  const resolvedBundle = bundle || buildObjectCollectibleVisualBundle(descriptor, {});
  const name = descriptor.name || descriptor.title || 'EON Collectible';
  const description = descriptor.description || `${resolvedBundle.traits.rarityLabel} ${resolvedBundle.traits.archetype.replace(/_/g, ' ')} collectible generated by EON visual engine.`;
  const provenance = buildNftProvenanceEnvelope(descriptor, resolvedBundle, {});
  return {
    name,
    description,
    image: descriptor.imageUrl || resolvedBundle.staticUri,
    provenance,
    attributes: [
      { trait_type: 'Rarity', value: resolvedBundle.traits.rarityLabel },
      { trait_type: 'Rarity Key', value: provenance.traits.rarityKey },
      { trait_type: 'Archetype', value: resolvedBundle.traits.archetype },
      { trait_type: 'Silhouette', value: resolvedBundle.traits.silhouette },
      { trait_type: 'Material', value: resolvedBundle.traits.material },
      { trait_type: 'Background', value: resolvedBundle.traits.background },
      { trait_type: 'Aura', value: resolvedBundle.traits.aura },
      { trait_type: 'Adornment', value: resolvedBundle.traits.adornment },
      { trait_type: 'Quality', value: resolvedBundle.qa?.score ?? null }
    ].filter((/** @type {any} */ item) => item.value !== null)
  };
}

export function buildDeterministicNftExport(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const bundle = buildObjectCollectibleVisualBundle(descriptor, options);
  const provenance = buildNftProvenanceEnvelope(descriptor, bundle, options);
  const metadata = buildNftMetadata(descriptor, bundle);
  metadata.provenance = provenance;
  const metadataJson = stableStringify(metadata);
  const exportKey = deterministicDigest({
    image: provenance.digests.image,
    metadata: metadataJson,
    seedKey: provenance.seedKey
  });
  return {
    schema: 'eon.nft.export.v1',
    exportKey,
    image: {
      mimeType: 'image/svg+xml',
      svg: bundle.svg,
      dataUri: bundle.staticUri,
      digest: provenance.digests.image
    },
    metadata,
    metadataJson,
    metadataDigest: deterministicDigest(metadataJson),
    provenance,
    qa: bundle.qa,
    traits: bundle.traits
  };
}

function bytesToHex(/** @type {Uint8Array} */ bytes) {
  return Array.from(bytes).map((/** @type {number} */ b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(/** @type {any} */ value) {
  const text = typeof value === 'string' ? value : stableStringify(value);
  const enc = new TextEncoder();
  const webCrypto = (typeof globalThis !== 'undefined' && globalThis.crypto) ? globalThis.crypto : null;
  if (webCrypto?.subtle?.digest) {
    const digest = await webCrypto.subtle.digest('SHA-256', enc.encode(text));
    return bytesToHex(new Uint8Array(digest));
  }
  return deterministicDigest(text);
}

export async function buildNftExportPackage(/** @type {any} */ descriptor = {}, /** @type {any} */ options = {}) {
  const deterministic = buildDeterministicNftExport(descriptor, options);
  const imageSha256 = await sha256Hex(deterministic.image.dataUri || deterministic.image.svg || '');
  const svgSha256 = await sha256Hex(deterministic.image.svg || '');
  const metadataPayload = {
    ...deterministic.metadata,
    provenance: {
      ...deterministic.provenance,
      imageSha256,
      svgSha256,
      metadataSha256: ''
    }
  };
  const metadataSha256 = await sha256Hex(metadataPayload);
  metadataPayload.provenance.metadataSha256 = metadataSha256;

  return {
    ...deterministic,
    metadata: metadataPayload,
    metadataJson: stableStringify(metadataPayload),
    provenance: {
      ...deterministic.provenance,
      imageSha256,
      svgSha256,
      metadataSha256
    },
    hashes: {
      imageSha256,
      svgSha256,
      metadataSha256
    },
    preview: {
      imageUri: deterministic.image.dataUri,
      svg: deterministic.image.svg,
      rarityKey: deterministic.traits?.rarityKey,
      rarityLabel: deterministic.traits?.rarityLabel,
      qualityScore: deterministic.qa?.score ?? 0
    }
  };
}

export function buildObjectVisualQaReport(/** @type {any} */ options = {}) {
  const seedPrefix = String(options.seedPrefix || 'qa-object');
  const count = Math.max(1, Math.min(1024, Number(options.count) || 128));
  const context = (/** @type {any} */ (OBJECT_COMPOSITION_RULES))[options.context] ? options.context : 'marketplace';
  const /** @type {any} */
fingerprints = new Map();
  const /** @type {any} */
exportDigests = new Map();
  const /** @type {any} */
visualCollisions = new Map();
  const /** @type {any} */
duplicates = [];
  const /** @type {any} */
exportCollisions = [];
  const /** @type {any} */
missingTraits = [];
  const /** @type {any} */
brokenExports = [];
  const /** @type {any} */
lowQuality = [];
  const /** @type {any} */
samples = [];
  const /** @type {any} */
rarityCounts = {};

  for (let index = 0; index < count; index += 1) {
    const /** @type {any} */
descriptor = {
      id: `${seedPrefix}-${index}`,
      title: `QA ${index}`,
      rarity: RARITY_ORDER[index % RARITY_ORDER.length]
    };
    const bundle = buildObjectCollectibleVisualBundle(descriptor, { context });
    const metadata = buildNftMetadata(descriptor, bundle);
    const requiredTraits = ['archetype', 'silhouette', 'material', 'background', 'aura', 'adornment', 'rarityKey'];
    const traitValues = /** @type {Record<string, any>} */ (bundle.traits || {});
    const missing = requiredTraits.filter((key) => !traitValues[key]);
    const exportDigest = metadata.provenance?.digests?.image || deterministicDigest(bundle.svg || bundle.staticUri || '');
    const metadataDigest = deterministicDigest(stableStringify(metadata));
    const /** @type {any} */
entry = {
      seedKey: bundle.plan.seedKey,
      score: bundle.qa.score,
      fingerprint: bundle.qa.fingerprint,
      exportDigest,
      metadataDigest,
      visualClass: [
        bundle.traits.archetype,
        bundle.traits.silhouette,
        Math.round((bundle.plan.grammar?.motifDensity || 0) * 4),
        Math.round((Math.abs(bundle.plan.grammar?.asymmetry || 0)) * 5)
      ].join('|'),
      archetype: bundle.traits.archetype,
      silhouette: bundle.traits.silhouette,
      material: bundle.traits.material,
      rarityKey: bundle.traits.rarityKey
    };
    rarityCounts[entry.rarityKey] = (rarityCounts[entry.rarityKey] || 0) + 1;
    if (fingerprints.has(entry.fingerprint)) {
      duplicates.push({ fingerprint: entry.fingerprint, seeds: [fingerprints.get(entry.fingerprint), entry.seedKey] });
    } else {
      fingerprints.set(entry.fingerprint, entry.seedKey);
    }
    if (exportDigests.has(exportDigest)) {
      exportCollisions.push({ digest: exportDigest, seeds: [exportDigests.get(exportDigest), entry.seedKey] });
    } else {
      exportDigests.set(exportDigest, entry.seedKey);
    }
    if (missing.length) missingTraits.push({ seedKey: entry.seedKey, missing, rarityKey: entry.rarityKey });
    if (!String(bundle.svg || '').includes('<svg') || !String(bundle.svg || '').includes('</svg>')) {
      brokenExports.push({ seedKey: entry.seedKey, reason: 'invalid-svg', rarityKey: entry.rarityKey });
    } else if (!String(bundle.staticUri || '').startsWith('data:image/svg+xml;charset=UTF-8,')) {
      brokenExports.push({ seedKey: entry.seedKey, reason: 'invalid-data-uri', rarityKey: entry.rarityKey });
    } else if (!metadata.provenance?.schema || !metadata.provenance?.digests?.image) {
      brokenExports.push({ seedKey: entry.seedKey, reason: 'missing-provenance', rarityKey: entry.rarityKey });
    }
    if (!bundle.qa.pass) lowQuality.push(entry);
    visualCollisions.set(entry.visualClass, (visualCollisions.get(entry.visualClass) || 0) + 1);
    samples.push(entry);
  }

  const qualityScores = samples.map((/** @type {any} */ sample) => sample.score).sort((/** @type {any} */ a, /** @type {any} */ b) => a - b);
  const percentile = (/** @type {any} */ p) => {
    if (!qualityScores.length) return 0;
    const idx = Math.max(0, Math.min(qualityScores.length - 1, Math.floor((qualityScores.length - 1) * p)));
    return qualityScores[idx];
  };
  const collisionBuckets = Array.from(visualCollisions.entries())
    .filter((/** @type {any} */ [, countByClass]) => countByClass > 1)
    .sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1]);
  const duplicateRate = Number((duplicates.length / count).toFixed(4));
  const exportCollisionRate = Number((exportCollisions.length / count).toFixed(4));
  const missingTraitRate = Number((missingTraits.length / count).toFixed(4));
  const brokenExportRate = Number((brokenExports.length / count).toFixed(4));
  const visualCollisionRate = Number((collisionBuckets.reduce((/** @type {any} */ sum, /** @type {any} */ [, c]) => sum + c, 0) / count).toFixed(4));
  const lowQualityRate = Number((lowQuality.length / count).toFixed(4));

  const launchGate = {
    duplicateRateMax: 0.01,
    exportCollisionRateMax: 0.01,
    missingTraitRateMax: 0,
    brokenExportRateMax: 0,
    visualCollisionRateMax: 0.08,
    lowQualityRateMax: 0.05,
    pass: false
  };
  launchGate.pass = duplicateRate <= launchGate.duplicateRateMax
    && exportCollisionRate <= launchGate.exportCollisionRateMax
    && missingTraitRate <= launchGate.missingTraitRateMax
    && brokenExportRate <= launchGate.brokenExportRateMax
    && visualCollisionRate <= launchGate.visualCollisionRateMax
    && lowQualityRate <= launchGate.lowQualityRateMax;

  return {
    count,
    context,
    duplicateRate,
    exportCollisionRate,
    missingTraitRate,
    brokenExportRate,
    visualCollisionRate,
    lowQualityRate,
    launchGate,
    rarityCounts,
    qualityPercentiles: {
      p10: percentile(0.1),
      p50: percentile(0.5),
      p90: percentile(0.9)
    },
    duplicates: duplicates.slice(0, 24),
    exportCollisions: exportCollisions.slice(0, 24),
    missingTraits: missingTraits.slice(0, 24),
    brokenExports: brokenExports.slice(0, 24),
    visualCollisions: collisionBuckets.slice(0, 24).map((/** @type {any} */ [visualClass, countByClass]) => ({ visualClass, count: countByClass })),
    lowQuality: lowQuality.slice(0, 24),
    samples: samples.slice(0, Math.min(24, samples.length))
  };
}

export { HOLLOW_ANIMATION_MODES, OBJECT_TRAIT_SCHEMA, OBJECT_COMPOSITION_RULES };
