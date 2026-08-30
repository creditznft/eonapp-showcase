/**
 * W371 — EON City Performance Lab.
 *
 * This is a user-owned, manual checklist for the City modes. It never probes a
 * device, uploads a screenshot, gathers identifiers, sends telemetry, or marks
 * any case passed automatically. Runtime summaries are optional local numbers
 * attached only when the tester explicitly saves an observation.
 */
export const CITY_PERFORMANCE_LAB_SCHEMA = 'eon.city.performance-lab.w371.v1';
export const CITY_PERFORMANCE_LAB_STORAGE_KEY = 'eon:city:performance-lab:v1';
export const CITY_PERFORMANCE_LAB_CASES = Object.freeze([
  Object.freeze({ id: 'desktop-integrated', label: 'Desktop integrated graphics', detail: 'Portal → City Lite → Immersive Work Mode fallback, movement, route review and exit.', required: true }),
  Object.freeze({ id: 'desktop-discrete', label: 'Desktop dedicated GPU', detail: 'Spatial Command Space camera, Immersive Work Mode, local EONBOT review and return.', required: true }),
  Object.freeze({ id: 'android-4gb', label: 'Android around 4 GB', detail: 'City Lite default, touch controls, low-quality fallback and no false performance claim.', required: true }),
  Object.freeze({ id: 'iphone-safari', label: 'iPhone Safari', detail: 'Portrait/landscape guidance, touch controls, audio-off default and City Lite fallback.', required: true }),
  Object.freeze({ id: 'warm-reopen-cache', label: 'Warm City reopen · asset reuse', detail: 'Load City once, close/reopen the unchanged release, then export renderer evidence. Content-addressed City art should reuse browser-local storage with zero or near-zero observed City-art network transfer.', required: true }),
  Object.freeze({ id: 'weak-webgl-fallback', label: 'Weak or unavailable WebGL', detail: 'Clear fallback to City Overview without lost local City state.', required: true })
]);

const freeze = (value) => Object.freeze(value);
const ALLOWED_STATUS = new Set(['not-run', 'passed', 'failed', 'blocked']);
const SECRET_PATTERN = /(?:api[\s_-]*key|access[\s_-]*token|refresh[\s_-]*token|bearer\s+|password|seed\s+phrase|private\s+key|\bsk-[a-z0-9_-]{8,}\b|0x[a-f0-9]{64})/i;
const MAX_NOTE = 160;

function safeStorage(storage = globalThis.localStorage) {
  try { return storage || null; } catch { return null; }
}

function cleanStatus(value = '') {
  const status = String(value || '').trim().toLowerCase();
  return ALLOWED_STATUS.has(status) ? status : 'not-run';
}

function cleanNote(value = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE);
  return SECRET_PATTERN.test(text) ? '' : text;
}

function cleanMetric(value, minimum = 0, maximum = 100000) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : null;
}

function cleanRuntimeSummary(summary = {}) {
  const observation = summary?.performanceObservation && typeof summary.performanceObservation === 'object' ? summary.performanceObservation : {};
  return Object.freeze({
    quality: String(summary.quality || 'unknown').slice(0, 24),
    activeWorldRegionId: String(summary.activeWorldRegionId || summary.lifecycle?.lastFpsSample?.worldRegionId || 'unknown').slice(0, 48),
    firstFrameMs: cleanMetric(observation.firstFrameMs ?? summary.firstFrameMs, 0, 100000),
    sessionDurationMs: cleanMetric(observation.sessionDurationMs ?? summary.sessionDurationMs, 0, 10000000),
    averageFrameMs: cleanMetric(summary.averageFrameMs ?? observation.averageFrameMs, 0, 10000),
    p95FrameMs: cleanMetric(observation.p95FrameMs ?? summary.p95FrameMs, 0, 10000),
    p99FrameMs: cleanMetric(observation.p99FrameMs ?? summary.p99FrameMs, 0, 10000),
    estimatedFps: cleanMetric(observation.estimatedFps ?? summary.estimatedFps ?? summary.fps, 0, 240),
    frameSamples: cleanMetric(observation.frameSamples ?? summary.frameSamples, 0, 10000000),
    memorySlopeBytesPerMinute: cleanMetric(observation.memory?.slopeBytesPerMinute, -1000000000, 1000000000),
    fallbackIssued: summary.fallbackIssued === true || summary.contextLost === true || observation.contextLost === true,
    performanceState: String(summary.performanceState || summary.performanceGovernor?.state || (observation.contextLost ? 'context-lost' : 'unknown')).slice(0, 48)
  });
}

function knownCase(id = '') {
  return CITY_PERFORMANCE_LAB_CASES.some((item) => item.id === String(id || '').trim());
}

