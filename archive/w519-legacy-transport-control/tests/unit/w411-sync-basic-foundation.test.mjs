import assert from 'node:assert/strict';
import test from 'node:test';
import { W411_SYNC_BASIC_FOUNDATION_CONTRACT, validateW411SyncBasicFoundationContract } from '../../config/w411-sync-basic-foundation-contract.mjs';
import { EON_SYNC_BASIC_SCHEMA, buildEonSyncBasicLocalMigrationPreview, createEonSyncBasicRecord, createEonSyncBasicTombstone, getEonSyncBasicTruth, resolveEonSyncBasicConflict } from '../../assets/js/eon-sync/eon-sync-basic-foundation.js';
import { inspectW411SyncBasicFoundation } from '../../scripts/w411-sync-basic-foundation-gate.mjs';

function memoryStorage(entries = {}) {
  const rows = new Map(Object.entries(entries));
  return {
    getItem: (key) => rows.get(String(key)) ?? null,
    setItem: (key, value) => rows.set(String(key), String(value)),
    removeItem: (key) => rows.delete(String(key)),
    rows
  };
}

const DEVICE = 'device_test_sync_basic_0001';

test('W411 creates deterministic safe record envelopes and tombstones without persistence', async () => {
  const record = await createEonSyncBasicRecord({ id: 'preferences:language', type: 'preferences', content: { language: 'hi' }, originDeviceId: DEVICE, updatedAt: '2026-06-28T00:00:00.000Z' });
  assert.equal(record.schema, EON_SYNC_BASIC_SCHEMA);
  assert.equal(record.originDeviceId, DEVICE);
  assert.equal(record.deletedAt, null);
  assert.match(record.contentHash, /^sha256:[a-f0-9]{64}$/);
  const same = await createEonSyncBasicRecord({ id: 'preferences:language', type: 'preferences', content: { language: 'hi' }, originDeviceId: DEVICE, updatedAt: '2026-06-28T00:00:00.000Z' });
  assert.equal(record.contentHash, same.contentHash);
  const tombstone = await createEonSyncBasicTombstone({ id: 'preferences:language', type: 'preferences', originDeviceId: DEVICE, deletedAt: '2026-06-28T01:00:00.000Z' });
  assert.equal(tombstone.content, null);
  assert.equal(tombstone.deletedAt, '2026-06-28T01:00:00.000Z');
});

test('W411 migration preview materializes only explicit safe selections and never writes storage', async () => {
  const local = memoryStorage({
    'eon:lang:preference:v1': 'hi',
    'eon:forge:projects:v1': JSON.stringify([{ id: 'project-1', files: { 'index.html': '<h1>Hello</h1>' } }]),
    'eon:share:drafts:v1': JSON.stringify([{ title: 'Safe share' }]),
    'eon:vault:secret': 'do-not-read'
  });
  const session = memoryStorage({
    'eon:chat:threads:v1': JSON.stringify({ threads: [{ id: 'chat-a', messages: [{ role: 'user', text: 'Hello' }] }] })
  });
  const beforeLocal = new Map(local.rows);
  const beforeSession = new Map(session.rows);
  const withoutConsent = await buildEonSyncBasicLocalMigrationPreview({ localStorage: local, sessionStorage: session, selectedTypes: ['preferences', 'chat-text'], originDeviceId: DEVICE, explicitUserConsent: false, now: Date.UTC(2026, 5, 28) });
  assert.equal(withoutConsent.records.length, 0);
  assert.ok(withoutConsent.skipped.some((row) => row.reason === 'explicit-opt-in-required' || row.reason === 'explicit-text-consent-required'));
  const withConsent = await buildEonSyncBasicLocalMigrationPreview({ localStorage: local, sessionStorage: session, selectedTypes: ['preferences', 'chat-text', 'project-text', 'share-remix-metadata'], originDeviceId: DEVICE, explicitUserConsent: true, now: Date.UTC(2026, 5, 28) });
  assert.ok(withConsent.records.some((record) => record.type === 'preferences'));
  assert.ok(withConsent.records.some((record) => record.type === 'chat-text'));
  assert.ok(withConsent.records.some((record) => record.type === 'project-text'));
  assert.deepEqual(local.rows, beforeLocal);
  assert.deepEqual(session.rows, beforeSession);
  assert.equal(withConsent.networkRequestCreated, false);
});

test('W411 text conflicts require a copy and low-risk preferences do not silently overwrite', async () => {
  const local = await createEonSyncBasicRecord({ id: 'chat-text:threads', type: 'chat-text', content: { text: 'local' }, originDeviceId: DEVICE, updatedAt: '2026-06-28T00:00:00.000Z' });
  const remote = await createEonSyncBasicRecord({ id: 'chat-text:threads', type: 'chat-text', content: { text: 'remote' }, originDeviceId: 'device_test_sync_basic_0002', updatedAt: '2026-06-28T01:00:00.000Z' });
  const conflict = resolveEonSyncBasicConflict(local, remote);
  assert.equal(conflict.strategy, 'conflict-copy-required');
  assert.ok(conflict.conflictCopy?.id.includes(':conflict-'));
  assert.equal(conflict.automaticOverwrite, false);
  const preferenceLocal = await createEonSyncBasicRecord({ id: 'preferences:theme', type: 'preferences', content: { theme: 'graphite' }, originDeviceId: DEVICE, updatedAt: '2026-06-28T00:00:00.000Z' });
  const preferenceRemote = await createEonSyncBasicRecord({ id: 'preferences:theme', type: 'preferences', content: { theme: 'obsidian' }, originDeviceId: 'device_test_sync_basic_0002', updatedAt: '2026-06-28T01:00:00.000Z' });
  const resolved = resolveEonSyncBasicConflict(preferenceLocal, preferenceRemote);
  assert.equal(resolved.strategy, 'last-write-wins-low-risk');
  assert.equal(resolved.primary.content.theme, 'obsidian');
  assert.equal(resolved.automaticOverwrite, false);
});

test('W411 contract, inactive truth and source gate pass', () => {
  assert.deepEqual(validateW411SyncBasicFoundationContract(), []);
  assert.equal(W411_SYNC_BASIC_FOUNDATION_CONTRACT.enabled, false);
  const truth = getEonSyncBasicTruth();
  assert.equal(truth.enabled, false);
  assert.equal(truth.automaticUpload, false);
  assert.equal(truth.secureVaultSyncIncluded, false);
  const report = inspectW411SyncBasicFoundation();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 10);
  assert.match(report.limitations.join(' '), /two-device/i);
});
