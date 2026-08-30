/** W627D — durable Creator Library metadata plus optional local IndexedDB media blobs. */

import { EON_PROJECT_REGISTRY_STORAGE_KEY, canonicalProjectId, registerProjectSource, removeProjectSource } from '../projects/eon-project-registry.js';
import { evaluateEonCapacity } from '../storage/eon-capacity-authority.js';
import { EON_LIBRARY_INDEX_STORAGE_KEY, registerLibrarySource, removeLibrarySource } from '../storage/eon-library-index.js';
import { captureEonStorageSnapshot, restoreEonStorageSnapshot } from '../storage/eon-storage-transaction.js';

export const EON_CREATOR_LIBRARY_SCHEMA = 'eon.creator-library.w627d.v1';
export const EON_CREATOR_LIBRARY_STORAGE_KEY = 'eon:creator-library:v1';
export const EON_CREATOR_MEDIA_DATABASE = 'eonapp-creator-media-v1';
export const EON_CREATOR_MEDIA_STORE = 'media';
const MAX_PROMPT = 12_000;
const SECRET_LIKE_RE = /(?:api[-_ ]?key|access[-_ ]?token|secret|password|authorization|private[-_ ]?key|bearer)\s*[:=]/i;

function storage(options = {}) { if (options.storage) return options.storage; try { return globalThis.localStorage || null; } catch { return null; } }
function clean(value = '', limit = 180) { return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, limit); }
function nowIso(now = () => Date.now()) { return new Date(Number(now())).toISOString(); }
function parse(raw, fallback) { try { const value = JSON.parse(String(raw || '')); return value && typeof value === 'object' ? value : fallback; } catch { return fallback; } }
function assetId() { try { return `creatorasset_${globalThis.crypto.randomUUID()}`; } catch { return `creatorasset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`; } }

function normalizeAsset(value = {}) {
  const createdAt = String(value.createdAt || new Date().toISOString());
  const prompt = value.promptSavedByUser === true ? clean(value.prompt, MAX_PROMPT) : '';
  if (prompt && SECRET_LIKE_RE.test(prompt)) throw new Error('Prompt looks like a secret and cannot be saved in Creator Library.');
  return Object.freeze({
    schema: EON_CREATOR_LIBRARY_SCHEMA,
    assetId: clean(value.assetId || assetId(), 160),
    versionId: clean(value.versionId || 'v1', 80),
    parentAssetId: clean(value.parentAssetId, 160),
    mediaKind: value.mediaKind === 'video' ? 'video' : 'image',
    title: clean(value.title || 'Untitled creator output', 180),
    promptSavedByUser: value.promptSavedByUser === true,
    prompt,
    workflowId: clean(value.workflowId, 160),
    workflowVersion: clean(value.workflowVersion, 120),
    providerId: clean(value.providerId || 'local', 80),
    runtimeId: clean(value.runtimeId, 120),
    rail: ['local-runtime', 'direct-user-owned-byok', 'guide'].includes(value.rail) ? value.rail : 'guide',
    modelLabel: clean(value.modelLabel, 160),
    sourceJobId: clean(value.sourceJobId, 180),
    sha256: clean(value.sha256, 128),
    contentType: clean(value.contentType, 80),
    width: Math.max(0, Number(value.width || 0)),
    height: Math.max(0, Number(value.height || 0)),
    durationSeconds: Math.max(0, Number(value.durationSeconds || 0)),
    bytes: Math.max(0, Number(value.bytes || 0)),
    mediaStoredLocally: value.mediaStoredLocally === true,
    mediaPortableInCapsule: false,
    deleted: value.deleted === true,
    createdAt,
    updatedAt: String(value.updatedAt || createdAt)
  });
}

function readState(options = {}) {
  const target = storage(options);
  const raw = parse(target?.getItem?.(EON_CREATOR_LIBRARY_STORAGE_KEY), { schema: EON_CREATOR_LIBRARY_SCHEMA, assets: [] });
  const assets = [];
  for (const row of (Array.isArray(raw.assets) ? raw.assets : [])) {
    try { assets.push(normalizeAsset(row)); } catch { /* reject malformed migrated row */ }
  }
  return { schema: EON_CREATOR_LIBRARY_SCHEMA, updatedAt: String(raw.updatedAt || ''), assets };
}