function cleanRecord(value = {}) {
  const id = String(value?.id || '').trim();
  return Object.freeze({
    id,
    status: cleanStatus(value?.status),
    note: cleanNote(value?.note),
    runtime: cleanRuntimeSummary(value?.runtime || {}),
    updatedAt: /^\d{4}-\d{2}-\d{2}T/.test(String(value?.updatedAt || '')) ? String(value.updatedAt).slice(0, 40) : null
  });
}

function normaliseRecords(records = []) {
  const byId = new Map();
  for (const raw of Array.isArray(records) ? records : []) {
    const id = String(raw?.id || '').trim();
    if (!knownCase(id)) continue;
    byId.set(id, cleanRecord(raw));
  }
  return Object.freeze(CITY_PERFORMANCE_LAB_CASES.map((item) => byId.get(item.id) || freezeRecord(item.id)));
}

function freezeRecord(id) {
  return Object.freeze({ id, status: 'not-run', note: '', runtime: cleanRuntimeSummary({}), updatedAt: null });
}

function readRaw(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_PERFORMANCE_LAB_STORAGE_KEY) || 'null');
    return parsed?.schema === CITY_PERFORMANCE_LAB_SCHEMA && Array.isArray(parsed.records) ? parsed.records : [];
  } catch { return []; }
}

function createSnapshot(records = []) {
  const safe = normaliseRecords(records);
  const required = safe.filter((row) => CITY_PERFORMANCE_LAB_CASES.find((entry) => entry.id === row.id)?.required);
  const passed = required.filter((row) => row.status === 'passed').length;
  return Object.freeze({
    schema: CITY_PERFORMANCE_LAB_SCHEMA,
    records: safe,
    requiredCaseCount: required.length,
    passedCaseCount: passed,
    status: passed === required.length ? 'manual-checklist-complete' : 'incomplete',
    localOnly: true,
    deviceProbeCreated: false,
    remoteTelemetryCreated: false,
    screenshotUploadCreated: false,
    autoPassCreated: false,
    certificationCreated: false
  });
}

export function loadCityPerformanceLab({ storage = safeStorage() } = {}) {
  return createSnapshot(readRaw(storage));
}

export function saveCityPerformanceLabObservation({ id = '', status = 'not-run', note = '', runtime = {} } = {}, { confirmedByUser = false, storage = safeStorage(), now = Date.now() } = {}) {
  if (!knownCase(id)) return Object.freeze({ ok: false, reason: 'unknown-case', snapshot: loadCityPerformanceLab({ storage }) });
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', snapshot: loadCityPerformanceLab({ storage }) });
  const existing = loadCityPerformanceLab({ storage }).records;
  const nextRecord = cleanRecord({ id, status, note, runtime, updatedAt: new Date(Number(now)).toISOString() });
  const next = existing.map((entry) => entry.id === id ? nextRecord : entry);
  const snapshot = createSnapshot(next);
  try {
    storage?.setItem(CITY_PERFORMANCE_LAB_STORAGE_KEY, JSON.stringify({ schema: CITY_PERFORMANCE_LAB_SCHEMA, records: snapshot.records }));
    return Object.freeze({ ok: true, reason: null, snapshot });
  } catch {
    return Object.freeze({ ok: false, reason: 'local-storage-write-failed', snapshot });
  }
}

export function buildCityPerformanceLabExport(snapshot = {}, { now = Date.now() } = {}) {
  const source = createSnapshot(snapshot.records || snapshot);
  return JSON.stringify({
    schema: CITY_PERFORMANCE_LAB_SCHEMA,
    exportedAt: new Date(Number(now)).toISOString(),
    scope: 'user-owned-manual-city-performance-checklist',
    checklistStatus: source.status,
    records: source.records,
    proofBoundary: {
      userReported: true,
      automaticallyVerified: false,
      deviceProbeCreated: false,
      remoteTelemetryCreated: false,
      screenshotUploadCreated: false,
      certificationCreated: false,
      launchApprovalCreated: false
    }
  }, null, 2);
}

export function getCityPerformanceLabTruth() {
  return Object.freeze({
    schema: CITY_PERFORMANCE_LAB_SCHEMA,
    localOnly: true,
    deviceProbeCreated: false,
    remoteTelemetryCreated: false,
    screenshotUploadCreated: false,
    autoPassCreated: false,
    certificationCreated: false,
    userConfirmedSaveOnly: true,
    contains: freeze(['case status', 'bounded note', 'bounded runtime summary']),
    neverContains: freeze(['device identifier', 'user agent', 'screenshot', 'chat', 'Vault', 'provider key', 'payment data'])
  });
}
