#!/usr/bin/env node
/** W412 source gate: Sync transport must stay explicit, dedicated-DB and fail-closed. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_SYNC_BASIC_TYPES, getEonSyncBasicTruth } from '../assets/js/eon-sync/eon-sync-basic-foundation.js';
import { EON_SYNC_BASIC_RECORD_TYPES, EON_SYNC_BASIC_TRANSPORT_LIMITS, getEonSyncBasicConfig, normalizeEonSyncBasicRecord, publicEonSyncBasicStatus, verifyEonSyncBasicRecordContentHash } from '../functions/_shared/eon-sync-basic.js';
import { getEonSyncBasicClientTruth } from '../assets/js/eon-sync/eon-sync-basic-client.js';
import { W412_SYNC_BASIC_TRANSPORT_CONTRACT, validateW412SyncBasicTransportContract } from '../config/w412-sync-basic-transport-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW412SyncBasicTransport() {
  const contract = W412_SYNC_BASIC_TRANSPORT_CONTRACT;
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const shared = read('functions/_shared/eon-sync-basic.js');
  const status = read('functions/api/sync/status.js');
  const records = read('functions/api/sync/records.js');
  const tombstone = read('functions/api/sync/records/tombstone.js');
  const migration = read('sync/migrations/0001_eon_sync_basic.sql');
  const client = read('assets/js/eon-sync/eon-sync-basic-client.js');
  const shell = read('assets/js/eon-app-shell.js');
  const docs = read('docs/W412_SYNC_BASIC_TRANSPORT_2026-06-28.md');
  const sampleRequest = new Request('https://eonapp.invalid/api/sync/status');
  const disabled = getEonSyncBasicConfig(sampleRequest, {});
  const sampleRecord = normalizeEonSyncBasicRecord({ id: 'preferences:theme', type: 'preferences', originDeviceId: 'device_abcdefghijklmnop', updatedAt: '2026-06-28T00:00:00.000Z', version: 1, deletedAt: null, contentHash: `sha256:${'a'.repeat(64)}`, content: { theme: 'graphite' } });

  check('contract-valid', validateW412SyncBasicTransportContract().length === 0, 'W412 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'all W412 source, migration, client, contract, gate, test and docs files exist');
  check('type-parity', EON_SYNC_BASIC_TYPES.join(',') === contract.allowedTypes.join(',') && EON_SYNC_BASIC_RECORD_TYPES.join(',') === contract.allowedTypes.join(','), 'browser foundation and transport use the same six approved safe types');
  check('foundation-remains-not-live', getEonSyncBasicTruth().enabled === false && getEonSyncBasicTruth().networkEndpoints.length === 0 && getEonSyncBasicTruth().secureVaultSyncIncluded === false, 'W411 foundation does not claim activation or Vault Sync');
  check('dedicated-config-fails-closed', disabled.configured === false && disabled.database === null && publicEonSyncBasicStatus(disabled, null).available === false, 'no dedicated D1 binding + proof flags means no Sync transport');
  check('record-normalizer-fails-closed', sampleRecord.ok === true && normalizeEonSyncBasicRecord({ ...sampleRecord.record, type: 'vault' }).ok === false && normalizeEonSyncBasicRecord({ ...sampleRecord.record, content: { apiKey: 'not allowed' } }).ok === false, 'only safe types and secret-free content are accepted');
  check('strict-transport-limits', EON_SYNC_BASIC_TRANSPORT_LIMITS.maxRecordsPerWrite <= 48 && EON_SYNC_BASIC_TRANSPORT_LIMITS.maxRecordBytes <= 350000, 'bounded manual batches and record sizes are enforced');
  check('status-does-not-sync', /onRequestGet/.test(status) && /publicEonSyncBasicStatus/.test(status) && !/upsertEonSyncBasicRecords/.test(status), 'status endpoint cannot create a Sync write');
  check('writes-need-session-origin-and-review', /requireEonSyncBasicSession/.test(records) && /requestHasAllowedSameOrigin/.test(records) && /normalizeEonSyncBasicRecord/.test(records) && /automaticMerge:\s*false/.test(records), 'record write requires configured session, same-origin mutation and review-only conflict behavior');
  check('server-verifies-record-integrity', /verifyEonSyncBasicRecordContentHash/.test(records) && /content-hash-mismatch/.test(records) && /verifyEonSyncBasicRecordContentHash/.test(tombstone) && /content-hash-mismatch/.test(tombstone), 'the Worker independently verifies the canonical content hash before D1 accepts records or tombstones');
  check('tombstone-is-controlled', /deletedAt/.test(tombstone) && /requestHasAllowedSameOrigin/.test(tombstone) && /automaticDeletion:\s*false/.test(tombstone), 'deletion is transportable only as an explicit tombstone, never automatic deletion');
  check('migration-excludes-sensitive-domains', /eon_sync_records/.test(migration) && !/vault|api_key|payment|wallet|reward/i.test(migration.replace(/--[^\n]*/g, '')), 'dedicated schema has only safe record/device tables and no sensitive-domain tables');
  check('client-requires-user-actions', /explicitUserAction/.test(client) && /explicitUploadConsent/.test(client) && /explicitDeletionConsent/.test(client) && /importNetworkOnModuleLoad:\s*false/.test(client), 'browser transport has no import-time network or automatic write/delete/merge');
  check('client-truth-boundary', Object.entries(contract.expectedClientTruth).every(([key, expected]) => getEonSyncBasicClientTruth()[key] === expected), 'client truth keeps all automated/sensitive capabilities false');
  check('settings-does-not-expose-sync', !/data-eon-settings-sync-status|requestEonSyncBasicStatus/.test(shell) && /Portable Workspace Capsule/.test(shell) && /No cloud Sync, relay, D1 restore path/.test(shell), 'Settings exposes local Capsule recovery only; dormant Sync Basic has no public activation surface.');
  check('docs-disclose-manual-boundary', /manual proof/i.test(docs) && /two-device/i.test(docs) && /Vault/i.test(docs) && /not a public release/i.test(docs), 'docs disclose the required manual two-device, Vault and public-release boundaries');

  return Object.freeze({ schema: 'eonapp.w412.sync-basic-transport-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze([
    'W412 provides a fail-closed transport and source client; it does not prove any live Cloudflare binding, Google session, cross-device transfer, conflict result, deletion propagation or restore drill.',
    'The public Settings surface exposes no Sync Basic action. Upload, read, tombstone and merge-review functions remain dormant source capabilities for later quarantine and manual-proof review, not automatic product behavior.',
    'Secure Vault Sync remains excluded until a separate E2EE, recovery, device-revocation and empty-device restore proof is completed.'
  ]) });
}

export function runW412SyncBasicTransportGate({ writeArtifact = true } = {}) {
  const report = inspectW412SyncBasicTransport();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w412-sync-basic-transport-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW412SyncBasicTransportGate();
  process.stdout.write(`W412 Sync Basic transport gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
