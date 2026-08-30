/**
 * W536 — Browser-only Google Drive encrypted snapshot connector.
 *
 * The adapter is intentionally dormant until the owner configures a public
 * browser client ID and a person performs an explicit backup action. It never
 * handles a client secret, writes access credentials to browser storage, or
 * starts a background sync/restore job.
 */
import {
  EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY,
  EON_GOOGLE_DRIVE_SNAPSHOT_CONFIG_ROUTE,
  EON_GOOGLE_DRIVE_SNAPSHOT_MAX_BYTES,
  EON_GOOGLE_DRIVE_SNAPSHOT_MIME,
  EON_GOOGLE_DRIVE_SNAPSHOT_SCHEMA,
  EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE,
  W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT
} from '../../../config/w536-google-drive-snapshot-contract.mjs';

export {
  EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY,
  EON_GOOGLE_DRIVE_SNAPSHOT_CONFIG_ROUTE,
  EON_GOOGLE_DRIVE_SNAPSHOT_MAX_BYTES,
  EON_GOOGLE_DRIVE_SNAPSHOT_MIME,
  EON_GOOGLE_DRIVE_SNAPSHOT_SCHEMA,
  EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE
};

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const CLIENT_ID_RE = /^\d{6,}-[A-Za-z0-9_-]{12,}\.apps\.googleusercontent\.com$/;
const FILE_ID_RE = /^[A-Za-z0-9_-]{10,256}$/;
const FILE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,180}\.eoncapsule$/;

function frozen(value) { return Object.freeze(value); }
function text(value = '', max = 400) { return String(value || '').trim().slice(0, max); }
function validClientId(value = '') { return CLIENT_ID_RE.test(text(value, 320)); }
function validFileId(value = '') { return FILE_ID_RE.test(text(value, 300)); }
function validAccessCredential(value = '') { return /^[A-Za-z0-9._~-]{20,4096}$/.test(text(value, 4096)); }
function byteLength(value = '') { return new TextEncoder().encode(String(value ?? '')).byteLength; }
function nowIso(now = () => Date.now()) { return new Date(Number(now())).toISOString(); }

function safeApiError(status = 0, body = '') {
  const normalized = text(body, 220).replace(/[\r\n]+/g, ' ');
  const hint = status === 401 ? 'Drive permission expired or was declined.'
    : status === 403 ? 'Google Drive denied this action or the Drive API/configuration is incomplete.'
      : status === 404 ? 'The Drive backup could not be found.'
        : status >= 500 ? 'Google Drive is temporarily unavailable. No local records changed; try again later.'
          : 'Google Drive could not complete this action.';
  return frozen({ code: `drive_http_${Number(status) || 0}`, message: normalized ? `${hint} (${normalized})` : hint });
}

async function bodyText(response) {
  try { return await response.text(); } catch { return ''; }
}

async function expectJson(response) {
  const raw = await bodyText(response);
  if (!response?.ok) throw Object.assign(new Error(safeApiError(response?.status, raw).message), { code: safeApiError(response?.status, raw).code });
  try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('Google Drive returned an invalid response.'), { code: 'drive_invalid_json' }); }
}

function driveHeaders(accessCredential, extra = {}) {
  if (!validAccessCredential(accessCredential)) throw new Error('Google Drive permission is unavailable. Start the explicit Drive consent step again.');
  return { authorization: `Bearer ${accessCredential}`, ...extra };
}

function publicRecord(record = {}) {
  const id = text(record.id, 260);
  const name = text(record.name, 220);
  if (!validFileId(id) || !FILE_NAME_RE.test(name)) return null;
  const size = Math.max(0, Math.min(EON_GOOGLE_DRIVE_SNAPSHOT_MAX_BYTES, Number(record.size || 0)));
  const createdAt = text(record.createdTime, 64);
  const modifiedAt = text(record.modifiedTime, 64);
  return frozen({ id, name, size, createdAt, modifiedAt, mimeType: text(record.mimeType, 120), trashed: Boolean(record.trashed) });
}

