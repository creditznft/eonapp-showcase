import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEonCityVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

test('W157 district landmark plan remains complete after W165 cumulative pass', () => {
  const world = buildEonCityVoxelWorld();
  const plan = buildW157W165CertificationPlan({ world, quality: 'neon' });
  const score = scoreW157W165CertificationPlan(plan);
  assert.equal(plan.schema, W157_W165_CERTIFICATION_SCHEMA);
  assert.ok(plan.completedPhases.includes('W157'));
  assert.ok(plan.completedPhases.includes('W158'));
  assert.ok(plan.completedPhases.includes('W159'));
  assert.ok(plan.completedPhases.includes('W160'));
  assert.equal(plan.plannedPhases.length, 0);
  assert.equal(score.ok, true);
  assert.equal(score.score, 100);
});

test('W157 landmarks are routed, readable, unique, and tap-only', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon' });
  assert.ok(plan.landmarkSculpt.length >= 10);
  assert.ok(plan.districtCoverage.uniqueSilhouettes >= 10);
  assert.ok(plan.landmarkSculpt.every((landmark) => landmark.hasReadableSignage));
  assert.ok(plan.landmarkSculpt.every((landmark) => landmark.hasUserTapTarget && landmark.noAutoNavigation));
  assert.ok(plan.landmarkSculpt.every((landmark) => landmark.lowDeviceProxy.includes('sign')));
});

test('W157 runtime adds landmark-only objects on high devices and skips heavy meshes on low devices', () => {
  const world = buildEonCityVoxelWorld();
  const high = createW157W165CertificationLayer({ map: world, quality: 'neon', device: { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 } });
  assert.ok(high.group);
  assert.ok(high.stats.objectCount >= 40);
  assert.equal(high.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  high.group.traverse((object) => {
    if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId);
  });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: world, quality: 'low', device: lowTier.inputs });
  assert.equal(lowTier.enabled, false);
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});
