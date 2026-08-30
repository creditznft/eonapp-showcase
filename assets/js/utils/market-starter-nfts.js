/**
 * market-starter-nfts.js — W108 personal Market drop layer
 *
 * Creates a deterministic local-first NFT starter drop for every new browser/user.
 * The drop is NOT an on-chain mint. It is a private, browser-local market preview
 * that can be saved into the Vault collection so first-time Market users always see
 * unique EON City items and search/filter never opens on an empty-feeling page.
 */

export const MARKET_STARTER_DROP_KEY = 'eon:market:user-nft-drops:v1';
export const MARKET_STARTER_VISITOR_KEY = 'eon:market:visitor:v1';
export const MARKET_STARTER_COLLECTION_KEY = 'eon:nft:collection:v1';
export const MARKET_STARTER_V3_COLLECTION_KEY = 'eon:nft-collection:v3';
export const MARKET_STARTER_VAULT_RECEIPTS_KEY = 'eon:market:starter-vault-receipts:v1';

const DROP_VERSION = 'w138-market-vault-proof-v1';
const DEFAULT_DROP_COUNT = 12;

const DROP_BLUEPRINTS = Object.freeze([
  {
    title: 'EON City Citizen Sigil',
    collectionType: 'nft',
    archetype: 'sigil_disc',
    background: 'astral-grid',
    material: 'crystal',
    aura: 'ion',
    rarityTier: 1,
    tags: ['citizen', 'identity', 'realm', 'starter']
  },
  {
    title: 'AI Cockpit Operator Core',
    collectionType: 'operator',
    archetype: 'quantum_core',
    background: 'quantum-datavault',
    material: 'plasma',
    aura: 'aether',
    rarityTier: 2,
    tags: ['ai cockpit', 'operator', 'automation', 'starter']
  },
  {
    title: 'Chat Oracle Lens',
    collectionType: 'agent_profile',
    archetype: 'ai_eye',
    background: 'prismatic-vault',
    material: 'ether',
    aura: 'ion',
    rarityTier: 2,
    tags: ['chat', 'assistant', 'voice', 'language']
  },
  {
    title: 'Market Boulevard Pass',
    collectionType: 'workflow',
    archetype: 'portal_arch',
    background: 'golden-sanctum',
    material: 'rune_metal',
    aura: 'solar',
    rarityTier: 2,
    tags: ['market', 'storefront', 'sell', 'creator']
  },
  {
    title: 'Trade Signal Compass',
    collectionType: 'signal',
    archetype: 'bone_compass',
    background: 'astral-grid',
    material: 'steel',
    aura: 'ion',
    rarityTier: 2,
    tags: ['trade', 'signal', 'research', 'watchlist']
  },
  {
    title: 'Vault Recovery Key',
    collectionType: 'dataset',
    archetype: 'key',
    background: 'quantum-datavault',
    material: 'shadowsteel',
    aura: 'aether',
    rarityTier: 2,
    tags: ['vault', 'backup', 'recovery', 'keys']
  },
  {
    title: 'Device Lab Relay',
    collectionType: 'compute',
    archetype: 'server_rack',
    background: 'server-room',
    material: 'brass',
    aura: 'ion',
    rarityTier: 1,
    tags: ['iot', 'device lab', 'automation', 'realm']
  },
  {
    title: 'Creator Studio Prism',
    collectionType: 'prompt_pack',
    archetype: 'arcane_prism',
    background: 'prismatic-vault',
    material: 'celestial_gold',
    aura: 'solar',
    rarityTier: 3,
    tags: ['creator', 'video', 'thumbnail', 'publish']
  },
  {
    title: 'Realm Portal Beacon',
    collectionType: 'realmlord',
    archetype: 'portal_arch',
    background: 'astral-grid',
    material: 'liquid-chrome',
    aura: 'violet',
    rarityTier: 3,
    tags: ['realm', 'portal', 'district', 'navigation']
  },
  {
    title: 'Automation Drone Core',
    collectionType: 'workflow',
    archetype: 'drone_core',
    background: 'server-room',
    material: 'steel',
    aura: 'ion',
    rarityTier: 2,
    tags: ['automation', 'agent', 'workflow', 'schedule']
  },
  {
    title: 'Music Reactor Charm',
    collectionType: 'skill_pack',
    archetype: 'plasma_core',
    background: 'golden-sanctum',
    material: 'crystal',
    aura: 'solar',
    rarityTier: 2,
    tags: ['music', 'audio', 'creator', 'studio']
  },
  {
    title: 'Video Forge Keyframe',
    collectionType: 'template',
    archetype: 'fractal_bloom',
    background: 'prismatic-vault',
    material: 'ether',
    aura: 'aether',
    rarityTier: 3,
    tags: ['video', 'editor', 'storyboard', 'export']
  },
  {
    title: 'Referral Comet Badge',
    collectionType: 'pioneer',
    archetype: 'celestial_map',
    background: 'astral-grid',
    material: 'celestial_gold',
    aura: 'ion',
    rarityTier: 2,
    tags: ['referral', 'community', 'launch', 'reward']
  },
  {
    title: 'Support Shield Receipt',
    collectionType: 'operator',
    archetype: 'titan_shield',
    background: 'quantum-datavault',
    material: 'rune_metal',
    aura: 'aether',
    rarityTier: 2,
    tags: ['support', 'receipt', 'safety', 'trust']
  },
  {
    title: 'Language Prism Glyph',
    collectionType: 'dataset',
    archetype: 'prism_eye',
    background: 'prismatic-vault',
    material: 'crystal',
    aura: 'violet',
    rarityTier: 2,
    tags: ['language', 'translation', 'guide', 'eonbot']
  },
  {
    title: 'Local Model Totem',
    collectionType: 'compute',
    archetype: 'server_rack',
    background: 'server-room',
    material: 'shadowsteel',
    aura: 'ion',
    rarityTier: 3,
    tags: ['local ai', 'ollama', 'model', 'compute']
  }
]);

