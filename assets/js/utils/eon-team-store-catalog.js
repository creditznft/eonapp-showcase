/**
 * eon-team-store-catalog.js
 * Official EON Team Store catalog and purchase-intent envelope helpers.
 *
 * Launch policy:
 * - Standard items are USD-priced, open-edition utility NFTs.
 * - Buyer receives a unique generated NFT envelope after verified payment.
 * - No resale/profit promises.
 * - Official sale receiver is the Admin 1 / EON Team wallet.
 */

export const OFFICIAL_STORE_POLICY = Object.freeze({
  receiverLabel: 'Admin 1 / EON Team receiver wallet',
  currency: 'usd',
  edition: 'open',
  settlement: 'verified-payment-first',
  rewardRail: 'Pool Points first; sales-share only after payment proof rails.',
  noProfitPromise: true
});

const OFFICIAL_STORE_CATALOG = Object.freeze([
  {
    id: 'genesis-eon-starter-profile-boost',
    tier: 'starter',
    type: 'nft',
    collectionType: 'profile',
    title: 'Starter Profile Boost',
    desc: 'Low-cost open-edition utility NFT that adds a polished profile badge, starter Realm CTA, and base Pool Point weight.',
    priceUsd: 1,
    priceEon: 1,
    category: 'utility',
    rarityTier: 1,
    imageHint: '⚡',
    utilityUnlocks: ['Profile badge', 'Starter Realm CTA', 'Base Pool Point weight']
  },
  {
    id: 'genesis-eon-share-spark-pass',
    tier: 'starter',
    type: 'nft',
    collectionType: 'referral',
    title: 'Share Spark Pass',
    desc: 'Open-edition referral utility NFT for creators who want ready share cards, link copy, and local campaign tracking.',
    priceUsd: 2,
    priceEon: 2,
    category: 'utility',
    rarityTier: 1,
    imageHint: '📣',
    utilityUnlocks: ['Referral share card', 'Campaign copy pack', 'Local share tracking']
  },
  {
    id: 'genesis-eon-vault-backup-badge',
    tier: 'starter',
    type: 'nft',
    collectionType: 'vault',
    title: 'Vault Backup Badge',
    desc: 'Open-edition recovery utility NFT that marks backup readiness and unlocks a clearer Vault safety checklist.',
    priceUsd: 3,
    priceEon: 3,
    category: 'utility',
    rarityTier: 1,
    imageHint: '🔐',
    utilityUnlocks: ['Backup status badge', 'Recovery checklist', 'Cloud mirror guide']
  },
  {
    id: 'genesis-eon-builder-forge-open-pass',
    tier: 'builder',
    type: 'nft',
    collectionType: 'builder',
    title: 'Builder Forge Open Pass',
    desc: 'Official generated utility NFT for website builder missions, template launches, and WorkBench queue organization.',
    priceUsd: 5,
    priceEon: 5,
    category: 'utility',
    rarityTier: 2,
    imageHint: '🔨',
    utilityUnlocks: ['Builder templates', 'Launch checklist', 'WorkBench mission board']
  },
  {
    id: 'genesis-eon-operator-nexus-open-pass',
    tier: 'builder',
    type: 'nft',
    collectionType: 'operator',
    title: 'Operator Nexus Open Pass',
    desc: 'Official generated utility NFT for AI Cockpit operator rails, campaign workflows, and provider-health visibility.',
    priceUsd: 7,
    priceEon: 7,
    category: 'utility',
    rarityTier: 2,
    imageHint: '🧠',
    utilityUnlocks: ['Cockpit command cards', 'Provider health console', 'Campaign workflow templates']
  },
  {
    id: 'genesis-eon-realm-architect-open-pass',
    tier: 'builder',
    type: 'nft',
    collectionType: 'realmlord',
    title: 'Realm Architect Open Pass',
    desc: 'Official generated utility NFT for Realm storefront modules, EON City access cards, and safe personal-world templates.',
    priceUsd: 9,
    priceEon: 9,
    category: 'utility',
    rarityTier: 2,
    imageHint: '🌍',
    utilityUnlocks: ['Realm storefront modules', 'EON City access card', 'Safe world templates']
  },
  {
    id: 'genesis-eon-signal-atlas-open-pass',
    tier: 'builder',
    type: 'nft',
    collectionType: 'signal',
    title: 'Signal Atlas Open Pass',
    desc: 'Official generated utility NFT for Trade Cockpit watchlists, paper-trading journals, and research templates.',
    priceUsd: 6,
    priceEon: 6,
    category: 'utility',
    rarityTier: 2,
    imageHint: '📈',
    utilityUnlocks: ['Trade watchlist templates', 'Paper journal', 'Research prompt pack']
  },
  {
    id: 'genesis-eon-creator-campaign-bundle',
    tier: 'creator',
    type: 'nft',
    collectionType: 'campaign',
    title: 'Creator Campaign Bundle',
    desc: 'Open-edition creator utility NFT for referral campaigns, social post planning, and reusable creator launch assets.',
    priceUsd: 15,
    priceEon: 15,
    category: 'utility',
    rarityTier: 3,
    imageHint: '🚀',
    utilityUnlocks: ['Referral campaign planner', 'Social copy generator', 'Launch asset checklist']
  },
  {
    id: 'genesis-eon-workflow-loom-open-pass',
    tier: 'creator',
    type: 'nft',
    collectionType: 'workflow',
    title: 'Workflow Loom Open Pass',
    desc: 'Official generated utility NFT for reusable agent workflows, SOP templates, and mission-queue structure.',
    priceUsd: 19,
    priceEon: 19,
    category: 'utility',
    rarityTier: 3,
    imageHint: '🧵',
    utilityUnlocks: ['SOP templates', 'Agent workflow recipes', 'Mission queue structure']
  },
  {
    id: 'genesis-eon-dataset-vault-open-pass',
    tier: 'creator',
    type: 'nft',
    collectionType: 'dataset',
    title: 'Dataset Vault Open Pass',
    desc: 'Official generated utility NFT for export bundles, dataset manifests, and provenance-ready archive workflows.',
    priceUsd: 25,
    priceEon: 25,
    category: 'utility',
    rarityTier: 3,
    imageHint: '📦',
    utilityUnlocks: ['Dataset manifests', 'Export bundles', 'Provenance-ready archives']
  },
  {
    id: 'genesis-eon-city-founder-display',
    tier: 'collector',
    type: 'nft',
    collectionType: 'collector',
    title: 'EON City Founder Display',
    desc: 'Premium open-edition prestige display for early supporters. Cosmetic/status value only; no profit or resale promise.',
    priceUsd: 49,
    priceEon: 49,
    category: 'collector',
    rarityTier: 4,
    imageHint: '🏙️',
    utilityUnlocks: ['Founder display frame', 'EON City cosmetic monument', 'Prestige profile tag']
  }
]);

