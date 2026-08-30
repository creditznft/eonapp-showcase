/**
 * A15 I07 — encrypted, digest-verified Creator raw-media portability.
 *
 * Workspace Capsule intentionally excludes raw media. This separate user-held
 * archive encrypts media and its minimum Creator metadata in the browser. A
 * restore is inspect/select/apply, verifies every digest, and rolls back local
 * metadata plus media blobs if any selected record fails.
 */

import {
  EON_CREATOR_LIBRARY_STORAGE_KEY,
  deleteCreatorMedia,
  getCreatorMedia,
  listCreatorAssets,
  putCreatorMedia,
  saveCreatorAsset
} from '../create/creator-library-store.js';
import { EON_PROJECT_REGISTRY_STORAGE_KEY } from '../projects/eon-project-registry.js';
import { EON_LIBRARY_INDEX_STORAGE_KEY } from '../storage/eon-library-index.js';
import { captureEonStorageSnapshot, restoreEonStorageSnapshot } from '../storage/eon-storage-transaction.js';

export const EON_CREATOR_MEDIA_BUNDLE_SCHEMA = 'eonapp.creator-media-bundle.a15.i07.v1';
export const EON_CREATOR_MEDIA_PAYLOAD_SCHEMA = 'eonapp.creator-media-bundle-payload.a15.i07.v1';
export const EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION = 'RESTORE CREATOR MEDIA';
export const EON_CREATOR_MEDIA_BUNDLE_MAX_RECORDS = 300;
export const EON_CREATOR_MEDIA_BUNDLE_MAX_BYTES = 512 * 1024 * 1024;
export const EON_CREATOR_MEDIA_BUNDLE_MAX_RECORD_BYTES = 192 * 1024 * 1024;
export const EON_CREATOR_MEDIA_BUNDLE_KDF_ITERATIONS = 310_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const freeze = (value) => Object.freeze(value);
const clean = (value = '', limit = 180) => String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, limit);
const iso = (value = Date.now()) => new Date(Number(value)).toISOString();
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function cryptoFor(candidate = null) {
  const api = candidate || globalThis.crypto;
  if (!api?.subtle || typeof api.getRandomValues !== 'function') throw new Error('Web Crypto is required for an encrypted Creator media bundle.');
  return api;
}

function bytesToBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa !== 'function') throw new Error('Base64 encoding is unavailable.');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value = '') {
  const cleanValue = String(value || '').trim();
  if (!cleanValue || !BASE64URL_RE.test(cleanValue)) throw new Error('Creator media bundle contains invalid encoded data.');
  const padded = cleanValue.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (cleanValue.length % 4)) % 4);
  if (typeof atob !== 'function') throw new Error('Base64 decoding is unavailable.');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Bytes(bytes, cryptoApi = null) {
  return hex(await cryptoFor(cryptoApi).subtle.digest('SHA-256', bytes));
}

async function deriveKey(passphrase = '', salt, cryptoApi = null) {
  const secret = String(passphrase || '');
  if (secret.length < 12) throw new Error('Use a Creator media bundle passphrase with at least 12 characters.');
  const api = cryptoFor(cryptoApi);
  const material = await api.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return api.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: EON_CREATOR_MEDIA_BUNDLE_KDF_ITERATIONS },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function randomBytes(length, cryptoApi = null) {
  const value = new Uint8Array(length);
  cryptoFor(cryptoApi).getRandomValues(value);
  return value;
}

function randomId(prefix = 'eonmedia', cryptoApi = null) {
  return `${prefix}_${bytesToBase64Url(randomBytes(18, cryptoApi))}`;
}

