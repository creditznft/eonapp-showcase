import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY,
  EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE,
  W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT,
  validateW536GoogleDriveSnapshotContract
} from '../../config/w536-google-drive-snapshot-contract.mjs';
import {
  buildDriveSnapshotName,
  downloadGoogleDriveSnapshot,
  getGoogleDriveSnapshotTruth,
  listGoogleDriveSnapshots,
  readGoogleDrivePublicConfig,
  requestGoogleDriveAccess,
  revokeGoogleDriveAccess,
  trashGoogleDriveSnapshot,
  uploadGoogleDriveSnapshot
} from '../../assets/js/local-first/eon-google-drive-snapshot-connector.js';
import { onRequestGet } from '../../functions/api/public/google-drive.js';

const clientId = '123456789012-abcdefghijklmnopqrstuv.apps.googleusercontent.com';
const accessCredential = 'drive_access_credential_that_is_long_enough_12345';
const fileId = 'drivefile_1234567890';
const rawCapsule = JSON.stringify({ schema: 'eonapp.portable-workspace-capsule.v1', version: 2, ciphertext: 'encrypted-only-test-fixture' });

function jsonResponse(value, init = {}) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) }
  });
}

test('W536 locks the Drive connector to explicit encrypted snapshots, not login reuse or sync', () => {
  assert.deepEqual(validateW536GoogleDriveSnapshotContract(), []);
  assert.equal(W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT.scope, EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE);
  assert.equal(W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT.automaticUpload, false);
  assert.equal(W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT.automaticRestore, false);
  assert.equal(W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT.automaticCrossDeviceSync, false);
  assert.ok(W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT.forbidden.includes('Google Login consent reused for Drive'));

  const truth = getGoogleDriveSnapshotTruth({ configured: true });
  assert.equal(truth.googleLoginConsentReusable, false);
  assert.equal(truth.tokenStorage, 'memory-only');
  assert.equal(truth.mode, 'explicit-encrypted-snapshot-not-sync');
  assert.equal(truth.automaticCrossDeviceSync, false);
});

test('W536 public configuration endpoint exposes only a valid public client ID and never a secret', async () => {
  const configured = await onRequestGet({ env: { EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID: clientId, EON_GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: 'must-not-be-read' } });
  assert.equal(configured.headers.get('cache-control'), 'no-store, max-age=0');
  const payload = await configured.json();
  assert.equal(payload.configured, true);
  assert.equal(payload.clientId, clientId);
  assert.equal(Object.hasOwn(payload, 'clientSecret'), false);
  assert.equal(JSON.stringify(payload).includes('must-not-be-read'), false);

  const disabled = await onRequestGet({ env: { EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID: 'malformed' } });
  assert.equal((await disabled.json()).configured, false);
});

test('W536 reads only safe public Drive configuration and rejects a malformed client identifier', async () => {
  const configured = await readGoogleDrivePublicConfig({
    fetchImpl: async () => jsonResponse({ configured: true, clientId, scope: EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE })
  });
  assert.deepEqual(configured, {
    configured: true,
    clientId,
    reason: null,
    scope: EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE
  });

  const rejected = await readGoogleDrivePublicConfig({
    fetchImpl: async () => jsonResponse({ configured: true, clientId: 'not-a-google-client-id' })
  });
  assert.equal(rejected.configured, false);
  assert.equal(rejected.clientId, '');
});

test('W536 requests a separate Drive token only after an explicit authorization action', async () => {
  let requested = 0;
  let captured = null;
  const googleRef = {
    accounts: {
      oauth2: {
        initTokenClient(options) {
          captured = options;
          return {
            requestAccessToken() {
              requested += 1;
              options.callback({ access_token: accessCredential, expires_in: 3599, scope: EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE });
            }
          };
        }
      }
    }
  };
  const session = await requestGoogleDriveAccess({ clientId, googleRef });
  assert.equal(requested, 1);
  assert.equal(captured.scope, EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE);
  assert.equal(captured.include_granted_scopes, false);
  assert.equal(captured.prompt, 'consent');
  assert.equal(session.credential, accessCredential);
  assert.equal(session.scope, EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE);
});

