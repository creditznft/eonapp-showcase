/** A15 I06 — unified local Library identity index. Work bodies remain in source stores. */

export const EON_LIBRARY_INDEX_SCHEMA = 'eonapp.library-index.a15.v1';
export const EON_LIBRARY_INDEX_STORAGE_KEY = 'eon:library-index:a15:v1';

function storageRef(options = {}) { if (options.storage) return options.storage; try { return globalThis.localStorage || null; } catch { return null; } }
function clean(value = '', limit = 240) { return String(value || '').replaceAll(String.fromCharCode(0), '').replace(/\s+/g, ' ').trim().slice(0, limit); }
function parse(raw, fallback) { try { const value = JSON.parse(String(raw || '')); return value && typeof value === 'object' ? value : fallback; } catch { return fallback; } }
function nowIso(options = {}) { const raw = typeof options.now === 'function' ? options.now() : options.now; const parsed = raw == null ? Date.now() : typeof raw === 'number' ? raw : Date.parse(String(raw)); return new Date(Number.isFinite(parsed) ? parsed : Date.now()).toISOString(); }
function token(value = '') { return clean(value, 180).replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/-{2,}/g, '-').replace(/(^-|-$)/g, '') || 'unknown'; }
function aliasKey(namespace = '', sourceId = '') { return `${token(namespace)}::${token(sourceId)}`; }

function empty(options = {}) { const timestamp = nowIso(options); return { schema: EON_LIBRARY_INDEX_SCHEMA, revision: 0, createdAt: timestamp, updatedAt: timestamp, records: {}, aliases: {}, lastRebuild: null }; }
function normalizeSource(value = {}) { return Object.freeze({ namespace: token(value.namespace), sourceId: token(value.sourceId), storageKey: clean(value.storageKey, 220), schema: clean(value.schema, 160), updatedAt: String(value.updatedAt || new Date().toISOString()) }); }
function normalizeRecord(value = {}) {
  const sources = [];
  const seen = new Set();
  for (const row of Array.isArray(value.sources) ? value.sources : []) { const source = normalizeSource(row); const key = aliasKey(source.namespace, source.sourceId); if (!seen.has(key)) { seen.add(key); sources.push(source); } }
  const createdAt = String(value.createdAt || new Date().toISOString());
  return Object.freeze({
    schema: EON_LIBRARY_INDEX_SCHEMA,
    libraryItemId: clean(value.libraryItemId, 220),
    kind: ['library-item', 'project-artifact', 'creator-asset'].includes(value.kind) ? value.kind : 'library-item',
    title: clean(value.title || 'Untitled library item', 180),
    projectId: clean(value.projectId, 180),
    mediaKind: clean(value.mediaKind, 40),
    lifecycleState: value.lifecycleState === 'archived' ? 'archived' : 'active',
    sources: Object.freeze(sources),
    createdAt,
    updatedAt: String(value.updatedAt || createdAt),
    localOnly: true,
    contentBodyStored: false,
    credentialAllowed: false
  });
}

export function canonicalLibraryItemId(namespace = '', sourceId = '', projectId = '') {
  const prefix = projectId ? `${token(projectId)}_` : '';
  return `library_${token(namespace)}_${prefix}${token(sourceId)}`.slice(0, 220);
}

export function loadLibraryIndex(options = {}) {
  const target = storageRef(options); const base = empty(options); const raw = parse(target?.getItem?.(EON_LIBRARY_INDEX_STORAGE_KEY), base);
  const records = {};
  for (const entry of Object.values(raw.records || {})) { const record = normalizeRecord(entry); if (record.libraryItemId) records[record.libraryItemId] = record; }
  const aliases = {};
  for (const [key, id] of Object.entries(raw.aliases || {})) if (records[id]) aliases[clean(key, 380)] = clean(id, 220);
  return { ...base, ...raw, schema: EON_LIBRARY_INDEX_SCHEMA, revision: Math.max(0, Number(raw.revision) || 0), records, aliases };
}

