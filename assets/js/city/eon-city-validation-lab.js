/**
 * W410 — EON City Validation Lab.
 *
 * A local, human-operated evidence checklist for City controls and visual
 * conditions. It never probes hardware, reads screenshots/video, uploads
 * evidence, sends telemetry, infers a pass, or certifies a release.
 */
export const CITY_VALIDATION_LAB_SCHEMA = 'eon.city.validation-lab.w410.v1';
export const CITY_VALIDATION_LAB_STORAGE_KEY = 'eon:city:validation-lab:v1';

export const CITY_VALIDATION_LAB_CASES = Object.freeze([
  Object.freeze({ id: 'first-frame-and-wayfinding', label: 'Arrival frame and wayfinding', detail: 'Capture Arrival Gate, Command Deck sightline, readable landmark cues and the Mission Board without debug overlays.', required: true }),
  Object.freeze({ id: 'desktop-controls-reset', label: 'Desktop controls and reset', detail: 'Keyboard movement, mouse/look or click move, HUD click then movement, Pause/Resume, Reset view and Command Deck.', required: true }),
  Object.freeze({ id: 'midrange-quality-governor', label: 'Midrange quality governor', detail: 'Observe optional effects reducing while City controls, wayfinding and City Map fallback remain usable.', required: true }),
  Object.freeze({ id: 'android-touch-safe-areas', label: 'Android touch and safe areas', detail: 'Joystick, camera swipe, buttons, portrait/landscape guidance and visible fallback on a real Android browser.', required: true }),
  Object.freeze({ id: 'ios-safari-touch', label: 'iOS Safari touch', detail: 'Joystick, camera swipe, safe areas, orientation guidance and City Map fallback on a real iPhone/iPad Safari session.', required: true }),
  Object.freeze({ id: 'reduced-motion-and-sensory', label: 'Reduced motion and sensory', detail: 'Reduced effects and sensory settings keep the City readable without a hidden route or background action.', required: true }),
  Object.freeze({ id: 'district-review-and-return', label: 'District review and return', detail: 'Arrival, Creator Atrium, Forge Bay and Mission Board remain visible; native work requires review and a separate click.', required: true }),
  Object.freeze({ id: 'collision-and-label-readability', label: 'Collision and readable labels', detail: 'Walk routes have no blocking trap; labels remain readable at the target viewport and no essential HUD control is obscured.', required: true }),
  Object.freeze({ id: 'legacy-route-and-cache', label: 'Legacy route and cache recovery', detail: 'Legacy `/realm#my-realm-3d` reaches canonical `/eoncity` after the current service-worker update.', required: true }),
  Object.freeze({ id: 'performance-record', label: 'Performance evidence', detail: 'Record the actual device outcome separately in Device Lab. This Validation Lab does not sample or grade performance.', required: true })
]);

const ALLOWED_STATUS = new Set(['not-run', 'passed', 'failed', 'blocked']);
const SECRET_LIKE = /(?:api[\s_-]*key|access[\s_-]*token|refresh[\s_-]*token|bearer\s+|password|seed\s+phrase|private\s+key|\bsk-[a-z0-9_-]{8,}\b|0x[a-f0-9]{64})/i;
const MAX_NOTE = 160;

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function' && typeof candidate.removeItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function knownCase(id = '') {
  return CITY_VALIDATION_LAB_CASES.some((item) => item.id === String(id || '').trim());
}

function cleanStatus(value = '') {
  const status = String(value || '').trim().toLowerCase();
  return ALLOWED_STATUS.has(status) ? status : 'not-run';
}

function cleanNote(value = '') {
  const note = String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE);
  return SECRET_LIKE.test(note) ? '' : note;
}

function normaliseRecords(records = []) {
  const byId = new Map();
  for (const raw of Array.isArray(records) ? records : []) {
    const id = String(raw?.id || '').trim();
    if (!knownCase(id)) continue;
    byId.set(id, Object.freeze({ id, status: cleanStatus(raw?.status), note: cleanNote(raw?.note), updatedAt: /^\d{4}-\d{2}-\d{2}T/.test(String(raw?.updatedAt || '')) ? String(raw.updatedAt).slice(0, 40) : null }));
  }
  return Object.freeze(CITY_VALIDATION_LAB_CASES.map((item) => byId.get(item.id) || Object.freeze({ id: item.id, status: 'not-run', note: '', updatedAt: null })));
}

function parseStored(value = '') {
  try {
    const parsed = JSON.parse(value || 'null');
    return parsed?.schema === CITY_VALIDATION_LAB_SCHEMA && Array.isArray(parsed.records) ? parsed.records : [];
  } catch { return []; }
}

