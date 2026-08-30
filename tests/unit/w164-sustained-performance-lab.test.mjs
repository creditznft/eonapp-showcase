import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W164_SUSTAINED_PERFORMANCE_LAB_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };

test('W164 completes sustained performance lab with no planned phases remaining', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(plan.plannedPhases, []);
  assert.equal(score.score, 100);
});

test('W164 performance lab includes profiles, guardrails, cleanup gates, rules, and long-session cells', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator', seed: 'w164' }), quality: 'neon', device: highDevice });
  const lab = plan.sustainedPerformanceLab;
  assert.equal(lab.schema, W164_SUSTAINED_PERFORMANCE_LAB_SCHEMA);
  assert.equal(lab.coverage.performanceProfiles, 8);
  assert.equal(lab.coverage.thermalGuardrails, 8);
  assert.equal(lab.coverage.memoryCleanupGates, 8);
  assert.equal(lab.coverage.adaptiveQualityRules, 10);
  assert.equal(lab.coverage.longSessionProofCells, 32);
  assert.equal(lab.coverage.mobileHeavyMeshes, 0);
});

test('W164 cleanup gates are non-destructive and preserve all user-side storage categories', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  for (const gate of plan.sustainedPerformanceLab.memoryCleanupGates) {
    assert.equal(gate.nonDestructive, true, gate.id);
    assert.equal(gate.deletesLocalStorage, false, gate.id);
    assert.equal(gate.deletesIndexedDb, false, gate.id);
    assert.equal(gate.deletesVaultData, false, gate.id);
    assert.equal(gate.deletesNfts, false, gate.id);
    assert.equal(gate.deletesApiKeys, false, gate.id);
    assert.equal(gate.deletesReceipts, false, gate.id);
    assert.equal(gate.deletesBackups, false, gate.id);
    assert.equal(gate.deletesEntitlements, false, gate.id);
  }
});

test('W164 performance safety does not mutate rewards, Market starter drops, Vault, NFTs, keys, receipts, backups, or entitlements', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  const safety = plan.sustainedPerformanceLab.safety;
  assert.equal(safety.userDataMutation, false);
  assert.equal(safety.destructiveStorageCleanup, false);
  assert.equal(safety.localStorageRemoveItem, false);
  assert.equal(safety.indexedDbDeleteDatabase, false);
  assert.equal(safety.vaultPersistenceMutation, false);
  assert.equal(safety.nftInventoryMutation, false);
  assert.equal(safety.apiKeyVaultMutation, false);
  assert.equal(safety.receiptMutation, false);
  assert.equal(safety.entitlementMutation, false);
  assert.equal(safety.backupMutation, false);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.noBenchmarkUpload, true);
  assert.equal(safety.noRawIpTelemetry, true);
});

test('W164 runtime adds primitive sustained-performance objects on high devices and skips low devices', () => {
  const high = createW157W165CertificationLayer({ map: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  assert.ok(high.group, 'expected high-device W164 layer');
  assert.ok(high.stats.sustainedPerformanceRuntimeObjects >= 48);
  assert.equal(high.stats.performanceProfileCount, 8);
  assert.equal(high.stats.thermalGuardrailCount, 8);
  assert.equal(high.stats.memoryCleanupGateCount, 8);
  assert.equal(high.stats.adaptiveQualityRuleCount, 10);
  assert.equal(high.stats.longSessionProofCellCount, 32);
  assert.equal(high.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  high.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: buildPrivateWorkstationVoxelWorld(), quality: 'low', device: lowTier.inputs });
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});

test('W164 performance lab applies to EON City, My Realm, and Private Workstation plans', () => {
  for (const world of [buildEonCityVoxelWorld(), buildMyRealmVoxelWorld({ username: 'operator' }), buildPrivateWorkstationVoxelWorld()]) {
    const plan = buildW157W165CertificationPlan({ world, quality: 'neon', device: highDevice });
    assert.equal(scoreW157W165CertificationPlan(plan).score, 100);
    assert.equal(plan.sustainedPerformanceLab.coverage.performanceProfiles, 8);
    assert.equal(plan.sustainedPerformanceLab.coverage.mobileHeavyMeshes, 0);
    assert.equal(plan.sustainedPerformanceLab.safety.destructiveStorageCleanup, false);
  }
});
