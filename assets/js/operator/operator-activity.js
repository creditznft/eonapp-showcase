import { recordAgentPresenceFromOperatorActivity } from './agent-presence.js';

/**
 * EONAPP W189 — truthful local Operator activity ledger.
 *
 * The 2D Operator Map renders only actions recorded by real local product
 * flows. It never fabricates busy agents, provider runs, or trade activity.
 * Entries are local, non-secret, bounded and safe for the PWA/Vault backup
 * model. Cross-device event sync is intentionally not claimed here.
 */

export const OPERATOR_ACTIVITY_SCHEMA = 'eon.operator.activity.v1';
export const OPERATOR_ACTIVITY_STORAGE_KEY = 'eon:operator:activity:v1';
export const OPERATOR_ACTIVITY_MAX_ENTRIES = 120;

const SAFE_SOURCES = new Set(['automation', 'market', 'local-ai', 'chat', 'city', 'system']);
const SAFE_STATUSES = new Set(['active', 'waiting', 'complete', 'failed', 'ready', 'info']);
const SENSITIVE_KEY_RE = /(api.?key|access.?token|refresh.?token|client.?secret|password|passphrase|private.?key|seed|cookie|authorization|wallet|exchange)/i;

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = 'activity') {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function cleanText(value, max = 280) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function sanitizeMetadata(value, depth = 0) {
  if (depth > 3 || value == null) return null;
  if (Array.isArray(value)) return value.slice(0, 12).map((item) => sanitizeMetadata(item, depth + 1));
  if (typeof value !== 'object') return cleanText(value, 160);
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY_RE.test(key)) continue;
    output[cleanText(key, 48)] = sanitizeMetadata(item, depth + 1);
  }
  return output;
}

function normalizeEntry(entry = {}) {
  const source = SAFE_SOURCES.has(String(entry.source || '').toLowerCase()) ? String(entry.source).toLowerCase() : 'system';
  const status = SAFE_STATUSES.has(String(entry.status || '').toLowerCase()) ? String(entry.status).toLowerCase() : 'info';
  const route = cleanText(entry.route || '', 180);
  return {
    id: cleanText(entry.id || randomId('activity'), 160),
    schema: OPERATOR_ACTIVITY_SCHEMA,
    source,
    status,
    title: cleanText(entry.title || 'EONAPP activity', 160) || 'EONAPP activity',
    detail: cleanText(entry.detail || '', 420),
    route: route.startsWith('/') ? route : '',
    metadata: sanitizeMetadata(entry.metadata || {}),
    at: cleanText(entry.at || nowIso(), 64)
  };
}

function readEnvelope() {
  const fallback = { schema: OPERATOR_ACTIVITY_SCHEMA, updatedAt: nowIso(), entries: [] };
  const parsed = readJson(OPERATOR_ACTIVITY_STORAGE_KEY, fallback);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) return fallback;
  return {
    schema: OPERATOR_ACTIVITY_SCHEMA,
    updatedAt: cleanText(parsed.updatedAt || nowIso(), 64),
    entries: parsed.entries.slice(-OPERATOR_ACTIVITY_MAX_ENTRIES).map(normalizeEntry)
  };
}

function emit(entry) {
  try {
    if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent('eon:operator-activity', { detail: entry }));
    }
  } catch {}
}

/** Record a truthful local product event. Never pass secrets or raw user content. */
export function appendOperatorActivity(entry = {}) {
  const normalized = normalizeEntry(entry);
  const envelope = readEnvelope();
  const next = {
    schema: OPERATOR_ACTIVITY_SCHEMA,
    updatedAt: nowIso(),
    entries: [...envelope.entries, normalized].slice(-OPERATOR_ACTIVITY_MAX_ENTRIES)
  };
  writeJson(OPERATOR_ACTIVITY_STORAGE_KEY, next);
  emit(normalized);
  // W286-B1: project only safe, recorded automation/local-AI/chat facts into
  // the separate City presence ledger. This does not create work or copy
  // activity detail; it gives City renderers a truthful local cue.
  try { recordAgentPresenceFromOperatorActivity(normalized); } catch {}
  return normalized;
}

export function listOperatorActivity({ limit = 12, source = '' } = {}) {
  const safeLimit = Math.max(1, Math.min(OPERATOR_ACTIVITY_MAX_ENTRIES, Number(limit) || 12));
  const entries = readEnvelope().entries;
  const filtered = source ? entries.filter((entry) => entry.source === String(source).toLowerCase()) : entries;
  return filtered.slice(-safeLimit).reverse();
}

export function getOperatorActivitySummary() {
  const entries = readEnvelope().entries;
  const latest = entries[entries.length - 1] || null;
  const active = entries.filter((entry) => entry.status === 'active' || entry.status === 'waiting').slice(-12);
  const sourceCounts = {};
  for (const entry of entries) sourceCounts[entry.source] = (sourceCounts[entry.source] || 0) + 1;
  return {
    schema: OPERATOR_ACTIVITY_SCHEMA,
    count: entries.length,
    activeCount: active.length,
    latest,
    sourceCounts,
    entries: entries.slice(-12).reverse()
  };
}

export function clearOperatorActivity() {
  try { globalThis.localStorage?.removeItem(OPERATOR_ACTIVITY_STORAGE_KEY); } catch {}
}
