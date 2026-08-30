import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonSyncBasicConfig, hashEonSyncBasicRecordContent, normalizeEonSyncBasicRecord, publicEonSyncBasicStatus, upsertEonSyncBasicRecords, verifyEonSyncBasicRecordContentHash } from '../../functions/_shared/eon-sync-basic.js';
import { getEonSyncBasicClientTruth, requestEonSyncBasicStatus, uploadReviewedEonSyncBasicRecords } from '../../assets/js/eon-sync/eon-sync-basic-client.js';
import { inspectW412SyncBasicTransport } from '../../scripts/w412-sync-basic-transport-gate.mjs';

const validRecordBase = Object.freeze({ id: 'preferences:theme', type: 'preferences', originDeviceId: 'device_abcdefghijklmnop', updatedAt: '2026-06-28T00:00:00.000Z', version: 1, deletedAt: null, content: { theme: 'graphite' } });

async function createValidRecord(overrides = {}) {
  const candidate = { ...validRecordBase, ...overrides };
  return Object.freeze({ ...candidate, contentHash: await hashEonSyncBasicRecordContent(candidate) });
}

test('W412 configuration is fail-closed without the dedicated database and proof flags', () => {
  const request = new Request('https://eonapp.invalid/api/sync/status');
  const config = getEonSyncBasicConfig(request, {});
  assert.equal(config.configured, false);
  assert.equal(config.database, null);
  assert.equal(publicEonSyncBasicStatus(config).available, false);
});

test('W412 accepts only safe canonical records and rejects sensitive or invalid shapes', async () => {
  const validRecord = await createValidRecord();
  assert.equal(normalizeEonSyncBasicRecord(validRecord).ok, true);
  assert.equal(await verifyEonSyncBasicRecordContentHash(validRecord), true);
  assert.equal(await verifyEonSyncBasicRecordContentHash({ ...validRecord, content: { theme: 'other' } }), false);
  assert.equal(normalizeEonSyncBasicRecord({ ...validRecord, type: 'vault' }).ok, false);
  assert.equal(normalizeEonSyncBasicRecord({ ...validRecord, originDeviceId: 'device_short' }).ok, false);
  assert.equal(normalizeEonSyncBasicRecord({ ...validRecord, content: { apiKey: 'hidden' } }).ok, false);
  assert.equal(normalizeEonSyncBasicRecord({ ...validRecord, deletedAt: '2026-06-28T00:01:00.000Z', content: { theme: 'graphite' } }).ok, false);
});

test('W412 sends only normalized reviewed records to dedicated D1 statements', async () => {
  const validRecord = await createValidRecord();
  const normalized = normalizeEonSyncBasicRecord(validRecord);
  const statements = [];
  const fakeDatabase = {
    prepare(sql) {
      return { bind(...values) { return { sql: String(sql), values }; } };
    },
    async batch(items) { statements.push(...items); return []; }
  };
  const result = await upsertEonSyncBasicRecords(fakeDatabase, 'account_123', [normalized.record]);
  assert.equal(result.accepted, 1);
  assert.equal(result.deviceCount, 1);
  assert.equal(statements.length, 2);
  assert.equal(statements.every((statement) => statement.values[0] === 'account_123'), true);
  assert.equal(statements.some((statement) => /eon_sync_records/.test(statement.sql)), true);
  assert.equal(statements.some((statement) => /eon_sync_devices/.test(statement.sql)), true);
});

test('W412 browser client never fetches until a user explicitly asks', async () => {
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ok: true, available: false, signedIn: false, status: 'not-configured', supportedTypes: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const denied = await requestEonSyncBasicStatus({ explicitUserAction: false, fetchImpl: fakeFetch });
  assert.equal(denied.networkRequestCreated, false);
  assert.equal(calls, 0);
  const checked = await requestEonSyncBasicStatus({ explicitUserAction: true, fetchImpl: fakeFetch });
  assert.equal(checked.ok, true);
  assert.equal(calls, 1);
});

test('W412 upload requires both visible action and separate upload consent', async () => {
  const validRecord = await createValidRecord();
  let calls = 0;
  const fakeFetch = async () => { calls += 1; return new Response(JSON.stringify({ ok: true, available: true, signedIn: true, accepted: 1 }), { status: 202, headers: { 'content-type': 'application/json' } }); };
  const denied = await uploadReviewedEonSyncBasicRecords([validRecord], { explicitUserAction: true, explicitUploadConsent: false, fetchImpl: fakeFetch });
  assert.equal(denied.networkRequestCreated, false);
  assert.equal(calls, 0);
  const accepted = await uploadReviewedEonSyncBasicRecords([validRecord], { explicitUserAction: true, explicitUploadConsent: true, fetchImpl: fakeFetch });
  assert.equal(accepted.networkRequestCreated, true);
  assert.equal(accepted.accepted, 1);
  assert.equal(calls, 1);
});

test('W412 source gate and client truth remain manual-proof only', () => {
  const truth = getEonSyncBasicClientTruth();
  assert.equal(truth.automaticUpload, false);
  assert.equal(truth.automaticMerge, false);
  assert.equal(truth.vaultSync, false);
  const report = inspectW412SyncBasicTransport();
  assert.equal(report.status, 'pass');
  assert.equal(report.checkCount, 16);
});
