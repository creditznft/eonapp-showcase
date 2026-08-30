/** W627F — Creator metadata export, restore preview, conflicts and migration. */

import { EON_CREATOR_LIBRARY_SCHEMA, EON_CREATOR_LIBRARY_STORAGE_KEY, listCreatorAssets } from './creator-library-store.js';
import { EON_PROJECT_REGISTRY_STORAGE_KEY, canonicalProjectId, registerProjectSource } from '../projects/eon-project-registry.js';
import { EON_LIBRARY_INDEX_STORAGE_KEY, registerLibrarySource } from '../storage/eon-library-index.js';
import { captureEonStorageSnapshot, restoreEonStorageSnapshot } from '../storage/eon-storage-transaction.js';
import { evaluateEonCapacity } from '../storage/eon-capacity-authority.js';

export const EON_CREATOR_EXPORT_SCHEMA = 'eon.creator-library-export.w627f.v1';
export const EON_CREATOR_RESTORE_CONFIRMATION = 'RESTORE CREATOR LIBRARY';
const MAX_RECORDS = 5_000;

function clean(value = '', limit = 180) { return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, limit); }
function nowIso(now = () => Date.now()) { return new Date(Number(now())).toISOString(); }
function storage(options = {}) { if (options.storage) return options.storage; try { return globalThis.localStorage || null; } catch { return null; } }
function canonical(value) { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`; }

export function buildCreatorLibraryExport(options = {}) {
  const assets = listCreatorAssets(options).map((asset) => Object.freeze({ ...asset, mediaStoredLocally: false, mediaPortableInCapsule: false, prompt: asset.promptSavedByUser ? asset.prompt : '', rawMediaIncluded: false }));
  return Object.freeze({
    schema: EON_CREATOR_EXPORT_SCHEMA,
    version: 1,
    createdAt: nowIso(options.now),
    assetCount: assets.length,
    assets: Object.freeze(assets),
    genericCapsuleIncludesMetadata: true,
    genericCapsuleIncludesRawMedia: false,
    explicitSeparateMediaExportRequired: true,
    credentialsIncluded: false,
    providerSecretsIncluded: false
  });
}

export function inspectCreatorLibraryRestore(candidate = {}, options = {}) {
  if (candidate?.schema !== EON_CREATOR_EXPORT_SCHEMA || Number(candidate?.version) !== 1) return Object.freeze({ ok: false, reason: 'unsupported-export' });
  const incoming = Array.isArray(candidate.assets) ? candidate.assets : [];
  if (incoming.length > MAX_RECORDS) return Object.freeze({ ok: false, reason: 'record-count-out-of-bounds' });
  const existing = new Map(listCreatorAssets(options).map((asset) => [asset.assetId, asset]));
  const changes = incoming.map((asset) => {
    const prior = existing.get(String(asset.assetId || ''));
    const status = !prior ? 'add' : canonical(prior) === canonical({ ...asset, mediaStoredLocally: prior.mediaStoredLocally }) ? 'same' : 'conflict';
    return Object.freeze({ assetId: clean(asset.assetId, 160), title: clean(asset.title), status, incoming: Object.freeze({ ...asset, mediaStoredLocally: false, mediaPortableInCapsule: false }) });
  });
  return Object.freeze({ ok: true, schema: EON_CREATOR_EXPORT_SCHEMA, changes: Object.freeze(changes), rawMediaRestored: false, automaticOverwrite: false });
}

export function applyCreatorLibraryRestore(preview = {}, choices = [], options = {}) {
  if (options.explicitUserAction !== true || options.confirmation !== EON_CREATOR_RESTORE_CONFIRMATION) return Object.freeze({ ok: false, reason: 'explicit-confirmation-required' });
  if (!preview?.ok || !Array.isArray(preview.changes)) return Object.freeze({ ok: false, reason: 'valid-preview-required' });
  const choiceMap = new Map((Array.isArray(choices) ? choices : []).map((row) => [String(row.assetId || ''), String(row.action || 'skip')]));
  const existing = listCreatorAssets(options);
  const byId = new Map(existing.map((asset) => [asset.assetId, asset]));
  const imported = [];
  const skipped = [];
  for (const change of preview.changes) {
    const action = choiceMap.get(change.assetId) || (change.status === 'add' ? 'add' : 'skip');
    if (change.status === 'conflict' && action !== 'overwrite') { skipped.push(change.assetId); continue; }
    if (change.status === 'same' || action === 'skip') { skipped.push(change.assetId); continue; }
    if (!['add', 'overwrite'].includes(action)) return Object.freeze({ ok: false, reason: 'invalid-choice' });
    byId.set(change.assetId, Object.freeze({ ...change.incoming, mediaStoredLocally: false, mediaPortableInCapsule: false, updatedAt: nowIso(options.now) }));
    imported.push(change.assetId);
  }
  const assets = [...byId.values()];
  const capacity = evaluateEonCapacity({ resourceId: 'creator-assets', currentCount: existing.length, totalCount: existing.length, requestedCount: assets.length - existing.length }, options);
  if (assets.length > capacity.limit) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity, imported: Object.freeze([]), skipped: Object.freeze(skipped), rawMediaRestored: false });
  const target = storage(options);
  const transaction = captureEonStorageSnapshot([EON_CREATOR_LIBRARY_STORAGE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], { ...options, storage: target });
  if (!transaction.ok) return Object.freeze({ ok: false, reason: transaction.reason || 'storage-snapshot-failed', imported: Object.freeze([]), skipped: Object.freeze(skipped), rawMediaRestored: false });
  try {
    const payload = { schema: EON_CREATOR_LIBRARY_SCHEMA, updatedAt: nowIso(options.now), assets };
    const serialized = JSON.stringify(payload);
    target?.setItem?.(EON_CREATOR_LIBRARY_STORAGE_KEY, serialized);
    if (target?.getItem?.(EON_CREATOR_LIBRARY_STORAGE_KEY) !== serialized) throw new Error('creator-library-write-verification-failed');
    for (const asset of assets) {
      const linkedJobId = clean(asset.sourceJobId, 180);
      const projectId = linkedJobId ? canonicalProjectId('creator-job', linkedJobId) : canonicalProjectId('creator-asset', asset.assetId);
      const project = registerProjectSource({
        namespace: 'creator-asset', sourceId: asset.assetId, projectId, storageKey: EON_CREATOR_LIBRARY_STORAGE_KEY,
        sourceSchema: EON_CREATOR_LIBRARY_SCHEMA, relation: 'artifact', title: linkedJobId ? '' : asset.title,
        operationalStatus: asset.deleted ? 'deleted' : 'saved', artifactRefs: [asset.assetId], createdAt: asset.createdAt,
        updatedAt: asset.updatedAt, continueDestination: 'create'
      }, { ...options, storage: target, emit: false });
      if (!project.ok) throw new Error(`project-registry:${project.reason || 'write-failed'}`);
      const indexed = registerLibrarySource({
        namespace: 'creator-asset', sourceId: asset.assetId, kind: 'creator-asset', title: asset.title, projectId,
        mediaKind: asset.mediaKind, lifecycleState: asset.deleted ? 'archived' : 'active', storageKey: EON_CREATOR_LIBRARY_STORAGE_KEY,
        sourceSchema: EON_CREATOR_LIBRARY_SCHEMA, createdAt: asset.createdAt, updatedAt: asset.updatedAt
      }, { ...options, storage: target, emit: false });
      if (!indexed.ok) throw new Error(`library-index:${indexed.reason || 'write-failed'}`);
    }
    return Object.freeze({ ok: true, imported: Object.freeze(imported), skipped: Object.freeze(skipped), rawMediaRestored: false, writesVerified: true, rollbackPrepared: true });
  } catch (error) {
    const rollback = restoreEonStorageSnapshot(transaction, { ...options, storage: target });
    return Object.freeze({ ok: false, reason: rollback.ok ? 'restore-failed-rolled-back' : 'restore-failed-rollback-pending', failure: String(error?.message || error).slice(0, 180), imported: Object.freeze([]), skipped: Object.freeze(skipped), rawMediaRestored: false, rolledBack: rollback.ok });
  }
}

export function getCreatorDataSurvivalTruth() {
  return Object.freeze({ schema: EON_CREATOR_EXPORT_SCHEMA, updateMustNotClearLocalStorage: true, updateMustNotClearIndexedDb: true, metadataCapsuleKey: EON_CREATOR_LIBRARY_STORAGE_KEY, rawMediaInGenericCapsule: false, separateEncryptedMediaBundleRequired: true, completeMetadataExportWithoutSlicing: true, restorePreviewRequired: true, perConflictChoiceRequired: true, futureVersionsRejected: true, automaticMerge: false, transactionalIndexWrites: true });
}
