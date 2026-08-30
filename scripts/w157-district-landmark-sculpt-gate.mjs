import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
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
const eonCity = buildEonCityVoxelWorld();
const myRealm = buildMyRealmVoxelWorld({ username: 'operator' });
const office = buildPrivateWorkstationVoxelWorld();
const cityPlan = buildW157W165CertificationPlan({ world: eonCity, quality: 'neon', device: { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 } });
const cityScore = scoreW157W165CertificationPlan(cityPlan);
const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
const ultraLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'neon', device: { webgl2: true, deviceMemory: 16, hardwareConcurrency: 12 } });
const lowLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'low', device: { mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 } });

check('schema is W157 district landmark sculpt', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W157/W159 cumulative score is 100', () => assert.equal(cityScore.score, 100));
check('W157 remains completed', () => assert.ok(cityPlan.completedPhases.includes('W157')));
check('W158/W159/W164 are now completed and no planned phases remain', () => { assert.ok(cityPlan.completedPhases.includes('W158')); assert.ok(cityPlan.completedPhases.includes('W159')); assert.equal(cityPlan.plannedPhases.length, 0); });
check('ten landmarks exist', () => assert.ok(cityPlan.landmarkSculpt.length >= 10));
check('landmarks are readable and unique', () => {
  assert.ok(cityPlan.landmarkSculpt.every((landmark) => landmark.hasReadableSignage && landmark.hasUniqueSilhouette && landmark.roomAudit?.purposeClear));
  assert.ok(cityPlan.districtCoverage.uniqueSilhouettes >= 10);
});
check('landmark routes require user tap only', () => assert.ok(cityPlan.landmarkSculpt.every((landmark) => landmark.hasUserTapTarget && landmark.noAutoNavigation && landmark.decorativeOnlyUntilTapped)));
check('low-device tier disables heavy visuals', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
});
check('ultra layer creates only W157 landmark objects', () => {
  assert.ok(ultraLayer.group, 'expected ultra layer group');
  assert.ok(ultraLayer.stats.objectCount >= 40, `object count too low: ${ultraLayer.stats.objectCount}`);
  assert.equal(ultraLayer.stats.completedPhases, 9);
  const phaseIds = new Set();
  ultraLayer.group.traverse((object) => {
    if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId);
  });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('my realm and private office inherit safe W157 proof', () => {
  const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon' });
  const officePlan = buildW157W165CertificationPlan({ world: office, quality: 'neon' });
  assert.equal(scoreW157W165CertificationPlan(realmPlan).score, 100);
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
});
check('receipt is deterministic and safe', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: cityPlan, score: cityScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page includes W156 and W157 proof modules', () => {
  const html = read('realm.html');
  assert.match(html, /w156-ultra-showcase-proof\.js/);
  assert.match(html, /w157-w165-certification-proof\.js/);
});
check('W150 Telegram/Monetag hardening stays included', () => {
  const telegram = read('telegram.html');
  const reward = read('reward-access.html');
  const redirects = read('_redirects');
  const headers = read('_headers');
  assert.match(telegram, /No ad starts automatically/i);
  assert.match(telegram, /reward-access(?:\.html)?\?mode=telegram/i);
  assert.match(reward, /Watch rewarded ad/i);
  assert.doesNotMatch(redirects, /\/telegram\s+\/telegram\.html\s+200/);
  assert.doesNotMatch(redirects, /\/reward-access\s+\/reward-access\.html\s+200/);
  assert.match(redirects, /Do not add explicit rewrites here or production can loop/i);
  assert.match(headers, /frame-ancestors 'self' https:\/\/web\.telegram\.org.*https:\/\/\*\.telegram\.org/);
});
check('reward, market, and vault launch safety unchanged', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W157 District Landmark Sculpt gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('W157 District Landmark Sculpt regression gate passed: 14/14');
console.log(`Landmarks: ${cityPlan.landmarkSculpt.length}`);
console.log(`Unique silhouettes: ${cityPlan.districtCoverage.uniqueSilhouettes}`);
console.log(`Ultra runtime objects: ${ultraLayer.stats.objectCount}`);
console.log(`Low-device heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Completed phases: ${cityPlan.completedPhases.join(', ')}`);
console.log(`Planned next phases: ${cityPlan.plannedPhases.join(', ')}`);
