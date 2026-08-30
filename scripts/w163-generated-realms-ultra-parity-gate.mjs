import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W163_GENERATED_REALMS_ULTRA_PARITY_SCHEMA,
  buildW157W165CertificationPlan,
  createW157W165CertificationLayer,
  recordW157W165CertificationReceipt,
  resolveW157W165CertificationTier,
  scoreW157W165CertificationPlan
} from '../assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js';

const failures = [];
const check = (label, fn) => {
  try { fn(); }
  catch (error) { failures.push(`${label}: ${error.message}`); }
};
const read = (path) => fs.readFileSync(path, 'utf8');

const device = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };
const eonCity = buildEonCityVoxelWorld();
const myRealm = buildMyRealmVoxelWorld({ username: 'operator', seed: 'w163-parity' });
const office = buildPrivateWorkstationVoxelWorld();
const cityPlan = buildW157W165CertificationPlan({ world: eonCity, quality: 'neon', device });
const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon', device });
const officePlan = buildW157W165CertificationPlan({ world: office, quality: 'neon', device });
const cityScore = scoreW157W165CertificationPlan(cityPlan);
const realmScore = scoreW157W165CertificationPlan(realmPlan);
const ultraLayer = createW157W165CertificationLayer({ map: myRealm, quality: 'neon', device });
const cityLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'neon', device });
const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
const lowLayer = createW157W165CertificationLayer({ map: myRealm, quality: 'low', device: lowTier.inputs });

