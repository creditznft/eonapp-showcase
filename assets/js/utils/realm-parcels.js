const REALM_DISTRICT_REGISTRY_KEY = 'eon:realm:district-registry:v2';
const REALM_PARCELS_KEY = 'eon:realm:parcels:v2';
const REALM_TRANSFER_LOG_KEY = 'eon:realm:transfer-log:v1';

export const /** @type {any} */
ASCENSION_TIER_CATALOG = [
  { tierId: 'starter', label: 'Starter', minUpgradeLevel: 1, trafficMultiplier: 1, ownerShareBonusBps: 0, visualFx: 'none', description: 'Baseline parcel tier.' },
  { tierId: 'ascendant', label: 'Ascendant', minUpgradeLevel: 10, trafficMultiplier: 1.15, ownerShareBonusBps: 100, visualFx: 'glow', description: 'Unlocks advanced district modules.' },
  { tierId: 'mythic', label: 'Mythic', minUpgradeLevel: 20, trafficMultiplier: 1.3, ownerShareBonusBps: 250, visualFx: 'aurora', description: 'High-yield endgame parcel tier.' }
];

const /** @type {any} */
DEFAULT_REALM_DISTRICT_REGISTRY = {
  version: 2,
  realmId: 'eon-realm-network',
  districts: [
    { districtId: 'void-raider-salvage-frontier', gameId: 'void-raider', name: 'Salvage Frontier', phase: 1, biomeFamily: 'Abyssal', maxParcels: 2400, supplyClass: 'core' },
    { districtId: 'neon-dungeon-undercity', gameId: 'neon-dungeon', name: 'Undercity', phase: 1, biomeFamily: 'Neon', maxParcels: 2100, supplyClass: 'core' },
    { districtId: 'island-survival-archipelago', gameId: 'island-survival', name: 'Archipelago', phase: 1, biomeFamily: 'Coastal', maxParcels: 1900, supplyClass: 'core' },
    { districtId: 'frozen-wasteland-ice-frontier', gameId: 'frozen-wasteland', name: 'Ice Frontier', phase: 9, biomeFamily: 'Arctic', maxParcels: 700, supplyClass: 'premium' },
    { districtId: 'desert-storm-dune-trade-route', gameId: 'desert-storm', name: 'Dune Trade Route', phase: 9, biomeFamily: 'Desert', maxParcels: 700, supplyClass: 'premium' },
    { districtId: 'sky-fortress-aerial-citadel', gameId: 'sky-fortress', name: 'Aerial Citadel', phase: 9, biomeFamily: 'Aerial', maxParcels: 550, supplyClass: 'event-limited' },
    { districtId: 'cosmic-arena-sector', gameId: 'cosmic-arena', name: 'Arena Sector', phase: 9, biomeFamily: 'Cosmic', maxParcels: 500, supplyClass: 'event-limited' }
  ]
};

const /** @type {any} */
DISTRICT_MODULES = {
  default: {
    monetization: ['ad-rotation', 'sponsor-wall', 'referral-router'],
    utility: ['fast-travel', 'storage-node'],
    social: ['guild-beacon']
  },
  'cosmic-arena-sector': {
    monetization: ['ticket-gate', 'battle-pass-terminal', 'ad-rotation'],
    utility: ['telemetry-node', 'matchmaking-cache'],
    social: ['duel-hall']
  }
};

function nowIso() {
  return new Date().toISOString();
}

function safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/write failures in local-first mode.
  }
}

function normalizeSplit(/** @type {any} */ split = {}) {
  return {
    ownerShareBps: Number.isFinite(Number((/** @type {any} */ (split)).ownerShareBps)) ? Number((/** @type {any} */ (split)).ownerShareBps) : 7000,
    protocolShareBps: Number.isFinite(Number((/** @type {any} */ (split)).protocolShareBps)) ? Number((/** @type {any} */ (split)).protocolShareBps) : 3000
  };
}