function writeState(state, options = {}) {
  const target = storage(options);
  const payload = { schema: EON_CREATOR_LIBRARY_SCHEMA, updatedAt: nowIso(options.now), assets: state.assets.map(normalizeAsset) };
  const serialized = JSON.stringify(payload);
  target?.setItem?.(EON_CREATOR_LIBRARY_STORAGE_KEY, serialized);
  if (target?.getItem?.(EON_CREATOR_LIBRARY_STORAGE_KEY) !== serialized) throw new Error('Creator Library write verification failed.');
  try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:creator-library-changed', { detail: { updatedAt: payload.updatedAt } })); } catch {}
  return Object.freeze(payload);
}


function registerCreatorAssetProject(asset = {}, options = {}) {
  const linkedJobId = clean(asset.sourceJobId, 180);
  const projectId = linkedJobId
    ? canonicalProjectId('creator-job', linkedJobId)
    : canonicalProjectId('creator-asset', asset.assetId);
  return registerProjectSource({
    namespace: 'creator-asset',
    sourceId: asset.assetId,
    projectId,
    storageKey: EON_CREATOR_LIBRARY_STORAGE_KEY,
    sourceSchema: EON_CREATOR_LIBRARY_SCHEMA,
    relation: 'artifact',
    title: linkedJobId ? '' : asset.title,
    operationalStatus: linkedJobId ? '' : (asset.deleted ? 'deleted' : 'saved'),
    artifactRefs: [asset.assetId],
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    continueDestination: 'create'
  }, { ...options, emit: false });
}

function registerCreatorAssetLibrary(asset = {}, options = {}) {
  const linkedJobId = clean(asset.sourceJobId, 180);
  return registerLibrarySource({
    namespace: 'creator-asset',
    sourceId: asset.assetId,
    kind: 'creator-asset',
    title: asset.title,
    projectId: linkedJobId ? canonicalProjectId('creator-job', linkedJobId) : canonicalProjectId('creator-asset', asset.assetId),
    mediaKind: asset.mediaKind,
    lifecycleState: asset.deleted ? 'archived' : 'active',
    storageKey: EON_CREATOR_LIBRARY_STORAGE_KEY,
    sourceSchema: EON_CREATOR_LIBRARY_SCHEMA,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt
  }, { ...options, emit: false });
}

function creatorAssetTransaction(options = {}) {
  return captureEonStorageSnapshot([
    EON_CREATOR_LIBRARY_STORAGE_KEY,
    EON_PROJECT_REGISTRY_STORAGE_KEY,
    EON_LIBRARY_INDEX_STORAGE_KEY
  ], options);
}

function rollbackCreatorAssetTransaction(snapshot, options = {}) {
  return restoreEonStorageSnapshot(snapshot, options);
}

async function restorePriorCreatorMedia(assetIdValue = '', priorMedia = null, mediaWasWritten = false, options = {}) {
  if (!mediaWasWritten) return Object.freeze({ ok: true, changed: false });
  if (priorMedia?.blob instanceof Blob) return putCreatorMedia(assetIdValue, priorMedia.blob, options);
  return deleteCreatorMedia(assetIdValue, options);
}

function openMediaDatabase(indexedDb = globalThis.indexedDB) {
  if (!indexedDb?.open) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(EON_CREATOR_MEDIA_DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(EON_CREATOR_MEDIA_STORE)) database.createObjectStore(EON_CREATOR_MEDIA_STORE, { keyPath: 'assetId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Creator media database unavailable.'));
  });
}

export async function putCreatorMedia(assetIdValue = '', blob = null, options = {}) {
  if (!(blob instanceof Blob)) return Object.freeze({ ok: false, reason: 'media-blob-required' });
  const database = await openMediaDatabase(options.indexedDb);
  if (!database) return Object.freeze({ ok: false, reason: 'indexeddb-unavailable' });
  return new Promise((resolve) => {
    const transaction = database.transaction(EON_CREATOR_MEDIA_STORE, 'readwrite');
    transaction.objectStore(EON_CREATOR_MEDIA_STORE).put({ assetId: String(assetIdValue), blob, contentType: blob.type, bytes: blob.size, savedAt: nowIso(options.now) });
    transaction.oncomplete = () => { database.close(); resolve(Object.freeze({ ok: true, bytes: blob.size })); };
    transaction.onerror = () => { database.close(); resolve(Object.freeze({ ok: false, reason: 'indexeddb-write-failed' })); };
  });
}

