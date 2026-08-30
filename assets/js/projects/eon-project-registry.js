/**
 * A15 I05 — canonical local Project identity and lifecycle authority.
 *
 * The registry indexes project identity and continuity only. Domain stores keep
 * their own work bodies. Indexing never deletes, truncates, publishes, uploads,
 * or claims cross-device synchronization.
 */

import { evaluateEonCapacity } from '../storage/eon-capacity-authority.js';

export const EON_PROJECT_REGISTRY_SCHEMA = 'eonapp.project-registry.a15.v1';
export const EON_PROJECT_REGISTRY_STORAGE_KEY = 'eon:project-registry:a15:v1';
export const EON_PROJECT_MIGRATION_SCHEMA = 'eonapp.project-migration-receipt.a15.v1';

const LIFECYCLE_STATES = new Set(['active', 'archived']);
const SOURCE_ID_RE = /[^a-zA-Z0-9._:-]+/g;
const MAX_TEXT = 600;

function nowIso(options = {}) {
  const value = typeof options.now === 'function' ? options.now() : options.now;
  if (value == null) return new Date().toISOString();
  const numeric = typeof value === 'number' ? value : Date.parse(String(value));
  return new Date(Number.isFinite(numeric) ? numeric : Date.now()).toISOString();
}

function storageRef(options = {}) {
  if (options.storage) return options.storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function clean(value = '', limit = MAX_TEXT) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function sourceToken(value = '') {
  return clean(value, 180).replace(SOURCE_ID_RE, '-').replace(/-{2,}/g, '-').replace(/(^-|-$)/g, '') || 'unknown';
}

function parse(raw, fallback) {
  try {
    const value = JSON.parse(String(raw || ''));
    return value && typeof value === 'object' ? value : fallback;
  } catch {
    return fallback;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptyState(options = {}) {
  const timestamp = nowIso(options);
  return {
    schema: EON_PROJECT_REGISTRY_SCHEMA,
    revision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    records: {},
    aliases: {},
    migrations: []
  };
}

function aliasKey(namespace = '', sourceId = '') {
  return `${sourceToken(namespace)}::${sourceToken(sourceId)}`;
}

export function canonicalProjectId(namespace = '', sourceId = '', options = {}) {
  const source = sourceToken(sourceId);
  const family = sourceToken(namespace);
  if (options.preserveSourceId === true && /^(?:project|proj)[_:.-]/i.test(source)) return source.slice(0, 180);
  return `project_${family}_${source}`.slice(0, 180);
}

export function projectLifecycleFromOperationalStatus(status = '', options = {}) {
  if (options.archived === true) return 'archived';
  const value = clean(status, 60).toLowerCase();
  return ['archived', 'complete', 'completed', 'saved', 'deleted'].includes(value) ? 'archived' : 'active';
}

function normalizeSource(value = {}) {
  return Object.freeze({
    namespace: sourceToken(value.namespace),
    sourceId: sourceToken(value.sourceId),
    storageKey: clean(value.storageKey, 220),
    schema: clean(value.schema, 160),
    relation: ['owner', 'continuity', 'artifact', 'job'].includes(value.relation) ? value.relation : 'continuity',
    updatedAt: String(value.updatedAt || new Date().toISOString())
  });
}

function countsAsProjectSlot(record = {}) {
  return record.lifecycleState === 'active' && (record.sources || []).some((source) => ['owner', 'continuity'].includes(source.relation));
}

function projectSlotCounts(records = {}) {
  const rows = Object.values(records || {});
  const activeCount = rows.filter(countsAsProjectSlot).length;
  const archivedCount = rows.filter((row) => row.lifecycleState === 'archived' && (row.sources || []).some((source) => ['owner', 'continuity'].includes(source.relation))).length;
  return Object.freeze({ activeCount, archivedCount, totalCount: activeCount + archivedCount });
}

function normalizeRecord(value = {}) {
  const createdAt = String(value.createdAt || new Date().toISOString());
  const lifecycleState = LIFECYCLE_STATES.has(value.lifecycleState) ? value.lifecycleState : 'active';
  const sourceRows = Array.isArray(value.sources) ? value.sources : [];
  const sourceMap = new Map();
  for (const row of sourceRows) {
    const source = normalizeSource(row);
    sourceMap.set(aliasKey(source.namespace, source.sourceId), source);
  }
  return Object.freeze({
    schema: EON_PROJECT_REGISTRY_SCHEMA,
    projectId: clean(value.projectId, 180),
    title: clean(value.title || 'Untitled project', 180),
    summary: clean(value.summary, 600),
    lifecycleState,
    operationalStatus: clean(value.operationalStatus || (lifecycleState === 'archived' ? 'archived' : 'active'), 80),
    continueDestination: clean(value.continueDestination || 'projects', 80),
    sources: Object.freeze([...sourceMap.values()]),
    artifactRefs: Object.freeze([...(Array.isArray(value.artifactRefs) ? value.artifactRefs : [])].map((item) => clean(item, 180)).filter(Boolean).filter((item, index, all) => all.indexOf(item) === index)),
    createdAt,
    updatedAt: String(value.updatedAt || createdAt),
    migrationReceiptId: clean(value.migrationReceiptId, 180),
    localOnly: true,
    contentBodyStored: false
  });
}

export function loadProjectRegistry(options = {}) {
  const target = storageRef(options);
  const base = emptyState(options);
  const raw = parse(target?.getItem?.(EON_PROJECT_REGISTRY_STORAGE_KEY), base);
  const records = {};
  for (const entry of Object.values(raw.records || {})) {
    const record = normalizeRecord(entry);
    if (record.projectId) records[record.projectId] = record;
  }
  const aliases = {};
  for (const [key, projectId] of Object.entries(raw.aliases || {})) {
    if (records[projectId]) aliases[clean(key, 380)] = clean(projectId, 180);
  }
  return {
    ...base,
    ...raw,
    schema: EON_PROJECT_REGISTRY_SCHEMA,
    revision: Math.max(0, Number(raw.revision) || 0),
    records,
    aliases,
    migrations: Array.isArray(raw.migrations) ? raw.migrations.map((row) => clone(row)) : []
  };
}

export function saveProjectRegistry(state = {}, options = {}) {
  const target = storageRef(options);
  if (!target?.setItem) return Object.freeze({ ok: false, reason: 'storage-unavailable' });
  const current = loadProjectRegistry({ ...options, storage: target });
  const records = {};
  for (const entry of Object.values(state.records || {})) {
    const record = normalizeRecord(entry);
    if (record.projectId) records[record.projectId] = record;
  }
  const payload = {
    schema: EON_PROJECT_REGISTRY_SCHEMA,
    revision: Math.max(current.revision + 1, Number(state.revision) || 0),
    createdAt: String(state.createdAt || current.createdAt || nowIso(options)),
    updatedAt: nowIso(options),
    records,
    aliases: { ...(state.aliases || {}) },
    migrations: Array.isArray(state.migrations) ? state.migrations.map((row) => clone(row)) : []
  };
  try {
    target.setItem(EON_PROJECT_REGISTRY_STORAGE_KEY, JSON.stringify(payload));
    const persisted = parse(target.getItem(EON_PROJECT_REGISTRY_STORAGE_KEY), null);
    if (!persisted || persisted.schema !== EON_PROJECT_REGISTRY_SCHEMA || Number(persisted.revision) !== payload.revision) {
      return Object.freeze({ ok: false, reason: 'write-verification-failed' });
    }
  } catch (error) {
    return Object.freeze({ ok: false, reason: 'storage-write-failed', message: clean(error?.message, 240) });
  }
  if (options.emit !== false) {
    try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:project-registry-changed', { detail: { revision: payload.revision, updatedAt: payload.updatedAt } })); } catch {}
  }
  return Object.freeze({ ok: true, state: payload });
}

export function registerProjectSource(input = {}, options = {}) {
  const namespace = sourceToken(input.namespace);
  const sourceId = sourceToken(input.sourceId || input.projectId);
  if (!namespace || !sourceId || sourceId === 'unknown') return Object.freeze({ ok: false, reason: 'source-identity-required' });
  const state = loadProjectRegistry(options);
  const key = aliasKey(namespace, sourceId);
  const preferredId = clean(input.projectId, 180) || canonicalProjectId(namespace, sourceId, { preserveSourceId: input.preserveSourceId === true });
  const projectId = state.aliases[key] || preferredId;
  const existing = state.records[projectId] || {};
  const nextSource = normalizeSource({
    namespace,
    sourceId,
    storageKey: input.storageKey,
    schema: input.sourceSchema || input.schema,
    relation: input.relation,
    updatedAt: input.updatedAt || nowIso(options)
  });
  const sources = [...(existing.sources || []).filter((row) => aliasKey(row.namespace, row.sourceId) !== key), nextSource];
  const hasLifecycleInput = Boolean(input.lifecycleState || input.operationalStatus || input.archived === true);
  const preserveExistingCopy = nextSource.relation === 'artifact' && Boolean(existing.projectId);
  const record = normalizeRecord({
    ...existing,
    projectId,
    title: preserveExistingCopy ? existing.title : (input.title || existing.title),
    summary: preserveExistingCopy ? existing.summary : (input.summary ?? existing.summary),
    lifecycleState: input.lifecycleState || (hasLifecycleInput ? projectLifecycleFromOperationalStatus(input.operationalStatus, input) : existing.lifecycleState),
    operationalStatus: input.operationalStatus || existing.operationalStatus,
    continueDestination: input.continueDestination || existing.continueDestination,
    artifactRefs: [...(existing.artifactRefs || []), ...(input.artifactRefs || [])],
    sources,
    createdAt: input.createdAt || existing.createdAt,
    updatedAt: input.updatedAt || nowIso(options),
    migrationReceiptId: input.migrationReceiptId || existing.migrationReceiptId
  });
  const beforeCounts = projectSlotCounts(state.records);
  const nextRecords = { ...state.records, [projectId]: record };
  const afterCounts = projectSlotCounts(nextRecords);
  if (afterCounts.activeCount > beforeCounts.activeCount) {
    const capacity = evaluateEonCapacity({
      resourceId: 'universal-projects',
      ...beforeCounts,
      requestedCount: afterCounts.activeCount - beforeCounts.activeCount,
      requestedTotalCount: Math.max(0, afterCounts.totalCount - beforeCounts.totalCount)
    }, options);
    if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  }
  state.records[projectId] = record;
  state.aliases[key] = projectId;
  const saved = saveProjectRegistry(state, options);
  if (!saved.ok) return saved;
  return Object.freeze({ ok: true, record, alias: key, created: !existing.projectId });
}

export function removeProjectSource(namespace = '', sourceId = '', options = {}) {
  const state = loadProjectRegistry(options);
  const key = aliasKey(namespace, sourceId);
  const projectId = state.aliases[key];
  if (!projectId) return Object.freeze({ ok: false, reason: 'source-not-found' });
  const existing = state.records[projectId];
  delete state.aliases[key];
  const sources = (existing?.sources || []).filter((row) => aliasKey(row.namespace, row.sourceId) !== key);
  if (!sources.length) delete state.records[projectId];
  else state.records[projectId] = normalizeRecord({ ...existing, sources, updatedAt: nowIso(options) });
  const saved = saveProjectRegistry(state, options);
  return saved.ok ? Object.freeze({ ok: true, projectId, removedRecord: !sources.length }) : saved;
}

export function listProjectRegistryRecords(options = {}) {
  return Object.freeze(Object.values(loadProjectRegistry(options).records).sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt))));
}

export function getProjectRegistryRecord(projectId = '', options = {}) {
  return loadProjectRegistry(options).records[clean(projectId, 180)] || null;
}

export function getProjectRegistryTruth(options = {}) {
  const state = loadProjectRegistry(options);
  const records = Object.values(state.records);
  return Object.freeze({
    schema: EON_PROJECT_REGISTRY_SCHEMA,
    localOnly: true,
    identityAndLifecycleOnly: true,
    sourceBodiesMutated: false,
    activeProjects: records.filter((row) => row.lifecycleState === 'active').length,
    archivedProjects: records.filter((row) => row.lifecycleState === 'archived').length,
    totalProjects: records.length,
    migrationReceipts: state.migrations.length,
    revision: state.revision
  });
}

export const __projectRegistryInternals = Object.freeze({ aliasKey, normalizeRecord, normalizeSource, sourceToken, countsAsProjectSlot, projectSlotCounts });
