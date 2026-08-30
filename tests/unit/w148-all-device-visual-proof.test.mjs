import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY,
  W148_ALL_DEVICE_VISUAL_PROOF_SCHEMA,
  W148_DEVICE_PROFILES,
  buildW148AllDeviceVisualProofLab,
  buildW148GeneratedRealmQualityParity,
  getW148FinalPhaseSummary,
  recordW148AllDeviceVisualProofReceipt,
  scoreW148AllDeviceVisualProofLab
} from '../../assets/js/realm3d/engine/EonCityW148AllDeviceVisualProofRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.get(String(key)) || null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

test('W148 device matrix protects constrained devices and enables desktop AAA', () => {
  const city = buildEonCityVoxelWorld();
  const plan = buildW148AllDeviceVisualProofLab({ worldKind: city.kind, world: city });
  const score = scoreW148AllDeviceVisualProofLab(plan);
  assert.equal(plan.schema, W148_ALL_DEVICE_VISUAL_PROOF_SCHEMA);
  assert.equal(score.score, 100);
  assert.equal(score.ok, true);
  assert.ok(W148_DEVICE_PROFILES.length >= 7);
  assert.equal(plan.devicePolicies.lowPhoneProtected, true);
  assert.equal(plan.devicePolicies.reducedMotionProtected, true);
  assert.equal(plan.devicePolicies.saveDataProtected, true);
  assert.equal(plan.devicePolicies.highDesktopAaaEnabled, true);
  assert.equal(plan.devicePolicies.mobileHeavyMeshes, 0);
});

test('W148 certifies My Realm as EON City-quality generated world', () => {
  const city = buildEonCityVoxelWorld();
  const realm = buildMyRealmVoxelWorld({ username: 'unit', seed: 'w148' });
  const parity = buildW148GeneratedRealmQualityParity({ realmWorld: realm, cityWorld: city });
  const plan = buildW148AllDeviceVisualProofLab({ worldKind: realm.kind, world: realm, cityReferenceWorld: city });
  const score = scoreW148AllDeviceVisualProofLab(plan);
  assert.equal(parity.score, 100);
  assert.equal(parity.ok, true);
  assert.equal(score.score, 100);
  assert.equal(realm.eonCityQualityGeneratedRealm, true);
  assert.ok(realm.workstationScreens.length >= 10);
  assert.ok(realm.districts.length >= 7);
  assert.ok(realm.npcs.length >= 6);
  assert.match(realm.realmGeneratorV2.w148EonCityQualityBridge.target, /EON City-quality/);
});

test('W148 receipt is safe, deterministic, and local', () => {
  const realm = buildMyRealmVoxelWorld({ username: 'receipt', seed: 'w148' });
  const plan = buildW148AllDeviceVisualProofLab({ worldKind: realm.kind, world: realm, cityReferenceWorld: buildEonCityVoxelWorld() });
  const score = scoreW148AllDeviceVisualProofLab(plan);
  const storage = new MemoryStorage();
  const receipt = recordW148AllDeviceVisualProofReceipt(storage, { plan, score });
  assert.equal(receipt.key, W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.secretValuesIncluded, false);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.noFinancialPromises, true);
  assert.equal(Boolean(storage.getItem(W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY)), true);
});

test('W148 engine, panel, route, generator, CSS, and package scripts are wired', () => {
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /realmAllDeviceProofSession\s*=\s*'w148'/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /getW148AllDeviceVisualProofState/);
  assert.match(read('assets/js/realm3d/engine/WorldPanels.js'), /data-w148-all-device-visual-proof="true"/);
  assert.match(read('assets/js/realm3d/engine/VoxelWorld.js'), /w148AllDeviceVisualProof/);
  assert.match(read('assets/js/realm3d/engine/EonCityRealmGeneratorV2.js'), /w148EonCityQualityBridge/);
  assert.match(read('assets/css/realm3d.css'), /W148 EON City all-device visual proof lab/);
  assert.match(read('realm.html'), /w148-all-device-proof-lab\.js/);
  assert.match(read('realm.html'), /data-w148-proof-status/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['qa:w148-all-device-visual-proof']);
  assert.ok(pkg.scripts['qa:w121-w148-visual-overhaul']);
  assert.ok(pkg.scripts['qa:final-codex-merge-handoff']);
});

test('W148 is final today-phase summary with no remaining recommended phases', () => {
  const summary = getW148FinalPhaseSummary();
  assert.equal(summary.completedPhase, 'W148');
  assert.equal(summary.allDeviceVisualProofDone, true);
  assert.deepEqual(summary.remainingPhases, []);
  assert.ok(summary.todayPhasesDone.includes('W142'));
  assert.ok(summary.todayPhasesDone.includes('W148'));
});

test('W148 generated stats prove completion after gate runs', () => {
  const statsPath = path.join(root, 'artifacts', 'W148_ALL_DEVICE_VISUAL_PROOF_STATS_2026-06-13.json');
  if (!fs.existsSync(statsPath)) return;
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W148_ALL_DEVICE_VISUAL_PROOF_SCHEMA);
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
  assert.equal(stats.receiptKey, W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY);
});
