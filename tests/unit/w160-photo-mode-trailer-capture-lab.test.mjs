import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W160_PHOTO_TRAILER_LAB_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };

test('W160 completes photo/trailer capture while leaving W165 planned', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(plan.plannedPhases, []);
  assert.equal(score.score, 100);
});

test('W160 photo lab has tap-gated rails, clean HUD modes, and screenshot matrix', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const lab = plan.photoTrailerLab;
  assert.equal(lab.schema, W160_PHOTO_TRAILER_LAB_SCHEMA);
  assert.equal(lab.coverage.presetCount, 8);
  assert.equal(lab.coverage.cameraRails, 8);
  assert.equal(lab.coverage.cleanHudModes, 8);
  assert.equal(lab.coverage.screenshotMatrixCells, 36);
  assert.equal(lab.coverage.founderDemoSteps, 8);
  assert.ok(lab.presets.every((preset) => preset.captureRequiresUserTap && preset.cameraRail.autoPlay === false && preset.noPrivateDataCapture));
});

test('W160 runtime adds photo primitives on high devices and skips low devices', () => {
  const world = buildPrivateWorkstationVoxelWorld();
  const high = createW157W165CertificationLayer({ map: world, quality: 'neon', device: highDevice });
  assert.ok(high.group, 'expected high-device W160 layer');
  assert.ok(high.stats.photoTrailerRuntimeObjects >= 40);
  assert.equal(high.stats.photoTrailerPresetCount, 8);
  const phaseIds = new Set();
  high.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: world, quality: 'low', device: lowTier.inputs });
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});

test('W160 photo/trailer safety preserves rewards, Market, Vault, and private data', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const safety = plan.photoTrailerLab.safety;
  assert.equal(safety.userTapRequiredForCapture, true);
  assert.equal(safety.noAutoRecording, true);
  assert.equal(safety.noAutoDownload, true);
  assert.equal(safety.noPrivateDataCapture, true);
  assert.equal(safety.rawApiKeysCaptured, false);
  assert.equal(safety.seedPhrasesCaptured, false);
  assert.equal(safety.walletBackupsCaptured, false);
  assert.equal(safety.privateChatsCaptured, false);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.vaultPersistenceMutation, false);
});
