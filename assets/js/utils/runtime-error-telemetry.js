/**
 * EONAPP W200 — privacy-safe local runtime evidence.
 *
 * This captures a short, redacted error summary in the current browser profile
 * so a user can export a reproducible issue report. It does not send telemetry
 * anywhere and never records stack traces, request bodies, URLs with query
 * strings, credentials, or user-entered chat content.
 */

export const EON_RUNTIME_ERROR_KEY = 'eon:runtime:errors:v1';
const MAX_EVENTS = 24;
import { redactTelemetryPath, redactTelemetryText } from './privacy-telemetry.js';

function safeStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function sanitiseText(value = '') {
  return redactTelemetryText(value, 240);
}

function randomSuffix() {
  try {
    const bytes = new Uint8Array(6);
    globalThis.crypto?.getRandomValues?.(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'local';
  }
}

function readEvents(storage = null) {
  try {
    const parsed = JSON.parse(safeStorage(storage)?.getItem(EON_RUNTIME_ERROR_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function listRuntimeErrors(options = {}) {
  return readEvents(options.storage).slice(0, MAX_EVENTS).map((event) => ({ ...event }));
}

export function recordRuntimeError(input = {}, options = {}) {
  const storage = safeStorage(options.storage);
  const message = sanitiseText(input.message || input.reason || 'Unknown runtime error');
  if (!message) return null;
  const event = Object.freeze({
    id: `err-${Number(options.now || Date.now()).toString(36)}-${randomSuffix()}`,
    at: new Date(Number(options.now || Date.now())).toISOString(),
    page: redactTelemetryPath(input.page || globalThis.location?.href || '/', '/'),
    source: sanitiseText(input.source || 'runtime'),
    message
  });
  const next = [event, ...readEvents(storage)].slice(0, MAX_EVENTS);
  try { storage?.setItem(EON_RUNTIME_ERROR_KEY, JSON.stringify(next)); } catch {}
  try { globalThis.dispatchEvent?.(new CustomEvent('eon:runtime-error', { detail: event })); } catch {}
  return event;
}

export function clearRuntimeErrors(options = {}) {
  try { safeStorage(options.storage)?.removeItem(EON_RUNTIME_ERROR_KEY); } catch {}
}

let isInstalled = false;

export function initEonRuntimeErrorTelemetry(options = {}) {
  if (isInstalled || typeof window === 'undefined') return false;
  isInstalled = true;
  window.addEventListener('error', (event) => {
    recordRuntimeError({ source: 'window-error', message: event?.message || 'Window error', page: window.location?.pathname }, options);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    recordRuntimeError({ source: 'unhandled-rejection', message: reason?.message || reason || 'Unhandled promise rejection', page: window.location?.pathname }, options);
  });
  return true;
}
