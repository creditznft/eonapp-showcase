const REALM_EVENTS_KEY = 'eon:realm:events:v2';

const /** @type {any} */
EVENT_PRESETS = {
  default: [
    { presetId: 'rush-hour', label: 'Rush Hour', eventType: 'festival', durationSec: 2700, participantTickBase: 18, grossTickBase: 120, prestigeGainOnEnd: 15 },
    { presetId: 'prime-time', label: 'Prime Time', eventType: 'market-surge', durationSec: 5400, participantTickBase: 12, grossTickBase: 90, prestigeGainOnEnd: 10 }
  ],
  'cosmic-arena-sector': [
    { presetId: 'arena-night', label: 'Arena Night', eventType: 'duel-cup', durationSec: 3600, participantTickBase: 24, grossTickBase: 160, prestigeGainOnEnd: 18 }
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

function loadEvents() {
  const parsed = safeParse(localStorage.getItem(REALM_EVENTS_KEY) || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveEvents(/** @type {any} */ events) {
  try {
    localStorage.setItem(REALM_EVENTS_KEY, JSON.stringify(events.slice(0, 1500)));
  } catch {
    // Best-effort persistence.
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

function presetsForDistrict(/** @type {any} */ districtId) {
  return (/** @type {any} */ (EVENT_PRESETS))[districtId] || EVENT_PRESETS.default;
}

function normalizeEvent(/** @type {any} */ event) {
  const startedAtMs = Number(event.startedAtMs || Date.now());
  const durationSec = Math.max(60, Number(event.durationSec || 3600));
  const activeUntilMs = Number(event.activeUntilMs || (startedAtMs + durationSec * 1000));
  const participantCount = Math.max(0, Number(event.participantCount || 0));

  return {
    eventId: String(event.eventId || `revt-${startedAtMs.toString(36)}-${crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'')}`),
    parcelId: String(event.parcelId || ''),
    districtId: String(event.districtId || ''),
    eventType: String(event.eventType || 'festival'),
    label: String(event.label || 'Realm Event'),
    state: String(event.state || 'active'),
    startedAtMs,
    startedAt: new Date(startedAtMs).toISOString(),
    durationSec,
    activeUntilMs,
    activeUntil: new Date(activeUntilMs).toISOString(),
    participantCount,
    participantTickBase: Math.max(1, Number(event.participantTickBase || 12)),
    grossTickBase: Math.max(1, Number(event.grossTickBase || 80)),
    prestigeGainOnEnd: Math.max(0, Number(event.prestigeGainOnEnd || 10))
  };
}

function writeNormalized(/** @type {any} */ events) {
  const normalized = events.map((/** @type {any} */ entry) => normalizeEvent(entry)).filter((/** @type {any} */ entry) => entry.parcelId);
  saveEvents(normalized);
  return normalized;
}

function findParcel(/** @type {any} */ parcelId) {
  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => String(p?.parcelId) === String(parcelId));
  return { parcels, idx };
}

export function getEventPresetCatalog(/** @type {any} */ districtId) {
  return presetsForDistrict(String(districtId || '')).map((/** @type {any} */ preset) => ({
    presetId: preset.presetId,
    label: preset.label,
    eventType: preset.eventType,
    durationSec: preset.durationSec
  }));
}

export function getRealmEvents(/** @type {any} */ filter = {}) {
  const events = writeNormalized(loadEvents());
  const list = events.filter((/** @type {any} */ event) => {
    if ((/** @type {any} */ (filter))?.parcelId && event.parcelId !== String((/** @type {any} */ (filter)).parcelId)) return false;
    if ((/** @type {any} */ (filter))?.districtId && event.districtId !== String((/** @type {any} */ (filter)).districtId)) return false;
    if ((/** @type {any} */ (filter))?.state && event.state !== String((/** @type {any} */ (filter)).state)) return false;
    return true;
  }).sort((/** @type {any} */ a, /** @type {any} */ b) => b.startedAtMs - a.startedAtMs);

  const limit = Number((/** @type {any} */ (filter))?.limit || 0);
  if (limit > 0) return list.slice(0, limit);
  return list;
}

export function activateRealmEvent(/** @type {any} */ parcelId, /** @type {any} */ presetId) {
  const pid = String(parcelId || '').trim();
  const sid = String(presetId || '').trim();
  if (!pid || !sid) return { ok: false, error: 'missing_fields' };

  const { parcels, idx } = findParcel(pid);
  if (idx < 0) return { ok: false, error: 'parcel_not_found' };
  const parcel = parcels[idx];

  const preset = presetsForDistrict(String(parcel?.districtId || '')).find((/** @type {any} */ entry) => entry.presetId === sid);
  if (!preset) return { ok: false, error: 'preset_not_found' };

  const nowMs = Date.now();
  const events = getRealmEvents({ parcelId: pid });
  const activeExists = events.some((/** @type {any} */ event) => event.state === 'active' && event.activeUntilMs > nowMs);
  if (activeExists) {
    return { ok: false, error: 'event_already_active_or_scheduled' };
  }

  const event = normalizeEvent({
    eventId: `revt-${nowMs.toString(36)}-${crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'')}`,
    parcelId: pid,
    districtId: String(parcel?.districtId || ''),
    eventType: preset.eventType,
    label: preset.label,
    state: 'active',
    startedAtMs: nowMs,
    durationSec: preset.durationSec,
    activeUntilMs: nowMs + preset.durationSec * 1000,
    participantCount: 0,
    participantTickBase: preset.participantTickBase,
    grossTickBase: preset.grossTickBase,
    prestigeGainOnEnd: preset.prestigeGainOnEnd
  });

  const /** @type {any} */
merged = [event, ...loadEvents()];
  writeNormalized(merged);
  return { ok: true, event };
}

export function tickRealmEventParticipation(/** @type {any} */ eventId) {
  const eid = String(eventId || '').trim();
  if (!eid) return { ok: false, error: 'missing_event_id' };

  const nowMs = Date.now();
  const events = writeNormalized(loadEvents());
  const idx = events.findIndex((/** @type {any} */ event) => event.eventId === eid);
  if (idx < 0) return { ok: false, error: 'event_not_found' };

  const event = events[idx];
  if (event.state !== 'active') return { ok: false, error: 'event_not_active' };

  if (event.activeUntilMs <= nowMs) {
    event.state = 'ended';
    events[idx] = event;
    saveEvents(events);
    return { ok: false, error: 'event_expired' };
  }

  const visitsDelta = Math.max(1, Math.floor(event.participantTickBase));
  const grossDelta = Math.max(1, Math.floor(event.grossTickBase));

  event.participantCount += visitsDelta;
  events[idx] = event;
  saveEvents(events);

  const { parcels, idx: parcelIdx } = findParcel(event.parcelId);
  if (parcelIdx >= 0) {
    const parcel = parcels[parcelIdx];
    parcel.trafficStats = parcel.trafficStats || { visits30d: 0 };
    parcel.revenueStats = parcel.revenueStats || { gross30d: 0, ownerShare30d: 0 };
    parcel.trafficStats.visits30d = Number(parcel.trafficStats.visits30d || 0) + visitsDelta;
    parcel.revenueStats.gross30d = Number(parcel.revenueStats.gross30d || 0) + grossDelta;
    parcel.revenueStats.ownerShare30d = Number(parcel.revenueStats.ownerShare30d || 0) + Math.floor(grossDelta * 0.55);
    parcel.updatedAt = new Date().toISOString();
    parcels[parcelIdx] = parcel;
    saveParcels(parcels);
  }

  return { ok: true, visitsDelta, grossDelta, event };
}

export function endRealmEvent(/** @type {any} */ eventId) {
  const eid = String(eventId || '').trim();
  if (!eid) return { ok: false, error: 'missing_event_id' };

  const events = writeNormalized(loadEvents());
  const idx = events.findIndex((/** @type {any} */ event) => event.eventId === eid);
  if (idx < 0) return { ok: false, error: 'event_not_found' };

  const event = events[idx];
  if (event.state !== 'ended') {
    event.state = 'ended';
    event.activeUntilMs = Date.now();
    event.activeUntil = new Date(event.activeUntilMs).toISOString();
    events[idx] = event;
    saveEvents(events);

    const { parcels, idx: parcelIdx } = findParcel(event.parcelId);
    if (parcelIdx >= 0) {
      const parcel = parcels[parcelIdx];
      parcel.prestigeScore = Number(parcel.prestigeScore || 0) + Number(event.prestigeGainOnEnd || 0);
      parcel.updatedAt = new Date().toISOString();
      parcels[parcelIdx] = parcel;
      saveParcels(parcels);
    }
  }

  return { ok: true, event };
}

export function sweepExpiredEvents() {
  const nowMs = Date.now();
  const events = writeNormalized(loadEvents());
  let changed = 0;
  for (const /** @type {any} */
event of events) {
    if (event.state === 'active' && event.activeUntilMs <= nowMs) {
      event.state = 'ended';
      changed += 1;
    }
  }
  if (changed > 0) {
    saveEvents(events);
  }
  return { changed, total: events.length };
}

export function buildDistrictHeatmap() {
  const events = getRealmEvents();
  const parcels = loadParcels();
  const /** @type {any} */
byDistrict = new Map();

  for (const /** @type {any} */
parcel of parcels) {
    const districtId = String(parcel?.districtId || 'unknown');
    const row = byDistrict.get(districtId) || {
      districtId,
      totalVisits30d: 0,
      totalPrestige: 0,
      parcelCount: 0,
      avgUpgrade: 0,
      topParcelId: ''
    };
    row.parcelCount += 1;
    row.totalVisits30d += Number(parcel?.trafficStats?.visits30d || 0);
    row.totalPrestige += Number(parcel?.prestigeScore || 0);
    row.avgUpgrade += Number(parcel?.upgradeLevel || 1);
    const topCurrentVisits = row.topParcelId
      ? Number(parcels.find((/** @type {any} */ p) => p.parcelId === row.topParcelId)?.trafficStats?.visits30d || 0)
      : -1;
    const parcelVisits = Number(parcel?.trafficStats?.visits30d || 0);
    if (!row.topParcelId || parcelVisits > topCurrentVisits) {
      row.topParcelId = String(parcel?.parcelId || '');
    }
    byDistrict.set(districtId, row);
  }

  for (const /** @type {any} */
event of events) {
    const districtId = String(event?.districtId || 'unknown');
    const row = byDistrict.get(districtId) || {
      districtId,
      totalVisits30d: 0,
      totalPrestige: 0,
      parcelCount: 0,
      avgUpgrade: 0,
      topParcelId: ''
    };
    row.totalVisits30d += Number(event?.participantCount || 0);
    byDistrict.set(districtId, row);
  }

  return Array.from(byDistrict.values())
    .map((/** @type {any} */ row) => ({
      ...row,
      avgUpgrade: row.parcelCount > 0 ? Number((row.avgUpgrade / row.parcelCount).toFixed(2)) : 0
    }))
    .sort((/** @type {any} */ a, /** @type {any} */ b) => b.totalVisits30d - a.totalVisits30d);
}
