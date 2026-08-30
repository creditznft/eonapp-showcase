import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W163_GENERATED_REALMS_ULTRA_PARITY_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };

test('W163 completes generated realms ultra parity while leaving W165 planned', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  const score = scoreW157W165CertificationPlan(plan);
  assert.deepEqual(plan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(plan.plannedPhases, []);
  assert.equal(score.score, 100);
});

test('W163 generated realms inherit premium templates, owner surfaces, and low-device variants', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator', seed: 'w163' }), quality: 'neon', device: highDevice });
  const parity = plan.generatedRealmUltraParity;
  assert.equal(parity.schema, W163_GENERATED_REALMS_ULTRA_PARITY_SCHEMA);
  assert.equal(parity.coverage.premiumTemplates, 8);
  assert.equal(parity.coverage.templateParityBridges, 10);
  assert.equal(parity.coverage.ownerValueSurfaces, 8);
  assert.equal(parity.coverage.lowDeviceVariants, 8);
  assert.equal(parity.coverage.generationProofMatrixCells, 32);
  assert.equal(parity.coverage.templatesWithCityEquivalent, 8);
  assert.equal(parity.coverage.templatesWithOwnerSurfaces, 8);
  assert.equal(parity.coverage.templatesWithLowDeviceFallback, 8);
});

test('W163 parity templates are safe-template only and do not mutate rewards, market, vault, or entitlements', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  for (const template of plan.generatedRealmUltraParity.realmParityTemplates) {
    assert.equal(template.premiumTemplateParity, true, template.id);
    assert.equal(template.usesSafeTemplateOnly, true, template.id);
    assert.equal(template.noArbitraryHtml, true, template.id);
    assert.equal(template.noUploadsRequired, true, template.id);
    assert.equal(template.noPrivateDataCapture, true, template.id);
    assert.equal(template.noRewardMutation, true, template.id);
    assert.equal(template.noMarketMutation, true, template.id);
    assert.equal(template.noVaultMutation, true, template.id);
    assert.equal(template.noEntitlementMutation, true, template.id);
    assert.ok(template.cityEquivalentLabel.length > 4, template.id);
    assert.ok(template.lowDeviceFallback.length > 8, template.id);
  }
});

test('W163 owner value surfaces are proof UI only, not payout or entitlement mutations', () => {
  const plan = buildW157W165CertificationPlan({ world: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  const ownerSurfaces = plan.generatedRealmUltraParity.ownerValueSurfaces;
  assert.equal(ownerSurfaces.length, 8);
  assert.ok(ownerSurfaces.some((surface) => surface.platformFeeCopyVisible === true));
  for (const surface of ownerSurfaces) {
    assert.equal(surface.ownerWalletRedacted, true, surface.id);
    assert.equal(surface.payoutPromise, false, surface.id);
    assert.equal(surface.saleEntitlementMutation, false, surface.id);
    assert.equal(surface.noRewardMutation, true, surface.id);
    assert.equal(surface.noVaultMutation, true, surface.id);
  }
});

test('W163 runtime adds primitive parity objects on high devices and skips low devices', () => {
  const high = createW157W165CertificationLayer({ map: buildMyRealmVoxelWorld({ username: 'operator' }), quality: 'neon', device: highDevice });
  assert.ok(high.group, 'expected high-device W163 layer');
  assert.ok(high.stats.generatedRealmRuntimeObjects >= 48);
  assert.equal(high.stats.generatedRealmParityTemplateCount, 8);
  assert.equal(high.stats.ownerValueSurfaceCount, 8);
  assert.equal(high.stats.lowDeviceVariantCount, 8);
  assert.equal(high.stats.generationProofMatrixCells, 32);
  assert.equal(high.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  high.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);

  const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
  const low = createW157W165CertificationLayer({ map: buildPrivateWorkstationVoxelWorld(), quality: 'low', device: lowTier.inputs });
  assert.equal(low.group, null);
  assert.equal(low.stats.mobileHeavyMeshes, 0);
});

test('W163 parity applies to EON City, My Realm, and Private Workstation plans', () => {
  for (const world of [buildEonCityVoxelWorld(), buildMyRealmVoxelWorld({ username: 'operator' }), buildPrivateWorkstationVoxelWorld()]) {
    const plan = buildW157W165CertificationPlan({ world, quality: 'neon', device: highDevice });
    assert.equal(scoreW157W165CertificationPlan(plan).score, 100);
    assert.equal(plan.generatedRealmUltraParity.coverage.premiumTemplates, 8);
    assert.equal(plan.generatedRealmUltraParity.safety.safeTemplatesOnly, true);
    assert.equal(plan.generatedRealmUltraParity.safety.entitlementMutation, false);
  }
});