export function getGoogleDriveSnapshotTruth({ configured = false } = {}) {
  return frozen({
    schema: EON_GOOGLE_DRIVE_SNAPSHOT_SCHEMA,
    state: configured ? 'configured-awaiting-explicit-user-consent' : 'owner-configuration-required',
    provider: 'Google Drive',
    scope: EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE,
    mode: 'explicit-encrypted-snapshot-not-sync',
    configured: Boolean(configured),
    connected: false,
    tokenStorage: 'memory-only',
    backupBeforeUpload: 'The browser creates one encrypted Capsule before it contacts Google Drive.',
    restore: 'A selected Drive copy is downloaded only after user action, then inspected locally before any individual workspace record can change.',
    automaticUpload: false,
    automaticRestore: false,
    automaticCrossDeviceSync: false,
    googleLoginConsentReusable: false,
    contract: W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT.schema
  });
}

/** Fetches only public client configuration. Call after a backup action, never at page boot. */
export async function readGoogleDrivePublicConfig({ fetchImpl = globalThis.fetch, endpoint = EON_GOOGLE_DRIVE_SNAPSHOT_CONFIG_ROUTE } = {}) {
  if (typeof fetchImpl !== 'function') return frozen({ configured: false, clientId: '', reason: 'browser-fetch-unavailable' });
  let response;
  try {
    response = await fetchImpl(endpoint, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
  } catch {
    return frozen({ configured: false, clientId: '', reason: 'public-config-unavailable' });
  }
  if (!response?.ok) return frozen({ configured: false, clientId: '', reason: `public-config-http-${Number(response?.status) || 0}` });
  let payload = {};
  try { payload = await response.json(); } catch { return frozen({ configured: false, clientId: '', reason: 'public-config-invalid' }); }
  const clientId = text(payload?.clientId, 320);
  return frozen({
    configured: Boolean(payload?.configured) && validClientId(clientId),
    clientId: validClientId(clientId) ? clientId : '',
    reason: validClientId(clientId) && payload?.configured ? null : text(payload?.reason || 'owner-configuration-required', 120),
    scope: text(payload?.scope, 200) || EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE
  });
}

/** Loads Google Identity Services only after the user enters the Drive flow. */
export async function loadGoogleIdentityServices({ documentRef = globalThis.document, googleRef = globalThis.google } = {}) {
  if (googleRef?.accounts?.oauth2) return googleRef;
  if (!documentRef?.createElement || !documentRef?.head) throw new Error('Google Drive consent is unavailable in this browser.');
  const present = documentRef.querySelector?.(`script[src="${GIS_SCRIPT}"]`);
  await new Promise((resolve, reject) => {
    const script = present || documentRef.createElement('script');
    const done = () => {
      const source = globalThis.google;
      if (source?.accounts?.oauth2) resolve();
      else reject(new Error('Google Drive consent library did not load.'));
    };
    if (present) {
      present.addEventListener?.('load', done, { once: true });
      present.addEventListener?.('error', () => reject(new Error('Google Drive consent library could not load.')), { once: true });
      setTimeout(() => { if (globalThis.google?.accounts?.oauth2) resolve(); }, 0);
      return;
    }
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = done;
    script.onerror = () => reject(new Error('Google Drive consent library could not load.'));
    documentRef.head.append(script);
  });
  if (!globalThis.google?.accounts?.oauth2) throw new Error('Google Drive consent library is unavailable.');
  return globalThis.google;
}

/** Must run from the second, explicit user gesture after the consent preview. */
export function requestGoogleDriveAccess({ clientId = '', googleRef = globalThis.google } = {}) {
  if (!validClientId(clientId)) return Promise.reject(new Error('Google Drive is not configured for this deployment yet.'));
  const oauth = googleRef?.accounts?.oauth2;
  if (!oauth?.initTokenClient) return Promise.reject(new Error('Google Drive consent is not prepared. Select Prepare Google Drive backup first.'));
  return new Promise((resolve, reject) => {
    let completed = false;
    const finish = (value, error = null) => {
      if (completed) return;
      completed = true;
      if (error) reject(error); else resolve(value);
    };
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE,
      include_granted_scopes: false,
      prompt: 'consent',
      callback: (response = {}) => {
        const credential = text(response?.access_token, 4096);
        if (response?.error || !validAccessCredential(credential)) {
          finish(null, new Error(response?.error ? 'Google Drive permission was not granted.' : 'Google Drive did not return a usable permission.'));
          return;
        }
        finish(frozen({ credential, expiresIn: Number(response.expires_in || 0), scope: text(response.scope, 300) }));
      },
      error_callback: () => finish(null, new Error('Google Drive permission window was closed or blocked.'))
    });
    try { client.requestAccessToken(); } catch { finish(null, new Error('Google Drive permission could not start.')); }
  });
}