export function saveLibraryIndex(state = {}, options = {}) {
  const target = storageRef(options); if (!target?.setItem) return Object.freeze({ ok: false, reason: 'storage-unavailable' });
  const current = loadLibraryIndex({ ...options, storage: target }); const records = {};
  for (const entry of Object.values(state.records || {})) { const record = normalizeRecord(entry); if (record.libraryItemId) records[record.libraryItemId] = record; }
  const payload = { schema: EON_LIBRARY_INDEX_SCHEMA, revision: current.revision + 1, createdAt: String(state.createdAt || current.createdAt), updatedAt: nowIso(options), records, aliases: { ...(state.aliases || {}) }, lastRebuild: state.lastRebuild || current.lastRebuild || null };
  try { const serialized = JSON.stringify(payload); target.setItem(EON_LIBRARY_INDEX_STORAGE_KEY, serialized); if (target.getItem(EON_LIBRARY_INDEX_STORAGE_KEY) !== serialized) return Object.freeze({ ok: false, reason: 'write-verification-failed' }); }
  catch (error) { return Object.freeze({ ok: false, reason: 'storage-write-failed', message: clean(error?.message, 220) }); }
  if (options.emit !== false) { try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:library-index-changed', { detail: { revision: payload.revision, updatedAt: payload.updatedAt } })); } catch {} }
  return Object.freeze({ ok: true, state: payload });
}

export function registerLibrarySource(input = {}, options = {}) {
  const namespace = token(input.namespace); const sourceId = token(input.sourceId); if (sourceId === 'unknown') return Object.freeze({ ok: false, reason: 'source-identity-required' });
  const state = loadLibraryIndex(options); const key = aliasKey(namespace, sourceId); const id = state.aliases[key] || clean(input.libraryItemId, 220) || canonicalLibraryItemId(namespace, sourceId, input.projectId);
  const existing = state.records[id] || {}; const source = normalizeSource({ namespace, sourceId, storageKey: input.storageKey, schema: input.sourceSchema, updatedAt: input.updatedAt || nowIso(options) });
  const record = normalizeRecord({ ...existing, libraryItemId: id, kind: input.kind || existing.kind, title: input.title || existing.title, projectId: input.projectId || existing.projectId, mediaKind: input.mediaKind || existing.mediaKind, lifecycleState: input.lifecycleState || existing.lifecycleState, sources: [...(existing.sources || []).filter((row) => aliasKey(row.namespace, row.sourceId) !== key), source], createdAt: input.createdAt || existing.createdAt, updatedAt: input.updatedAt || nowIso(options) });
  state.records[id] = record; state.aliases[key] = id; const saved = saveLibraryIndex(state, options); return saved.ok ? Object.freeze({ ok: true, record, created: !existing.libraryItemId }) : saved;
}

export function removeLibrarySource(namespace = '', sourceId = '', options = {}) {
  const state = loadLibraryIndex(options); const key = aliasKey(namespace, sourceId); const id = state.aliases[key]; if (!id) return Object.freeze({ ok: false, reason: 'source-not-found' });
  const existing = state.records[id]; delete state.aliases[key]; const sources = (existing?.sources || []).filter((row) => aliasKey(row.namespace, row.sourceId) !== key);
  if (!sources.length) delete state.records[id]; else state.records[id] = normalizeRecord({ ...existing, sources, updatedAt: nowIso(options) });
  const saved = saveLibraryIndex(state, options); return saved.ok ? Object.freeze({ ok: true, libraryItemId: id, removedRecord: !sources.length }) : saved;
}

export function listLibraryIndexRecords(options = {}) { return Object.freeze(Object.values(loadLibraryIndex(options).records).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))); }

