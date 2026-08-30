import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W159_PRIVATE_WORKSTATION_SCHEMA,
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
const myRealm = buildMyRealmVoxelWorld({ username: 'operator' });
const office = buildPrivateWorkstationVoxelWorld();
const cityPlan = buildW157W165CertificationPlan({ world: eonCity, quality: 'neon', device });
const officePlan = buildW157W165CertificationPlan({ world: office, quality: 'neon', device });
const cityScore = scoreW157W165CertificationPlan(cityPlan);
const ultraLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'neon', device });
const officeLayer = createW157W165CertificationLayer({ map: office, quality: 'neon', device });
const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
const lowLayer = createW157W165CertificationLayer({ map: office, quality: 'low', device: lowTier.inputs });

check('schema is W157/W159 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W159 private workstation schema is exported', () => assert.equal(W159_PRIVATE_WORKSTATION_SCHEMA, 'eon.realm3d.w159.private-workstation-ultra-office.v1'));
check('W157, W158, W159, W160, W161, W162, W163, W164, and W165 are complete; no planned phases remain', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.equal(cityPlan.plannedPhases.length, 0);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('score is 100', () => assert.equal(cityScore.score, 100));
check('private office plan contains eight safe work zones', () => {
  const officePlanModel = cityPlan.privateWorkstationUltraOffice;
  assert.equal(officePlanModel.schema, W159_PRIVATE_WORKSTATION_SCHEMA);
  assert.equal(officePlanModel.coverage.zoneCount, 8);
  assert.equal(officePlanModel.coverage.monitorFocusStates, 8);
  assert.equal(officePlanModel.coverage.routes, 8);
  assert.ok(officePlanModel.zones.every((zone) => zone.userTapRequired && zone.routeSafe && zone.decorativeUntilTapped && zone.noAutoOpen && zone.noIframeTrap));
});
check('private office command wall is rich enough for gamer/power-user first impression', () => {
  const wall = cityPlan.privateWorkstationUltraOffice.commandWall;
  assert.ok(wall.panels.length >= 6);
  assert.ok(wall.monitorFocusStates.length >= 8);
  assert.ok(wall.reflections.length >= 4);
  assert.ok(wall.deskProps.length >= 6);
});
check('private office excludes secrets and private data', () => {
  const model = cityPlan.privateWorkstationUltraOffice;
  assert.equal(model.safety.privateDataExcluded, true);
  assert.equal(model.safety.rawApiKeysRendered, false);
  assert.equal(model.safety.seedPhrasesRendered, false);
  assert.equal(model.safety.walletBackupsRendered, false);
  assert.equal(model.safety.privateChatsRendered, false);
  assert.equal(model.safety.arbitraryUserHtmlRendered, false);
  assert.ok(model.zones.every((zone) => zone.privateDataExcluded && zone.publicPreviewOnly && zone.forbiddenPreviewFields.includes('apiKey') && zone.forbiddenPreviewFields.includes('seedPhrase')));
});
check('runtime creates W157, W158, W159, and W160 objects only on high devices', () => {
  assert.ok(ultraLayer.group, 'expected W157/W159 high-device group');
  assert.ok(ultraLayer.stats.objectCount >= 180, `runtime object count too low: ${ultraLayer.stats.objectCount}`);
  assert.equal(ultraLayer.stats.privateOfficeZoneCount, 8);
  assert.equal(ultraLayer.stats.privateOfficeMonitorFocusStates, 8);
  assert.ok(ultraLayer.stats.privateOfficeRuntimeObjects >= 40);
  assert.equal(ultraLayer.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  ultraLayer.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('private workstation world inherits the W159 office layer', () => {
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
  assert.ok(officeLayer.group, 'expected private office layer');
  assert.equal(officePlan.privateWorkstationUltraOffice.coverage.zoneCount, 8);
  assert.ok(officeLayer.stats.privateOfficeRuntimeObjects >= 40);
});
check('my realm still inherits the safe cumulative plan', () => {
  const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon', device });
  assert.equal(scoreW157W165CertificationPlan(realmPlan).score, 100);
  assert.deepEqual(realmPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('low-device tier still skips heavy private office runtime meshes', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('receipt records W159 without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: cityPlan, score: cityScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.privateOfficeZones, 8);
  assert.equal(receipt.privateOfficeMonitorFocusStates, 8);
  assert.equal(receipt.privateOfficePrivateDataExcluded, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page and proof module expose W159 proof markers', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(proof, /w159PrivateWorkstationUltra/);
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
check('W159 code does not touch Monetag, starter NFT, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W159 Private Workstation Ultra Office gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('W159 Private Workstation Ultra Office gate passed: 15/15');
console.log(`Completed phases: ${cityPlan.completedPhases.join(', ')}`);
console.log(`Office zones: ${cityPlan.privateWorkstationUltraOffice.coverage.zoneCount}`);
console.log(`Monitor focus states: ${cityPlan.privateWorkstationUltraOffice.coverage.monitorFocusStates}`);
console.log(`Desk props: ${cityPlan.privateWorkstationUltraOffice.commandWall.deskProps.length}`);
console.log(`Reflection illusions: ${cityPlan.privateWorkstationUltraOffice.commandWall.reflections.length}`);
console.log(`Runtime objects: ${ultraLayer.stats.objectCount}`);
console.log(`W159 runtime objects: ${ultraLayer.stats.privateOfficeRuntimeObjects}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${cityPlan.plannedPhases.join(', ') || 'none'}`);
