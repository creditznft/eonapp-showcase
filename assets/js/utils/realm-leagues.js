const REALM_LEAGUES_KEY = 'eon:realm:leagues:v1';

export const /** @type {any} */
LEAGUE_TIERS = [
  { tierId: 'bronze', label: 'Bronze', color: '#b36b33', minScore: 0 },
  { tierId: 'silver', label: 'Silver', color: '#7f95a7', minScore: 150 },
  { tierId: 'gold', label: 'Gold', color: '#c8a32d', minScore: 320 },
  { tierId: 'platinum', label: 'Platinum', color: '#3cb9b2', minScore: 560 },
  { tierId: 'diamond', label: 'Diamond', color: '#6f8eff', minScore: 900 }
];

function safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getParcels() {
  const parsed = safeParse(localStorage.getItem('eon:realm:parcels:v2') || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function loadStore() {
  const parsed = safeParse(localStorage.getItem(REALM_LEAGUES_KEY) || '{}', {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function saveStore(/** @type {any} */ store) {
  try {
    localStorage.setItem(REALM_LEAGUES_KEY, JSON.stringify(store));
  } catch {
    // Best-effort persistence.
  }
}

function tierFromScore(/** @type {any} */ score) {
  let current = LEAGUE_TIERS[0];
  for (const /** @type {any} */
tier of LEAGUE_TIERS) {
    if (score >= tier.minScore) {
      current = tier;
    }
  }
  return current;
}

function rankRows(/** @type {any} */ rows) {
  const sorted = rows.slice().sort((/** @type {any} */ a, /** @type {any} */ b) => b.score - a.score);
  return sorted.map((/** @type {any} */ row, /** @type {any} */ idx) => ({
    ...row,
    leagueRank: idx + 1
  }));
}

function materializeStandings() {
  const store = loadStore();
  const parcels = getParcels();
  const /** @type {any} */
current = [];

  for (const /** @type {any} */
parcel of parcels) {
    const id = String(parcel?.parcelId || '');
    if (!id) continue;
    const existing = store[id] || { promotions: 0, demotions: 0 };
    const visits = Number(parcel?.trafficStats?.visits30d || 0);
    const prestige = Number(parcel?.prestigeScore || 0);
    const ownerShare = Number(parcel?.revenueStats?.ownerShare30d || 0);
    const score = Math.floor(visits * 0.8 + prestige * 1.4 + ownerShare * 0.02);
    const tier = tierFromScore(score);

    current.push({
      parcelId: id,
      districtId: String(parcel?.districtId || ''),
      score,
      tierId: tier.tierId,
      promotions: Number(existing.promotions || 0),
      demotions: Number(existing.demotions || 0)
    });
  }

  return rankRows(current);
}

export function getLeagueTierCatalog() {
  return LEAGUE_TIERS.map((/** @type {any} */ tier) => ({ ...tier }));
}

export function enrollParcelInLeague(/** @type {any} */ parcelId) {
  const pid = String(parcelId || '').trim();
  if (!pid) return { ok: false, error: 'missing_parcel_id' };

  const parcels = getParcels();
  const exists = parcels.some((/** @type {any} */ p) => String(p?.parcelId) === pid);
  if (!exists) return { ok: false, error: 'parcel_not_found' };

  const store = loadStore();
  if (store[pid]) {
    return { ok: false, error: 'already_enrolled', status: store[pid] };
  }

  store[pid] = {
    parcelId: pid,
    promotions: 0,
    demotions: 0,
    lastTierId: 'bronze',
    enrolledAt: new Date().toISOString()
  };
  saveStore(store);
  return { ok: true, status: store[pid] };
}

export function getParcelLeagueStatus(/** @type {any} */ parcelId) {
  const standings = materializeStandings();
  return standings.find((/** @type {any} */ row) => row.parcelId === String(parcelId || '')) || null;
}

export function promoteParcel(/** @type {any} */ parcelId) {
  const pid = String(parcelId || '').trim();
  const store = loadStore();
  if (!store[pid]) return { ok: false, error: 'not_enrolled' };
  store[pid].promotions = Number(store[pid].promotions || 0) + 1;
  saveStore(store);
  return { ok: true, status: store[pid] };
}

export function demoteParcel(/** @type {any} */ parcelId) {
  const pid = String(parcelId || '').trim();
  const store = loadStore();
  if (!store[pid]) return { ok: false, error: 'not_enrolled' };
  store[pid].demotions = Number(store[pid].demotions || 0) + 1;
  saveStore(store);
  return { ok: true, status: store[pid] };
}

export function tickLeagueStandings() {
  const store = loadStore();
  const before = materializeStandings();
  let promotions = 0;
  let demotions = 0;

  for (const /** @type {any} */
row of before) {
    const prevTier = store[row.parcelId]?.lastTierId || 'bronze';
    if (!store[row.parcelId]) {
      store[row.parcelId] = { parcelId: row.parcelId, promotions: 0, demotions: 0, lastTierId: row.tierId };
      continue;
    }

    const prevIndex = LEAGUE_TIERS.findIndex((/** @type {any} */ tier) => tier.tierId === prevTier);
    const nextIndex = LEAGUE_TIERS.findIndex((/** @type {any} */ tier) => tier.tierId === row.tierId);

    if (nextIndex > prevIndex) {
      store[row.parcelId].promotions = Number(store[row.parcelId].promotions || 0) + 1;
      promotions += 1;
    } else if (nextIndex < prevIndex) {
      store[row.parcelId].demotions = Number(store[row.parcelId].demotions || 0) + 1;
      demotions += 1;
    }

    store[row.parcelId].lastTierId = row.tierId;
    store[row.parcelId].lastTickAt = new Date().toISOString();
  }

  saveStore(store);
  return {
    ok: true,
    updated: before.length,
    promotions,
    demotions
  };
}

export function getLeagueStandings(/** @type {any} */ options = {}) {
  const limit = Math.max(1, Number(options?.limit || 50));
  const standings = materializeStandings();
  const store = loadStore();

  return standings.slice(0, limit).map((/** @type {any} */ row) => ({
    ...row,
    promotions: Number(store[row.parcelId]?.promotions || row.promotions || 0),
    demotions: Number(store[row.parcelId]?.demotions || row.demotions || 0)
  }));
}

export function getDistrictCompetitionRankings() {
  const standings = materializeStandings();
  const /** @type {any} */
byDistrict = new Map();

  for (const /** @type {any} */
row of standings) {
    const districtId = row.districtId || 'unknown';
    const bucket = byDistrict.get(districtId) || {
      districtId,
      parcelCount: 0,
      totalScore: 0,
      topTier: 'bronze'
    };
    bucket.parcelCount += 1;
    bucket.totalScore += row.score;

    const currentTop = LEAGUE_TIERS.find((/** @type {any} */ tier) => tier.tierId === bucket.topTier) || LEAGUE_TIERS[0];
    const incoming = LEAGUE_TIERS.find((/** @type {any} */ tier) => tier.tierId === row.tierId) || LEAGUE_TIERS[0];
    if (incoming.minScore > currentTop.minScore) {
      bucket.topTier = incoming.tierId;
    }

    byDistrict.set(districtId, bucket);
  }

  const rows = Array.from(byDistrict.values()).map((/** @type {any} */ row) => ({
    ...row,
    avgScore: row.parcelCount > 0 ? Number((row.totalScore / row.parcelCount).toFixed(2)) : 0
  })).sort((/** @type {any} */ a, /** @type {any} */ b) => b.totalScore - a.totalScore);

  return rows.map((/** @type {any} */ row, /** @type {any} */ idx) => ({
    districtRank: idx + 1,
    ...row
  }));
}
