import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEonCityVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W158_NPC_IDENTITY_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

test('W158 remains complete after W159 while leaving W165 planned', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon' });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.equal(plan.plannedPhases.length, 0);
  assert.equal(score.ok, true);
  assert.equal(score.score, 100);
});

test('W158 NPC identities have readable faces, roles, loops, and safe voice policy', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon' });
  assert.ok(plan.npcIdentities.length >= 12);
  assert.ok(plan.npcIdentityCoverage.families >= 4);
  assert.ok(plan.npcIdentityCoverage.idleLoops >= 4);
  assert.ok(plan.npcIdentityCoverage.gestureLoops >= 4);
  assert.ok(plan.npcIdentities.every((npc) => npc.schema === W158_NPC_IDENTITY_SCHEMA));
  assert.ok(plan.npcIdentities.every((npc) => npc.readableFace && npc.faceRig && npc.costumeSilhouette));
  assert.ok(plan.npcIdentities.every((npc) => npc.voicePolicy.voiceOffByDefault && npc.voicePolicy.microphoneStartsOnlyAfterTap));
  assert.ok(plan.npcIdentities.every((npc) => npc.safety.noApiKeys && npc.safety.noSeedPhrases && npc.safety.noWalletBackups && npc.safety.noFinancialPromises));
});

test('W158 runtime adds identity rigs only on high devices and preserves low-device safety', () => {
  const world = buildEonCityVoxelWorld();
  const high = createW157W165CertificationLayer({ map: world, quality: 'neon', device: { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 } });
  assert.ok(high.group);
  assert.ok(high.stats.objectCount >= 120);
  assert.ok(high.stats.npcIdentityCount >= 12);
  assert.ok(high.stats.socialCircleCount >= 10);
  assert.ok(high.stats.gestureLoopCount >= 10);
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
