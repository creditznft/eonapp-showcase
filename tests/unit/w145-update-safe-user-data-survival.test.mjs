import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  W145_DEPLOYMENT_INVARIANTS,
  W145_PROTECTED_STORAGE_GROUPS,
  W145_UPDATE_SURVIVAL_RECEIPT_KEY,
  W145_UPDATE_SURVIVAL_SCHEMA,
  assertW145UpdateSurvivalManifest,
  buildW145UpdateSurvivalManifest,
  getW145RemainingPhaseSummary,
  getW145UpdateSurvivalStatus,
  recordW145UpdateSurvivalReceipt,
  seedW145ProofStorage,
  simulateCloudflareAppUpdate,
  summarizeW145ProtectedStorage
} from '../../assets/js/utils/update-safe-user-data.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.store.size; }
  key(index) { return Array.from(this.store.keys())[index] || null; }
  getItem(key) { return this.store.has(String(key)) ? this.store.get(String(key)) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
  removeItem(key) { this.store.delete(String(key)); }
  clear() { this.store.clear(); }
  toObject() { return Object.fromEntries(this.store.entries()); }
}

test('W145 registry covers NFTs, Vault, API keys, settings, receipts, and workstation data', () => {
  const groupIds = W145_PROTECTED_STORAGE_GROUPS.map((group) => group.id);
  for (const id of ['ai-api-keys', 'nfts-market-vault', 'vault-backup-security', 'identity-settings', 'chat-projects-workspace', 'city-preview-work-loop', 'automation-workstation', 'legacy-value-preservation']) {
    assert.ok(groupIds.includes(id), `missing group ${id}`);
  }
  const legacyValueGroup = W145_PROTECTED_STORAGE_GROUPS.find((group) => group.id === 'legacy-value-preservation');
  assert.equal(legacyValueGroup?.required, false);
  assert.equal(legacyValueGroup?.legacy, true);
  const allKeys = W145_PROTECTED_STORAGE_GROUPS.flatMap((group) => group.keys);
  for (const key of [
    'eon:api-key-vault:v2', 'eon:api-key-vault:v1', 'eon:nft-collection:v3', 'eon:market:starter-vault-receipts:v1',
    'eon:realm:state:v3', 'eon:city:world-state:v1', 'eon:city:expanse:w766a:state:v1',
    'eon:city:living-frontier-session:rt91:v1', 'eon:city:genuine-agent-theatre:w624i:v1',
    'eon:city:living-nexus:w660p:v1', 'eon:city:living-nexus:encounters:w660s:v1',
    'eon:city:command-district:v1', 'eon:city:command-hub:resume:w731:v1',
    'eon:city:accessibility-device:w624k:v1', 'eon:city:sensory-preferences:v1', 'eon:city:quality-preference:v1',
    'eon:eonbot:job-fabric:v1', 'eon:eonbot:action-receipts:v1', 'eon:settings:v1', 'eon:automation-os:v3'
  ]) {
    assert.ok(allKeys.includes(key), `missing protected key ${key}`);
  }
  assert.equal(W145_DEPLOYMENT_INVARIANTS.noBootClear, true);
  assert.equal(W145_DEPLOYMENT_INVARIANTS.noSecretManifestValues, true);
});

test('W145 simulated Cloudflare update preserves every seeded protected key byte-for-byte', () => {
  const storage = new MemoryStorage();
  const seed = seedW145ProofStorage(storage, { prefix: 'unit' });
  const manifest = simulateCloudflareAppUpdate(storage, { previousVersion: 'w141', nextVersion: 'w145' });
  assert.equal(manifest.schema, W145_UPDATE_SURVIVAL_SCHEMA);
  assert.equal(manifest.ok, true);
  assert.equal(manifest.preservedKeyCount, seed.seededKeyCount);
  assert.deepEqual(manifest.lostKeys, []);
  assert.deepEqual(manifest.changedKeys, []);
  assert.deepEqual(manifest.unexpectedNewAppKeys, []);
  assertW145UpdateSurvivalManifest(manifest);
});

