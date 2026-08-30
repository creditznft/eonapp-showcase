import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W161_LIGHTING_WEATHER_AUDIO_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };

test('W161 completes atmosphere polish while leaving W165 planned', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(plan.plannedPhases, []);
  assert.equal(score.score, 100);
});

test('W161 atmosphere has time-of-day moods, weather overlays, and audio cues', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const atmosphere = plan.lightingWeatherAudioPolish;
  assert.equal(atmosphere.schema, W161_LIGHTING_WEATHER_AUDIO_SCHEMA);
  assert.equal(atmosphere.coverage.moodCount, 8);
  assert.equal(atmosphere.coverage.weatherProfiles, 8);
  assert.equal(atmosphere.coverage.ambientLoops, 8);
  assert.ok(atmosphere.coverage.districtLightRigs >= 10);
  assert.equal(atmosphere.coverage.reducedMotionFallbacks, 8);
  assert.equal(atmosphere.coverage.tapGatedAudioCues, 8);
});

test('W161 audio remains opt-in with text fallback and no mic autostart', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const safety = plan.lightingWeatherAudioPolish.safety;
  assert.equal(safety.userTapRequiredForAudio, true);
  assert.equal(safety.mutedByDefault, true);
  assert.equal(safety.noAutoplayAudio, true);
  assert.equal(safety.noMicrophoneAutostart, true);
  assert.equal(safety.voiceOffByDefault, true);
  assert.equal(safety.textFallbackAlwaysAvailable, true);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.vaultPersistenceMutation, false);
});

test('W161 runtime adds primitive atmosphere objects on high devices and skips low devices', () => {
  const world = buildPrivateWorkstationVoxelWorld();
  const high = createW157W165CertificationLayer({ map: world, quality: 'neon', device: highDevice });
  assert.ok(high.group, 'expected high-device W161 layer');
  assert.ok(high.stats.lightingWeatherRuntimeObjects >= 40);
  assert.equal(high.stats.lightingWeatherMoodCount, 8);
  const phaseIds = new Set();
  high.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: world, quality: 'low', device: lowTier.inputs });
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});