function safeAsset(asset = {}) {
  return freeze({
    assetId: clean(asset.assetId, 160),
    versionId: clean(asset.versionId || 'v1', 80),
    parentAssetId: clean(asset.parentAssetId, 160),
    mediaKind: asset.mediaKind === 'video' ? 'video' : 'image',
    title: clean(asset.title || 'Untitled creator output', 180),
    promptSavedByUser: asset.promptSavedByUser === true,
    prompt: asset.promptSavedByUser === true ? clean(asset.prompt, 12_000) : '',
    workflowId: clean(asset.workflowId, 160),
    workflowVersion: clean(asset.workflowVersion, 120),
    providerId: clean(asset.providerId || 'local', 80),
    runtimeId: clean(asset.runtimeId, 120),
    rail: ['local-runtime', 'direct-user-owned-byok', 'guide'].includes(asset.rail) ? asset.rail : 'guide',
    modelLabel: clean(asset.modelLabel, 160),
    sourceJobId: clean(asset.sourceJobId, 180),
    width: Math.max(0, Number(asset.width || 0)),
    height: Math.max(0, Number(asset.height || 0)),
    durationSeconds: Math.max(0, Number(asset.durationSeconds || 0)),
    createdAt: iso(Date.parse(asset.createdAt) || Date.now()),
    updatedAt: iso(Date.parse(asset.updatedAt) || Date.now()),
    credentialsIncluded: false
  });
}