test('W145 detects lost or mutated user data during an unsafe update', () => {
  const before = new MemoryStorage();
  seedW145ProofStorage(before, { prefix: 'before' });
  const after = new MemoryStorage(before.toObject());
  after.removeItem('eon:nft-collection:v3');
  after.setItem('eon:settings:v1', '{"changed":true}');
  const manifest = buildW145UpdateSurvivalManifest(before, after);
  assert.equal(manifest.ok, false);
  assert.ok(manifest.lostKeys.includes('eon:nft-collection:v3'));
  assert.ok(manifest.changedKeys.includes('eon:settings:v1'));
  assert.throws(() => assertW145UpdateSurvivalManifest(manifest), /survival failed/);
});

test('W145 receipt and status mark data survival done without exposing secrets', () => {
  const storage = new MemoryStorage();
  seedW145ProofStorage(storage, { prefix: 'secret-proof' });
  const manifest = simulateCloudflareAppUpdate(storage);
  const receipt = recordW145UpdateSurvivalReceipt(storage, { manifest });
  const status = getW145UpdateSurvivalStatus(storage);
  assert.equal(receipt.schema, W145_UPDATE_SURVIVAL_SCHEMA);
  assert.equal(receipt.ok, true);
  assert.equal(Boolean(storage.getItem(W145_UPDATE_SURVIVAL_RECEIPT_KEY)), true);
  assert.equal(status.done, true);
  assert.equal(status.receipt.ok, true);
  const serialized = JSON.stringify(receipt);
  assert.equal(serialized.includes('proof_secret_should_never_print'), false);
});

test('W145 remaining phase summary removes W145 from unfinished list', () => {
  const summary = getW145RemainingPhaseSummary();
  assert.equal(summary.dataSurvivalDone, true);
  assert.equal(summary.completedPhase, 'W145');
  assert.equal(summary.phases.some((phase) => phase.id === 'W145'), false);
  for (const id of ['W143', 'W144', 'W146', 'W147', 'W148']) {
    assert.ok(summary.phases.some((phase) => phase.id === id), `missing ${id}`);
  }
});

test('W145 Vault, EON City, package, and stats are wired', () => {
  assert.match(read('assets/js/utils/vault.js'), /w145UpdateSurvival/);
  assert.match(read('assets/js/utils/vault.js'), /recordW145UpdateSurvivalReceipt\(localStorage/);
  assert.match(read('vault.html'), /assets\/js\/vault\/eon-vault-page\.js/);
  assert.match(read('assets/js/vault/eon-vault-page.js'), /createSafeVaultBackupSummary/);
  assert.equal(fs.existsSync(path.join(root, 'assets/js/vault-page.js')), false, 'retired Vault value UI must not return to the active source tree');
  assert.match(read('assets/js/city/eon-city-2d-engine.js'), /CITY_FIRST_CIRCUIT/);
  assert.match(read('assets/js/city/eon-city-3d-model.js'), /CITY_3D_QUALITY_PRESETS/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['qa:w145-update-safe-user-data-survival']);
  const statsPath = path.join(root, 'tmp', 'evidence', 'w517-source-convergence', 'legacy-gates', 'w145-update-safe-user-data-survival-stats.json');
  if (!fs.existsSync(statsPath)) {
    fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
    execFileSync(process.execPath, [path.join(root, 'scripts', 'w145-update-safe-user-data-survival-gate.mjs')], { cwd: root, stdio: 'ignore' });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W145_UPDATE_SURVIVAL_SCHEMA);
  assert.equal(stats.score, 100);
  assert.equal(stats.dataSurvivalDone, true);
});

test('W145 summary works on partial real storage without requiring seeded demo data', () => {
  const partial = new MemoryStorage({ 'eon:api-key-vault:v1': 'cipher', 'eon:nft-collection:v3': '{"a":[{"id":"a","name":"A"}]}' });
  const summary = summarizeW145ProtectedStorage(partial);
  assert.equal(summary.schema, `${W145_UPDATE_SURVIVAL_SCHEMA}.storage-summary`);
  assert.ok(summary.protectedKeysPresent >= 2);
  assert.ok(summary.groups.some((group) => group.id === 'ai-api-keys'));
});
