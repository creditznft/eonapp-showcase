/** A15 I05 — non-destructive migration into the canonical Project registry. */

import {
  EON_PROJECT_MIGRATION_SCHEMA,
  EON_PROJECT_REGISTRY_SCHEMA,
  canonicalProjectId,
  loadProjectRegistry,
  projectLifecycleFromOperationalStatus,
  saveProjectRegistry
} from './eon-project-registry.js';

export const EON_PROJECT_MIGRATION_SOURCES = Object.freeze([
  Object.freeze({ namespace: 'ordinary', storageKey: 'eon:projects:v3', shape: 'projects-array' }),
  Object.freeze({ namespace: 'workspace-legacy', storageKey: 'eon:workspace:projects:v1', shape: 'projects-array' }),
  Object.freeze({ namespace: 'w631', storageKey: 'eon:project-operating-system:w631:v1', shape: 'projects-object' }),
  Object.freeze({ namespace: 'forge', storageKey: 'eon:forge:projects:v1', shape: 'array' }),
  Object.freeze({ namespace: 'creator-job', storageKey: 'eon:creator-jobs:v1', shape: 'jobs-array' }),
  Object.freeze({ namespace: 'creator-asset', storageKey: 'eon:creator-library:v1', shape: 'assets-array' })
]);

function storageRef(options = {}) {
  if (options.storage) return options.storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function clean(value = '', limit = 600) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function parse(raw, fallback) {
  try { const value = JSON.parse(String(raw || '')); return value && typeof value === 'object' ? value : fallback; } catch { return fallback; }
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

async function sha256(value = '') {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function rowsForSource(source, raw) {
  if (source.shape === 'array') return Array.isArray(raw) ? raw : [];
  if (source.shape === 'projects-array') return Array.isArray(raw?.projects) ? raw.projects : [];
  if (source.shape === 'projects-object') return Object.values(raw?.projects || {});
  if (source.shape === 'jobs-array') return Array.isArray(raw?.jobs) ? raw.jobs : [];
  if (source.shape === 'assets-array') return Array.isArray(raw?.assets) ? raw.assets : [];
  return [];
}

function sourceIdFor(namespace, row = {}) {
  if (namespace === 'ordinary' || namespace === 'workspace-legacy') return clean(row.id || row.projectId, 180);
  if (namespace === 'w631') return clean(row.projectId || row.id, 180);
  if (namespace === 'forge') return clean(row.id || row.projectId, 180);
  if (namespace === 'creator-job') return clean(row.jobId || row.id, 180);
  if (namespace === 'creator-asset') return clean(row.assetId, 180);
  return clean(row.id || row.projectId, 180);
}

function recordFromSource(source, row = {}, ordinaryIds = new Set()) {
  const sourceId = sourceIdFor(source.namespace, row);
  if (!sourceId) return null;
  const sharedOrdinary = ['ordinary', 'workspace-legacy', 'w631'].includes(source.namespace) && ordinaryIds.has(sourceId);
  const linkedCreatorJobId = source.namespace === 'creator-asset' ? clean(row.sourceJobId, 180) : '';
  const projectId = sharedOrdinary
    ? sourceId
    : linkedCreatorJobId
      ? canonicalProjectId('creator-job', linkedCreatorJobId)
      : canonicalProjectId(source.namespace, sourceId, { preserveSourceId: source.namespace === 'ordinary' });
  const status = clean(row.status || row.state || (row.deleted ? 'deleted' : 'active'), 80);
  const title = clean(row.title || row.safeLabel || (source.namespace === 'creator-asset' ? 'Creator output' : 'Untitled project'), 180);
  const summary = clean(row.summary || row.outcome || row.brief || row.message, 600);
  const relation = source.namespace === 'creator-asset' ? 'artifact' : source.namespace === 'creator-job' ? 'job' : source.namespace === 'ordinary' ? 'owner' : 'continuity';
  const artifactRefs = source.namespace === 'creator-asset' && row.assetId ? [clean(row.assetId, 180)] : [];
  return {
    projectId,
    title,
    summary,
    lifecycleState: projectLifecycleFromOperationalStatus(status, { archived: Boolean(row.archived || row.deleted) }),
    operationalStatus: status || 'active',
    continueDestination: source.namespace === 'forge' ? 'forge' : source.namespace.startsWith('creator') ? 'create' : 'projects',
    createdAt: String(row.createdAt || row.updatedAt || new Date(0).toISOString()),
    updatedAt: String(row.updatedAt || row.createdAt || new Date(0).toISOString()),
    artifactRefs,
    source: {
      namespace: source.namespace,
      sourceId,
      storageKey: source.storageKey,
      schema: clean(row.schema || '', 160),
      relation,
      updatedAt: String(row.updatedAt || row.createdAt || new Date(0).toISOString())
    }
  };
}

function mergeRecord(existing = null, incoming = {}) {
  if (!existing) {return {
    schema: EON_PROJECT_REGISTRY_SCHEMA,
    ...incoming,
    sources: [incoming.source],
    artifactRefs: [...incoming.artifactRefs],
    localOnly: true,
    contentBodyStored: false
  };}
  const sourceKey = `${incoming.source.namespace}::${incoming.source.sourceId}`;
  const sources = [...(existing.sources || []).filter((row) => `${row.namespace}::${row.sourceId}` !== sourceKey), incoming.source];
  return {
    ...existing,
    title: existing.title === 'Untitled project' ? incoming.title : existing.title,
    summary: existing.summary || incoming.summary,
    lifecycleState: existing.lifecycleState === 'active' || incoming.lifecycleState === 'active' ? 'active' : 'archived',
    operationalStatus: existing.operationalStatus || incoming.operationalStatus,
    continueDestination: existing.continueDestination || incoming.continueDestination,
    createdAt: String(existing.createdAt) < String(incoming.createdAt) ? existing.createdAt : incoming.createdAt,
    updatedAt: String(existing.updatedAt) > String(incoming.updatedAt) ? existing.updatedAt : incoming.updatedAt,
    artifactRefs: [...new Set([...(existing.artifactRefs || []), ...(incoming.artifactRefs || [])])],
    sources
  };
}

export async function inspectLegacyProjectSources(options = {}) {
  const target = storageRef(options);
  if (!target?.getItem) return Object.freeze({ ok: false, reason: 'storage-unavailable' });
  const sourceSnapshots = [];
  const parsedSources = [];
  for (const source of EON_PROJECT_MIGRATION_SOURCES) {
    const rawText = String(target.getItem(source.storageKey) || '');
    const parsed = parse(rawText, source.shape === 'array' ? [] : {});
    const rows = rowsForSource(source, parsed);
    const digest = await sha256(rawText || canonicalJson(parsed));
    sourceSnapshots.push(Object.freeze({ ...source, count: rows.length, digest, bytes: new TextEncoder().encode(rawText).byteLength }));
    parsedSources.push({ source, rows });
  }
  const ordinaryRows = parsedSources.find((entry) => entry.source.namespace === 'ordinary')?.rows || [];
  const ordinaryIds = new Set(ordinaryRows.map((row) => sourceIdFor('ordinary', row)).filter(Boolean));
  const candidates = [];
  const invalidRows = [];
  for (const { source, rows } of parsedSources) {
    rows.forEach((row, index) => {
      const candidate = recordFromSource(source, row, ordinaryIds);
      if (candidate) candidates.push(candidate);
      else invalidRows.push({ namespace: source.namespace, index, reason: 'source-id-missing' });
    });
  }
  return Object.freeze({ ok: true, sourceSnapshots: Object.freeze(sourceSnapshots), candidates: Object.freeze(candidates), invalidRows: Object.freeze(invalidRows) });
}

export async function migrateLegacyProjects(options = {}) {
  if (options.explicitUserAction !== true && options.automaticIndexOnly !== true) return Object.freeze({ ok: false, reason: 'explicit-action-or-index-only-authority-required' });
  const target = storageRef(options);
  const inspected = await inspectLegacyProjectSources({ ...options, storage: target });
  if (!inspected.ok) return inspected;
  const before = loadProjectRegistry({ ...options, storage: target });
  const records = { ...before.records };
  const aliases = { ...before.aliases };
  const touchedIds = new Set();
  const previousRecords = {};
  const previousAliases = {};
  for (const candidate of inspected.candidates) {
    if (!touchedIds.has(candidate.projectId)) previousRecords[candidate.projectId] = records[candidate.projectId] || null;
    const key = `${candidate.source.namespace}::${candidate.source.sourceId}`;
    previousAliases[key] = aliases[key] || null;
    records[candidate.projectId] = mergeRecord(records[candidate.projectId], candidate);
    aliases[key] = candidate.projectId;
    touchedIds.add(candidate.projectId);
  }
  const timestamp = new Date(typeof options.now === 'function' ? options.now() : (options.now ?? Date.now())).toISOString();
  const receiptSeed = {
    schema: EON_PROJECT_MIGRATION_SCHEMA,
    timestamp,
    sourceSnapshots: inspected.sourceSnapshots,
    candidateCount: inspected.candidates.length,
    targetProjectCount: Object.keys(records).length,
    touchedProjectCount: touchedIds.size,
    invalidRows: inspected.invalidRows
  };
  const receiptId = `project_migration_${(await sha256(canonicalJson(receiptSeed))).slice(0, 24)}`;
  const existingReceipt = before.migrations.find((row) => row.receiptId === receiptId);
  if (existingReceipt) {
    return Object.freeze({
      ok: true,
      idempotent: true,
      receipt: Object.freeze({ ...existingReceipt, previousRecords: undefined, previousAliases: undefined }),
      state: before
    });
  }
  const migratedRecords = Object.fromEntries(Object.entries(records).map(([projectId, record]) => [projectId, { ...record, migrationReceiptId: receiptId }]));
  const receipt = {
    ...receiptSeed,
    receiptId,
    targetDigest: '',
    automaticIndexOnly: options.automaticIndexOnly === true,
    legacyStoresMutated: false,
    rollbackAvailable: true,
    touchedProjectIds: [...touchedIds].sort(),
    previousRecords,
    previousAliases
  };
  const next = {
    ...before,
    records: migratedRecords,
    aliases,
    migrations: [...before.migrations.filter((row) => row.receiptId !== receiptId), receipt]
  };
  const firstSave = saveProjectRegistry(next, { ...options, storage: target });
  if (!firstSave.ok) return firstSave;
  const targetDigest = await sha256(canonicalJson({ records: firstSave.state.records, aliases: firstSave.state.aliases }));
  const finalReceipt = { ...receipt, targetDigest };
  const finalState = {
    ...firstSave.state,
    migrations: [...firstSave.state.migrations.filter((row) => row.receiptId !== receiptId), finalReceipt]
  };
  const saved = saveProjectRegistry(finalState, { ...options, storage: target });
  if (!saved.ok) return saved;
  const persistedDigest = await sha256(canonicalJson({ records: saved.state.records, aliases: saved.state.aliases }));
  if (persistedDigest !== targetDigest) return Object.freeze({ ok: false, reason: 'target-digest-mismatch', expected: targetDigest, actual: persistedDigest });
  return Object.freeze({ ok: true, receipt: Object.freeze({ ...finalReceipt, previousRecords: undefined, previousAliases: undefined }), state: saved.state });
}

export async function rollbackProjectMigration(receiptId = '', options = {}) {
  if (options.explicitUserAction !== true || options.confirmed !== true) return Object.freeze({ ok: false, reason: 'explicit-confirmation-required' });
  const target = storageRef(options);
  const state = loadProjectRegistry({ ...options, storage: target });
  const receipt = state.migrations.find((row) => row.receiptId === receiptId);
  if (!receipt) return Object.freeze({ ok: false, reason: 'migration-receipt-not-found' });
  const records = { ...state.records };
  const aliases = { ...state.aliases };
  for (const projectId of receipt.touchedProjectIds || []) {
    const previous = receipt.previousRecords?.[projectId];
    if (previous) records[projectId] = previous;
    else delete records[projectId];
  }
  for (const [key, previous] of Object.entries(receipt.previousAliases || {})) {
    if (previous) aliases[key] = previous;
    else delete aliases[key];
  }
  const next = { ...state, records, aliases, migrations: state.migrations.filter((row) => row.receiptId !== receiptId) };
  const saved = saveProjectRegistry(next, { ...options, storage: target });
  return saved.ok ? Object.freeze({ ok: true, receiptId, state: saved.state, legacyStoresMutated: false }) : saved;
}

export const __projectMigrationInternals = Object.freeze({ canonicalJson, mergeRecord, recordFromSource, rowsForSource, sha256, sourceIdFor });