export function getEonTeamStoreCatalog() {
  return OFFICIAL_STORE_CATALOG.map((item) => ({
    ...item,
    price: `$${Number(item.priceUsd || 0)} USD`,
    currency: 'usd',
    limited: false,
    openEdition: true,
    animatedVisual: false,
    series: 'EON Team Store · Genesis Season',
    permanenceRail: 'arweave',
    revenueNote: 'Launch sales route to Admin 1 / EON Team receiver wallet.',
    storePolicy: OFFICIAL_STORE_POLICY
  }));
}

export function getEonTeamStoreTiers() {
  const tiers = new Map();
  getEonTeamStoreCatalog().forEach((item) => {
    const key = String(item.tier || 'utility');
    if (!tiers.has(key)) tiers.set(key, []);
    tiers.get(key).push(item);
  });
  return Object.fromEntries(tiers.entries());
}

export function isOfficialEonTeamListing(listing = {}) {
  const seller = String(listing.sellerWallet || listing.by || listing.seller || '').toLowerCase();
  const metadataSeller = String(listing?.metadata?.eonTeam?.seller || '').toLowerCase();
  return Boolean(listing.isGenesis || listing.metadata?.eonTeam || metadataSeller.includes('eon team') || seller.includes('eon team'));
}

function hashSeed(value = '') {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

export function buildOfficialUtilityNftEnvelope(listing = {}, buyer = {}) {
  const listingId = String(listing.listingId || listing.id || listing.title || 'official-eon-item');
  const buyerId = String(buyer.wallet || buyer.uid || buyer.localId || 'local-vault');
  const createdAt = new Date().toISOString();
  const seed = `EON-${hashSeed(`${listingId}:${buyerId}:${createdAt}:${Math.random()}`)}`;
  const priceUsd = Number(listing.priceUsd ?? listing.priceEon ?? 0);
  return {
    version: 'official-utility-nft-envelope/v1',
    source: 'eon-team-store',
    status: 'payment_verification_required',
    edition: 'open',
    receiver: OFFICIAL_STORE_POLICY.receiverLabel,
    sku: listingId,
    title: String(listing.title || 'Official EON Utility NFT'),
    utilityType: String(listing.collectionType || listing.type || 'utility'),
    uniqueSeed: seed,
    buyer: {
      wallet: String(buyer.wallet || ''),
      localId: buyerId
    },
    price: {
      amount: Number.isFinite(priceUsd) ? priceUsd : 0,
      currency: 'USD'
    },
    visualManifest: {
      seed,
      imageHint: String(listing.imageHint || '⚡'),
      series: String(listing.series || 'EON Team Store · Genesis Season'),
      lowMotion: true
    },
    unlocks: Array.isArray(listing.utilityUnlocks) ? listing.utilityUnlocks.slice(0, 12) : [],
    safety: {
      noProfitPromise: true,
      manualSellerTransferRequired: false,
      generatedAfterVerifiedPayment: true
    },
    createdAt
  };
}

export function saveOfficialPurchaseIntent(envelope) {
  try {
    const key = 'eon:official-purchase-intents:v1';
    const rows = JSON.parse(localStorage.getItem(key) || '[]');
    const list = Array.isArray(rows) ? rows : [];
    list.push(envelope);
    localStorage.setItem(key, JSON.stringify(list.slice(-50)));
    return { ok: true, count: list.length };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}