function normalizeParcel(/** @type {any} */ raw, /** @type {any} */ districtIds) {
  const districtId = districtIds.includes(raw?.districtId) ? raw.districtId : districtIds[0];
  const upgradeLevel = Math.max(1, Math.floor(Number(raw?.upgradeLevel || 1)));
  const ascensionTier = upgradeLevel >= 20 ? 'mythic' : upgradeLevel >= 10 ? 'ascendant' : 'starter';
  return {
    parcelId: String(raw?.parcelId || ''),
    ownerUid: String(raw?.ownerUid || 'guest'),
    ownerWallet: String(raw?.ownerWallet || ''),
    districtId,
    metadataUri: String(raw?.metadataUri || ''),
    upgradeLevel,
    ascensionTier,
    prestigeScore: Math.max(0, Math.floor(Number(raw?.prestigeScore || 0))),
    revenueStats: {
      gross30d: Math.max(0, Math.floor(Number(raw?.revenueStats?.gross30d || 0))),
      ownerShare30d: Math.max(0, Math.floor(Number(raw?.revenueStats?.ownerShare30d || 0)))
    },
    trafficStats: {
      visits30d: Math.max(0, Math.floor(Number(raw?.trafficStats?.visits30d || 0)))
    },
    modules: raw?.modules && typeof raw.modules === 'object' ? raw.modules : {},
    economics: {
      split: normalizeSplit(raw?.economics?.split)
    },
    visuals: raw?.visuals && typeof raw.visuals === 'object' ? raw.visuals : null,
    updatedAt: String(raw?.updatedAt || nowIso())
  };
}

function loadRegistry() {
  const stored = safeParse(localStorage.getItem(REALM_DISTRICT_REGISTRY_KEY) || 'null', null);
  if (stored && Array.isArray(stored.districts) && stored.districts.length > 0) {
    return stored;
  }
  saveJson(REALM_DISTRICT_REGISTRY_KEY, DEFAULT_REALM_DISTRICT_REGISTRY);
  return DEFAULT_REALM_DISTRICT_REGISTRY;
}

function loadParcels() {
  const registry = loadRegistry();
  const districtIds = registry.districts.map((/** @type {any} */ d) => d.districtId);
  const parsed = safeParse(localStorage.getItem(REALM_PARCELS_KEY) || '[]', []);
  const list = Array.isArray(parsed) ? parsed : [];
  const normalized = list
    .map((/** @type {any} */ entry) => normalizeParcel(entry, districtIds))
    .filter((/** @type {any} */ entry) => entry.parcelId);
  saveJson(REALM_PARCELS_KEY, normalized);
  return normalized;
}

function saveParcels(/** @type {any} */ parcels) {
  saveJson(REALM_PARCELS_KEY, parcels);
}

