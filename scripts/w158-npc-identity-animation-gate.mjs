import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W158_NPC_IDENTITY_SCHEMA,
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
const cityScore = scoreW157W165CertificationPlan(cityPlan);
const ultraLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'neon', device });
const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
const lowLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'low', device: lowTier.inputs });

check('schema is W157/W159 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W158 NPC identity schema is exported', () => assert.equal(W158_NPC_IDENTITY_SCHEMA, 'eon.realm3d.w158.npc-identity-animation.v1'));
check('W157, W158, W159, W160, W161, W162, W163, W164, and W165 are complete; no planned phases remain', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.equal(cityPlan.plannedPhases.length, 0);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('score is 100', () => assert.equal(cityScore.score, 100));
check('NPC identities are numerous and readable', () => {
  assert.ok(cityPlan.npcIdentities.length >= 12, `npc identities too low: ${cityPlan.npcIdentities.length}`);
  assert.ok(cityPlan.npcIdentities.every((npc) => npc.schema === W158_NPC_IDENTITY_SCHEMA && npc.readableFace && npc.faceRig && npc.costumeSilhouette));
});
check('NPC identity families and animation loops are diverse', () => {
  assert.ok(cityPlan.npcIdentityCoverage.families >= 4, `families: ${cityPlan.npcIdentityCoverage.families}`);
  assert.ok(cityPlan.npcIdentityCoverage.idleLoops >= 4, `idle loops: ${cityPlan.npcIdentityCoverage.idleLoops}`);
  assert.ok(cityPlan.npcIdentityCoverage.gestureLoops >= 4, `gesture loops: ${cityPlan.npcIdentityCoverage.gestureLoops}`);
  assert.ok(cityPlan.npcIdentityCoverage.socialCircles >= 4, `social circles: ${cityPlan.npcIdentityCoverage.socialCircles}`);
});
check('NPC voice/mic/social safety is opt-in and non-creepy', () => {
  assert.equal(cityPlan.npcIdentityCoverage.safeVoicePolicies, cityPlan.npcIdentities.length);
  assert.ok(cityPlan.npcIdentityCoverage.nonCreepyProximity >= 10);
  assert.ok(cityPlan.npcIdentities.every((npc) => npc.voicePolicy.voiceOffByDefault && npc.voicePolicy.microphoneStartsOnlyAfterTap && npc.voicePolicy.textFallbackAlwaysAvailable));
  assert.ok(cityPlan.npcIdentities.every((npc) => npc.safety.noApiKeys && npc.safety.noSeedPhrases && npc.safety.noWalletBackups && npc.safety.noFinancialPromises && npc.safety.noAutoOpen));
});
check('runtime creates W157 landmarks and W158 NPC rigs only on high devices', () => {
  assert.ok(ultraLayer.group, 'expected W157/W158 high-device group');
  assert.ok(ultraLayer.stats.objectCount >= 120, `runtime object count too low: ${ultraLayer.stats.objectCount}`);
  assert.equal(ultraLayer.stats.npcIdentityCount, cityPlan.npcIdentities.length);
  assert.ok(ultraLayer.stats.socialCircleCount >= 10);
  assert.ok(ultraLayer.stats.gestureLoopCount >= 10);
  assert.equal(ultraLayer.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  ultraLayer.group.traverse((object) => {
    if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId);
  });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('low-device tier still skips heavy runtime meshes', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('my realm and private office inherit W158 plan safely', () => {
  const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon', device });
  const officePlan = buildW157W165CertificationPlan({ world: office, quality: 'neon', device });
  assert.equal(scoreW157W165CertificationPlan(realmPlan).score, 100);
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
  assert.ok(realmPlan.npcIdentities.length >= 12);
  assert.ok(officePlan.npcIdentities.length >= 12);
});
check('receipt records W158 without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: cityPlan, score: cityScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.npcIdentityCount, cityPlan.npcIdentities.length);
  assert.equal(receipt.voiceOffByDefault, true);
  assert.equal(receipt.microphoneStartsOnlyAfterTap, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page includes cumulative proof module and W158 panel copy', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(proof, /w158NpcIdentityAnimation/);
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
check('W158 code does not touch Monetag, starter NFT, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W158 NPC Identity and Animation gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('W158 NPC Identity and Animation gate passed: 14/14');
console.log(`NPC identities: ${cityPlan.npcIdentities.length}`);
console.log(`NPC families: ${cityPlan.npcIdentityCoverage.families}`);
console.log(`Idle loops: ${cityPlan.npcIdentityCoverage.idleLoops}`);
console.log(`Gesture loops: ${cityPlan.npcIdentityCoverage.gestureLoops}`);
console.log(`Social circles: ${cityPlan.npcIdentityCoverage.socialCircles}`);
console.log(`Runtime objects: ${ultraLayer.stats.objectCount}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${cityPlan.plannedPhases.join(', ') || 'none'}`);
