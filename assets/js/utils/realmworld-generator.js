/**
 * realmworld-generator.js
 * Deterministic local-first realm generator for EON RealmWorld.
 *
 * Design rules:
 * - no user uploads in MVP
 * - no free text/chat in multiplayer MVP
 * - every world can be regenerated from public snapshot data
 * - Arweave snapshots are planned as the durable hosting rail
 */

const TERRAIN_TYPES = Object.freeze(['neon-isles', 'crystal-valley', 'forest-circuit', 'void-desert', 'aurora-coast']);
const DISTRICT_TYPES = Object.freeze(['vault', 'market', 'workbench', 'gallery', 'portal', 'arena', 'signal', 'compute']);
const SAFE_EMOTES = Object.freeze(['wave', 'spark', 'bow', 'cheer', 'trade', 'thanks']);

function hashSeed(value = '') {
  let hash = 2166136261;
  const text = String(value || 'eon-realmworld');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed = '') {
  let current = hashSeed(seed);
  return () => {
    current ^= current << 13;
    current ^= current >>> 17;
    current ^= current << 5;
    return ((current >>> 0) % 1000000) / 1000000;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function safeSlug(value = '') {
  return String(value || 'realm')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'realm';
}

function normalizeCollectionType(value = '') {
  return String(value || 'nft').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}

function buildUtilityBuildingForCollection(collectionType = 'nft') {
  const key = normalizeCollectionType(collectionType);
  const map = {
    land: { building: 'Realm Gate', power: 'publishes a parcel portal', icon: '🗺️' },
    realmlord: { building: 'Sovereign Hall', power: 'unlocks premium realm modules', icon: '👑' },
    builder: { building: 'Builder Forge', power: 'opens launch templates and build stations', icon: '🏗️' },
    operator: { building: 'Operator Nexus', power: 'opens review and seller controls', icon: '🛠️' },
    signal: { building: 'Signal Observatory', power: 'opens research and market-intel dashboards', icon: '📡' },
    compute: { building: 'Compute Forge', power: 'opens worker-node and CU stations', icon: '⚙️' },
    workflow: { building: 'Workflow Loom', power: 'opens reusable mission pipelines', icon: '🧵' },
    dataset: { building: 'Data Vault', power: 'opens permanent dataset manifests', icon: '🗃️' },
    prompt_pack: { building: 'Prompt Library', power: 'opens prompt packs and briefing kits', icon: '📜' },
    agent_profile: { building: 'Agent Shrine', power: 'opens persona and routing profiles', icon: '🤖' },
    skill_pack: { building: 'Skill Dojo', power: 'opens creator/operator capability boosts', icon: '🥋' },
    referral: { building: 'Growth Beacon', power: 'opens referral boosts and invite rewards', icon: '🌀' },
    nft: { building: 'Relic Gallery', power: 'displays animated collectibles and merge ladders', icon: '💎' }
  };
  return map[key] || map.nft;
}

export function buildRealmWorldSeed(input = {}) {
  const wallet = String(input.wallet || input.walletAddress || '').toLowerCase();
  const username = safeSlug(input.username || input.realmName || input.displayName || 'local-operator');
  const profileSeed = input.seed || input.profileId || input.uid || '';
  return `realmworld:${wallet || 'guest'}:${username}:${profileSeed || 'local'}`;
}

export function normalizePresenceMode(value = 'solo') {
  const mode = String(value || 'solo').toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (mode === 'public' || mode === 'public-listed') return 'public-listed';
  if (mode === 'invite' || mode === 'invite-only') return 'invite-only';
  return 'solo';
}

export function buildRealmWorldSafetyProfile(mode = 'solo') {
  const presenceMode = normalizePresenceMode(mode);
  return {
    presenceMode,
    publicDiscovery: presenceMode === 'public-listed',
    inviteOnly: presenceMode === 'invite-only',
    multiplayer: presenceMode !== 'solo',
    maxPeers: presenceMode === 'solo' ? 0 : 4,
    visitorKind: 'ghost-avatar',
    chat: false,
    uploads: false,
    customTextOnPublicVisit: false,
    allowedEmotes: [...SAFE_EMOTES],
    moderationRisk: 'low-by-design',
    ruleSummary: 'Ghost visitors, preset emotes, no public chat, no uploads, owner-approved realm snapshot data only.'
  };
}

export function buildRealmWorldDistricts(input = {}, options = {}) {
  const seed = buildRealmWorldSeed(input);
  const rng = seeded(`${seed}:districts:${options.variant || 'v1'}`);
  const count = clamp(options.count || 8, 5, 12);
  const districts = [];
  for (let i = 0; i < count; i += 1) {
    const type = DISTRICT_TYPES[i % DISTRICT_TYPES.length];
    const angle = (Math.PI * 2 * i) / count;
    const radius = 34 + Math.floor(rng() * 24);
    districts.push({
      id: `district-${type}-${i + 1}`,
      type,
      label: `${type.charAt(0).toUpperCase()}${type.slice(1)} District`,
      x: Math.round(50 + Math.cos(angle) * radius),
      y: Math.round(50 + Math.sin(angle) * radius),
      altitude: Math.round(8 + rng() * 42),
      mood: pick(rng, ['calm', 'electric', 'mystic', 'cosmic', 'industrial']),
      unlockHint: type === 'vault' ? 'Vault identity' : type === 'market' ? 'Marketplace showroom' : type === 'workbench' ? 'AI cockpit station' : 'Utility NFT powered module'
    });
  }
  return districts;
}

export function buildRealmWorldMonuments(input = {}, collection = []) {
  const seed = buildRealmWorldSeed(input);
  const rng = seeded(`${seed}:monuments`);
  const items = Array.isArray(collection) ? collection.slice(0, 24) : [];
  const fallback = items.length ? items : [
    { id: 'starter-relic', title: 'Starter Relic', collectionType: 'nft', rarityTier: 1 },
    { id: 'vault-core', title: 'Vault Core', collectionType: 'builder', rarityTier: 2 },
    { id: 'eonbot-npc', title: 'EONBOT Guide', collectionType: 'agent_profile', rarityTier: 2 }
  ];
  return fallback.map((item, index) => {
    const collectionType = normalizeCollectionType(item.collectionType || item.type || item.category || 'nft');
    const utility = buildUtilityBuildingForCollection(collectionType);
    return {
      id: `monument-${safeSlug(item.id || item.title || index)}`,
      sourceId: item.id || item.listingId || item.tokenId || '',
      title: String(item.title || item.name || utility.building),
      collectionType,
      rarityTier: Number(item.rarityTier ?? item.rarity ?? 1),
      building: utility.building,
      power: utility.power,
      icon: utility.icon,
      x: Math.round(12 + rng() * 76),
      y: Math.round(12 + rng() * 76),
      animated: item.animatedVisual !== false,
      permanence: item.metadata?.permanence?.status || item.permanenceRail || 'local-first'
    };
  });
}

export function buildRealmWorldNpcs(input = {}, options = {}) {
  const seed = buildRealmWorldSeed(input);
  const rng = seeded(`${seed}:npcs`);
  const products = Array.isArray(options.products) ? options.products.slice(0, 6) : [];
  const base = [
    {
      id: 'npc-eonbot-guide',
      name: 'EONBOT Guide',
      role: 'AI realm assistant',
      script: 'Welcomes visitors, explains the owner realm, and routes the owner into Chat or WorkBench.'
    },
    {
      id: 'npc-market-host',
      name: 'Market Host',
      role: 'Showroom NPC',
      script: 'Presents listed products, utility NFTs, and referral offers using preset cards only.'
    },
    {
      id: 'npc-loot-keeper',
      name: 'Loot Keeper',
      role: 'Lootbox NPC',
      script: 'Explains daily drops, cooldowns, and claimable realm events.'
    }
  ];
  products.forEach((product, index) => {
    base.push({
      id: `npc-product-${safeSlug(product.id || product.title || index)}`,
      name: `${String(product.title || 'Product')} Curator`.slice(0, 60),
      role: 'Product NPC',
      script: `Promotes ${String(product.title || 'a realm product')} with preset CTA cards and no free-form claims.`
    });
  });
  return base.slice(0, 8).map((npc, index) => ({
    ...npc,
    x: Math.round(15 + rng() * 70),
    y: Math.round(15 + rng() * 70),
    emote: SAFE_EMOTES[index % SAFE_EMOTES.length]
  }));
}

export function buildRealmWorldSnapshot(input = {}, options = {}) {
  const seed = buildRealmWorldSeed(input);
  const rng = seeded(`${seed}:world`);
  const terrain = pick(rng, TERRAIN_TYPES);
  const presenceMode = normalizePresenceMode(options.presenceMode || input.presenceMode || 'solo');
  const collection = Array.isArray(options.collection) ? options.collection : [];
  const products = Array.isArray(options.products) ? options.products : [];
  const now = options.now || new Date().toISOString();
  return {
    schema: 'eon.realmworld.snapshot.v1',
    engine: 'EON RealmWorld Generator',
    generatedAt: now,
    owner: {
      wallet: String(input.wallet || input.walletAddress || '').toLowerCase(),
      username: safeSlug(input.username || input.realmName || input.displayName || 'local-operator'),
      displayName: String(input.displayName || input.realmName || 'Local Operator').slice(0, 80)
    },
    seed,
    terrain,
    palette: pick(rng, [
      ['#0f172a', '#38bdf8', '#a78bfa', '#22c55e'],
      ['#111827', '#f97316', '#facc15', '#fb7185'],
      ['#020617', '#22d3ee', '#818cf8', '#e879f9'],
      ['#0b1120', '#34d399', '#93c5fd', '#f0abfc']
    ]),
    districts: buildRealmWorldDistricts(input),
    monuments: buildRealmWorldMonuments(input, collection),
    npcs: buildRealmWorldNpcs(input, { products }),
    portals: [
      { id: 'portal-chat', label: 'EONBOT Chat', href: '/chat.html', type: 'ai', x: 50, y: 7, altitude: 42 },
      { id: 'portal-workbench', label: 'AI Cockpit', href: '/eon-browser.html', type: 'workbench', x: 86, y: 48, altitude: 50 },
      { id: 'portal-market', label: 'Market', href: '/market', type: 'market', x: 50, y: 89, altitude: 38 },
      { id: 'portal-vault', label: 'Vault', href: '/vault', type: 'vault', x: 14, y: 48, altitude: 46 }
    ],
    renderer: {
      schema: 'eon.realmworld.renderer.v1',
      phases: ['css-2-5d', 'canvas-map', 'ghost-3d', 'portal-transitions', 'webxr-optional'],
      defaultMode: 'css',
      camera: { x: 50, y: 50, zoom: 1, pitch: 58, rotation: 0 },
      cloudflareWorkerRequired: false,
      centralGameServerRequired: false
    },
    safety: buildRealmWorldSafetyProfile(presenceMode),
    permanence: {
      rail: 'arweave',
      status: 'export-ready',
      note: 'Upload this JSON snapshot plus NFT media/metadata bundle to Arweave for permanent public hosting.'
    }
  };
}

export function buildRealmWorldArweaveManifest(snapshot = {}) {
  const clean = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const cleanAny = /** @type {any} */ (clean);
  const owner = cleanAny.owner || {};
  const username = safeSlug(owner.username || 'realm');
  return {
    schema: 'eon.realmworld.arweave-manifest.v1',
    contentType: 'application/json',
    path: `realms/${username}/realmworld.snapshot.json`,
    tags: [
      { name: 'App-Name', value: 'EONAPP' },
      { name: 'Content-Type', value: 'application/json' },
      { name: 'EON-Object', value: 'RealmWorldSnapshot' },
      { name: 'EON-Realm', value: username }
    ],
    snapshot: clean
  };
}