function readJson(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function hashSeed(value = '') {
  let hash = 2166136261;
  const text = String(value || 'eon');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function secureSuffix() {
  try {
    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues(bytes);
    return Array.from(bytes, (part) => part.toString(36)).join('-');
  } catch {
    return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  }
}

function getOrCreateVisitorId() {
  const profileId = String(
    globalThis.localStorage?.getItem('eon:profile:uid')
    || globalThis.localStorage?.getItem('eon:profile:id')
    || ''
  ).trim();
  if (profileId) return profileId;

  const existing = String(globalThis.localStorage?.getItem(MARKET_STARTER_VISITOR_KEY) || '').trim();
  if (existing) return existing;

  const created = `visitor-${secureSuffix()}`;
  try { globalThis.localStorage?.setItem(MARKET_STARTER_VISITOR_KEY, created); } catch {}
  return created;
}

function pickVariant(seed, index, options) {
  const value = hashSeed(`${seed}|${index}|${options.join('|')}`);
  return options[value % options.length];
}

function buildDropItem(visitorId, index) {
  const blueprint = DROP_BLUEPRINTS[index % DROP_BLUEPRINTS.length];
  const seedHash = hashSeed(`${visitorId}|${DROP_VERSION}|${index}|${blueprint.title}`);
  const serial = (seedHash % 9999).toString().padStart(4, '0');
  const rarityBoost = seedHash % 17 === 0 ? 1 : 0;
  const rarityTier = Math.max(1, Math.min(4, Number(blueprint.rarityTier || 1) + rarityBoost));
  const district = pickVariant(seedHash, index, ['Spawn Plaza', 'AI Tower', 'Market Boulevard', 'Vault Tower', 'Device Lab', 'Trade Dome', 'Creator Row', 'Portal Hall']);
  const utility = pickVariant(seedHash, index, ['starter access', 'realm identity', 'workflow memory', 'operator badge', 'preview utility', 'vault proof']);

  return {
    id: `starter-${serial}-${String(blueprint.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
    type: 'nft',
    collectionType: blueprint.collectionType,
    title: `${blueprint.title} #${serial}`,
    desc: `A unique local-first EON City starter NFT generated for this browser. It previews ${district}, carries ${utility}, and can be saved into your Vault before any on-chain minting is enabled.`,
    price: 'Free',
    priceEon: 0,
    by: 'Generated for you',
    mode: 'starter-drop',
    soon: false,
    generatedForUser: true,
    source: 'market-starter-drop',
    rarityTier,
    maxSupply: 1,
    limited: true,
    district,
    utilityUnlocks: [district, utility, 'Vault-save preview'],
    permanenceRail: 'local-first',
    archetype: blueprint.archetype,
    background: blueprint.background,
    material: blueprint.material,
    aura: blueprint.aura,
    tags: blueprint.tags,
    seedKey: `${visitorId}|${DROP_VERSION}|${index}|${serial}`,
    createdAt: new Date().toISOString(),
    metadata: {
      starterDrop: true,
      visitorHash: hashSeed(visitorId).toString(16),
      dropVersion: DROP_VERSION,
      district,
      tags: blueprint.tags
    }
  };
}

function normalizeEnvelope(envelope) {
  const items = Array.isArray(envelope?.items) ? envelope.items.filter(Boolean) : [];
  return {
    version: String(envelope?.version || ''),
    visitorId: String(envelope?.visitorId || ''),
    createdAt: envelope?.createdAt || '',
    claimedIds: Array.isArray(envelope?.claimedIds) ? envelope.claimedIds : [],
    items
  };
}

export function ensureMarketStarterDrop(options = {}) {
  const count = Math.max(1, Math.min(12, Number(options.count || DEFAULT_DROP_COUNT)));
  const visitorId = getOrCreateVisitorId();
  const existing = normalizeEnvelope(readJson(MARKET_STARTER_DROP_KEY, {}));
  if (existing.version === DROP_VERSION && existing.visitorId === visitorId && existing.items.length >= count) {
    return { seeded: false, visitorId, items: existing.items.slice(0, count), claimedIds: existing.claimedIds };
  }

  const items = Array.from({ length: count }, (_, index) => buildDropItem(visitorId, index));
  const envelope = {
    version: DROP_VERSION,
    visitorId,
    createdAt: new Date().toISOString(),
    claimedIds: existing.claimedIds.filter((id) => items.some((item) => item.id === id)),
    items
  };
  writeJson(MARKET_STARTER_DROP_KEY, envelope);
  return { seeded: true, visitorId, items, claimedIds: envelope.claimedIds };
}

export function getMarketStarterDropItems() {
  return ensureMarketStarterDrop({ count: DEFAULT_DROP_COUNT }).items;
}

export function getMarketStarterStats() {
  const drop = ensureMarketStarterDrop({ count: DEFAULT_DROP_COUNT });
  return {
    count: drop.items.length,
    claimed: drop.claimedIds.length,
    unclaimed: Math.max(0, drop.items.length - drop.claimedIds.length),
    visitorId: drop.visitorId
  };
}

function saveToLegacyVaultCollection(item) {
  const existing = readJson(MARKET_STARTER_COLLECTION_KEY, []);
  const list = Array.isArray(existing) ? existing : [];
  if (list.some((entry) => entry?.id === item.id || entry?.nftId === item.id)) return false;
  list.unshift({
    id: item.id,
    nftId: item.id,
    name: item.title,
    title: item.title,
    rarity: String(item.rarityTier || 'common'),
    category: 'market-starter-drop',
    source: 'market-starter-drop',
    collectionType: item.collectionType,
    desc: item.desc,
    utilityUnlocks: item.utilityUnlocks,
    earnedAt: Date.now(),
    generatedForUser: true,
    metadata: item.metadata || {}
  });
  return writeJson(MARKET_STARTER_COLLECTION_KEY, list);
}

function rarityKeyForStarterItem(item) {
  const tier = Number(item?.rarityTier || 1);
  if (tier >= 4) return 'legendary';
  if (tier >= 3) return 'epic';
  if (tier >= 2) return 'rare';
  return 'common';
}

function iconForStarterItem(item) {
  const text = `${item?.title || ''} ${item?.collectionType || ''} ${(item?.tags || []).join(' ')}`.toLowerCase();
  if (text.includes('vault') || text.includes('key')) return '🛡️';
  if (text.includes('trade') || text.includes('signal')) return '🧭';
  if (text.includes('creator') || text.includes('prism')) return '🔮';
  if (text.includes('device') || text.includes('compute')) return '📡';
  if (text.includes('market') || text.includes('store')) return '🏙️';
  if (text.includes('chat') || text.includes('oracle')) return '👁️';
  if (text.includes('operator') || text.includes('cockpit')) return '⚙️';
  return '✦';
}

function buildVaultCopy(item, earnedAt = Date.now()) {
  const rarity = rarityKeyForStarterItem(item);
  const copyId = String(item?.id || '').trim();
  return {
    id: copyId,
    nftId: copyId,
    uid: `${copyId}_${earnedAt}`,
    name: item?.title || copyId,
    title: item?.title || copyId,
    desc: item?.desc || '',
    icon: iconForStarterItem(item),
    rarity,
    rarityTier: Number(item?.rarityTier || 1),
    earnedAt,
    category: 'market-starter-drop',
    collectionType: item?.collectionType || 'nft',
    merged: false,
    source: 'market-starter-drop',
    generatedForUser: true,
    tags: Array.isArray(item?.tags) ? item.tags : [],
    utilityUnlocks: Array.isArray(item?.utilityUnlocks) ? item.utilityUnlocks : [],
    metadata: {
      ...(item?.metadata || {}),
      marketStarterVaultProof: true,
      savedFrom: 'market.html',
      vaultRoute: '/vault.html#nft-collection',
      proofVersion: 'w138'
    }
  };
}

function saveToV3VaultCollection(item) {
  const collection = readJson(MARKET_STARTER_V3_COLLECTION_KEY, {});
  const normalized = collection && typeof collection === 'object' && !Array.isArray(collection) ? collection : {};
  const copies = Array.isArray(normalized[item.id]) ? normalized[item.id] : [];
  if (copies.some((copy) => copy?.source === 'market-starter-drop')) return false;
  normalized[item.id] = [buildVaultCopy(item), ...copies];
  return writeJson(MARKET_STARTER_V3_COLLECTION_KEY, normalized);
}

function writeStarterVaultReceipt(item, alreadySaved = false) {
  const receipts = readJson(MARKET_STARTER_VAULT_RECEIPTS_KEY, []);
  const list = Array.isArray(receipts) ? receipts : [];
  const savedAt = new Date().toISOString();
  const next = [
    {
      schema: 'eonapp.w138.market-starter-vault-receipt.v1',
      itemId: item.id,
      title: item.title,
      rarity: rarityKeyForStarterItem(item),
      savedAt,
      alreadySaved: Boolean(alreadySaved),
      source: 'market-starter-drop',
      storageKeys: [MARKET_STARTER_COLLECTION_KEY, MARKET_STARTER_V3_COLLECTION_KEY],
      vaultRoute: '/vault.html#nft-collection',
      realmPreviewRoute: `/realm.html?preview=market-drop&item=${encodeURIComponent(item.id)}`,
      proof: `${item.title} saved from Market to Vault inventory at ${savedAt}`
    },
    ...list.filter((receipt) => receipt?.itemId !== item.id)
  ].slice(0, 24);
  writeJson(MARKET_STARTER_VAULT_RECEIPTS_KEY, next);
  return next[0];
}

export function getMarketStarterVaultProof() {
  const drop = ensureMarketStarterDrop({ count: DEFAULT_DROP_COUNT });
  const legacy = readJson(MARKET_STARTER_COLLECTION_KEY, []);
  const v3 = readJson(MARKET_STARTER_V3_COLLECTION_KEY, {});
  const receipts = readJson(MARKET_STARTER_VAULT_RECEIPTS_KEY, []);
  const legacyIds = new Set((Array.isArray(legacy) ? legacy : []).map((item) => item?.id || item?.nftId).filter(Boolean));
  const v3Ids = new Set(Object.entries(v3 && typeof v3 === 'object' && !Array.isArray(v3) ? v3 : {})
    .filter(([, copies]) => Array.isArray(copies) && copies.some((copy) => copy?.source === 'market-starter-drop'))
    .map(([id]) => id));
  const visibleV3Copies = Object.values(v3 && typeof v3 === 'object' && !Array.isArray(v3) ? v3 : {})
    .flatMap((copies) => Array.isArray(copies) ? copies : [])
    .filter((copy) => copy?.source === 'market-starter-drop' && (copy?.id || copy?.nftId) && (copy?.name || copy?.title));

  return {
    schema: 'eonapp.w138.market-vault-proof.v1',
    dropCount: drop.items.length,
    claimedCount: drop.claimedIds.length,
    legacySavedCount: legacyIds.size,
    v3SavedCount: v3Ids.size,
    visibleV3Count: visibleV3Copies.length,
    receiptCount: Array.isArray(receipts) ? receipts.length : 0,
    vaultRoute: '/vault.html#nft-collection',
    ok: drop.items.length >= DEFAULT_DROP_COUNT && visibleV3Copies.length >= drop.claimedIds.length
  };
}

export function claimMarketStarterNftToVault(itemId) {
  const drop = ensureMarketStarterDrop({ count: DEFAULT_DROP_COUNT });
  const item = drop.items.find((candidate) => candidate.id === itemId);
  if (!item) return { ok: false, error: 'not_found' };

  const legacySaved = saveToLegacyVaultCollection(item);
  const v3Saved = saveToV3VaultCollection(item);
  const alreadySaved = !legacySaved && !v3Saved;
  const receipt = writeStarterVaultReceipt(item, alreadySaved);
  const claimedIds = Array.from(new Set([...(drop.claimedIds || []), item.id]));
  writeJson(MARKET_STARTER_DROP_KEY, {
    version: DROP_VERSION,
    visitorId: drop.visitorId,
    createdAt: readJson(MARKET_STARTER_DROP_KEY, {})?.createdAt || new Date().toISOString(),
    claimedIds,
    items: drop.items
  });

  return {
    ok: true,
    alreadySaved,
    item,
    receipt,
    vaultProof: getMarketStarterVaultProof(),
    claimedIds
  };
}