export async function getCreatorMedia(assetIdValue = '', options = {}) {
  const database = await openMediaDatabase(options.indexedDb);
  if (!database) return null;
  return new Promise((resolve) => {
    const transaction = database.transaction(EON_CREATOR_MEDIA_STORE, 'readonly');
    const request = transaction.objectStore(EON_CREATOR_MEDIA_STORE).get(String(assetIdValue));
    request.onsuccess = () => { const result = request.result || null; database.close(); resolve(result); };
    request.onerror = () => { database.close(); resolve(null); };
  });
}

export async function deleteCreatorMedia(assetIdValue = '', options = {}) {
  const database = await openMediaDatabase(options.indexedDb);
  if (!database) return Object.freeze({ ok: false, reason: 'indexeddb-unavailable' });
  return new Promise((resolve) => {
    const transaction = database.transaction(EON_CREATOR_MEDIA_STORE, 'readwrite');
    transaction.objectStore(EON_CREATOR_MEDIA_STORE).delete(String(assetIdValue));
    transaction.oncomplete = () => { database.close(); resolve(Object.freeze({ ok: true })); };
    transaction.onerror = () => { database.close(); resolve(Object.freeze({ ok: false, reason: 'indexeddb-delete-failed' })); };
  });
}

export function listCreatorAssets(options = {}) {
  return Object.freeze(readState(options).assets.filter((asset) => !asset.deleted));
}

export async function saveCreatorAsset(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!input.sha256 || input.digestMatched !== true) return Object.freeze({ ok: false, reason: 'digest-matched-output-required' });
  if (!['complete', 'saved'].includes(input.jobState)) return Object.freeze({ ok: false, reason: 'complete-job-required' });
  const timestamp = nowIso(options.now);
  const asset = normalizeAsset({ ...input, assetId: input.assetId || assetId(), createdAt: input.createdAt || timestamp, updatedAt: timestamp, mediaStoredLocally: false });
  const state = readState(options);
  const existing = state.assets.some((entry) => entry.assetId === asset.assetId);
  const capacity = evaluateEonCapacity({ resourceId: 'creator-assets', currentCount: state.assets.length, totalCount: state.assets.length, existing }, options);
  if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });

  const transaction = creatorAssetTransaction(options);
  if (!transaction.ok) return Object.freeze({ ok: false, reason: transaction.reason || 'storage-snapshot-failed' });
  const priorMedia = existing && input.mediaBlob instanceof Blob ? await getCreatorMedia(asset.assetId, options) : null;
  let mediaResult = Object.freeze({ ok: false, reason: 'metadata-only' });
  if (input.mediaBlob instanceof Blob) mediaResult = await putCreatorMedia(asset.assetId, input.mediaBlob, options);
  const finalAsset = normalizeAsset({ ...asset, mediaStoredLocally: mediaResult.ok === true || (existing && priorMedia?.blob instanceof Blob) });

  try {
    state.assets = [finalAsset, ...state.assets.filter((entry) => entry.assetId !== finalAsset.assetId)];
    writeState(state, options);
    const registered = registerCreatorAssetProject(finalAsset, options);
    if (!registered.ok) throw new Error(`project-registry:${registered.reason || 'write-failed'}`);
    const indexed = registerCreatorAssetLibrary(finalAsset, options);
    if (!indexed.ok) throw new Error(`library-index:${indexed.reason || 'write-failed'}`);
  } catch (error) {
    const rollback = rollbackCreatorAssetTransaction(transaction, options);
    const mediaRollback = await restorePriorCreatorMedia(finalAsset.assetId, priorMedia, mediaResult.ok === true, options);
    return Object.freeze({
      ok: false,
      reason: !rollback.ok || !mediaRollback.ok ? 'rollback-failed' : String(error?.message || '').startsWith('library-index:') ? 'library-index-write-failed' : 'project-registry-write-failed',
      detail: String(error?.message || error),
      rollbackReason: !rollback.ok ? rollback.reason : !mediaRollback.ok ? mediaRollback.reason : ''
    });
  }
  return Object.freeze({ ok: true, asset: finalAsset, media: mediaResult });
}