function makeParcelId(/** @type {any} */ uid, /** @type {any} */ districtId, /** @type {any} */ index) {
  const compact = String(uid || 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'guest';
  return `${districtId}::${compact}-${String(index).padStart(2, '0')}`;
}

function computeVisualHash(/** @type {any} */ parcel) {
  const seed = `${parcel.parcelId}|${parcel.districtId}|${parcel.upgradeLevel}|${parcel.ownerWallet || ''}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `rvh-${(h >>> 0).toString(16)}`;
}

function deterministicVisuals(/** @type {any} */ parcel) {
  return {
    manifestHash: computeVisualHash(parcel),
    colorway: parcel.districtId.includes('cosmic') ? 'cosmic-neon' : parcel.districtId.includes('desert') ? 'amber-dune' : 'void-indigo',
    sigil: parcel.parcelId.slice(-6),
    generatedAt: nowIso()
  };
}

export function getRealmDistrictRegistry() {
  return loadRegistry();
}

export function getRealmParcels() {
  return loadParcels();
}

export function ensureStarterRealmParcels(/** @type {any} */ ownerUid = 'guest', /** @type {any} */ ownerWallet = '') {
  const parcels = loadParcels();
  const registry = loadRegistry();
  const districtIds = registry.districts.map((/** @type {any} */ d) => d.districtId);
  const /** @type {any} */
existingByDistrict = new Set(
    parcels
      .filter((/** @type {any} */ p) => String(p.ownerUid) === String(ownerUid) && String(p.ownerWallet || '') === String(ownerWallet || ''))
      .map((/** @type {any} */ p) => p.districtId)
  );

  const /** @type {any} */
seeded = [];
  let seedIndex = 1;
  for (const /** @type {any} */
districtId of districtIds.slice(0, 3)) {
    if (existingByDistrict.has(districtId)) continue;
    const parcel = normalizeParcel({
      parcelId: makeParcelId(ownerUid, districtId, seedIndex++),
      ownerUid,
      ownerWallet,
      districtId,
      upgradeLevel: 1,
      prestigeScore: 10,
      trafficStats: { visits30d: 20 },
      revenueStats: { gross30d: 120, ownerShare30d: 84 },
      metadataUri: '',
      modules: {},
      visuals: null
    }, districtIds);
    parcels.push(parcel);
    seeded.push(parcel);
  }

  if (seeded.length) saveParcels(parcels);
  return seeded;
}

export function getRealmSummary() {
  const parcels = loadParcels();
  const total = parcels.length;
  const totalPrestige = parcels.reduce((/** @type {any} */ sum, /** @type {any} */ p) => sum + (p.prestigeScore || 0), 0);
  const avgUpgrade = total > 0
    ? Number((parcels.reduce((/** @type {any} */ sum, /** @type {any} */ p) => sum + (p.upgradeLevel || 1), 0) / total).toFixed(2))
    : 0;
  return { total, totalPrestige, avgUpgrade };
}

export function getRealmDistrictPortfolio(/** @type {any} */ ownerWallet = '') {
  const wallet = String(ownerWallet || '').toLowerCase();
  const parcels = loadParcels().filter((/** @type {any} */ p) => !wallet || String(p.ownerWallet || '').toLowerCase() === wallet);
  const registry = loadRegistry();

  const districts = registry.districts.map((/** @type {any} */ d) => {
    const scoped = parcels.filter((/** @type {any} */ p) => p.districtId === d.districtId);
    const visits30d = scoped.reduce((/** @type {any} */ sum, /** @type {any} */ p) => sum + (p.trafficStats?.visits30d || 0), 0);
    const ownerShare30d = scoped.reduce((/** @type {any} */ sum, /** @type {any} */ p) => sum + (p.revenueStats?.ownerShare30d || 0), 0);
    return {
      districtId: d.districtId,
      name: d.name,
      gameId: d.gameId,
      biomeFamily: d.biomeFamily || 'Unknown',
      parcelCount: scoped.length,
      visits30d,
      ownerShare30d
    };
  }).filter((/** @type {any} */ entry) => entry.parcelCount > 0 || !ownerWallet);

  return { districts };
}

export function getDistrictModuleCatalog(/** @type {any} */ districtId) {
  return (/** @type {any} */ (DISTRICT_MODULES))[districtId] || DISTRICT_MODULES.default;
}

export function getAvailableModulesForParcel(/** @type {any} */ parcelId) {
  const parcel = loadParcels().find((/** @type {any} */ p) => p.parcelId === parcelId);
  if (!parcel) return { ok: false, error: 'parcel_not_found', modules: { monetization: [], utility: [], social: [] }, ascensionTier: 'starter' };
  const catalog = getDistrictModuleCatalog(parcel.districtId);
  const level = parcel.upgradeLevel || 1;
  const /** @type {any} */
availableModules = { monetization: [], utility: [], social: [] };
  for (const [kind, moduleList] of Object.entries(catalog)) {
    for (const /** @type {any} */
moduleId of moduleList) {
      const requiredLevel = moduleId.includes('battle-pass') ? 10 : moduleId.includes('telemetry') ? 20 : 1;
      if (level >= requiredLevel) {
        if (!Array.isArray((/** @type {any} */ (availableModules))[kind])) {
          continue;
        }
        (/** @type {any} */ (availableModules))[kind].push(moduleId);
      }
    }
  }
  return { ok: true, ascensionTier: parcel.ascensionTier || 'starter', modules: availableModules };
}

export function applyRealmTrafficTick(/** @type {any} */ parcelId) {
  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => p.parcelId === parcelId);
  if (idx < 0) return { ok: false, error: 'parcel_not_found' };

  const parcel = parcels[idx];
  const tierMeta = ASCENSION_TIER_CATALOG.find((/** @type {any} */ t) => t.tierId === parcel.ascensionTier) || ASCENSION_TIER_CATALOG[0];
  const multiplier = Number(tierMeta?.trafficMultiplier || 1);
  const visitsDelta = Math.max(1, Math.floor((8 + (parcel.upgradeLevel || 1)) * multiplier));
  const ownerShareDelta = Math.max(1, Math.floor((4 + Math.floor((parcel.upgradeLevel || 1) / 2)) * multiplier));
  const grossDelta = Math.max(ownerShareDelta, Math.floor(ownerShareDelta * 1.4));
  const prestigeDelta = Math.max(1, Math.floor(2 * multiplier));

  parcel.trafficStats.visits30d = Number(parcel.trafficStats?.visits30d || 0) + visitsDelta;
  parcel.revenueStats.ownerShare30d = Number(parcel.revenueStats?.ownerShare30d || 0) + ownerShareDelta;
  parcel.revenueStats.gross30d = Number(parcel.revenueStats?.gross30d || 0) + grossDelta;
  parcel.prestigeScore = Number(parcel.prestigeScore || 0) + prestigeDelta;
  parcel.updatedAt = nowIso();

  saveParcels(parcels);
  return {
    ok: true,
    parcel,
    deltas: { visitsDelta, ownerShareDelta, grossDelta, prestigeDelta }
  };
}

export function assignRealmModule(/** @type {any} */ parcelId, /** @type {any} */ kind, /** @type {any} */ moduleId) {
  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => p.parcelId === parcelId);
  if (idx < 0) return { ok: false, error: 'parcel_not_found' };
  const parcel = parcels[idx];
  parcel.modules = parcel.modules || {};
  parcel.modules[kind] = moduleId;
  parcel.updatedAt = nowIso();
  saveParcels(parcels);
  return { ok: true, parcel };
}

export function upgradeRealmParcel(/** @type {any} */ parcelId) {
  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => p.parcelId === parcelId);
  if (idx < 0) return { ok: false, error: 'parcel_not_found' };
  const parcel = parcels[idx];
  parcel.upgradeLevel = Math.min(30, (parcel.upgradeLevel || 1) + 1);
  parcel.ascensionTier = parcel.upgradeLevel >= 20 ? 'mythic' : parcel.upgradeLevel >= 10 ? 'ascendant' : 'starter';
  parcel.prestigeScore = (parcel.prestigeScore || 0) + 8;
  parcel.trafficStats.visits30d = (parcel.trafficStats?.visits30d || 0) + 12;
  parcel.revenueStats.gross30d = (parcel.revenueStats?.gross30d || 0) + 30;
  parcel.revenueStats.ownerShare30d = (parcel.revenueStats?.ownerShare30d || 0) + 21;
  parcel.updatedAt = nowIso();
  saveParcels(parcels);
  return { ok: true, parcel };
}

export function updateRealmParcelMetadataUri(/** @type {any} */ parcelId, /** @type {any} */ metadataUri) {
  const nextUri = String(metadataUri || '').trim();
  if (nextUri && !/^ipfs:\/\//i.test(nextUri) && !/^local:\/\//i.test(nextUri)) {
    return { ok: false, error: 'invalid_uri' };
  }
  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => p.parcelId === parcelId);
  if (idx < 0) return { ok: false, error: 'parcel_not_found' };
  parcels[idx].metadataUri = nextUri;
  parcels[idx].updatedAt = nowIso();
  saveParcels(parcels);
  return { ok: true, parcel: parcels[idx] };
}

export function generateRealmParcelVisuals(/** @type {any} */ parcelId, /** @type {any} */ options = {}) {
  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => p.parcelId === parcelId);
  if (idx < 0) return { ok: false, error: 'parcel_not_found' };
  const parcel = parcels[idx];
  const visuals = deterministicVisuals(parcel);
  if ((/** @type {any} */ (options)).persist !== false) {
    parcel.visuals = visuals;
    parcel.updatedAt = nowIso();
    saveParcels(parcels);
  }
  return { ok: true, parcel, visuals };
}

export function runRealmParcelDeterminismCheck(/** @type {any} */ parcelId, /** @type {any} */ options = {}) {
  const iterations = Math.max(1, Math.min(12, Number((/** @type {any} */ (options)).iterations || 3)));
  const parcel = loadParcels().find((/** @type {any} */ p) => p.parcelId === parcelId);
  if (!parcel) return { ok: false, error: 'parcel_not_found' };
  const baseline = deterministicVisuals(parcel).manifestHash;
  for (let i = 0; i < iterations; i += 1) {
    if (deterministicVisuals(parcel).manifestHash !== baseline) {
      return { ok: true, deterministic: { ok: false, mismatchAt: i + 1, iterations, baselineManifestHash: baseline } };
    }
  }
  return { ok: true, deterministic: { ok: true, iterations, baselineManifestHash: baseline } };
}

export function buildRealmDeedMintQueue(/** @type {any} */ options = {}) {
  const ownerWallet = String((/** @type {any} */ (options)).ownerWallet || '').trim();
  const parcels = loadParcels();
  const /** @type {any} */
queue = [];
  let skipped = 0;
  for (const /** @type {any} */
parcel of parcels) {
    if (ownerWallet && String(parcel.ownerWallet || '').toLowerCase() !== ownerWallet.toLowerCase()) {
      skipped += 1;
      continue;
    }
    queue.push({
      parcelId: parcel.parcelId,
      districtId: parcel.districtId,
      ownerWallet: parcel.ownerWallet,
      metadataUri: parcel.metadataUri || `ipfs://pending/${parcel.parcelId}`,
      network: (/** @type {any} */ (options)).network || 'polygon',
      mintMode: (/** @type {any} */ (options)).mintMode || 'admin',
      royaltyBps: Number((/** @type {any} */ (options)).defaultRoyaltyBps || 550)
    });
  }
  return {
    queue,
    stats: { queued: queue.length, skipped }
  };
}