async function collectRecords({ assets, getMedia, cryptoApi = null } = {}) {
  if (!Array.isArray(assets) || assets.length > EON_CREATOR_MEDIA_BUNDLE_MAX_RECORDS) throw new Error('Creator media record count is out of bounds.');
  const records = [];
  let totalBytes = 0;
  for (const asset of assets) {
    if (!asset?.assetId || asset.deleted === true || asset.mediaStoredLocally !== true) continue;
    const stored = await getMedia(asset.assetId);
    const blob = stored?.blob;
    if (!(blob instanceof Blob)) continue;
    if (blob.size > EON_CREATOR_MEDIA_BUNDLE_MAX_RECORD_BYTES) throw new Error(`Creator media record ${asset.assetId} is too large for one portable bundle.`);
    totalBytes += blob.size;
    if (totalBytes > EON_CREATOR_MEDIA_BUNDLE_MAX_BYTES) throw new Error('Creator media bundle exceeds the safe in-browser size limit. Export fewer assets at a time.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const digest = await sha256Bytes(bytes, cryptoApi);
    records.push(freeze({
      asset: safeAsset(asset),
      media: freeze({
        contentType: clean(blob.type || stored.contentType || asset.contentType || 'application/octet-stream', 120),
        bytes: blob.size,
        sha256: digest,
        data: bytesToBase64Url(bytes)
      })
    }));
  }
  return freeze({ records: freeze(records.sort((a, b) => a.asset.assetId.localeCompare(b.asset.assetId))), totalBytes });
}

export async function createCreatorMediaBundle(options = {}) {
  const cryptoApi = cryptoFor(options.cryptoApi);
  const assets = options.assets || listCreatorAssets(options);
  const getMediaFn = options.getMedia || ((assetId) => getCreatorMedia(assetId, options));
  const collected = await collectRecords({ assets, getMedia: getMediaFn, cryptoApi });
  const payload = freeze({
    schema: EON_CREATOR_MEDIA_PAYLOAD_SCHEMA,
    version: 1,
    createdAt: iso(options.now || Date.now()),
    records: collected.records,
    recordCount: collected.records.length,
    totalBytes: collected.totalBytes,
    credentialsIncluded: false,
    providerSecretsIncluded: false,
    accountTokensIncluded: false
  });
  const plaintext = encoder.encode(JSON.stringify(payload));
  const salt = randomBytes(16, cryptoApi);
  const iv = randomBytes(12, cryptoApi);
  const key = await deriveKey(options.passphrase, salt, cryptoApi);
  const ciphertext = new Uint8Array(await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  return freeze({
    schema: EON_CREATOR_MEDIA_BUNDLE_SCHEMA,
    version: 1,
    bundleId: randomId('eonmedia', cryptoApi),
    createdAt: payload.createdAt,
    recordCount: payload.recordCount,
    totalBytes: payload.totalBytes,
    algorithm: freeze({ kdf: 'PBKDF2-SHA-256', iterations: EON_CREATOR_MEDIA_BUNDLE_KDF_ITERATIONS, cipher: 'AES-GCM-256' }),
    salt: bytesToBase64Url(salt),
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(ciphertext),
    ciphertextSha256: await sha256Bytes(ciphertext, cryptoApi),
    localOnly: true,
    automaticUpload: false,
    rawValuesVisibleInEnvelope: false
  });
}

export function serializeCreatorMediaBundle(bundle = {}) {
  if (bundle?.schema !== EON_CREATOR_MEDIA_BUNDLE_SCHEMA) throw new Error('Creator media bundle is invalid.');
  return JSON.stringify(bundle, null, 2);
}

async function openBundle(input, { passphrase = '', cryptoApi = null } = {}) {
  const candidate = typeof input === 'string' ? JSON.parse(input) : input;
  if (candidate?.schema !== EON_CREATOR_MEDIA_BUNDLE_SCHEMA || Number(candidate?.version) !== 1) throw new Error('Unsupported Creator media bundle.');
  if (candidate?.algorithm?.kdf !== 'PBKDF2-SHA-256' || Number(candidate?.algorithm?.iterations) !== EON_CREATOR_MEDIA_BUNDLE_KDF_ITERATIONS || candidate?.algorithm?.cipher !== 'AES-GCM-256') throw new Error('Unsupported Creator media bundle encryption.');
  const api = cryptoFor(cryptoApi);
  const salt = base64UrlToBytes(candidate.salt);
  const iv = base64UrlToBytes(candidate.iv);
  const ciphertext = base64UrlToBytes(candidate.ciphertext);
  if ((await sha256Bytes(ciphertext, api)) !== String(candidate.ciphertextSha256 || '')) throw new Error('Creator media bundle transport digest does not match.');
  const key = await deriveKey(passphrase, salt, api);
  let plaintext;
  try { plaintext = await api.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext); } catch { throw new Error('Creator media bundle passphrase or authenticated content is invalid.'); }
  const payload = JSON.parse(decoder.decode(plaintext));
  if (payload?.schema !== EON_CREATOR_MEDIA_PAYLOAD_SCHEMA || Number(payload?.version) !== 1 || !Array.isArray(payload?.records)) throw new Error('Creator media bundle payload is invalid.');
  if (payload.records.length > EON_CREATOR_MEDIA_BUNDLE_MAX_RECORDS || Number(payload.totalBytes || 0) > EON_CREATOR_MEDIA_BUNDLE_MAX_BYTES) throw new Error('Creator media bundle limits are invalid.');
  let totalBytes = 0;
  const seen = new Set();
  const records = [];
  for (const row of payload.records) {
    const asset = safeAsset(row?.asset || {});
    if (!asset.assetId || seen.has(asset.assetId)) throw new Error('Creator media bundle contains a missing or duplicate asset ID.');
    seen.add(asset.assetId);
    const bytes = base64UrlToBytes(row?.media?.data);
    const declaredBytes = Number(row?.media?.bytes || 0);
    if (declaredBytes !== bytes.byteLength || declaredBytes > EON_CREATOR_MEDIA_BUNDLE_MAX_RECORD_BYTES) throw new Error(`Creator media bundle size does not match for ${asset.assetId}.`);
    const digest = await sha256Bytes(bytes, api);
    if (digest !== String(row?.media?.sha256 || '')) throw new Error(`Creator media digest does not match for ${asset.assetId}.`);
    totalBytes += bytes.byteLength;
    records.push(freeze({ asset, media: freeze({ contentType: clean(row?.media?.contentType || 'application/octet-stream', 120), bytes: bytes.byteLength, sha256: digest, bytesValue: bytes }) }));
  }
  if (totalBytes !== Number(payload.totalBytes || 0)) throw new Error('Creator media bundle total byte count does not match.');
  return freeze({ envelope: candidate, payload: freeze({ ...payload, records: freeze(records), totalBytes }) });
}

function publicStage(stage) {
  return freeze({
    ok: true,
    stageId: stage.stageId,
    bundleId: stage.envelope.bundleId,
    recordCount: stage.records.length,
    totalBytes: stage.totalBytes,
    changes: freeze(stage.changes.map((change) => freeze({ assetId: change.assetId, title: change.title, bytes: change.bytes, status: change.status, selectedAction: stage.selection.get(change.assetId) || 'skip' }))),
    rawMediaIncluded: true,
    rawMediaExposedInPreview: false,
    automaticOverwrite: false,
    confirmationRequired: EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION
  });
}

export function createCreatorMediaBundleRestoreSession(options = {}) {
  const stages = new Map();
  const listAssetsFn = options.listAssets || (() => listCreatorAssets(options));
  const getMediaFn = options.getMedia || ((assetId) => getCreatorMedia(assetId, options));
  const saveAssetFn = options.saveAsset || ((asset, mediaBlob) => saveCreatorAsset({ ...asset, sha256: asset.sha256, mediaBlob, digestMatched: true, jobState: 'saved' }, { ...options, explicitUserAction: true }));
  const putMediaFn = options.putMedia || ((assetId, blob) => putCreatorMedia(assetId, blob, options));
  const deleteMediaFn = options.deleteMedia || ((assetId) => deleteCreatorMedia(assetId, options));

  async function stageBundle(input, { passphrase = '' } = {}) {
    const opened = await openBundle(input, { passphrase, cryptoApi: options.cryptoApi });
    const existing = new Map(listAssetsFn().map((asset) => [asset.assetId, asset]));
    const changes = [];
    for (const record of opened.payload.records) {
      const priorAsset = existing.get(record.asset.assetId);
      const priorMedia = priorAsset ? await getMediaFn(record.asset.assetId) : null;
      let status = priorAsset ? 'replace' : 'add';
      if (priorAsset && priorMedia?.blob instanceof Blob && priorMedia.blob.size === record.media.bytes) {
        const priorDigest = await sha256Bytes(new Uint8Array(await priorMedia.blob.arrayBuffer()), options.cryptoApi);
        if (priorDigest === record.media.sha256) status = 'same';
      }
      changes.push(freeze({ assetId: record.asset.assetId, title: record.asset.title, bytes: record.media.bytes, status }));
    }
    const stageId = randomId('eonmediastage', options.cryptoApi);
    const selection = new Map(changes.map((change) => [change.assetId, change.status === 'add' ? 'add' : 'skip']));
    stages.set(stageId, { stageId, envelope: opened.envelope, records: opened.payload.records, totalBytes: opened.payload.totalBytes, changes, selection });
    return publicStage(stages.get(stageId));
  }

  function choose(stageId = '', choices = []) {
    const stage = stages.get(String(stageId || ''));
    if (!stage) return freeze({ ok: false, reason: 'stage-expired' });
    const statusById = new Map(stage.changes.map((change) => [change.assetId, change.status]));
    for (const change of stage.changes) stage.selection.set(change.assetId, 'skip');
    for (const choice of Array.isArray(choices) ? choices : []) {
      const assetId = String(choice?.assetId || '');
      const action = String(choice?.action || 'skip');
      const status = statusById.get(assetId);
      if (!status || !['skip', 'add', 'replace'].includes(action)) return freeze({ ok: false, reason: 'invalid-choice' });
      if (status === 'add' && !['skip', 'add'].includes(action)) return freeze({ ok: false, reason: 'invalid-add-choice' });
      if (status === 'replace' && !['skip', 'replace'].includes(action)) return freeze({ ok: false, reason: 'invalid-replace-choice' });
      if (status === 'same' && action !== 'skip') return freeze({ ok: false, reason: 'same-record-cannot-overwrite' });
      stage.selection.set(assetId, action);
    }
    return publicStage(stage);
  }

  async function commit(stageId = '', { confirmation = '' } = {}) {
    const stage = stages.get(String(stageId || ''));
    if (!stage) return freeze({ ok: false, reason: 'stage-expired', restored: 0, rolledBack: false });
    if (String(confirmation || '') !== EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION) return freeze({ ok: false, reason: 'explicit-confirmation-required', restored: 0, rolledBack: false });
    const selected = stage.records.filter((record) => ['add', 'replace'].includes(stage.selection.get(record.asset.assetId)));
    if (!selected.length) return freeze({ ok: false, reason: 'no-media-selected', restored: 0, rolledBack: false });
    const storageSnapshot = captureEonStorageSnapshot([EON_CREATOR_LIBRARY_STORAGE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], options);
    if (!storageSnapshot.ok) return freeze({ ok: false, reason: storageSnapshot.reason || 'storage-snapshot-failed', restored: 0, rolledBack: false });
    const priorMedia = new Map();
    for (const record of selected) priorMedia.set(record.asset.assetId, await getMediaFn(record.asset.assetId));
    const applied = [];
    let failure = '';
    try {
      for (const record of selected) {
        const blob = new Blob([record.media.bytesValue], { type: record.media.contentType });
        const result = await saveAssetFn({
          ...record.asset,
          contentType: record.media.contentType,
          bytes: record.media.bytes,
          sha256: record.media.sha256,
          mediaStoredLocally: true
        }, blob);
        if (result?.ok !== true) throw new Error(`asset-restore:${result?.reason || 'failed'}`);
        const verified = await getMediaFn(record.asset.assetId);
        if (!(verified?.blob instanceof Blob) || verified.blob.size !== record.media.bytes) throw new Error('media-post-restore-size-verification-failed');
        const digest = await sha256Bytes(new Uint8Array(await verified.blob.arrayBuffer()), options.cryptoApi);
        if (digest !== record.media.sha256) throw new Error('media-post-restore-digest-verification-failed');
        applied.push(record.asset.assetId);
      }
    } catch (error) { failure = String(error?.message || error).slice(0, 180); }

    if (failure) {
      const storageRollback = restoreEonStorageSnapshot(storageSnapshot, options);
      let mediaRollback = true;
      for (const record of selected) {
        const prior = priorMedia.get(record.asset.assetId);
        const result = prior?.blob instanceof Blob
          ? await putMediaFn(record.asset.assetId, prior.blob)
          : await deleteMediaFn(record.asset.assetId);
        if (result?.ok !== true) mediaRollback = false;
      }
      return freeze({ ok: false, reason: storageRollback.ok && mediaRollback ? 'restore-failed-rolled-back' : 'restore-failed-rollback-pending', failure, restored: 0, rolledBack: storageRollback.ok && mediaRollback, rawValuesIncluded: false });
    }

    stages.delete(stage.stageId);
    return freeze({
      ok: true,
      schema: 'eonapp.creator-media-restore-receipt.a15.i07.v1',
      restoredAt: iso(options.now || Date.now()),
      bundleId: stage.envelope.bundleId,
      restored: applied.length,
      assetIds: freeze(applied.sort()),
      totalBytes: selected.reduce((sum, record) => sum + record.media.bytes, 0),
      digestsVerified: true,
      writesVerified: true,
      rollbackPrepared: true,
      rawValuesIncluded: false
    });
  }

  return freeze({ stageBundle, choose, commit });
}

export function getCreatorMediaBundleTruth() {
  return freeze({
    schema: EON_CREATOR_MEDIA_BUNDLE_SCHEMA,
    encrypted: true,
    kdf: 'PBKDF2-SHA-256',
    cipher: 'AES-GCM-256',
    rawMediaIncluded: true,
    WorkspaceCapsuleIncludesRawMedia: false,
    inspectBeforeApply: true,
    perRecordChoice: true,
    destructiveOverwriteDefault: false,
    digestVerified: true,
    atomicMetadataRollback: true,
    mediaRollbackPrepared: true,
    passphrasePersisted: false,
    automaticUpload: false,
    credentialsIncluded: false
  });
}
