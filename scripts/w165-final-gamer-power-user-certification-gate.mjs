import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W165_FINAL_GAMER_POWER_USER_CERTIFICATION_SCHEMA,
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

const highDevice = { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 };
const city = buildEonCityVoxelWorld();
const myRealm = buildMyRealmVoxelWorld({ username: 'operator', seed: 'w165-final-certification' });
const office = buildPrivateWorkstationVoxelWorld();
const cityPlan = buildW157W165CertificationPlan({ world: city, quality: 'neon', device: highDevice });
const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon', device: highDevice });
const officePlan = buildW157W165CertificationPlan({ world: office, quality: 'neon', device: highDevice });
const cityScore = scoreW157W165CertificationPlan(cityPlan);
const realmScore = scoreW157W165CertificationPlan(realmPlan);
const highLayer = createW157W165CertificationLayer({ map: myRealm, quality: 'neon', device: highDevice });
const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
const lowLayer = createW157W165CertificationLayer({ map: myRealm, quality: 'low', device: lowTier.inputs });

check('schema is W157/W165 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W165 final certification schema is exported', () => assert.equal(W165_FINAL_GAMER_POWER_USER_CERTIFICATION_SCHEMA, 'eon.realm3d.w165.final-gamer-power-user-certification.v1'));
check('W157 through W165 are complete with no planned phases remaining', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('city, generated realm, and private workstation scores are 100', () => {
  assert.equal(cityScore.score, 100);
  assert.equal(realmScore.score, 100);
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
});
check('W165 final certification includes full gamer and power-user proof coverage', () => {
  const final = realmPlan.finalGamerPowerUserCertification;
  assert.equal(final.schema, W165_FINAL_GAMER_POWER_USER_CERTIFICATION_SCHEMA);
  assert.equal(final.coverage.certifiedRoutes, 10);
  assert.equal(final.coverage.uniqueRoutes, 10);
  assert.equal(final.coverage.routeBackPaths, 10);
  assert.equal(final.coverage.routePrimaryActions, 10);
  assert.equal(final.coverage.buttonTruthGroups, 12);
  assert.equal(final.coverage.deadButtonGroups, 0);
  assert.equal(final.coverage.accessibilityCheckpoints, 8);
  assert.equal(final.coverage.powerUserSurfaces, 8);
  assert.equal(final.coverage.launchSafetyInvariants, 8);
  assert.equal(final.coverage.finalProofMatrixCells, 32);
  assert.equal(final.coverage.mobileHeavyMeshes, 0);
});
check('W165 route matrix is user-tap gated and has no dead interaction', () => {
  for (const route of realmPlan.finalGamerPowerUserCertification.finalRouteCertifications) {
    assert.ok(route.route, route.id);
    assert.equal(route.hasVisiblePrimaryAction, true, route.id);
    assert.equal(route.hasVisibleBackPath, true, route.id);
    assert.equal(route.hasReadablePurpose, true, route.id);
    assert.equal(route.userTapRequired, true, route.id);
    assert.equal(route.noAutoNavigation, true, route.id);
    assert.equal(route.noAutoAd, true, route.id);
    assert.equal(route.noAutoRecording, true, route.id);
    assert.equal(route.noPrivateDataCapture, true, route.id);
    assert.equal(route.mobileHeavyMeshes, 0, route.id);
  }
});
check('W165 button truth, accessibility, and power-user surfaces are launch-safe', () => {
  const final = realmPlan.finalGamerPowerUserCertification;
  assert.equal(final.buttonTruthGroups.every((group) => group.checked && !group.deadButtonsAllowed && group.userTapRequired), true);
  assert.equal(final.accessibilityCheckpoints.every((checkpoint) => checkpoint.requiredForLaunch && checkpoint.lowDeviceFallback && checkpoint.textFallback), true);
  assert.equal(final.powerUserSurfaces.every((surface) => surface.visibleInProofPanel && surface.privateDataExcluded && surface.noFinancialPromise), true);
  assert.equal(final.launchSafetyInvariants.every((invariant) => invariant.enforced && invariant.regressionProtected), true);
});
check('W165 safety boundary prevents ads, recording, navigation, secrets, storage, rewards, market, vault, and entitlement mutation', () => {
  const safety = realmPlan.finalGamerPowerUserCertification.safety;
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
  assert.equal(safety.noAutoplayAudio, true);
  assert.equal(safety.noMicrophoneAutostart, true);
  assert.equal(safety.noAutoNavigation, true);
  assert.equal(safety.noPrivateDataCapture, true);
  assert.equal(safety.noSecretRender, true);
  assert.equal(safety.noRawIpTelemetry, true);
  assert.equal(safety.noBenchmarkUpload, true);
  assert.equal(safety.noFinancialPromise, true);
  assert.equal(safety.textFallbackAlwaysAvailable, true);
});
check('runtime creates W165 primitive proof objects only on high devices', () => {
  assert.ok(highLayer.group, 'expected high-device W165 layer');
  assert.ok(highLayer.stats.objectCount >= 455, `runtime object count too low: ${highLayer.stats.objectCount}`);
  assert.equal(highLayer.stats.finalCertifiedRouteCount, 10);
  assert.equal(highLayer.stats.buttonTruthGroupCount, 12);
  assert.equal(highLayer.stats.accessibilityCheckpointCount, 8);
  assert.equal(highLayer.stats.powerUserSurfaceCount, 8);
  assert.equal(highLayer.stats.launchSafetyInvariantCount, 8);
  assert.equal(highLayer.stats.finalProofMatrixCells, 32);
  assert.ok(highLayer.stats.finalCertificationRuntimeObjects >= 50);
  assert.equal(highLayer.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  highLayer.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('low-device tier skips heavy W165 runtime and keeps static fallback', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('receipt records W165 final certification without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: realmPlan, score: realmScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.finalCertifiedRoutes, 10);
  assert.equal(receipt.finalButtonTruthGroups, 12);
  assert.equal(receipt.finalAccessibilityCheckpoints, 8);
  assert.equal(receipt.finalPowerUserSurfaces, 8);
  assert.equal(receipt.finalLaunchSafetyInvariants, 8);
  assert.equal(receipt.finalProofMatrixCells, 32);
  assert.equal(receipt.finalGamerReady, true);
  assert.equal(receipt.finalPowerUserReady, true);
  assert.equal(receipt.finalNoAutoAd, true);
  assert.equal(receipt.finalNoAutoRecording, true);
  assert.equal(receipt.finalNoAutoNavigation, true);
  assert.equal(receipt.finalNoSecretRender, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page and proof module expose W165 markers', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(panels, /W165 final certification/);
  assert.match(proof, /w165FinalGamerPowerUserCertification/);
  assert.match(proof, /w165CertifiedRoutes/);
  assert.match(proof, /w165ButtonTruthGroups/);
  assert.match(proof, /w165NoAutoAd/);
  assert.match(proof, /w165NoSecretRender/);
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
check('W165 code does not touch Monetag, starter NFT, Vault, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W165 Final gamer/power-user certification gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/W165_FINAL_GAMER_POWER_USER_CERTIFICATION_STATS_2026-06-14.json', `${JSON.stringify({
  schema: 'eon.qa.w165.final-gamer-power-user-certification.stats.v1',
  ok: true,
  completedPhases: realmPlan.completedPhases,
  plannedPhases: realmPlan.plannedPhases,
  certifiedRoutes: realmPlan.finalGamerPowerUserCertification.coverage.certifiedRoutes,
  buttonTruthGroups: realmPlan.finalGamerPowerUserCertification.coverage.buttonTruthGroups,
  accessibilityCheckpoints: realmPlan.finalGamerPowerUserCertification.coverage.accessibilityCheckpoints,
  powerUserSurfaces: realmPlan.finalGamerPowerUserCertification.coverage.powerUserSurfaces,
  launchSafetyInvariants: realmPlan.finalGamerPowerUserCertification.coverage.launchSafetyInvariants,
  finalProofMatrixCells: realmPlan.finalGamerPowerUserCertification.coverage.finalProofMatrixCells,
  runtimeObjects: highLayer.stats.objectCount,
  w165RuntimeObjects: highLayer.stats.finalCertificationRuntimeObjects,
  mobileHeavyMeshes: lowLayer.stats.mobileHeavyMeshes,
  releaseVerdict: realmPlan.finalGamerPowerUserCertification.releaseVerdict,
  safety: realmPlan.finalGamerPowerUserCertification.safety
}, null, 2)}\n`);

console.log('W165 Final gamer/power-user certification gate passed: 15/15');
console.log(`Completed phases: ${realmPlan.completedPhases.join(', ')}`);
console.log(`Certified routes: ${realmPlan.finalGamerPowerUserCertification.coverage.certifiedRoutes}`);
console.log(`Button truth groups: ${realmPlan.finalGamerPowerUserCertification.coverage.buttonTruthGroups}`);
console.log(`Accessibility checkpoints: ${realmPlan.finalGamerPowerUserCertification.coverage.accessibilityCheckpoints}`);
console.log(`Power-user surfaces: ${realmPlan.finalGamerPowerUserCertification.coverage.powerUserSurfaces}`);
console.log(`Launch safety invariants: ${realmPlan.finalGamerPowerUserCertification.coverage.launchSafetyInvariants}`);
console.log(`Final proof matrix cells: ${realmPlan.finalGamerPowerUserCertification.coverage.finalProofMatrixCells}`);
console.log(`Runtime objects: ${highLayer.stats.objectCount}`);
console.log(`W165 runtime objects: ${highLayer.stats.finalCertificationRuntimeObjects}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${realmPlan.plannedPhases.join(', ') || 'none'}`);