check('schema is W157/W163 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W163 generated realm parity schema is exported', () => assert.equal(W163_GENERATED_REALMS_ULTRA_PARITY_SCHEMA, 'eon.realm3d.w163.generated-realms-ultra-parity.v1'));
check('W157 through W165 are complete; no planned phases remain', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('city and generated realm scores are 100', () => {
  assert.equal(cityScore.score, 100);
  assert.equal(realmScore.score, 100);
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
});
check('W163 plan has premium templates, parity bridges, owner surfaces, low-device variants, and proof cells', () => {
  const parity = realmPlan.generatedRealmUltraParity;
  assert.equal(parity.schema, W163_GENERATED_REALMS_ULTRA_PARITY_SCHEMA);
  assert.equal(parity.coverage.premiumTemplates, 8);
  assert.equal(parity.coverage.templateParityBridges, 10);
  assert.equal(parity.coverage.ownerValueSurfaces, 8);
  assert.equal(parity.coverage.lowDeviceVariants, 8);
  assert.equal(parity.coverage.generationProofMatrixCells, 32);
  assert.equal(parity.coverage.templatesWithCityEquivalent, 8);
  assert.equal(parity.coverage.templatesWithOwnerSurfaces, 8);
  assert.equal(parity.coverage.templatesWithLowDeviceFallback, 8);
  assert.equal(parity.coverage.bridgesWithBacktrack, 10);
  assert.equal(parity.coverage.proofCellsSecretSafe, 32);
});
check('W163 generated realm safety boundary stays intact', () => {
  const safety = realmPlan.generatedRealmUltraParity.safety;
  assert.equal(safety.safeTemplatesOnly, true);
  assert.equal(safety.noArbitraryHtml, true);
  assert.equal(safety.noUploadsRequired, true);
  assert.equal(safety.noPrivateDataCapture, true);
  assert.equal(safety.noSecretRender, true);
  assert.equal(safety.userTapRequiredForTravel, true);
  assert.equal(safety.noAutoNavigation, true);
  assert.equal(safety.noAutoAd, true);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.vaultPersistenceMutation, false);
  assert.equal(safety.nftInventoryMutation, false);
  assert.equal(safety.entitlementMutation, false);
});
check('W163 templates all have city parity, owner surfaces, and safe fallbacks', () => {
  for (const template of realmPlan.generatedRealmUltraParity.realmParityTemplates) {
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
check('W163 owner value surfaces are display-only and wallet-redacted', () => {
  const ownerSurfaces = realmPlan.generatedRealmUltraParity.ownerValueSurfaces;
  assert.equal(ownerSurfaces.length, 8);
  assert.ok(ownerSurfaces.some((surface) => surface.platformFeeCopyVisible === true));
  for (const surface of ownerSurfaces) {
    assert.equal(surface.ownerWalletRedacted, true, surface.id);
    assert.equal(surface.payoutPromise, false, surface.id);
    assert.equal(surface.saleEntitlementMutation, false, surface.id);
    assert.equal(surface.safePublicSurface, true, surface.id);
  }
});
check('runtime creates W163 primitives only on high devices', () => {
  assert.ok(ultraLayer.group, 'expected high-device W163 layer');
  assert.ok(ultraLayer.stats.objectCount >= 350, `runtime object count too low: ${ultraLayer.stats.objectCount}`);
  assert.equal(ultraLayer.stats.generatedRealmParityTemplateCount, 8);
  assert.equal(ultraLayer.stats.templateParityBridgeCount, 10);
  assert.equal(ultraLayer.stats.ownerValueSurfaceCount, 8);
  assert.equal(ultraLayer.stats.lowDeviceVariantCount, 8);
  assert.equal(ultraLayer.stats.generationProofMatrixCells, 32);
  assert.ok(ultraLayer.stats.generatedRealmRuntimeObjects >= 48);
  assert.equal(ultraLayer.stats.mobileHeavyMeshes, 0);
  assert.ok(cityLayer.stats.generatedRealmRuntimeObjects >= 48);
  const phaseIds = new Set();
  ultraLayer.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('low-device tier skips W163 heavy runtime and keeps static fallback', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('receipt records W163 without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: realmPlan, score: realmScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.generatedRealmParityTemplates, 8);
  assert.equal(receipt.generatedRealmParityBridges, 10);
  assert.equal(receipt.generatedRealmOwnerValueSurfaces, 8);
  assert.equal(receipt.generatedRealmLowDeviceVariants, 8);
  assert.equal(receipt.generatedRealmProofCells, 32);
  assert.equal(receipt.generatedRealmsSafeTemplatesOnly, true);
  assert.equal(receipt.generatedRealmsNoArbitraryHtml, true);
  assert.equal(receipt.generatedRealmsNoPrivateDataCapture, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page and proof module expose W163 markers', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(panels, /W163 generated realm parity safety/);
  assert.match(proof, /w163GeneratedRealmsUltraParity/);
  assert.match(proof, /w163SafeTemplatesOnly/);
});
check('W150 Telegram/Monetag hardening stays bundled', () => {
  const telegram = read('telegram.html');
  const reward = read('reward-access.html');
  const redirects = read('_redirects');
  assert.match(telegram, /No ad starts automatically/i);
  assert.match(reward, /Watch rewarded ad/i);
  assert.doesNotMatch(redirects, /\/telegram\s+\/telegram\.html\s+200/);
  assert.doesNotMatch(redirects, /\/reward-access\s+\/reward-access\.html\s+200/);
  assert.match(redirects, /Do not add explicit rewrites here or production can loop/i);
});
check('W163 code does not touch Monetag, starter NFT, Vault, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W163 Generated Realms Ultra Parity gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/W163_GENERATED_REALMS_ULTRA_PARITY_STATS_2026-06-14.json', `${JSON.stringify({
  schema: 'eon.qa.w163.generated-realms-ultra-parity.stats.v1',
  ok: true,
  completedPhases: realmPlan.completedPhases,
  plannedPhases: realmPlan.plannedPhases,
  premiumTemplates: realmPlan.generatedRealmUltraParity.coverage.premiumTemplates,
  templateParityBridges: realmPlan.generatedRealmUltraParity.coverage.templateParityBridges,
  ownerValueSurfaces: realmPlan.generatedRealmUltraParity.coverage.ownerValueSurfaces,
  lowDeviceVariants: realmPlan.generatedRealmUltraParity.coverage.lowDeviceVariants,
  generationProofMatrixCells: realmPlan.generatedRealmUltraParity.coverage.generationProofMatrixCells,
  runtimeObjects: ultraLayer.stats.objectCount,
  w163RuntimeObjects: ultraLayer.stats.generatedRealmRuntimeObjects,
  mobileHeavyMeshes: lowLayer.stats.mobileHeavyMeshes,
  safety: realmPlan.generatedRealmUltraParity.safety
}, null, 2)}\n`);

console.log('W163 Generated Realms Ultra Parity gate passed: 14/14');
console.log(`Completed phases: ${realmPlan.completedPhases.join(', ')}`);
console.log(`Premium generated realm templates: ${realmPlan.generatedRealmUltraParity.coverage.premiumTemplates}`);
console.log(`Template parity bridges: ${realmPlan.generatedRealmUltraParity.coverage.templateParityBridges}`);
console.log(`Owner value surfaces: ${realmPlan.generatedRealmUltraParity.coverage.ownerValueSurfaces}`);
console.log(`Low-device variants: ${realmPlan.generatedRealmUltraParity.coverage.lowDeviceVariants}`);
console.log(`Generation proof matrix cells: ${realmPlan.generatedRealmUltraParity.coverage.generationProofMatrixCells}`);
console.log(`Runtime objects: ${ultraLayer.stats.objectCount}`);
console.log(`W163 runtime objects: ${ultraLayer.stats.generatedRealmRuntimeObjects}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${realmPlan.plannedPhases.join(', ') || 'none'}`);
