#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { writeW517EphemeralJson } from './w517-evidence-output.mjs';

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
  simulateCloudflareAppUpdate
} from '../assets/js/utils/update-safe-user-data.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

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

const storage = new MemoryStorage();
const seed = seedW145ProofStorage(storage, { prefix: 'w145-gate' });
const before = storage.toObject();
const manifest = simulateCloudflareAppUpdate(storage, { previousVersion: 'w141', nextVersion: 'w145' });
const receipt = recordW145UpdateSurvivalReceipt(storage, { manifest });
const status = getW145UpdateSurvivalStatus(storage);
const after = storage.toObject();
const directManifest = buildW145UpdateSurvivalManifest(before, after, { simulatedFrom: 'w141', simulatedTo: 'w145' });
const remaining = getW145RemainingPhaseSummary();

try { assertW145UpdateSurvivalManifest(manifest); } catch (error) { failures.push(error instanceof Error ? error.message : String(error)); }
try { assertW145UpdateSurvivalManifest(directManifest); } catch (error) { failures.push(`direct manifest: ${error instanceof Error ? error.message : String(error)}`); }

const utility = read('assets/js/utils/update-safe-user-data.js');
const vaultJs = read('assets/js/utils/vault.js');
const vaultPageHtml = read('vault.html');
const vaultPageJs = read('assets/js/vault/eon-vault-page.js');
const city2dEngine = read('assets/js/city/eon-city-2d-engine.js');
const city3dModel = read('assets/js/city/eon-city-3d-model.js');
const packageJson = JSON.parse(read('package.json'));
const assetFiles = fs.readdirSync(path.join(root, 'assets/js'), { recursive: true })
  .filter((file) => typeof file === 'string' && file.endsWith('.js'))
  .map((file) => `assets/js/${file}`);
const destructiveAssetHits = assetFiles.flatMap((file) => {
  const text = read(file);
  const hits = [];
  if (/localStorage\.clear\s*\(/.test(text)) hits.push(`${file}: localStorage.clear`);
  if (/indexedDB\.deleteDatabase\s*\(/.test(text)) hits.push(`${file}: indexedDB.deleteDatabase`);
  return hits;
});

assert(seed.seededKeyCount >= 20, 'W145 seed did not cover enough protected user-data keys');
assert(manifest.schema === W145_UPDATE_SURVIVAL_SCHEMA, 'W145 manifest schema missing');
assert(manifest.ok === true && manifest.preservedKeyCount === seed.seededKeyCount, 'W145 simulated Cloudflare update did not preserve every seeded key');
assert(manifest.lostKeys.length === 0 && manifest.changedKeys.length === 0, 'W145 manifest reports lost or changed user data keys');
assert(manifest.unexpectedNewAppKeys.length === 0, 'W145 update wrote unexpected app-owned keys');
assert(receipt.ok === true && receipt.schema === W145_UPDATE_SURVIVAL_SCHEMA, 'W145 receipt was not recorded as ok');
assert(storage.getItem(W145_UPDATE_SURVIVAL_RECEIPT_KEY), 'W145 receipt key not stored');
assert(status.done === true && status.receipt?.ok === true, 'W145 status does not detect completed update survival receipt');
assert(W145_PROTECTED_STORAGE_GROUPS.length >= 6, 'W145 protected storage groups are incomplete');
assert(W145_DEPLOYMENT_INVARIANTS.noBootClear === true, 'W145 invariant must forbid boot-time clear');
assert(W145_DEPLOYMENT_INVARIANTS.noSecretManifestValues === true, 'W145 invariant must redact secret manifest values');
assert(remaining.dataSurvivalDone === true && !remaining.phases.some((phase) => phase.id === 'W145'), 'W145 remaining phase summary should mark data survival done and exclude W145 from unfinished phases');
assert(!remaining.phases.some((phase) => phase.id === 'W142'), 'W142 should be completed after W142 cleanup and removed from remaining phases');
assert(remaining.phases.some((phase) => phase.id === 'W143'), 'remaining phase summary missing W143');
assert(remaining.phases.some((phase) => phase.id === 'W146'), 'W145 remaining phase summary missing W146');
assert(/W145_UPDATE_SURVIVAL_SCHEMA/.test(utility), 'W145 utility missing schema export');
assert(/W145_PROTECTED_STORAGE_GROUPS/.test(utility), 'W145 utility missing protected storage registry');
assert(/simulateCloudflareAppUpdate/.test(utility), 'W145 utility missing Cloudflare update simulator');
assert(/recordW145UpdateSurvivalReceipt/.test(utility), 'W145 utility missing receipt recorder');
assert(/w145UpdateSurvival/.test(vaultJs) && /vault-export-metadata/.test(vaultJs), 'Vault export metadata does not embed W145 update-survival manifest');
assert(/recordW145UpdateSurvivalReceipt\(localStorage/.test(vaultJs), 'Vault import does not write W145 update-survival receipt');
assert(/w145UpdateSurvival: getW145UpdateSurvivalStatus/.test(vaultJs), 'Vault security summary does not expose W145 update survival status');
assert(/assets\/js\/vault\/eon-vault-page\.js/.test(vaultPageHtml), 'Current Vault HTML must load the maintained concise Vault entrypoint');
assert(/createSafeVaultBackupSummary/.test(vaultPageJs), 'Current Vault UI must retain the safe local backup-summary boundary');
assert(!fs.existsSync(path.join(root, 'assets/js/vault-page.js')), 'Retired value-bearing Vault UI must remain outside the active source tree');
assert(/CITY_FIRST_CIRCUIT/.test(city2dEngine), 'Current 2D City engine must remain present for W145 data-survival coverage.');
assert(/CITY_3D_QUALITY_PRESETS/.test(city3dModel), 'Current optional 3D model must remain present for W145 data-survival coverage.');
assert(destructiveAssetHits.length === 0, `Destructive user storage update calls found: ${destructiveAssetHits.join(', ')}`);
assert(Boolean(packageJson.scripts?.['qa:w145-update-safe-user-data-survival']), 'package.json missing W145 QA script');
// W228 retires the historical W121–W145 aggregate. Its absence is intentional: release
// certification must prove the current W145 data-survival gate directly, not require a
// deleted legacy wave bundle.
assert(!Object.prototype.hasOwnProperty.call(packageJson.scripts || {}, 'qa:w121-w145-visual-overhaul'), 'legacy W121-W145 aggregate script must remain retired');

const stats = {
  schema: W145_UPDATE_SURVIVAL_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  seededKeyCount: seed.seededKeyCount,
  protectedGroupCount: W145_PROTECTED_STORAGE_GROUPS.length,
  preservedKeyCount: manifest.preservedKeyCount,
  receiptKey: W145_UPDATE_SURVIVAL_RECEIPT_KEY,
  dataSurvivalDone: true,
  remainingPhases: remaining.phases,
  destructiveAssetHits,
  manifest,
  receipt,
  failures
};
const evidencePath = writeW517EphemeralJson('legacy-gates/w145-update-safe-user-data-survival-stats.json', stats, { root });

if (failures.length) {
  console.error('[W145] Cloudflare update-safe user-data survival proof failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W145] Cloudflare update-safe user-data survival proof passed (${stats.score}/100): ${stats.preservedKeyCount}/${stats.seededKeyCount} protected local keys preserved, ${stats.protectedGroupCount} groups covered. Local receipt: ${evidencePath}`);
