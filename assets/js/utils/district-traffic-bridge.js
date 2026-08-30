const DISTRICT_ACTIVITY_KEY = 'eon:realm:district-activity:v1';

const /** @type {any} */
DISTRICT_EVENT_CATALOG = {
  default: [
    { eventType: 'festival', label: 'Festival Rush', visitsBase: 16, prestigeGain: 10, cooldownSec: 45 },
    { eventType: 'boss-raid', label: 'Boss Raid', visitsBase: 24, prestigeGain: 16, cooldownSec: 75 },
    { eventType: 'market-surge', label: 'Market Surge', visitsBase: 12, prestigeGain: 8, cooldownSec: 35 }
  ],
  'cosmic-arena-sector': [
    { eventType: 'duel-cup', label: 'Duel Cup', visitsBase: 26, prestigeGain: 18, cooldownSec: 90 },
    { eventType: 'starfall-league', label: 'Starfall League', visitsBase: 20, prestigeGain: 14, cooldownSec: 70 }
  ]
};

function safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadParcels() {
  const parsed = safeParse(localStorage.getItem('eon:realm:parcels:v2') || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveParcels(/** @type {any} */ parcels) {
  try {
    localStorage.setItem('eon:realm:parcels:v2', JSON.stringify(parcels));
  } catch {
    // Best-effort persistence.
  }
}

function loadActivity() {
  const parsed = safeParse(localStorage.getItem(DISTRICT_ACTIVITY_KEY) || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveActivity(/** @type {any} */ activity) {
  try {
    localStorage.setItem(DISTRICT_ACTIVITY_KEY, JSON.stringify(activity.slice(0, 1500)));
  } catch {
    // Best-effort persistence.
  }
}

function getCatalogForDistrict(/** @type {any} */ districtId) {
  return (/** @type {any} */ (DISTRICT_EVENT_CATALOG))[districtId] || DISTRICT_EVENT_CATALOG.default;
}

export function getDistrictEventCatalog(/** @type {any} */ districtId) {
  return getCatalogForDistrict(districtId).map((/** @type {any} */ entry) => ({
    eventType: entry.eventType,
    label: entry.label
  }));
}

export function dispatchGameEvent(/** @type {any} */ parcelId, /** @type {any} */ eventType, /** @type {any} */ meta = {}) {
  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => String(p?.parcelId) === String(parcelId));
  if (idx < 0) {
    return { ok: false, error: 'parcel_not_found' };
  }

  const parcel = parcels[idx];
  const districtId = String(parcel?.districtId || '');
  const eventDef = getCatalogForDistrict(districtId).find((/** @type {any} */ entry) => entry.eventType === eventType);
  if (!eventDef) {
    return { ok: false, error: 'event_not_supported' };
  }

  const activity = loadActivity();
  const nowMs = Date.now();
  const recent = activity.find((/** @type {any} */ entry) => entry.parcelId === parcelId && entry.eventType === eventType);
  if (recent && nowMs - Number(recent.timestampMs || 0) < eventDef.cooldownSec * 1000) {
    const elapsed = Math.floor((nowMs - Number(recent.timestampMs || 0)) / 1000);
    return { ok: false, error: 'event_on_cooldown', cooldownSec: Math.max(0, eventDef.cooldownSec - elapsed) };
  }

  const upgradeLevel = Number(parcel?.upgradeLevel || 1);
  const visitsDelta = Math.max(1, Math.floor(eventDef.visitsBase + upgradeLevel * 0.8));
  const ownerShareDelta = Math.max(1, Math.floor(visitsDelta * 0.55));
  const grossDelta = Math.max(ownerShareDelta, Math.floor(ownerShareDelta * 1.35));

  parcel.trafficStats = parcel.trafficStats || { visits30d: 0 };
  parcel.revenueStats = parcel.revenueStats || { gross30d: 0, ownerShare30d: 0 };
  parcel.trafficStats.visits30d = Number(parcel.trafficStats.visits30d || 0) + visitsDelta;
  parcel.revenueStats.ownerShare30d = Number(parcel.revenueStats.ownerShare30d || 0) + ownerShareDelta;
  parcel.revenueStats.gross30d = Number(parcel.revenueStats.gross30d || 0) + grossDelta;
  parcel.prestigeScore = Number(parcel.prestigeScore || 0) + eventDef.prestigeGain;
  parcel.updatedAt = new Date(nowMs).toISOString();
  parcels[idx] = parcel;
  saveParcels(parcels);

  activity.unshift({
    eventId: `dact-${nowMs.toString(36)}-${crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'')}`,
    parcelId,
    districtId,
    eventType,
    label: eventDef.label,
    visitsDelta,
    ownerShareDelta,
    grossDelta,
    prestigeGain: eventDef.prestigeGain,
    source: String((/** @type {any} */ (meta))?.source || 'manual'),
    timestampMs: nowMs,
    timestampIso: new Date(nowMs).toISOString()
  });
  saveActivity(activity);

  return {
    ok: true,
    label: eventDef.label,
    deltas: { visitsDelta, ownerShareDelta, grossDelta },
    prestigeGain: eventDef.prestigeGain
  };
}

export function getDistrictActivitySummary() {
  const activity = loadActivity();
  const /** @type {any} */
byDistrict = new Map();

  for (const /** @type {any} */
row of activity) {
    const districtId = String(row?.districtId || 'unknown');
    const current = byDistrict.get(districtId) || {
      districtId,
      totalEvents: 0,
      totalVisitsDelta: 0,
      topEventType: ''
    };
    current.totalEvents += 1;
    current.totalVisitsDelta += Number(row?.visitsDelta || 0);
    if (!current.topEventType) {
      current.topEventType = String(row?.eventType || '');
    }
    byDistrict.set(districtId, current);
  }

  return Array.from(byDistrict.values()).sort((/** @type {any} */ a, /** @type {any} */ b) => b.totalVisitsDelta - a.totalVisitsDelta);
}
