import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W162_GAMEPLAY_CLARITY_ONBOARDING_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };

test('W162 completes gameplay clarity while leaving W165 planned', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(plan.plannedPhases, []);
  assert.equal(score.score, 100);
});

test('W162 onboarding has next-action cards, teleports, minimap pins, checklist, and controls', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const clarity = plan.gameplayClarityOnboarding;
  assert.equal(clarity.schema, W162_GAMEPLAY_CLARITY_ONBOARDING_SCHEMA);
  assert.equal(clarity.coverage.clarityCards, 10);
  assert.equal(clarity.coverage.roomTeleportEntries, 10);
  assert.equal(clarity.coverage.minimapPins, 10);
  assert.equal(clarity.coverage.onboardingChecklistSteps, 8);
  assert.equal(clarity.coverage.controlHints, 8);
  assert.equal(clarity.coverage.noDeadInteractions, 10);
  assert.equal(clarity.coverage.tapTargetSafeCards, 10);
});

test('W162 cards make action choice obvious and remain tap-gated', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  for (const card of plan.gameplayClarityOnboarding.clarityCards) {
    assert.equal(card.onePrimaryAction, true);
    assert.equal(card.noDeadInteraction, true);
    assert.equal(card.hasBacktrack, true);
    assert.equal(card.hasRoomTeleportCopy, true);
    assert.equal(card.noAutoNavigation, true);
    assert.ok(card.accessibleTapTargetPx >= 48);
    assert.ok(card.routeBreadcrumbs.length >= 3);
    assert.ok(card.visibleCopy.includes(card.nextAction));
  }
});

test('W162 safety keeps rewards, market, vault, audio, and navigation user-tap only', () => {
  const plan = buildW157W165CertificationPlan({ world: buildEonCityVoxelWorld(), quality: 'neon', device: highDevice });
  const safety = plan.gameplayClarityOnboarding.safety;
  assert.equal(safety.userTapRequiredForNavigation, true);
  assert.equal(safety.noAutoNavigation, true);
  assert.equal(safety.noSilentRedirect, true);
  assert.equal(safety.noDeadEnds, true);
  assert.equal(safety.noAutoplayAudio, true);
  assert.equal(safety.noMicrophoneAutostart, true);
  assert.equal(safety.noAutoAd, true);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.vaultPersistenceMutation, false);
});

test('W162 runtime adds primitive clarity objects on high devices and skips low devices', () => {
  const world = buildPrivateWorkstationVoxelWorld();
  const high = createW157W165CertificationLayer({ map: world, quality: 'neon', device: highDevice });
  assert.ok(high.group, 'expected high-device W162 layer');
  assert.ok(high.stats.gameplayClarityRuntimeObjects >= 50);
  assert.equal(high.stats.gameplayClarityCardCount, 10);
  assert.equal(high.stats.roomTeleportClarityCount, 10);
  assert.equal(high.stats.minimapPinCount, 10);
  const phaseIds = new Set();
  high.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: world, quality: 'low', device: lowTier.inputs });
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});
