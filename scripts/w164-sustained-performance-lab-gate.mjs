import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W164_SUSTAINED_PERFORMANCE_LAB_SCHEMA,
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
const myRealm = buildMyRealmVoxelWorld({ username: 'operator', seed: 'w164-performance' });
const office = buildPrivateWorkstationVoxelWorld();
const cityPlan = buildW157W165CertificationPlan({ world: city, quality: 'neon', device: highDevice });
const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon', device: highDevice });
const officePlan = buildW157W165CertificationPlan({ world: office, quality: 'neon', device: highDevice });
const cityScore = scoreW157W165CertificationPlan(cityPlan);
const realmScore = scoreW157W165CertificationPlan(realmPlan);
const highLayer = createW157W165CertificationLayer({ map: myRealm, quality: 'neon', device: highDevice });
const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
const lowLayer = createW157W165CertificationLayer({ map: myRealm, quality: 'low', device: lowTier.inputs });

check('schema is W157/W164 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W164 sustained performance schema is exported', () => assert.equal(W164_SUSTAINED_PERFORMANCE_LAB_SCHEMA, 'eon.realm3d.w164.sustained-performance-lab.v1'));
check('W157 through W165 are complete; no planned phases remain', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('city, generated realm, and private workstation scores are 100', () => {
  assert.equal(cityScore.score, 100);
  assert.equal(realmScore.score, 100);
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
});
check('W164 performance lab includes full sustained proof coverage', () => {
  const lab = realmPlan.sustainedPerformanceLab;
  assert.equal(lab.schema, W164_SUSTAINED_PERFORMANCE_LAB_SCHEMA);
  assert.equal(lab.coverage.performanceProfiles, 8);
  assert.equal(lab.coverage.thermalGuardrails, 8);
  assert.equal(lab.coverage.memoryCleanupGates, 8);
  assert.equal(lab.coverage.adaptiveQualityRules, 10);
  assert.equal(lab.coverage.longSessionProofCells, 32);
  assert.equal(lab.coverage.profilesWithFrameBudget, 8);
  assert.equal(lab.coverage.profilesWithThermalGuardrail, 8);
  assert.equal(lab.coverage.profilesWithMemoryCleanupGate, 8);
  assert.equal(lab.coverage.nonDestructiveCleanupGates, 8);
  assert.equal(lab.coverage.mobileHeavyMeshes, 0);
});
check('W164 frame, thermal, and memory policies are low-device safe', () => {
  const lab = realmPlan.sustainedPerformanceLab;
  assert.equal(lab.frameBudgetPolicy.transformOnlyAnimation, true);
  assert.equal(lab.frameBudgetPolicy.noPostprocessingDependency, true);
  assert.equal(lab.frameBudgetPolicy.noShaderDependency, true);
  assert.equal(lab.frameBudgetPolicy.noHeavyMobileMeshes, true);
  assert.equal(lab.frameBudgetPolicy.pauseWhenHidden, true);
  assert.equal(lab.memoryPolicy.nonDestructiveCleanupOnly, true);
  assert.equal(lab.memoryPolicy.neverDeleteVaultData, true);
  assert.equal(lab.memoryPolicy.neverDeleteNfts, true);
  assert.equal(lab.memoryPolicy.neverDeleteApiKeys, true);
  assert.equal(lab.memoryPolicy.neverDeleteReceipts, true);
  assert.equal(lab.memoryPolicy.neverDeleteBackups, true);
  assert.equal(lab.memoryPolicy.neverDeleteEntitlements, true);
});
check('W164 safety boundary prevents storage deletion, telemetry upload, rewards, market, vault, and entitlement mutation', () => {
  const safety = realmPlan.sustainedPerformanceLab.safety;
  assert.equal(safety.userDataMutation, false);
  assert.equal(safety.destructiveStorageCleanup, false);
  assert.equal(safety.localStorageRemoveItem, false);
  assert.equal(safety.indexedDbDeleteDatabase, false);
  assert.equal(safety.vaultPersistenceMutation, false);
  assert.equal(safety.nftInventoryMutation, false);
  assert.equal(safety.apiKeyVaultMutation, false);
  assert.equal(safety.receiptMutation, false);
  assert.equal(safety.entitlementMutation, false);
  assert.equal(safety.backupMutation, false);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.noBenchmarkUpload, true);
  assert.equal(safety.noRawIpTelemetry, true);
});
check('W164 performance profiles all have budgets and no mobile heavy meshes', () => {
  for (const profile of realmPlan.sustainedPerformanceLab.performanceProfiles) {
    assert.ok(Number(profile.targetFps) >= 20, profile.id);
    assert.ok(Number(profile.frameBudgetMs) >= 16.7, profile.id);
    assert.ok(profile.thermalGuardrail, profile.id);
    assert.ok(profile.memoryCleanupGate, profile.id);
    assert.equal(profile.primitiveOnly, true, profile.id);
    assert.equal(profile.transformOnlyAnimation, true, profile.id);
    assert.equal(profile.noBenchmarkUpload, true, profile.id);
    assert.equal(profile.noRawIpTelemetry, true, profile.id);
    assert.equal(profile.mobileHeavyMeshes, 0, profile.id);
  }
});
check('W164 cleanup gates are explicitly non-destructive', () => {
  for (const gate of realmPlan.sustainedPerformanceLab.memoryCleanupGates) {
    assert.equal(gate.nonDestructive, true, gate.id);
    assert.equal(gate.deletesLocalStorage, false, gate.id);
    assert.equal(gate.deletesIndexedDb, false, gate.id);
    assert.equal(gate.deletesVaultData, false, gate.id);
    assert.equal(gate.deletesNfts, false, gate.id);
    assert.equal(gate.deletesApiKeys, false, gate.id);
    assert.equal(gate.deletesReceipts, false, gate.id);
    assert.equal(gate.deletesBackups, false, gate.id);
    assert.equal(gate.deletesEntitlements, false, gate.id);
  }
});
check('runtime creates W164 primitives only on high devices', () => {
  assert.ok(highLayer.group, 'expected high-device W164 layer');
  assert.ok(highLayer.stats.objectCount >= 400, `runtime object count too low: ${highLayer.stats.objectCount}`);
  assert.equal(highLayer.stats.performanceProfileCount, 8);
  assert.equal(highLayer.stats.thermalGuardrailCount, 8);
  assert.equal(highLayer.stats.memoryCleanupGateCount, 8);
  assert.equal(highLayer.stats.adaptiveQualityRuleCount, 10);
  assert.equal(highLayer.stats.longSessionProofCellCount, 32);
  assert.ok(highLayer.stats.sustainedPerformanceRuntimeObjects >= 48);
  assert.equal(highLayer.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  highLayer.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('low-device tier skips heavy W164 runtime and keeps static fallback', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('receipt records W164 without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: realmPlan, score: realmScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.performanceProfiles, 8);
  assert.equal(receipt.thermalGuardrails, 8);
  assert.equal(receipt.memoryCleanupGates, 8);
  assert.equal(receipt.adaptiveQualityRules, 10);
  assert.equal(receipt.longSessionProofCells, 32);
  assert.equal(receipt.nonDestructiveCleanupGates, 8);
  assert.equal(receipt.performanceLabNoStorageDeletion, true);
  assert.equal(receipt.performanceLabNoBenchmarkUpload, true);
  assert.equal(receipt.performanceLabNoRawIpTelemetry, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page and proof module expose W164 markers', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(panels, /W164 sustained performance safety/);
  assert.match(proof, /w164SustainedPerformanceLab/);
  assert.match(proof, /w164NoBenchmarkUpload/);
  assert.match(proof, /w164NoRawIpTelemetry/);
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
check('W164 code does not touch Monetag, starter NFT, Vault, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W164 Sustained Performance Lab gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/W164_SUSTAINED_PERFORMANCE_LAB_STATS_2026-06-14.json', `${JSON.stringify({
  schema: 'eon.qa.w164.sustained-performance-lab.stats.v1',
  ok: true,
  completedPhases: realmPlan.completedPhases,
  plannedPhases: realmPlan.plannedPhases,
  performanceProfiles: realmPlan.sustainedPerformanceLab.coverage.performanceProfiles,
  thermalGuardrails: realmPlan.sustainedPerformanceLab.coverage.thermalGuardrails,
  memoryCleanupGates: realmPlan.sustainedPerformanceLab.coverage.memoryCleanupGates,
  adaptiveQualityRules: realmPlan.sustainedPerformanceLab.coverage.adaptiveQualityRules,
  longSessionProofCells: realmPlan.sustainedPerformanceLab.coverage.longSessionProofCells,
  runtimeObjects: highLayer.stats.objectCount,
  w164RuntimeObjects: highLayer.stats.sustainedPerformanceRuntimeObjects,
  mobileHeavyMeshes: lowLayer.stats.mobileHeavyMeshes,
  safety: realmPlan.sustainedPerformanceLab.safety
}, null, 2)}\n`);

console.log('W164 Sustained Performance Lab gate passed: 15/15');
console.log(`Completed phases: ${realmPlan.completedPhases.join(', ')}`);
console.log(`Performance profiles: ${realmPlan.sustainedPerformanceLab.coverage.performanceProfiles}`);
console.log(`Thermal guardrails: ${realmPlan.sustainedPerformanceLab.coverage.thermalGuardrails}`);
console.log(`Memory cleanup gates: ${realmPlan.sustainedPerformanceLab.coverage.memoryCleanupGates}`);
console.log(`Adaptive quality rules: ${realmPlan.sustainedPerformanceLab.coverage.adaptiveQualityRules}`);
console.log(`Long-session proof cells: ${realmPlan.sustainedPerformanceLab.coverage.longSessionProofCells}`);
console.log(`Runtime objects: ${highLayer.stats.objectCount}`);
console.log(`W164 runtime objects: ${highLayer.stats.sustainedPerformanceRuntimeObjects}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${realmPlan.plannedPhases.join(', ') || 'none'}`);
