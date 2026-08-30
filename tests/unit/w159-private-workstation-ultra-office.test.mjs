import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W159_PRIVATE_WORKSTATION_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };

test('W159 completes private workstation while leaving W165 planned', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(plan.plannedPhases, []);
  assert.equal(score.score, 100);
});

test('W159 private office has safe command zones, focus states, reflections, and desk props', () => {
  const plan = buildW157W165CertificationPlan({ world: buildPrivateWorkstationVoxelWorld(), quality: 'neon', device: highDevice });
  const office = plan.privateWorkstationUltraOffice;
  assert.equal(office.schema, W159_PRIVATE_WORKSTATION_SCHEMA);
  assert.equal(office.coverage.zoneCount, 8);
  assert.equal(office.coverage.monitorFocusStates, 8);
  assert.ok(office.commandWall.reflections.length >= 4);
  assert.ok(office.commandWall.deskProps.length >= 6);
  assert.ok(office.zones.every((zone) => zone.userTapRequired && zone.privateDataExcluded && zone.noAutoOpen));
});

test('W159 runtime adds private office primitives on high devices and skips low devices', () => {
  const world = buildPrivateWorkstationVoxelWorld();
  const high = createW157W165CertificationLayer({ map: world, quality: 'neon', device: highDevice });
  assert.ok(high.group, 'expected high-device office layer');
  assert.ok(high.stats.privateOfficeRuntimeObjects >= 40);
  assert.equal(high.stats.privateOfficeZoneCount, 8);
  const phaseIds = new Set();
  high.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: world, quality: 'low', device: lowTier.inputs });
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});

test('W159 safety excludes secrets and preserves launch-critical systems', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  assert.equal(plan.privateWorkstationUltraOffice.safety.privateDataExcluded, true);
  assert.equal(plan.privateWorkstationUltraOffice.safety.rawApiKeysRendered, false);
  assert.equal(plan.privateWorkstationUltraOffice.safety.seedPhrasesRendered, false);
  assert.equal(plan.privateWorkstationUltraOffice.safety.walletBackupsRendered, false);
  assert.equal(plan.privateWorkstationUltraOffice.safety.rewardCodeMutation, false);
  assert.equal(plan.privateWorkstationUltraOffice.safety.marketStarterDropMutation, false);
  assert.equal(plan.privateWorkstationUltraOffice.safety.vaultPersistenceMutation, false);
});
