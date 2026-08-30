import { redactTelemetryPath, redactTelemetryText } from './privacy-telemetry.js';

/**
 * Local measurement ledger — W277 privacy-preserving measurement baseline.
 *
 * No measurement is sent off-device. It is off by default and must be enabled
 * by the person using this browser profile. The narrow local ledger is for
 * optional troubleshooting only; it is never an advertising, referral,
 * fingerprinting, payment or behavioural-profile system.
 */
export const EON_MEASUREMENT_PREFERENCE_KEY = 'eon:privacy:local-measurement:v1';
export const EON_LOCAL_MEASUREMENT_KEY = 'eon:analytics:v1';
export const EON_LOCAL_MEASUREMENT_SESSION_KEY = 'eon:analytics:session:v1';
const EON_PIPELINE_TELEMETRY_KEYS = Object.freeze(['eon:telemetry:events:v1', 'eon:telemetry:events:v2']);
export const EON_MEASUREMENT_DEFAULT_ENABLED = false;
export const EON_LOCAL_MEASUREMENT_POLICY = Object.freeze({
  transport: 'browser-local-only',
  defaultEnabled: EON_MEASUREMENT_DEFAULT_ENABLED,
  pageviewLimit: 64,
  eventLimit: 120,
  sessionLimit: 20,
  excludes: Object.freeze(['chat-content', 'credentials', 'queries', 'fragments', 'cookies', 'fingerprints', 'remote-transport'])
});

const ANALYTICS_KEY = EON_LOCAL_MEASUREMENT_KEY;
const SESSION_KEY = EON_LOCAL_MEASUREMENT_SESSION_KEY;
const MAX_PAGEVIEWS = EON_LOCAL_MEASUREMENT_POLICY.pageviewLimit;
const MAX_EVENTS = EON_LOCAL_MEASUREMENT_POLICY.eventLimit;
const MAX_SESSIONS = EON_LOCAL_MEASUREMENT_POLICY.sessionLimit;

function safeStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function readJson(storage, key, fallback) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJson(storage, key, value) {
  try { storage?.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function getLocalMeasurementPreference(options = {}) {
  const stored = readJson(safeStorage(options.storage), EON_MEASUREMENT_PREFERENCE_KEY, null);
  const enabled = stored?.enabled === true;
  return Object.freeze({
    schema: 'eon.local-measurement.preference.v1',
    enabled,
    decidedAt: Number(stored?.decidedAt || 0) || null,
    storage: 'browser-local-only',
    note: enabled
      ? 'Redacted local diagnostics are enabled only in this browser profile. Nothing is sent to EONAPP or partners.'
      : 'Redacted local diagnostics are off in this browser profile. Nothing is sent to EONAPP or partners.'
  });
}

export function isLocalMeasurementEnabled(options = {}) {
  return getLocalMeasurementPreference(options).enabled;
}

function clearLocalMeasurementStorage(storage = null, sessionStorage = null) {
  try { storage?.removeItem(ANALYTICS_KEY); } catch {}
  for (const key of EON_PIPELINE_TELEMETRY_KEYS) { try { storage?.removeItem(key); } catch {} }
  try { sessionStorage?.removeItem(SESSION_KEY); } catch {}
}

export function setLocalMeasurementPreference(enabled, options = {}) {
  const storage = safeStorage(options.storage);
  const sessionStorage = options.sessionStorage || (() => { try { return globalThis.sessionStorage || null; } catch { return null; } })();
  const next = { enabled: enabled === true, decidedAt: Number(options.now || Date.now()) };
  writeJson(storage, EON_MEASUREMENT_PREFERENCE_KEY, next);
  if (!next.enabled) {
    clearLocalMeasurementStorage(storage, sessionStorage);
    try { eonAnalytics?.clearMemory(); } catch {}
  }
  return getLocalMeasurementPreference({ storage });
}

function loadData() {
  const storage = safeStorage();
  const raw = readJson(storage, ANALYTICS_KEY, null);
  if (raw && typeof raw === 'object') return raw;
  return { pageviews: [], events: [], modes: {}, sessions: [], version: 2 };
}

function saveData(data) { writeJson(safeStorage(), ANALYTICS_KEY, data); }

function loadSession() {
  const storage = (() => { try { return globalThis.sessionStorage || null; } catch { return null; } })();
  const raw = readJson(storage, SESSION_KEY, null);
  if (raw && typeof raw === 'object') return raw;
  const bytes = new Uint8Array(4);
  try { globalThis.crypto?.getRandomValues?.(bytes); } catch {}
  const hex = Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
  return {
    id: `s-${Date.now()}-${hex || 'local'}`,
    startedAt: Date.now(),
    page: typeof window !== 'undefined' ? redactTelemetryPath(window.location.pathname, '/') : '/',
    eventCount: 0
  };
}

function saveSession(session) {
  try { globalThis.sessionStorage?.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}

export function clearLocalMeasurementData(options = {}) {
  const storage = safeStorage(options.storage);
  const sessionStorage = options.sessionStorage || (() => { try { return globalThis.sessionStorage || null; } catch { return null; } })();
  clearLocalMeasurementStorage(storage, sessionStorage);
  try { eonAnalytics?.clearMemory(); } catch {}
  return { ok: true, storage: 'browser-local-only' };
}

class EONAnalytics {
  constructor() {
    this.data = loadData();
    this.session = loadSession();
    if (isLocalMeasurementEnabled()) saveSession(this.session);
  }

  trackPageview(page, referrer) {
    if (!isLocalMeasurementEnabled()) return null;
    const pv = {
      page: redactTelemetryPath(page || (typeof window !== 'undefined' ? window.location.href : '/'), '/'),
      referrer: redactTelemetryPath(referrer || (typeof document !== 'undefined' ? document.referrer : '') || '', ''),
      ts: Date.now(),
      sessionId: this.session.id
    };
    this.data.pageviews.push(pv);
    if (this.data.pageviews.length > MAX_PAGEVIEWS) this.data.pageviews = this.data.pageviews.slice(-MAX_PAGEVIEWS);
    saveData(this.data);
    return pv;
  }

  trackEvent(category, action, label = '') {
    if (!isLocalMeasurementEnabled()) return null;
    const event = {
      category: redactTelemetryText(category, 64),
      action: redactTelemetryText(action, 96),
      label: redactTelemetryText(label, 180),
      ts: Date.now(),
      sessionId: this.session.id
    };
    this.data.events.push(event);
    if (this.data.events.length > MAX_EVENTS) this.data.events = this.data.events.slice(-MAX_EVENTS);
    this.session.eventCount += 1;
    saveSession(this.session);
    saveData(this.data);
    return event;
  }

  trackMode(mode) {
    if (!isLocalMeasurementEnabled()) return null;
    const key = redactTelemetryText(mode || 'unknown', 64) || 'unknown';
    this.data.modes[key] = (this.data.modes[key] || 0) + 1;
    saveData(this.data);
    return this.trackEvent('WorkBench', 'mode_switch', key);
  }

  endSession() {
    if (!isLocalMeasurementEnabled()) return null;
    const duration = Math.round((Date.now() - this.session.startedAt) / 1000);
    this.data.sessions.push({
      id: this.session.id,
      page: this.session.page,
      duration,
      eventCount: this.session.eventCount,
      ts: this.session.startedAt
    });
    if (this.data.sessions.length > MAX_SESSIONS) this.data.sessions = this.data.sessions.slice(-MAX_SESSIONS);
    saveData(this.data);
    return duration;
  }

  getReport() {
    const data = this.data;
    const totalPageviews = data.pageviews.length;
    const totalEvents = data.events.length;
    const totalSessions = data.sessions.length;
    const pageCount = {};
    data.pageviews.forEach((pv) => { pageCount[pv.page] = (pageCount[pv.page] || 0) + 1; });
    const topPages = Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([page, count]) => ({ page, count }));
    const eventCount = {};
    data.events.forEach((event) => { const key = `${event.category}:${event.action}`; eventCount[key] = (eventCount[key] || 0) + 1; });
    const topEvents = Object.entries(eventCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));
    const modeUsage = Object.entries(data.modes || {}).sort((a, b) => b[1] - a[1]).map(([mode, count]) => ({ mode, count }));
    const avgDuration = totalSessions ? Math.round(data.sessions.reduce((sum, row) => sum + (row.duration || 0), 0) / totalSessions) : 0;
    return { enabled: isLocalMeasurementEnabled(), totalPageviews, totalEvents, totalSessions, avgSessionDuration: avgDuration, topPages, topEvents, modeUsage };
  }

  clearMemory() {
    this.data = { pageviews: [], events: [], modes: {}, sessions: [], version: 2 };
    this.session = loadSession();
  }

  reset() {
    this.clearMemory();
    const storage = safeStorage();
    const sessionStorage = (() => { try { return globalThis.sessionStorage || null; } catch { return null; } })();
    clearLocalMeasurementStorage(storage, sessionStorage);
  }
}

const eonAnalytics = new EONAnalytics();

if (typeof window !== 'undefined') {
  eonAnalytics.trackPageview();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') eonAnalytics.endSession(); });
  window.addEventListener('beforeunload', () => eonAnalytics.endSession());
}

export default eonAnalytics;
