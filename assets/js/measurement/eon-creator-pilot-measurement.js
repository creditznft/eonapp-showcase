/**
 * W398/W399 creator/remix pilot measurement foundation.
 *
 * Local, opted-in, count-only diagnostics. No URL, caption, platform account,
 * referral identifier, content body, device identifier, IP address or network
 * transport is included. Remote analytics remains disabled.
 */
export const EON_CREATOR_PILOT_MEASUREMENT_SCHEMA = 'eonapp.creator-pilot-measurement.v1';
export const EON_CREATOR_PILOT_MEASUREMENT_KEY = 'eon:creator-pilot-measurement:v1';
export const EON_CREATOR_PILOT_EVENT_TYPES = Object.freeze([
  'share-pack-created', 'share-pack-exported', 'share-pack-native-share-opened',
  'remix-card-created', 'remix-card-exported', 'remix-card-native-share-opened',
  'creator-brief-opened', 'forge-export-reviewed'
]);

function storageFor(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function normalize(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const counts = {};
  for (const type of EON_CREATOR_PILOT_EVENT_TYPES) counts[type] = Math.max(0, Math.floor(Number(source?.counts?.[type] || 0)));
  return Object.freeze({ schema: EON_CREATOR_PILOT_MEASUREMENT_SCHEMA, version: 1, counts: Object.freeze(counts), updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : 0 });
}

export function readEonCreatorPilotMeasurement({ storage } = {}) {
  try { return normalize(JSON.parse(storageFor(storage)?.getItem(EON_CREATOR_PILOT_MEASUREMENT_KEY) || '{}')); } catch { return normalize(); }
}

export function recordEonCreatorPilotEvent(eventType = '', { enabled = false, storage, now = Date.now() } = {}) {
  const type = String(eventType || '').trim();
  if (!enabled || !EON_CREATOR_PILOT_EVENT_TYPES.includes(type)) return Object.freeze({ ok: false, reason: enabled ? 'unsupported-event' : 'local-measurement-disabled', measurement: readEonCreatorPilotMeasurement({ storage }) });
  const current = readEonCreatorPilotMeasurement({ storage });
  const next = normalize({ counts: { ...current.counts, [type]: current.counts[type] + 1 }, updatedAt: now });
  try { storageFor(storage)?.setItem(EON_CREATOR_PILOT_MEASUREMENT_KEY, JSON.stringify(next)); return Object.freeze({ ok: true, reason: null, measurement: next }); }
  catch { return Object.freeze({ ok: false, reason: 'storage-unavailable', measurement: current }); }
}

export function clearEonCreatorPilotMeasurement({ storage } = {}) {
  try { storageFor(storage)?.removeItem(EON_CREATOR_PILOT_MEASUREMENT_KEY); return true; } catch { return false; }
}

export function getEonCreatorPilotMeasurementTruth() {
  return Object.freeze({ schema: EON_CREATOR_PILOT_MEASUREMENT_SCHEMA, localOnly: true, remoteTransport: false, defaultEnabled: false, contentStored: false, urlsStored: false, referralStored: false, accountStored: false, platformStored: false });
}
