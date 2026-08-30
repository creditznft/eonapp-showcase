/** W412 browser client. Every network operation requires a visible caller action. */
import { EON_SYNC_BASIC_TYPES, resolveEonSyncBasicConflict } from './eon-sync-basic-foundation.js';

export const EON_SYNC_BASIC_CLIENT_SCHEMA = 'eonapp.sync-basic-client.w412.v1';
const STATUS_ENDPOINT = '/api/sync/status';
const RECORDS_ENDPOINT = '/api/sync/records';
const TOMBSTONE_ENDPOINT = '/api/sync/records/tombstone';

const frozen = (value) => Object.freeze(value);
const safeJson = async (response) => { try { return await response.json(); } catch { return null; } };
const fetcher = (candidate) => candidate || globalThis.fetch;

function actionRequired(explicitUserAction) {
  return explicitUserAction === true
    ? null
    : frozen({ ok: false, error: 'explicit-user-action-required', networkRequestCreated: false, automaticUpload: false, automaticMerge: false });
}

function safeStatus(payload = {}, response = null) {
  const value = payload && typeof payload === 'object' ? payload : {};
  return frozen({
    schema: EON_SYNC_BASIC_CLIENT_SCHEMA,
    ok: Boolean(response?.ok && value.ok !== false),
    httpStatus: Number(response?.status || 0),
    available: Boolean(value.available),
    signedIn: Boolean(value.signedIn),
    status: String(value.status || 'unknown'),
    automaticUpload: false,
    automaticMerge: false,
    secureVaultSync: false,
    manualProofRequired: true,
    supportedTypes: Array.isArray(value.supportedTypes) ? value.supportedTypes.filter((type) => EON_SYNC_BASIC_TYPES.includes(type)) : [],
    notice: String(value.notice || ''),
    error: value.error ? String(value.error) : ''
  });
}

export async function requestEonSyncBasicStatus({ explicitUserAction = false, fetchImpl = null } = {}) {
  const denied = actionRequired(explicitUserAction);
  if (denied) return denied;
  const request = fetcher(fetchImpl);
  if (typeof request !== 'function') return frozen({ ok: false, error: 'browser-fetch-unavailable', networkRequestCreated: false, automaticUpload: false, automaticMerge: false });
  try {
    const response = await request(STATUS_ENDPOINT, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
    return safeStatus(await safeJson(response), response);
  } catch {
    return frozen({ ok: false, error: 'sync-status-unreachable', networkRequestCreated: true, automaticUpload: false, automaticMerge: false });
  }
}

export async function uploadReviewedEonSyncBasicRecords(records = [], { explicitUserAction = false, explicitUploadConsent = false, fetchImpl = null } = {}) {
  const denied = actionRequired(explicitUserAction);
  if (denied) return denied;
  if (explicitUploadConsent !== true) return frozen({ ok: false, error: 'explicit-upload-consent-required', networkRequestCreated: false, automaticUpload: false, automaticMerge: false });
  if (!Array.isArray(records) || !records.length) return frozen({ ok: false, error: 'reviewed-records-required', networkRequestCreated: false, automaticUpload: false, automaticMerge: false });
  const request = fetcher(fetchImpl);
  if (typeof request !== 'function') return frozen({ ok: false, error: 'browser-fetch-unavailable', networkRequestCreated: false, automaticUpload: false, automaticMerge: false });
  try {
    const response = await request(RECORDS_ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ records }) });
    const payload = await safeJson(response);
    return frozen({ ...safeStatus(payload, response), accepted: Number(payload?.accepted || 0), networkRequestCreated: true, explicitUploadConsent: true });
  } catch {
    return frozen({ ok: false, error: 'sync-upload-unreachable', networkRequestCreated: true, automaticUpload: false, automaticMerge: false });
  }
}

export async function readReviewedEonSyncBasicRecords({ explicitUserAction = false, since = 0, fetchImpl = null } = {}) {
  const denied = actionRequired(explicitUserAction);
  if (denied) return denied;
  const request = fetcher(fetchImpl);
  if (typeof request !== 'function') return frozen({ ok: false, error: 'browser-fetch-unavailable', networkRequestCreated: false, records: [] });
  try {
    const cursor = Number.isFinite(Number(since)) && Number(since) >= 0 ? Math.floor(Number(since)) : 0;
    const response = await request(`${RECORDS_ENDPOINT}?since=${encodeURIComponent(cursor)}`, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
    const payload = await safeJson(response);
    return frozen({ ...safeStatus(payload, response), records: Array.isArray(payload?.records) ? payload.records : [], cursor: Number(payload?.cursor || cursor), networkRequestCreated: true, mergeRequired: true });
  } catch {
    return frozen({ ok: false, error: 'sync-read-unreachable', networkRequestCreated: true, records: [], mergeRequired: true });
  }
}

export async function sendReviewedEonSyncBasicTombstone(record = null, { explicitUserAction = false, explicitDeletionConsent = false, fetchImpl = null } = {}) {
  const denied = actionRequired(explicitUserAction);
  if (denied) return denied;
  if (explicitDeletionConsent !== true) return frozen({ ok: false, error: 'explicit-deletion-consent-required', networkRequestCreated: false, automaticDeletion: false });
  const request = fetcher(fetchImpl);
  if (typeof request !== 'function') return frozen({ ok: false, error: 'browser-fetch-unavailable', networkRequestCreated: false, automaticDeletion: false });
  try {
    const response = await request(TOMBSTONE_ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ record }) });
    const payload = await safeJson(response);
    return frozen({ ...safeStatus(payload, response), accepted: Number(payload?.accepted || 0), networkRequestCreated: true, automaticDeletion: false, explicitDeletionConsent: true });
  } catch {
    return frozen({ ok: false, error: 'sync-tombstone-unreachable', networkRequestCreated: true, automaticDeletion: false });
  }
}

export function buildEonSyncBasicMergeReview(localRecords = [], remoteRecords = []) {
  const local = Array.isArray(localRecords) ? localRecords : [];
  const remote = Array.isArray(remoteRecords) ? remoteRecords : [];
  const byId = new Map(local.map((record) => [`${record?.type || ''}:${record?.id || ''}`, record]));
  const decisions = [];
  for (const remoteRecord of remote) {
    const key = `${remoteRecord?.type || ''}:${remoteRecord?.id || ''}`;
    const localRecord = byId.get(key);
    if (!localRecord) {
      decisions.push(frozen({ key, strategy: 'import-review-required', primary: remoteRecord, conflictCopy: null, automaticOverwrite: false }));
      continue;
    }
    decisions.push(resolveEonSyncBasicConflict(localRecord, remoteRecord));
  }
  return frozen({ schema: EON_SYNC_BASIC_CLIENT_SCHEMA, mergeRequired: true, automaticMerge: false, automaticOverwrite: false, decisions: frozen(decisions) });
}

export function getEonSyncBasicClientTruth() {
  return frozen({ schema: EON_SYNC_BASIC_CLIENT_SCHEMA, importNetworkOnModuleLoad: false, explicitUserActionRequired: true, explicitUploadConsentRequired: true, explicitDeletionConsentRequired: true, automaticUpload: false, backgroundSync: false, automaticMerge: false, automaticDeletion: false, vaultSync: false, apiKeySync: false, liveReleaseApproved: false });
}