export function createCityValidationLabSnapshot(records = []) {
  const safe = normaliseRecords(records);
  const required = safe.filter((record) => CITY_VALIDATION_LAB_CASES.find((item) => item.id === record.id)?.required);
  const passed = required.filter((record) => record.status === 'passed').length;
  const failed = required.filter((record) => record.status === 'failed').length;
  const blocked = required.filter((record) => record.status === 'blocked').length;
  return Object.freeze({
    schema: CITY_VALIDATION_LAB_SCHEMA,
    records: safe,
    requiredCaseCount: required.length,
    passedCaseCount: passed,
    failedCaseCount: failed,
    blockedCaseCount: blocked,
    status: passed === required.length ? 'manual-evidence-recorded-awaiting-independent-review' : 'manual-evidence-incomplete',
    sourceOnly: true,
    localOnly: true,
    certificationIssued: false,
    launchApproved: false
  });
}

/** Loads only the local manual checklist. It never examines browser/device evidence. */
export function loadCityValidationLab({ storage = null } = {}) {
  const local = storageFor(storage);
  return createCityValidationLabSnapshot(parseStored(local?.getItem?.(CITY_VALIDATION_LAB_STORAGE_KEY) || ''));
}

/** Saves a bounded human-entered record only after an explicit foreground action. */
export function saveCityValidationLabObservation({ id, status, note } = {}, { confirmedByUser = false, storage = null, now = Date.now() } = {}) {
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', snapshot: loadCityValidationLab({ storage }) });
  if (!knownCase(id)) return Object.freeze({ ok: false, reason: 'unknown-validation-case', snapshot: loadCityValidationLab({ storage }) });
  const local = storageFor(storage);
  if (!local) return Object.freeze({ ok: false, reason: 'local-storage-unavailable', snapshot: loadCityValidationLab({ storage }) });
  const current = loadCityValidationLab({ storage: local });
  const record = Object.freeze({ id: String(id).trim(), status: cleanStatus(status), note: cleanNote(note), updatedAt: new Date(Number(now) || Date.now()).toISOString() });
  const next = current.records.map((item) => item.id === record.id ? record : item);
  const snapshot = createCityValidationLabSnapshot(next);
  try {
    local.setItem(CITY_VALIDATION_LAB_STORAGE_KEY, JSON.stringify({ schema: CITY_VALIDATION_LAB_SCHEMA, records: snapshot.records }));
    return Object.freeze({ ok: true, reason: null, snapshot });
  } catch { return Object.freeze({ ok: false, reason: 'local-storage-write-failed', snapshot }); }
}

/** Removes the local checklist only after a visible confirmation; no evidence is sent elsewhere. */
export function clearCityValidationLab({ confirmedByUser = false, storage = null } = {}) {
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', localOnly: true });
  const local = storageFor(storage);
  if (!local) return Object.freeze({ ok: false, reason: 'local-storage-unavailable', localOnly: true });
  try {
    local.removeItem(CITY_VALIDATION_LAB_STORAGE_KEY);
    return Object.freeze({ ok: true, reason: null, localOnly: true, certificationIssued: false });
  } catch { return Object.freeze({ ok: false, reason: 'local-storage-remove-failed', localOnly: true }); }
}

/** Creates a user-triggered local export. It contains no screenshots, videos, identifiers or automatic judgement. */
export function buildCityValidationLabExport(snapshot = loadCityValidationLab(), { now = Date.now() } = {}) {
  const safe = createCityValidationLabSnapshot(snapshot?.records || []);
  return JSON.stringify({
    schema: CITY_VALIDATION_LAB_SCHEMA,
    exportedAt: new Date(Number(now) || Date.now()).toISOString(),
    scope: 'user-owned-manual-city-validation-checklist',
    status: safe.status,
    requiredCaseCount: safe.requiredCaseCount,
    passedCaseCount: safe.passedCaseCount,
    failedCaseCount: safe.failedCaseCount,
    blockedCaseCount: safe.blockedCaseCount,
    records: safe.records,
    proofBoundary: Object.freeze({ humanReported: true, deviceProbeCreated: false, screenshotUploadCreated: false, videoUploadCreated: false, remoteTelemetryCreated: false, automaticCertification: false, launchApproval: false })
  }, null, 2);
}

export function getCityValidationLabTruth() {
  return Object.freeze({
    schema: CITY_VALIDATION_LAB_SCHEMA,
    localOnly: true,
    explicitSaveRequired: true,
    explicitExportRequired: true,
    explicitClearRequired: true,
    deviceProbeCreated: false,
    screenshotUploadCreated: false,
    videoUploadCreated: false,
    remoteTelemetryCreated: false,
    autoPassCreated: false,
    automaticCertification: false,
    launchApproval: false
  });
}
