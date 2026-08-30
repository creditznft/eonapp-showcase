/**
 * W427 — local-only canonical Babylon boot diagnostics.
 *
 * This module records a short, redacted session-local boot trail so the direct
 * /eoncity route can offer a useful same-route recovery without sending raw
 * errors, prompts, project content, account data, or telemetry anywhere.
 */
export const EON_CITY_BOOT_DIAGNOSTICS_SCHEMA = 'eon.city.boot-diagnostics.w427.v1';
export const CITY_BOOT_DIAGNOSTIC_STORAGE_KEY = 'eon:city:boot-diagnostics:v1';
export const CITY_BOOT_MARKERS = Object.freeze([
  'CITY_BOOT_STARTED',
  'CITY_WEBGL_UNAVAILABLE',
  'CITY_IMPORT_FAILED',
  'CITY_ENGINE_CREATE_FAILED',
  'CITY_ASSET_LOAD_FAILED',
  'CITY_CANVAS_MOUNT_FAILED',
  'CITY_FIRST_FRAME_TIMEOUT',
  'CITY_FIRST_FRAME_READY',
  'CITY_CONTEXT_LOST'
]);

const MARKER_SET = new Set(CITY_BOOT_MARKERS);
const QUALITY_SET = new Set(['lite', 'balanced', 'cinematic', 'unknown']);
const ENTRY_MODE_SET = new Set(['direct', 'review', 'safe']);
const SAFE_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MAX_RECORDS = 12;

function safeSessionStorage(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try {
    if (globalThis.sessionStorage && typeof globalThis.sessionStorage.getItem === 'function') return globalThis.sessionStorage;
  } catch {}
  return null;
}

function safeText(value, fallback = 'unspecified') {
  const text = String(value || '').trim().toLowerCase();
  return SAFE_CODE_PATTERN.test(text) ? text : fallback;
}

function safeQuality(value) {
  const quality = String(value || '').trim().toLowerCase();
  return QUALITY_SET.has(quality) ? quality : 'unknown';
}

function safeEntryMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  return ENTRY_MODE_SET.has(mode) ? mode : 'direct';
}

function safeRead(storage) {
  try {
    const records = JSON.parse(storage?.getItem(CITY_BOOT_DIAGNOSTIC_STORAGE_KEY) || '[]');
    if (!Array.isArray(records)) return [];
    return records.slice(-MAX_RECORDS).filter((record) => MARKER_SET.has(String(record?.marker || ''))).map((record) => Object.freeze({
      marker: String(record.marker),
      quality: safeQuality(record.quality),
      entryMode: safeEntryMode(record.entryMode),
      detailCode: safeText(record.detailCode),
      at: Number.isFinite(Number(record.at)) ? Number(record.at) : 0
    }));
  } catch {
    return [];
  }
}

function safeWrite(storage, records) {
  try {
    storage?.setItem(CITY_BOOT_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
    return true;
  } catch {
    return false;
  }
}

export function createCityBootDiagnostics({ storage, now = () => Date.now() } = {}) {
  const target = safeSessionStorage(storage);
  let records = safeRead(target);

  const snapshot = () => Object.freeze({
    schema: EON_CITY_BOOT_DIAGNOSTICS_SCHEMA,
    localOnly: true,
    remoteTransport: false,
    readsUserContent: false,
    rawErrorMessages: false,
    persistence: target ? 'sessionStorage' : 'memory',
    records: Object.freeze(records.map((record) => Object.freeze({ ...record })))
  });

  const record = (marker, { quality = 'unknown', entryMode = 'direct', detailCode = 'unspecified' } = {}) => {
    const safeMarker = MARKER_SET.has(String(marker || '')) ? String(marker) : 'CITY_ENGINE_CREATE_FAILED';
    const event = Object.freeze({
      marker: safeMarker,
      quality: safeQuality(quality),
      entryMode: safeEntryMode(entryMode),
      detailCode: safeText(detailCode),
      at: Number(now()) || Date.now()
    });
    records = [...records, event].slice(-MAX_RECORDS);
    safeWrite(target, records);
    return event;
  };

  const clear = () => {
    records = [];
    try { target?.removeItem?.(CITY_BOOT_DIAGNOSTIC_STORAGE_KEY); } catch {}
    return snapshot();
  };

  return Object.freeze({ record, getSnapshot: snapshot, clear });
}

export function getCityBootDiagnosticsTruth() {
  return Object.freeze({
    schema: EON_CITY_BOOT_DIAGNOSTICS_SCHEMA,
    markers: Object.freeze([...CITY_BOOT_MARKERS]),
    localOnly: true,
    remoteTransport: false,
    readsUserContent: false,
    rawErrorMessages: false,
    defaultPersistence: 'sessionStorage',
    maxRecords: MAX_RECORDS
  });
}
