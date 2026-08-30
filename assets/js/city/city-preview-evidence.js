/**
 * W259 — local-only City Play preview evidence kit.
 *
 * This module records finite device/task observations only after an explicit
 * preview tester action. It has no telemetry transport, account coupling,
 * user-agent capture, Chat/Vault content, provider data or chain activity.
 */
export const CITY_PREVIEW_EVIDENCE_SCHEMA = 'eon.city.preview-evidence.w259.v1';
export const CITY_PREVIEW_EVIDENCE_STORAGE_KEY = 'eon:city:preview-evidence:w259:v1';
export const CITY_PREVIEW_TASKS = Object.freeze([
  'fullscreen-orientation',
  'movement-controls',
  'prepared-route-review',
  'local-mission-outcome',
  'pause-and-resume',
  'city-lite-return',
  'context-loss-fallback'
]);
export const CITY_PREVIEW_EVENTS = Object.freeze([
  'preview-started',
  'renderer-ready',
  'performance-protection',
  'context-lost',
  'route-prepared',
  'route-confirmed',
  'mission-opened',
  'mission-returned',
  'paused',
  'resumed',
  'city-lite-returned',
  'frame-note-saved'
]);

function safeStorage(storage = globalThis.localStorage) {
  try { return storage || null; } catch { return null; }
}
function safeNow(now = Date.now) { return new Date(now()).toISOString(); }
function uid(random = Math.random, now = Date.now) {
  const timestamp = Math.max(0, Number(now()) || 0).toString(36);
  const entropy = Math.floor(Math.max(0, Math.min(0.999999999, Number(random()) || 0)) * 0xFFFFFFFFFFFF).toString(36).padStart(8, '0');
  return `w259-${timestamp}-${entropy}`;
}
function finite(value, fallback = null) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
function bounded(value, min, max, fallback = null) {
  const number = finite(value, fallback);
  if (number === null) return fallback;
  return Math.min(max, Math.max(min, number));
}
function resolutionBucket(environment = {}) {
  const width = bounded(environment.screenWidth, 0, 10000, 0);
  const height = bounded(environment.screenHeight, 0, 10000, 0);
  const max = Math.max(width, height);
  if (max >= 2200) return 'large';
  if (max >= 1280) return 'regular';
  return 'compact';
}
function orientation(environment = {}) {
  return Number(environment.screenWidth || 0) >= Number(environment.screenHeight || 0) ? 'landscape-or-square' : 'portrait';
}
function cleanTask(task) { return CITY_PREVIEW_TASKS.includes(task) ? task : null; }
function cleanEvent(event) { return CITY_PREVIEW_EVENTS.includes(event) ? event : null; }
function cleanResult(result) { return ['pass', 'observe', 'blocked'].includes(result) ? result : 'observe'; }
function readAll(storage = safeStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_PREVIEW_EVIDENCE_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch { return []; }
}
function persist(session, storage = safeStorage()) {
  try {
    const next = [session, ...readAll(storage).filter((entry) => entry?.id !== session.id)].slice(0, 6);
    storage?.setItem(CITY_PREVIEW_EVIDENCE_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch { return false; }
}

export function isCityPreviewEvidenceMode(search = globalThis.location?.search || '') {
  try { return new URLSearchParams(search).get('preview') === '1'; } catch { return false; }
}

export function createCityPreviewSession({ capability = {}, quality = 'unknown', environment = {}, now = Date.now, random = Math.random } = {}) {
  return {
    schema: CITY_PREVIEW_EVIDENCE_SCHEMA,
    id: uid(random, now),
    createdAt: safeNow(now),
    quality: String(quality || 'unknown'),
    device: {
      mobile: Boolean(capability.isMobile),
      webgl: Boolean(capability.webgl),
      lowTier: Boolean(capability.lowTier),
      reducedMotion: Boolean(capability.reducedMotion),
      saveData: Boolean(capability.saveData),
      recommendedQuality: String(capability.recommendedQuality || 'unknown'),
      cores: bounded(capability.cores, 1, 128, null),
      memoryGb: bounded(capability.memoryGb, 0, 128, null),
      touch: Boolean(environment.touch),
      fullscreenSupported: Boolean(environment.fullscreenSupported),
      orientationLockSupported: Boolean(environment.orientationLockSupported),
      resolutionBucket: resolutionBucket(environment),
      orientationAtStart: orientation(environment)
    },
    events: [],
    tasks: [],
    finalFrame: null,
    localOnly: true,
    remoteTelemetry: false,
    exportVersion: 1
  };
}

export function recordCityPreviewEvent(session, event, { result = 'observe', now = Date.now } = {}) {
  const type = cleanEvent(event);
  if (!session || !type) return { ok: false, session };
  const next = { ...session, events: [...(session.events || []), { type, result: cleanResult(result), at: safeNow(now) }].slice(-24) };
  return { ok: true, session: next };
}

export function recordCityPreviewTask(session, task, { result = 'pass', now = Date.now } = {}) {
  const type = cleanTask(task);
  if (!session || !type) return { ok: false, session };
  const next = {
    ...session,
    tasks: [...(session.tasks || []).filter((entry) => entry.type !== type), { type, result: cleanResult(result), at: safeNow(now) }]
  };
  return { ok: true, session: next };
}

export function recordCityPreviewFrame(session, summary = {}, { now = Date.now } = {}) {
  if (!session) return { ok: false, session };
  const finalFrame = {
    at: safeNow(now),
    quality: String(summary.quality || session.quality || 'unknown'),
    frameSamples: bounded(summary.frameSamples, 0, 10000000, 0),
    averageFrameMs: bounded(summary.averageFrameMs, 0, 1000, null),
    minFrameMs: bounded(summary.minFrameMs, 0, 1000, null),
    maxFrameMs: bounded(summary.maxFrameMs, 0, 1000, null),
    fps: bounded(summary.fps, 0, 1000, 0),
    activeMeshes: bounded(summary.activeMeshes, 0, 100000, 0),
    activeLights: bounded(summary.activeLights, 0, 10000, 0),
    contextLost: Boolean(summary.contextLost),
    performanceGovernor: String(summary.performanceGovernor?.state || 'unknown')
  };
  return { ok: true, session: { ...session, finalFrame } };
}

export function saveCityPreviewSession(session, storage = safeStorage()) {
  if (!session || session.schema !== CITY_PREVIEW_EVIDENCE_SCHEMA) return { ok: false, session };
  return { ok: persist(session, storage), session };
}

export function buildCityPreviewExport(session) {
  if (!session || session.schema !== CITY_PREVIEW_EVIDENCE_SCHEMA) return null;
  return JSON.stringify({
    schema: CITY_PREVIEW_EVIDENCE_SCHEMA,
    exportedAt: new Date().toISOString(),
    localOnly: true,
    remoteTelemetry: false,
    session
  }, null, 2);
}

export function downloadCityPreviewEvidence(session, documentRef = globalThis.document, urlRef = globalThis.URL) {
  const content = buildCityPreviewExport(session);
  if (!content || !documentRef?.createElement || !urlRef?.createObjectURL) return false;
  const blob = new Blob([content], { type: 'application/json' });
  const url = urlRef.createObjectURL(blob);
  const link = documentRef.createElement('a');
  link.href = url;
  link.download = `eon-city-preview-${session.id}.json`;
  link.hidden = true;
  documentRef.body?.appendChild?.(link);
  link.click();
  link.remove?.();
  setTimeout(() => urlRef.revokeObjectURL?.(url), 0);
  return true;
}