export async function deleteCreatorAsset(assetIdValue = '', options = {}) {
  if (options.explicitUserAction !== true || options.confirmed !== true) return Object.freeze({ ok: false, reason: 'explicit-confirmation-required' });
  const state = readState(options);
  const existing = state.assets.find((asset) => asset.assetId === assetIdValue);
  if (!existing) return Object.freeze({ ok: false, reason: 'asset-not-found' });
  const transaction = creatorAssetTransaction(options);
  if (!transaction.ok) return Object.freeze({ ok: false, reason: transaction.reason || 'storage-snapshot-failed' });
  try {
    state.assets = state.assets.filter((asset) => asset.assetId !== assetIdValue);
    writeState(state, options);
    const removed = removeProjectSource('creator-asset', assetIdValue, { ...options, emit: false });
    if (!removed.ok && removed.reason !== 'source-not-found') throw new Error(`project-registry:${removed.reason || 'write-failed'}`);
    const libraryRemoved = removeLibrarySource('creator-asset', assetIdValue, { ...options, emit: false });
    if (!libraryRemoved.ok && libraryRemoved.reason !== 'source-not-found') throw new Error(`library-index:${libraryRemoved.reason || 'write-failed'}`);
    if (existing.mediaStoredLocally) {
      const media = await deleteCreatorMedia(assetIdValue, options);
      if (!media.ok) throw new Error(`media:${media.reason || 'delete-failed'}`);
    }
  } catch (error) {
    const rollback = rollbackCreatorAssetTransaction(transaction, options);
    return Object.freeze({
      ok: false,
      reason: !rollback.ok ? 'rollback-failed' : String(error?.message || '').startsWith('media:') ? 'media-delete-failed' : String(error?.message || '').startsWith('library-index:') ? 'library-index-write-failed' : 'project-registry-write-failed',
      detail: String(error?.message || error),
      rollbackReason: rollback.ok ? '' : rollback.reason
    });
  }
  return Object.freeze({ ok: true, mediaDeleted: existing.mediaStoredLocally });
}

export function createCreatorAssetVersion(parentAssetId = '', patch = {}, options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
  const parent = listCreatorAssets(options).find((asset) => asset.assetId === parentAssetId);
  if (!parent) return Object.freeze({ ok: false, reason: 'parent-asset-not-found' });
  const siblings = listCreatorAssets(options).filter((asset) => asset.parentAssetId === parent.assetId || asset.assetId === parent.assetId);
  const versionId = `v${siblings.length + 1}`;
  const timestamp = nowIso(options.now);
  const asset = normalizeAsset({ ...parent, ...patch, assetId: assetId(), parentAssetId: parent.assetId, versionId, mediaStoredLocally: false, createdAt: timestamp, updatedAt: timestamp });
  const state = readState(options);
  const capacity = evaluateEonCapacity({ resourceId: 'creator-assets', currentCount: state.assets.length, totalCount: state.assets.length }, options);
  if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  const transaction = creatorAssetTransaction(options);
  if (!transaction.ok) return Object.freeze({ ok: false, reason: transaction.reason || 'storage-snapshot-failed' });
  try {
    state.assets.unshift(asset);
    writeState(state, options);
    const registered = registerCreatorAssetProject(asset, options);
    if (!registered.ok) throw new Error(`project-registry:${registered.reason || 'write-failed'}`);
    const indexed = registerCreatorAssetLibrary(asset, options);
    if (!indexed.ok) throw new Error(`library-index:${indexed.reason || 'write-failed'}`);
  } catch (error) {
    const rollback = rollbackCreatorAssetTransaction(transaction, options);
    return Object.freeze({ ok: false, reason: !rollback.ok ? 'rollback-failed' : String(error?.message || '').startsWith('library-index:') ? 'library-index-write-failed' : 'project-registry-write-failed', detail: String(error?.message || error), rollbackReason: rollback.ok ? '' : rollback.reason });
  }
  return Object.freeze({ ok: true, asset });
}

export function getCreatorLibraryTruth() {
  return Object.freeze({ schema: EON_CREATOR_LIBRARY_SCHEMA, metadataInLocalStorage: true, mediaInIndexedDbOnlyWhenExplicitlySaved: true, rawMediaInGenericCapsule: false, promptOptInOnly: true, credentialsAllowed: false, digestRequiredBeforeSave: true, userDeletionSupported: true });
}
