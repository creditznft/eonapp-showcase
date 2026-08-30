import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W160_PHOTO_TRAILER_LAB_SCHEMA,
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
const lowLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'low', device: lowTier.inputs });

check('schema is W157/W160 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W160 photo/trailer schema is exported', () => assert.equal(W160_PHOTO_TRAILER_LAB_SCHEMA, 'eon.realm3d.w160.photo-mode-trailer-capture-lab.v1'));
check('W157, W158, W159, W160, W161, W162, W163, W164, and W165 are complete; no planned phases remain', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('score is 100', () => assert.equal(cityScore.score, 100));
check('photo lab has cinematic presets, camera rails, clean HUD modes, and screenshot matrix', () => {
  const lab = cityPlan.photoTrailerLab;
  assert.equal(lab.schema, W160_PHOTO_TRAILER_LAB_SCHEMA);
  assert.equal(lab.coverage.presetCount, 8);
  assert.equal(lab.coverage.cameraRails, 8);
  assert.equal(lab.coverage.cleanHudModes, 8);
  assert.ok(lab.coverage.screenshotMatrixCells >= 36);
  assert.equal(lab.coverage.founderDemoSteps, 8);
  assert.ok(lab.presets.every((preset) => preset.cameraRail?.autoPlay === false && preset.captureRequiresUserTap && preset.noAutoRecording && preset.noPrivateDataCapture));
});
check('founder demo route is ordered and tap-gated', () => {
  const route = cityPlan.photoTrailerLab.founderDemoRoute;
  assert.equal(route.length, 8);
  assert.deepEqual(route.map((step) => step.step), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(route.every((step) => step.tapGate === true && step.route));
});
check('photo lab excludes secrets and launch-critical mutations', () => {
  const safety = cityPlan.photoTrailerLab.safety;
  assert.equal(safety.userTapRequiredForCapture, true);
  assert.equal(safety.noAutoRecording, true);
  assert.equal(safety.noAutoDownload, true);
  assert.equal(safety.noPrivateDataCapture, true);
  assert.equal(safety.rawApiKeysCaptured, false);
  assert.equal(safety.seedPhrasesCaptured, false);
  assert.equal(safety.walletBackupsCaptured, false);
  assert.equal(safety.privateChatsCaptured, false);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.vaultPersistenceMutation, false);
});
check('runtime creates W157, W158, W159, and W160 objects only on high devices', () => {
  assert.ok(ultraLayer.group, 'expected high-device W160 layer');
  assert.ok(ultraLayer.stats.objectCount >= 220, `runtime object count too low: ${ultraLayer.stats.objectCount}`);
  assert.equal(ultraLayer.stats.photoTrailerPresetCount, 8);
  assert.equal(ultraLayer.stats.cameraRailCount, 8);
  assert.ok(ultraLayer.stats.photoTrailerRuntimeObjects >= 40);
  assert.equal(ultraLayer.stats.screenshotMatrixCells, 36);
  assert.equal(ultraLayer.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  ultraLayer.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('private workstation and generated realm inherit W160 capture lab safely', () => {
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
  assert.ok(officeLayer.group, 'expected office layer');
  assert.equal(officePlan.photoTrailerLab.coverage.presetCount, 8);
  const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon', device });
  assert.equal(scoreW157W165CertificationPlan(realmPlan).score, 100);
  assert.deepEqual(realmPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.equal(realmPlan.photoTrailerLab.coverage.cameraRails, 8);
});
check('low-device tier skips heavy W160 runtime meshes', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('receipt records W160 without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: cityPlan, score: cityScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.photoTrailerPresetCount, 8);
  assert.equal(receipt.cameraRailCount, 8);
  assert.equal(receipt.screenshotMatrixCells, 36);
  assert.equal(receipt.photoCaptureUserTapRequired, true);
  assert.equal(receipt.noAutoRecording, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page and proof module expose W160 proof markers', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(proof, /w160PhotoTrailerLab/);
  assert.match(proof, /w160CaptureRequiresTap/);
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
check('W160 code does not touch Monetag, starter NFT, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W160 Photo Mode and Trailer Capture Lab gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/W160_PHOTO_MODE_TRAILER_CAPTURE_LAB_STATS_2026-06-14.json', `${JSON.stringify({
  schema: 'eon.qa.w160.photo-mode-trailer-capture-lab.stats.v1',
  ok: true,
  completedPhases: cityPlan.completedPhases,
  plannedPhases: cityPlan.plannedPhases,
  photoPresets: cityPlan.photoTrailerLab.coverage.presetCount,
  cameraRails: cityPlan.photoTrailerLab.coverage.cameraRails,
  cleanHudModes: cityPlan.photoTrailerLab.coverage.cleanHudModes,
  screenshotMatrixCells: cityPlan.photoTrailerLab.coverage.screenshotMatrixCells,
  founderDemoSteps: cityPlan.photoTrailerLab.coverage.founderDemoSteps,
  runtimeObjects: ultraLayer.stats.objectCount,
  w160RuntimeObjects: ultraLayer.stats.photoTrailerRuntimeObjects,
  mobileHeavyMeshes: lowLayer.stats.mobileHeavyMeshes,
  safety: cityPlan.photoTrailerLab.safety
}, null, 2)}
`);

console.log('W160 Photo Mode and Trailer Capture Lab gate passed: 15/15');
console.log(`Completed phases: ${cityPlan.completedPhases.join(', ')}`);
console.log(`Photo presets: ${cityPlan.photoTrailerLab.coverage.presetCount}`);
console.log(`Camera rails: ${cityPlan.photoTrailerLab.coverage.cameraRails}`);
console.log(`Clean HUD modes: ${cityPlan.photoTrailerLab.coverage.cleanHudModes}`);
console.log(`Screenshot matrix cells: ${cityPlan.photoTrailerLab.coverage.screenshotMatrixCells}`);
console.log(`Founder demo steps: ${cityPlan.photoTrailerLab.coverage.founderDemoSteps}`);
console.log(`Runtime objects: ${ultraLayer.stats.objectCount}`);
console.log(`W160 runtime objects: ${ultraLayer.stats.photoTrailerRuntimeObjects}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${cityPlan.plannedPhases.join(', ') || 'none'}`);
