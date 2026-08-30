/**
 * W318 — redacted foreground session store.
 *
 * This bridge deliberately uses sessionStorage, not localStorage, and stores
 * only opaque IDs, safe labels, states, hashes and expiry metadata. Long-lived
 * work belongs in the later encrypted local vault migration, never here.
 */

export const EON_KERNEL_SESSION_SCHEMA = 'eonapp.ai-kernel-foreground-session.v1';
export const EON_KERNEL_SESSION_KEY = 'eon:ai-kernel:foreground-session:v1';

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function') return candidate;
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function clean(value = '', max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeRecord(source = {}) {
  const value = source && typeof source === 'object' ? source : {};
  return Object.freeze({
    taskId: clean(value.taskId, 160),
    projectId: clean(value.projectId, 160),
    title: clean(value.title, 180),
    taskClass: clean(value.taskClass, 48),
    role: clean(value.role, 48),
    state: clean(value.state, 48),
    privacyClass: clean(value.privacyClass, 48),
    createdAt: clean(value.createdAt, 64),
    updatedAt: clean(value.updatedAt, 64),
    artifactIds: Array.isArray(value.artifactIds) ? value.artifactIds.map((item) => clean(item, 160)).filter(Boolean).slice(0, 32) : [],
    reviewId: clean(value.reviewId, 160),
    reviewStatus: clean(value.reviewStatus, 48),
    reviewExpiresAt: clean(value.reviewExpiresAt, 64),
    workflowState: clean(value.workflowState, 48)
  });
}

function parse(raw = '') {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || typeof value !== 'object' || !Array.isArray(value.records)) return Object.freeze({ schema: EON_KERNEL_SESSION_SCHEMA, records: Object.freeze([]) });
    return Object.freeze({
      schema: EON_KERNEL_SESSION_SCHEMA,
      records: Object.freeze(value.records.map(safeRecord).filter((record) => /^eontask_[a-z0-9_-]{12,120}$/i.test(record.taskId)).slice(-32))
    });
  } catch {
    return Object.freeze({ schema: EON_KERNEL_SESSION_SCHEMA, records: Object.freeze([]) });
  }
}

export function readEonKernelForegroundSession({ storage } = {}) {
  const resolved = storageFor(storage);
  return parse(resolved?.getItem(EON_KERNEL_SESSION_KEY));
}

export function upsertEonKernelForegroundRecord(record = {}, { storage } = {}) {
  const normalized = safeRecord(record);
  if (!/^eontask_[a-z0-9_-]{12,120}$/i.test(normalized.taskId)) return Object.freeze({ ok: false, reason: 'invalid-task-id', record: null });
  const resolved = storageFor(storage);
  if (!resolved) return Object.freeze({ ok: false, reason: 'session-storage-unavailable', record: null });
  const session = readEonKernelForegroundSession({ storage: resolved });
  const entries = session.records.filter((item) => item.taskId !== normalized.taskId);
  entries.push(normalized);
  try {
    resolved.setItem(EON_KERNEL_SESSION_KEY, JSON.stringify({ schema: EON_KERNEL_SESSION_SCHEMA, records: entries.slice(-32) }));
    return Object.freeze({ ok: true, reason: null, record: normalized });
  } catch {
    return Object.freeze({ ok: false, reason: 'session-storage-unavailable', record: null });
  }
}

export function getEonKernelSessionTruth() {
  return Object.freeze({
    schema: EON_KERNEL_SESSION_SCHEMA,
    storage: 'session-only-redacted',
    localStorage: false,
    durableWorkspaceStore: false,
    rawPromptStored: false,
    rawOutputStored: false,
    providerKeyStored: false,
    backgroundAfterClose: false
  });
}