export function buildDriveSnapshotName({ createdAt = nowIso(), capsuleId = '' } = {}) {
  const stamp = text(createdAt, 40).replace(/[:.]/g, '-').replace(/[^0-9TZ-]/g, '').slice(0, 32) || 'snapshot';
  const suffix = text(capsuleId, 140).replace(/[^A-Za-z0-9_-]/g, '').slice(-14) || 'capsule';
  return `EONAPP-backup-${stamp}-${suffix}.eoncapsule`;
}

export async function uploadGoogleDriveSnapshot({ accessCredential = '', serializedCapsule = '', capsule = {}, fetchImpl = globalThis.fetch, now = () => Date.now(), signal = null } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Browser network access is unavailable for the explicit Google Drive upload.');
  const size = byteLength(serializedCapsule);
  if (!serializedCapsule || size < 20 || size > EON_GOOGLE_DRIVE_SNAPSHOT_MAX_BYTES) throw new Error('The encrypted Capsule is outside the supported Google Drive snapshot size.');
  const capsuleId = text(capsule?.capsuleId, 180);
  const name = buildDriveSnapshotName({ createdAt: capsule?.createdAt || nowIso(now), capsuleId });
  if (!FILE_NAME_RE.test(name)) throw new Error('The encrypted Capsule snapshot name could not be prepared.');
  const metadata = {
    name,
    mimeType: EON_GOOGLE_DRIVE_SNAPSHOT_MIME,
    appProperties: {
      [EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY]: 'true',
      eonappSnapshotSchema: EON_GOOGLE_DRIVE_SNAPSHOT_SCHEMA,
      eonappCapsuleSchema: text(capsule?.schema, 120) || 'eonapp.portable-workspace-capsule.v1',
      eonappCapsuleVersion: String(Number(capsule?.version || 1)),
      eonappEncrypted: 'true'
    }
  };
  const initUrl = `${DRIVE_UPLOAD_API}?uploadType=resumable&fields=id,name,size,createdTime,modifiedTime,mimeType,trashed`;
  const init = await fetchImpl(initUrl, {
    method: 'POST',
    headers: driveHeaders(accessCredential, {
      'content-type': 'application/json; charset=UTF-8',
      'x-upload-content-type': EON_GOOGLE_DRIVE_SNAPSHOT_MIME,
      'x-upload-content-length': String(size)
    }),
    body: JSON.stringify(metadata),
    signal
  });
  if (!init?.ok) throw Object.assign(new Error(safeApiError(init?.status, await bodyText(init)).message), { code: safeApiError(init?.status).code });
  const sessionUrl = text(init.headers?.get?.('location'), 2048);
  if (!/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?/i.test(sessionUrl)) throw new Error('Google Drive did not provide a safe upload session.');
  const uploaded = await fetchImpl(sessionUrl, {
    method: 'PUT',
    headers: driveHeaders(accessCredential, {
      'content-type': EON_GOOGLE_DRIVE_SNAPSHOT_MIME,
      'content-range': `bytes 0-${size - 1}/${size}`
    }),
    body: serializedCapsule,
    signal
  });
  const record = publicRecord(await expectJson(uploaded));
  if (!record || record.size > EON_GOOGLE_DRIVE_SNAPSHOT_MAX_BYTES) throw new Error('Google Drive returned an invalid backup receipt.');
  return frozen({ ...record, uploadMode: 'explicit-encrypted-snapshot', automaticSync: false, rawValuesSent: false });
}

