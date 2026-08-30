const REALM_SEASONS_KEY = 'eon:realm:seasons:v1';

export const /** @type {any} */
SEASON_PRESET_CATALOG = [
  {
    presetId: 'genesis-sprint',
    label: 'Genesis Sprint',
    durationDays: 14,
    seasonTheme: 'Genesis Heat',
    trafficMultiplier: 1.1,
    description: 'Fast bootstrap season for early district momentum.'
  },
  {
    presetId: 'storm-cycle',
    label: 'Storm Cycle',
    durationDays: 21,
    seasonTheme: 'Storm Rotation',
    trafficMultiplier: 1.2,
    description: 'Higher volatility and stronger district competition.'
  },
  {
    presetId: 'ascension-open',
    label: 'Ascension Open',
    durationDays: 30,
    seasonTheme: 'Ascension Ladder',
    trafficMultiplier: 1.3,
    description: 'Long-form competitive season for tier progression.'
  }
];

function safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadStore() {
  const parsed = safeParse(localStorage.getItem(REALM_SEASONS_KEY) || 'null', null);
  if (parsed && Array.isArray(parsed.seasons)) {
    return parsed;
  }
  const /** @type {any} */
initial = { seasons: [], visits: {} };
  saveStore(initial);
  return initial;
}

function saveStore(/** @type {any} */ store) {
  try {
    localStorage.setItem(REALM_SEASONS_KEY, JSON.stringify(store));
  } catch {
    // Best-effort persistence.
  }
}

function getParcels() {
  const parsed = safeParse(localStorage.getItem('eon:realm:parcels:v2') || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeSeason(/** @type {any} */ season) {
  const startsAtMs = Number(season.startsAtMs || Date.now());
  const durationDays = Number(season.durationDays || 14);
  const endsAtMs = Number(season.endsAtMs || startsAtMs + durationDays * 86400000);
  return {
    seasonId: String(season.seasonId || ''),
    presetId: String(season.presetId || ''),
    label: String(season.label || season.seasonId || 'Season'),
    seasonTheme: String(season.seasonTheme || ''),
    description: String(season.description || ''),
    trafficMultiplier: Number(season.trafficMultiplier || 1),
    durationDays,
    startsAtMs,
    startsAt: new Date(startsAtMs).toISOString(),
    endsAtMs,
    endsAt: new Date(endsAtMs).toISOString(),
    status: String(season.status || 'active')
  };
}

function activeSeasonFrom(/** @type {any} */ store) {
  return (store.seasons || []).map((/** @type {any} */ s) => normalizeSeason(s)).find((/** @type {any} */ s) => s.status === 'active') || null;
}

function leaderboardFromStore(/** @type {any} */ store) {
  const active = activeSeasonFrom(store);
  if (!active) return [];
  const key = active.seasonId;
  const visitsMap = store.visits?.[key] || {};
  const parcels = getParcels();

  const rows = parcels.map((/** @type {any} */ parcel) => {
    const visits = Number(visitsMap[String(parcel.parcelId)] || 0);
    const prestige = Number(parcel?.prestigeScore || 0);
    const score = Math.floor(visits * active.trafficMultiplier + prestige);
    return {
      parcelId: String(parcel.parcelId),
      districtId: String(parcel.districtId || ''),
      visits,
      prestige,
      score
    };
  }).sort((/** @type {any} */ a, /** @type {any} */ b) => b.score - a.score);

  return rows.map((/** @type {any} */ row, /** @type {any} */ idx) => ({
    rank: idx + 1,
    ...row,
    trophy: idx === 0 ? 'Champion' : idx === 1 ? 'Runner-up' : idx === 2 ? 'Bronze' : ''
  }));
}

export function getSeasonPresetCatalog() {
  return SEASON_PRESET_CATALOG.map((/** @type {any} */ preset) => ({ ...preset }));
}

export function getSeasons_all() {
  const store = loadStore();
  return (store.seasons || []).map((/** @type {any} */ s) => normalizeSeason(s));
}

export function getActiveSeason() {
  const store = loadStore();
  const active = activeSeasonFrom(store);
  if (!active) return null;
  if (active.endsAtMs <= Date.now()) {
    endSeason(active.seasonId);
    return null;
  }
  return active;
}

export function startSeason(/** @type {any} */ seasonId, /** @type {any} */ options = {}) {
  const sid = String(seasonId || '').trim();
  if (!sid) return { ok: false, error: 'missing_season_id' };

  const store = loadStore();
  const current = activeSeasonFrom(store);
  if (current) {
    return { ok: false, error: 'another_season_active', season: current };
  }

  const presetId = String((/** @type {any} */ (options))?.presetId || 'genesis-sprint');
  const preset = SEASON_PRESET_CATALOG.find((/** @type {any} */ entry) => entry.presetId === presetId);
  if (!preset) {
    return { ok: false, error: 'preset_not_found' };
  }

  const startsAtMs = Date.now();
  const season = normalizeSeason({
    seasonId: sid,
    presetId,
    label: preset.label,
    seasonTheme: preset.seasonTheme,
    description: preset.description,
    trafficMultiplier: preset.trafficMultiplier,
    durationDays: preset.durationDays,
    startsAtMs,
    endsAtMs: startsAtMs + preset.durationDays * 86400000,
    status: 'active'
  });

  store.seasons.unshift(season);
  store.visits = store.visits || {};
  store.visits[sid] = {};
  saveStore(store);

  return { ok: true, season };
}

export function recordSeasonVisit(/** @type {any} */ parcelId, /** @type {any} */ visitDelta = 1) {
  const store = loadStore();
  const active = activeSeasonFrom(store);
  if (!active) return { ok: false, error: 'no_active_season' };

  const sid = active.seasonId;
  store.visits = store.visits || {};
  store.visits[sid] = store.visits[sid] || {};
  const key = String(parcelId || '');
  store.visits[sid][key] = Number(store.visits[sid][key] || 0) + Math.max(0, Number(visitDelta || 0));
  saveStore(store);

  return { ok: true, seasonId: sid, parcelId: key, visits: store.visits[sid][key] };
}

export function getSeasonLeaderboard() {
  const store = loadStore();
  return leaderboardFromStore(store);
}

export function endSeason(/** @type {any} */ seasonId) {
  const sid = String(seasonId || '').trim();
  if (!sid) return { ok: false, error: 'missing_season_id' };

  const store = loadStore();
  const idx = (store.seasons || []).findIndex((/** @type {any} */ s) => String(s?.seasonId) === sid);
  if (idx < 0) return { ok: false, error: 'season_not_found' };

  const season = normalizeSeason(store.seasons[idx]);
  if (season.status !== 'ended') {
    season.status = 'ended';
    season.endsAtMs = Date.now();
    season.endsAt = new Date(season.endsAtMs).toISOString();
    store.seasons[idx] = season;
    saveStore(store);
  }

  const finalRankings = leaderboardFromStore(store);
  return { ok: true, season, finalRankings };
}

export function applySeasonalReset(/** @type {any} */ scope = '*') {
  const parcels = getParcels();
  let resetCount = 0;

  for (const /** @type {any} */
parcel of parcels) {
    if (scope !== '*' && String(parcel.parcelId) !== String(scope)) continue;
    if (!parcel.trafficStats) parcel.trafficStats = { visits30d: 0 };
    parcel.trafficStats.visits30d = 0;
    resetCount += 1;
  }

  try {
    localStorage.setItem('eon:realm:parcels:v2', JSON.stringify(parcels));
  } catch {
    // Best-effort persistence.
  }

  return { ok: true, resetCount };
}
