import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W161_LIGHTING_WEATHER_AUDIO_SCHEMA,
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
const realmPlan = buildW157W165CertificationPlan({ world: myRealm, quality: 'neon', device });
const cityScore = scoreW157W165CertificationPlan(cityPlan);
const ultraLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'neon', device });
const officeLayer = createW157W165CertificationLayer({ map: office, quality: 'neon', device });
const lowTier = resolveW157W165CertificationTier({ quality: 'low', mobile: true, touch: true, saveData: true, reducedMotion: true, webgl2: false, deviceMemory: 2, hardwareConcurrency: 2 });
const lowLayer = createW157W165CertificationLayer({ map: eonCity, quality: 'low', device: lowTier.inputs });

check('schema is W157/W161 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W161 lighting/weather/audio schema is exported', () => assert.equal(W161_LIGHTING_WEATHER_AUDIO_SCHEMA, 'eon.realm3d.w161.lighting-weather-audio-polish.v1'));
check('W157 through W165 are complete; no planned phases remain', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('score is 100', () => assert.equal(cityScore.score, 100));
check('W161 atmosphere plan has moods, weather profiles, ambient loops, and district light rigs', () => {
  const lab = cityPlan.lightingWeatherAudioPolish;
  assert.equal(lab.schema, W161_LIGHTING_WEATHER_AUDIO_SCHEMA);
  assert.equal(lab.coverage.moodCount, 8);
  assert.equal(lab.coverage.weatherProfiles, 8);
  assert.equal(lab.coverage.ambientLoops, 8);
  assert.ok(lab.coverage.districtLightRigs >= 10);
  assert.equal(lab.coverage.reducedMotionFallbacks, 8);
  assert.equal(lab.coverage.saveDataFallbacks, 8);
  assert.equal(lab.coverage.tapGatedAudioCues, 8);
});
check('W161 audio is opt-in, muted by default, and mic-safe', () => {
  const safety = cityPlan.lightingWeatherAudioPolish.safety;
  assert.equal(safety.userTapRequiredForAudio, true);
  assert.equal(safety.mutedByDefault, true);
  assert.equal(safety.noAutoplayAudio, true);
  assert.equal(safety.noMicrophoneAutostart, true);
  assert.equal(safety.voiceOffByDefault, true);
  assert.equal(safety.textFallbackAlwaysAvailable, true);
  assert.equal(safety.noAutoRecording, true);
  assert.equal(safety.noPrivateDataCapture, true);
  assert.equal(safety.rewardCodeMutation, false);
  assert.equal(safety.marketStarterDropMutation, false);
  assert.equal(safety.vaultPersistenceMutation, false);
});
check('runtime creates W161 atmosphere primitives only on high devices', () => {
  assert.ok(ultraLayer.group, 'expected high-device W161 layer');
  assert.ok(ultraLayer.stats.objectCount >= 260, `runtime object count too low: ${ultraLayer.stats.objectCount}`);
  assert.equal(ultraLayer.stats.lightingWeatherMoodCount, 8);
  assert.equal(ultraLayer.stats.weatherProfileCount, 8);
  assert.equal(ultraLayer.stats.ambientLoopCount, 8);
  assert.ok(ultraLayer.stats.districtLightRigCount >= 10);
  assert.ok(ultraLayer.stats.lightingWeatherRuntimeObjects >= 40);
  assert.equal(ultraLayer.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  ultraLayer.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('private workstation and generated realm inherit W161 atmosphere safely', () => {
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
  assert.equal(scoreW157W165CertificationPlan(realmPlan).score, 100);
  assert.ok(officeLayer.group, 'expected office layer');
  assert.equal(officePlan.lightingWeatherAudioPolish.coverage.moodCount, 8);
  assert.equal(realmPlan.lightingWeatherAudioPolish.coverage.ambientLoops, 8);
});
check('low-device tier skips heavy W161 runtime meshes and keeps labels/static fallback', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('receipt records W161 without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: cityPlan, score: cityScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.lightingWeatherMoodCount, 8);
  assert.equal(receipt.weatherProfileCount, 8);
  assert.equal(receipt.ambientLoopCount, 8);
  assert.equal(receipt.lightingAudioMutedByDefault, true);
  assert.equal(receipt.lightingAudioTapRequired, true);
  assert.equal(receipt.noMicrophoneAutostart, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page and proof module expose W161 markers', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(proof, /w161LightingWeatherAudio/);
  assert.match(proof, /w161NoMicrophoneAutostart/);
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
check('W161 code does not touch Monetag, starter NFT, Vault, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W161 Lighting/Weather/Audio Polish gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/W161_LIGHTING_WEATHER_AUDIO_POLISH_STATS_2026-06-14.json', `${JSON.stringify({
  schema: 'eon.qa.w161.lighting-weather-audio-polish.stats.v1',
  ok: true,
  completedPhases: cityPlan.completedPhases,
  plannedPhases: cityPlan.plannedPhases,
  moods: cityPlan.lightingWeatherAudioPolish.coverage.moodCount,
  weatherProfiles: cityPlan.lightingWeatherAudioPolish.coverage.weatherProfiles,
  ambientLoops: cityPlan.lightingWeatherAudioPolish.coverage.ambientLoops,
  districtLightRigs: cityPlan.lightingWeatherAudioPolish.coverage.districtLightRigs,
  tapGatedAudioCues: cityPlan.lightingWeatherAudioPolish.coverage.tapGatedAudioCues,
  runtimeObjects: ultraLayer.stats.objectCount,
  w161RuntimeObjects: ultraLayer.stats.lightingWeatherRuntimeObjects,
  mobileHeavyMeshes: lowLayer.stats.mobileHeavyMeshes,
  safety: cityPlan.lightingWeatherAudioPolish.safety
}, null, 2)}\n`);

console.log('W161 Lighting/Weather/Audio Polish gate passed: 13/13');
console.log(`Completed phases: ${cityPlan.completedPhases.join(', ')}`);
console.log(`Moods: ${cityPlan.lightingWeatherAudioPolish.coverage.moodCount}`);
console.log(`Weather profiles: ${cityPlan.lightingWeatherAudioPolish.coverage.weatherProfiles}`);
console.log(`Ambient loops: ${cityPlan.lightingWeatherAudioPolish.coverage.ambientLoops}`);
console.log(`District light rigs: ${cityPlan.lightingWeatherAudioPolish.coverage.districtLightRigs}`);
console.log(`Tap-gated audio cues: ${cityPlan.lightingWeatherAudioPolish.coverage.tapGatedAudioCues}`);
console.log(`Runtime objects: ${ultraLayer.stats.objectCount}`);
console.log(`W161 runtime objects: ${ultraLayer.stats.lightingWeatherRuntimeObjects}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${cityPlan.plannedPhases.join(', ') || 'none'}`);