export async function listGoogleDriveSnapshots({ accessCredential = '', fetchImpl = globalThis.fetch, signal = null } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Browser network access is unavailable for Google Drive.');
  const query = `appProperties has { key='${EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY}' and value='true' } and trashed = false`;
  const params = new URLSearchParams({
    q: query,
    orderBy: 'createdTime desc',
    pageSize: '50',
    fields: 'files(id,name,size,createdTime,modifiedTime,mimeType,trashed)'
  });
  const response = await fetchImpl(`${DRIVE_API}/files?${params.toString()}`, { method: 'GET', headers: driveHeaders(accessCredential), signal });
  const payload = await expectJson(response);
  return frozen((Array.isArray(payload?.files) ? payload.files : []).map(publicRecord).filter(Boolean).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
}

export async function downloadGoogleDriveSnapshot({ accessCredential = '', fileId = '', fetchImpl = globalThis.fetch, signal = null } = {}) {
  if (!validFileId(fileId)) throw new Error('The selected Google Drive backup is invalid.');
  const response = await fetchImpl(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`, { method: 'GET', headers: driveHeaders(accessCredential), signal });
  const raw = await bodyText(response);
  if (!response?.ok) throw Object.assign(new Error(safeApiError(response?.status, raw).message), { code: safeApiError(response?.status).code });
  if (!raw || byteLength(raw) > EON_GOOGLE_DRIVE_SNAPSHOT_MAX_BYTES) throw new Error('The selected Google Drive backup is too large or invalid.');
  return raw;
}

export async function trashGoogleDriveSnapshot({ accessCredential = '', fileId = '', fetchImpl = globalThis.fetch, signal = null } = {}) {
  if (!validFileId(fileId)) throw new Error('The selected Google Drive backup is invalid.');
  const response = await fetchImpl(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=id,trashed`, {
    method: 'PATCH',
    headers: driveHeaders(accessCredential, { 'content-type': 'application/json; charset=UTF-8' }),
    body: JSON.stringify({ trashed: true }),
    signal
  });
  const payload = await expectJson(response);
  if (!validFileId(payload?.id) || payload?.trashed !== true) throw new Error('Google Drive did not confirm moving that backup to trash.');
  return frozen({ id: payload.id, trashed: true });
}

export function revokeGoogleDriveAccess({ accessCredential = '', googleRef = globalThis.google } = {}) {
  const revoke = googleRef?.accounts?.oauth2?.revoke;
  if (!validAccessCredential(accessCredential)) return Promise.resolve(frozen({ revoked: false, reason: 'no-in-memory-permission' }));
  if (typeof revoke !== 'function') return Promise.resolve(frozen({ revoked: false, reason: 'revoke-api-unavailable' }));
  return new Promise((resolve) => {
    try {
      revoke(accessCredential, (response = {}) => resolve(frozen({ revoked: Boolean(response?.successful), reason: response?.error ? 'provider-declined' : null })));
    } catch { resolve(frozen({ revoked: false, reason: 'revoke-failed' })); }
  });
}

export default {
  getGoogleDriveSnapshotTruth,
  readGoogleDrivePublicConfig,
  loadGoogleIdentityServices,
  requestGoogleDriveAccess,
  buildDriveSnapshotName,
  uploadGoogleDriveSnapshot,
  listGoogleDriveSnapshots,
  downloadGoogleDriveSnapshot,
  trashGoogleDriveSnapshot,
  revokeGoogleDriveAccess
};