test('W536 uploads only a caller-created encrypted Capsule with resumable Drive upload metadata', async () => {
  const calls = [];
  const record = {
    id: fileId,
    name: 'EONAPP-backup-2026-07-03T08-11-12-000Z-1234567890.eoncapsule',
    size: String(new TextEncoder().encode(rawCapsule).byteLength),
    createdTime: '2026-07-03T08:11:12.000Z',
    modifiedTime: '2026-07-03T08:11:12.000Z',
    mimeType: 'application/vnd.eonapp.workspace-capsule+json',
    trashed: false
  };
  const result = await uploadGoogleDriveSnapshot({
    accessCredential,
    serializedCapsule: rawCapsule,
    capsule: { capsuleId: 'eoncap_abcdefghijklmnopqrstuvwxyz', createdAt: '2026-07-03T08:11:12.000Z', schema: 'eonapp.portable-workspace-capsule.v1', version: 2 },
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      if (calls.length === 1) return new Response('', { status: 200, headers: { location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=test-session' } });
      return jsonResponse(record);
    }
  });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /uploadType=resumable/);
  assert.equal(calls[0].options.headers.authorization, `Bearer ${accessCredential}`);
  const metadata = JSON.parse(calls[0].options.body);
  assert.equal(metadata.appProperties[EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY], 'true');
  assert.equal(metadata.appProperties.eonappEncrypted, 'true');
  assert.equal(calls[1].options.body, rawCapsule);
  assert.equal(result.id, fileId);
  assert.equal(result.automaticSync, false);
  assert.equal(result.rawValuesSent, false);
});

test('W536 lists, locally inspects, trashes, and revokes only explicit selected Drive snapshots', async () => {
  const record = {
    id: fileId,
    name: 'EONAPP-backup-2026-07-03T08-11-12-000Z-1234567890.eoncapsule',
    size: String(new TextEncoder().encode(rawCapsule).byteLength),
    createdTime: '2026-07-03T08:11:12.000Z',
    modifiedTime: '2026-07-03T08:11:12.000Z',
    mimeType: 'application/vnd.eonapp.workspace-capsule+json',
    trashed: false
  };
  const listed = await listGoogleDriveSnapshots({ accessCredential, fetchImpl: async (url, options) => {
    const parsed = new URL(String(url));
    assert.match(parsed.searchParams.get('q'), /appProperties has/);
    assert.match(parsed.searchParams.get('q'), new RegExp(EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY));
    assert.equal(options.headers.authorization, `Bearer ${accessCredential}`);
    return jsonResponse({ files: [record] });
  } });
  assert.deepEqual(listed.map((entry) => entry.id), [fileId]);

  const downloaded = await downloadGoogleDriveSnapshot({ accessCredential, fileId, fetchImpl: async () => new Response(rawCapsule, { status: 200 }) });
  assert.equal(downloaded, rawCapsule);

  const trashed = await trashGoogleDriveSnapshot({ accessCredential, fileId, fetchImpl: async (url, options) => {
    assert.match(String(url), new RegExp(fileId));
    assert.equal(options.method, 'PATCH');
    assert.deepEqual(JSON.parse(options.body), { trashed: true });
    return jsonResponse({ id: fileId, trashed: true });
  } });
  assert.deepEqual(trashed, { id: fileId, trashed: true });

  let revokedCredential = '';
  const revoked = await revokeGoogleDriveAccess({
    accessCredential,
    googleRef: { accounts: { oauth2: { revoke(credential, callback) { revokedCredential = credential; callback({ successful: true }); } } } }
  });
  assert.equal(revokedCredential, accessCredential);
  assert.equal(revoked.revoked, true);
});

test('W536 produces bounded neutral snapshot names without account or workspace values', () => {
  const name = buildDriveSnapshotName({ createdAt: '2026-07-03T08:11:12.000Z', capsuleId: 'eoncap_abcdefghijklmnopqrstuvwxyz' });
  assert.match(name, /^EONAPP-backup-[A-Za-z0-9TZ-]+-[A-Za-z0-9_-]+\.eoncapsule$/);
  assert.equal(name.includes('workspace'), false);
  assert.equal(name.includes('credential'), false);
});