export function prepareRealmTransfer(/** @type {any} */ parcelId, /** @type {any} */ toWallet) {
  const wallet = String(toWallet || '').trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return { ok: false, error: 'invalid_wallet' };
  }
  const parcel = loadParcels().find((/** @type {any} */ p) => p.parcelId === parcelId);
  if (!parcel) return { ok: false, error: 'parcel_not_found' };
  const /** @type {any} */
transfer = {
    transferId: `xfer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    parcelId: parcel.parcelId,
    fromWallet: parcel.ownerWallet || '',
    toWallet: wallet,
    preparedAt: nowIso()
  };
  const log = safeParse(localStorage.getItem(REALM_TRANSFER_LOG_KEY) || '[]', []);
  const nextLog = Array.isArray(log) ? log : [];
  nextLog.unshift(transfer);
  saveJson(REALM_TRANSFER_LOG_KEY, nextLog.slice(0, 120));
  return { ok: true, transfer };
}

export function exportRealmBundle(/** @type {any} */ parcelId) {
  const parcel = loadParcels().find((/** @type {any} */ p) => p.parcelId === parcelId);
  if (!parcel) return '';
  return JSON.stringify({
    bundleType: 'realm-parcel',
    version: 1,
    exportedAt: nowIso(),
    parcel,
    visuals: parcel.visuals || deterministicVisuals(parcel)
  }, null, 2);
}

export function importRealmBundle(/** @type {any} */ bundleJson, /** @type {any} */ options = {}) {
  let /** @type {any} */
parsed;
  try {
    parsed = JSON.parse(String(bundleJson || ''));
  } catch {
    return { ok: false, error: 'invalid_json' };
  }
  if (!parsed || parsed.bundleType !== 'realm-parcel' || !parsed.parcel) {
    return { ok: false, error: 'invalid_bundle' };
  }

  const parcels = loadParcels();
  const registry = loadRegistry();
  const districtIds = registry.districts.map((/** @type {any} */ d) => d.districtId);
  const incoming = normalizeParcel(parsed.parcel, districtIds);
  if (!incoming.parcelId) return { ok: false, error: 'invalid_parcel' };
  if ((/** @type {any} */ (options)).adoptOwnershipAddress) {
    incoming.ownerWallet = String((/** @type {any} */ (options)).adoptOwnershipAddress);
  }

  const idx = parcels.findIndex((/** @type {any} */ p) => p.parcelId === incoming.parcelId);
  if (idx >= 0) {
    parcels[idx] = { ...parcels[idx], ...incoming, updatedAt: nowIso() };
  } else {
    parcels.push({ ...incoming, updatedAt: nowIso() });
  }
  saveParcels(parcels);

  return { ok: true, parcel: incoming };
}

export function replayRealmBundleVisuals(/** @type {any} */ bundleJson) {
  let /** @type {any} */
parsed;
  try {
    parsed = JSON.parse(String(bundleJson || ''));
  } catch {
    return { ok: false, error: 'invalid_json' };
  }
  if (!parsed?.parcel) return { ok: false, error: 'invalid_bundle' };
  const localVisual = deterministicVisuals(parsed.parcel);
  const importedHash = parsed?.visuals?.manifestHash || '';
  const match = importedHash ? importedHash === localVisual.manifestHash : true;
  return {
    ok: true,
    replay: {
      verdict: match ? 'match' : 'visual-match-metadata-mismatch',
      diffSummary: match
        ? 'Visual manifest hash matches deterministic replay output.'
        : `Imported hash ${importedHash} differs from replay hash ${localVisual.manifestHash}.`
    }
  };
}