export function rebuildLibraryIndexFromLegacy(options = {}) {
  const target = storageRef(options); if (!target?.getItem) return Object.freeze({ ok: false, reason: 'storage-unavailable' });
  const prior = loadLibraryIndex({ ...options, storage: target }); const state = { ...prior, records: {}, aliases: {} }; const sourceCounts = { ordinaryLibrary: 0, projectArtifacts: 0, creatorAssets: 0 };
  const ordinary = parse(target.getItem('eon:library:v3'), {});
  for (const item of Array.isArray(ordinary.items) ? ordinary.items : []) { const result = registerIntoState(state, { namespace: 'ordinary-library', sourceId: item.id, kind: 'library-item', title: item.title, storageKey: 'eon:library:v3', sourceSchema: item.schema || ordinary.schema, createdAt: item.createdAt, updatedAt: item.updatedAt, lifecycleState: item.lifecycleState }); if (result) sourceCounts.ordinaryLibrary += 1; }
  const projects = parse(target.getItem('eon:projects:v3'), {});
  for (const project of Array.isArray(projects.projects) ? projects.projects : []) for (const artifact of Array.isArray(project.artifacts) ? project.artifacts : []) { const sourceId = `${project.id}:${artifact.id}`; const result = registerIntoState(state, { namespace: 'project-artifact', sourceId, kind: 'project-artifact', title: artifact.title, projectId: project.id, storageKey: 'eon:projects:v3', sourceSchema: projects.schema, createdAt: artifact.createdAt, updatedAt: artifact.updatedAt }); if (result) sourceCounts.projectArtifacts += 1; }
  const creator = parse(target.getItem('eon:creator-library:v1'), {});
  for (const asset of Array.isArray(creator.assets) ? creator.assets : []) { if (asset.deleted) continue; const result = registerIntoState(state, { namespace: 'creator-asset', sourceId: asset.assetId, kind: 'creator-asset', title: asset.title, projectId: asset.sourceJobId ? `project_creator-job_${asset.sourceJobId}` : '', mediaKind: asset.mediaKind, storageKey: 'eon:creator-library:v1', sourceSchema: asset.schema || creator.schema, createdAt: asset.createdAt, updatedAt: asset.updatedAt }); if (result) sourceCounts.creatorAssets += 1; }
  const rebuiltAt = nowIso(options); state.lastRebuild = { schema: 'eonapp.library-index-rebuild.a15.v1', rebuiltAt, sourceCounts, recordCount: Object.keys(state.records).length, sourceBodiesMutated: false, silentEviction: false };
  const saved = saveLibraryIndex(state, { ...options, storage: target }); return saved.ok ? Object.freeze({ ok: true, receipt: Object.freeze(state.lastRebuild), state: saved.state }) : saved;
}

function registerIntoState(state, input = {}) {
  const namespace = token(input.namespace); const sourceId = token(input.sourceId); if (sourceId === 'unknown') return false; const key = aliasKey(namespace, sourceId); const id = canonicalLibraryItemId(namespace, sourceId, input.projectId);
  const source = normalizeSource({ namespace, sourceId, storageKey: input.storageKey, schema: input.sourceSchema, updatedAt: input.updatedAt || new Date(0).toISOString() });
  state.records[id] = normalizeRecord({ libraryItemId: id, kind: input.kind, title: input.title, projectId: input.projectId, mediaKind: input.mediaKind, lifecycleState: input.lifecycleState, sources: [source], createdAt: input.createdAt || input.updatedAt || new Date(0).toISOString(), updatedAt: input.updatedAt || input.createdAt || new Date(0).toISOString() }); state.aliases[key] = id; return true;
}

export function getLibraryIndexTruth(options = {}) { const records = listLibraryIndexRecords(options); const activeRecords = records.filter((record) => record.lifecycleState === 'active'); const archivedRecords = records.filter((record) => record.lifecycleState === 'archived'); const sourceCounts = {}; for (const record of records) for (const source of record.sources) sourceCounts[source.namespace] = (sourceCounts[source.namespace] || 0) + 1; return Object.freeze({ schema: EON_LIBRARY_INDEX_SCHEMA, localOnly: true, contentBodiesStored: false, activeRecords: activeRecords.length, archivedRecords: archivedRecords.length, recordCount: records.length, sourceCounts: Object.freeze(sourceCounts), sourceBodiesMutated: false, silentEviction: false }); }
