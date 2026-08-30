import { W642_RETENTION_EVENT_SCHEMA } from '../../../config/w642-product-truth-retention-contract.mjs';
export const EON_RETENTION_TELEMETRY_KEY = 'eon:retention:events:w642:v1';
const ALLOWED = new Set(['shown', 'opened', 'dismissed']);
export function recordEonRetentionEvent(action, type, { storage = globalThis.localStorage, now = Date.now() } = {}) {
  if (!ALLOWED.has(action)) return Object.freeze({ ok: false, reason: 'action-invalid' });
  const safeType = String(type || '').replace(/[^a-z-]/g, '').slice(0, 32) || 'unknown';
  let rows = [];
  try { const raw = JSON.parse(storage?.getItem?.(EON_RETENTION_TELEMETRY_KEY) || '[]'); rows = Array.isArray(raw) ? raw : []; } catch {}
  const event = Object.freeze({ schema: W642_RETENTION_EVENT_SCHEMA, action, type: safeType, day: new Date(now).toISOString().slice(0, 10), containsUserContent: false, remoteUpload: false });
  rows.push(event);
  try { storage?.setItem?.(EON_RETENTION_TELEMETRY_KEY, JSON.stringify(rows.slice(-30))); } catch {}
  return Object.freeze({ ok: true, event });
}
