import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W165_FINAL_GAMER_POWER_USER_CERTIFICATION_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };

test('W165 completes final gamer/power-user certification with no planned phases remaining', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(plan.plannedPhases, []);
  assert.equal(score.score, 100);
});

test('W165 final certification includes routes, button truth, accessibility, power-user surfaces, and proof cells', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator', seed: 'w165' }), quality: 'neon', device: highDevice });
  const final = plan.finalGamerPowerUserCertification;
  assert.equal(final.schema, W165_FINAL_GAMER_POWER_USER_CERTIFICATION_SCHEMA);
  assert.equal(final.coverage.certifiedRoutes, 10);
  assert.equal(final.coverage.buttonTruthGroups, 12);
  assert.equal(final.coverage.deadButtonGroups, 0);
  assert.equal(final.coverage.accessibilityCheckpoints, 8);
  assert.equal(final.coverage.powerUserSurfaces, 8);
  assert.equal(final.coverage.launchSafetyInvariants, 8);
  assert.equal(final.coverage.finalProofMatrixCells, 32);
  assert.equal(final.coverage.mobileHeavyMeshes, 0);
});

test('W165 final certification safety preserves rewards, Market starter drops, Vault, NFTs, keys, receipts, backups, and entitlements', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const safety = plan.finalGamerPowerUserCertification.safety;
  assert.equal(safety.userDataMutation, false);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.vaultPersistenceMutation, false);
  assert.equal(safety.nftInventoryMutation, false);
  assert.equal(safety.apiKeyVaultMutation, false);
  assert.equal(safety.receiptMutation, false);
  assert.equal(safety.entitlementMutation, false);
  assert.equal(safety.backupMutation, false);
  assert.equal(safety.noAutoAd, true);
  assert.equal(safety.noAutoRecording, true);
  assert.equal(safety.noAutoNavigation, true);
  assert.equal(safety.noPrivateDataCapture, true);
  assert.equal(safety.noSecretRender, true);
});

test('W165 route cards are tap-gated and accessible', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  for (const route of plan.finalGamerPowerUserCertification.finalRouteCertifications) {
    assert.equal(route.hasVisiblePrimaryAction, true, route.id);
    assert.equal(route.hasVisibleBackPath, true, route.id);
    assert.equal(route.userTapRequired, true, route.id);
    assert.equal(route.noAutoNavigation, true, route.id);
    assert.equal(route.noAutoAd, true, route.id);
    assert.equal(route.noAutoRecording, true, route.id);
  }
});

test('W165 runtime adds primitive certification objects on high devices and skips low devices', () => {
  const high = createW157W165CertificationLayer({ map: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  assert.ok(high.group, 'expected high-device W165 layer');
  assert.ok(high.stats.finalCertificationRuntimeObjects >= 50);
  assert.equal(high.stats.finalCertifiedRouteCount, 10);
  assert.equal(high.stats.buttonTruthGroupCount, 12);
  assert.equal(high.stats.accessibilityCheckpointCount, 8);
  assert.equal(high.stats.powerUserSurfaceCount, 8);
  assert.equal(high.stats.launchSafetyInvariantCount, 8);
  assert.equal(high.stats.finalProofMatrixCells, 32);
  assert.equal(high.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  high.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: buildPrivateWorkstationVoxelWorld(), quality: 'low', device: lowTier.inputs });
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});

test('W165 final certification applies to EON City, My Realm, and Private Workstation plans', () => {
  for (const world of [buildEonCityVoxelWorld(), buildMyRealmVoxelWorld({ username: 'operator' }), buildPrivateWorkstationVoxelWorld()]) {
    const plan = buildW157W165CertificationPlan({ world, quality: 'neon', device: highDevice });
    assert.equal(scoreW157W165CertificationPlan(plan).score, 100);
    assert.equal(plan.finalGamerPowerUserCertification.coverage.certifiedRoutes, 10);
    assert.equal(plan.finalGamerPowerUserCertification.safety.noAutoAd, true);
    assert.equal(plan.finalGamerPowerUserCertification.safety.vaultPersistenceMutation, false);
  }
});
