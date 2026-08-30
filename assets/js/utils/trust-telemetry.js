import eonAnalytics, { isLocalMeasurementEnabled } from './eon-analytics.js';
import { compactTelemetryPayload, redactTelemetryText } from './privacy-telemetry.js';

const TRUST_EVENTS_KEY = 'eon:trust:events:v1';
const MAX_EVENTS = 120;

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function nowMinuteBucket() { return Math.floor(Date.now() / 60000); }
function compactPayload(payload = {}) { return compactTelemetryPayload(payload, 12); }

export function clearTrustTelemetry() {
  try { localStorage.removeItem(TRUST_EVENTS_KEY); } catch {}
  return { ok: true, storage: 'browser-local-only' };
}

export function recordTrustEvent(domain, action, payload = {}) {
  if (!isLocalMeasurementEnabled()) return null;
  const entry = {
    domain: redactTelemetryText(domain || 'unknown', 40),
    action: redactTelemetryText(action || 'unknown', 60),
    payload: compactPayload(payload),
    minuteBucket: nowMinuteBucket(),
    ts: Date.now()
  };
  const events = loadJson(TRUST_EVENTS_KEY, []);
  events.push(entry);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  saveJson(TRUST_EVENTS_KEY, events);
  try { eonAnalytics.trackEvent(`trust:${entry.domain}`, entry.action, JSON.stringify(entry.payload).slice(0, 180)); } catch {}
  return entry;
}

export function recordRewardFunnel(stage, payload = {}) {
  return recordTrustEvent('campaign-disabled', String(stage || 'unknown'), { ...payload, active: false, reason: 'no_active_monetization_campaign' });
}

export function markPendingClaimCompletion(_offerId, _payload = {}) { return false; }
export function consumeClaimCompletionSignals(_page = '') { return []; }
export function recordReferralAttribution(stage, payload = {}) { return recordTrustEvent('referral', String(stage || 'unknown'), payload); }
export function recordSubscriptionAttribution(stage, payload = {}) { return recordTrustEvent('subscription', String(stage || 'unknown'), payload); }

export function getTrustTelemetryReport() {
  const enabled = isLocalMeasurementEnabled();
  const events = enabled ? loadJson(TRUST_EVENTS_KEY, []) : [];
  return {
    enabled,
    total: events.length,
    latest: events.slice(-20),
    byDomain: events.reduce((acc, event) => { acc[event.domain] = (acc[event.domain] || 0) + 1; return acc; }, {})
  };
}
