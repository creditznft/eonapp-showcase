import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W157_W165_CERTIFICATION_SCHEMA,
  W162_GAMEPLAY_CLARITY_ONBOARDING_SCHEMA,
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

check('schema is W157/W162 cumulative certification', () => assert.equal(W157_W165_CERTIFICATION_SCHEMA, 'eon.realm3d.w157-w165.landmarks-npc-office-photo-atmosphere-onboarding-generated-parity-performance-final-certification.v1'));
check('W162 gameplay clarity/onboarding schema is exported', () => assert.equal(W162_GAMEPLAY_CLARITY_ONBOARDING_SCHEMA, 'eon.realm3d.w162.gameplay-clarity-onboarding.v1'));
check('W157 through W165 are complete; no planned phases remain', () => {
  assert.deepEqual(cityPlan.completedPhases, ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
  assert.deepEqual(cityPlan.plannedPhases, []);
});
check('score is 100', () => assert.equal(cityScore.score, 100));
check('W162 clarity plan has route cards, teleport clarity, minimap pins, onboarding, and controls', () => {
  const clarity = cityPlan.gameplayClarityOnboarding;
  assert.equal(clarity.schema, W162_GAMEPLAY_CLARITY_ONBOARDING_SCHEMA);
  assert.equal(clarity.coverage.clarityCards, 10);
  assert.equal(clarity.coverage.roomTeleportEntries, 10);
  assert.equal(clarity.coverage.minimapPins, 10);
  assert.equal(clarity.coverage.onboardingChecklistSteps, 8);
  assert.equal(clarity.coverage.controlHints, 8);
  assert.equal(clarity.coverage.noDeadInteractions, 10);
  assert.equal(clarity.coverage.tapTargetSafeCards, 10);
  assert.equal(clarity.coverage.onePrimaryActionCards, 10);
  assert.equal(clarity.coverage.routeBreadcrumbs, 10);
  assert.equal(clarity.coverage.textFallbackCards, 10);
});
check('W162 navigation is tap-gated and has no dead ends', () => {
  const safety = cityPlan.gameplayClarityOnboarding.safety;
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
check('every W162 clarity card has one action, backtrack, minimap, and 48px tap target', () => {
  for (const card of cityPlan.gameplayClarityOnboarding.clarityCards) {
    assert.equal(card.onePrimaryAction, true, card.id);
    assert.equal(card.hasBacktrack, true, card.id);
    assert.equal(card.hasMinimapPin, true, card.id);
    assert.equal(card.hasRoomTeleportCopy, true, card.id);
    assert.equal(card.noDeadInteraction, true, card.id);
    assert.equal(card.noAutoNavigation, true, card.id);
    assert.ok(card.accessibleTapTargetPx >= 48, card.id);
    assert.ok(card.routeBreadcrumbs.length >= 3, card.id);
    assert.ok(card.secondaryActions.includes('Back to city'), card.id);
  }
});
check('runtime creates W162 clarity primitives only on high devices', () => {
  assert.ok(ultraLayer.group, 'expected high-device W162 layer');
  assert.ok(ultraLayer.stats.objectCount >= 310, `runtime object count too low: ${ultraLayer.stats.objectCount}`);
  assert.equal(ultraLayer.stats.gameplayClarityCardCount, 10);
  assert.equal(ultraLayer.stats.roomTeleportClarityCount, 10);
  assert.equal(ultraLayer.stats.minimapPinCount, 10);
  assert.equal(ultraLayer.stats.onboardingChecklistStepCount, 8);
  assert.equal(ultraLayer.stats.controlHintCount, 8);
  assert.ok(ultraLayer.stats.gameplayClarityRuntimeObjects >= 50);
  assert.equal(ultraLayer.stats.mobileHeavyMeshes, 0);
  const phaseIds = new Set();
  ultraLayer.group.traverse((object) => { if (object.userData?.phaseId) phaseIds.add(object.userData.phaseId); });
  assert.deepEqual([...phaseIds].sort(), ['W157', 'W158', 'W159', 'W160', 'W161', 'W162', 'W163', 'W164', 'W165']);
});
check('private workstation and generated realm inherit W162 clarity safely', () => {
  assert.equal(scoreW157W165CertificationPlan(officePlan).score, 100);
  assert.equal(scoreW157W165CertificationPlan(realmPlan).score, 100);
  assert.ok(officeLayer.group, 'expected office layer');
  assert.equal(officePlan.gameplayClarityOnboarding.coverage.clarityCards, 10);
  assert.equal(realmPlan.gameplayClarityOnboarding.coverage.roomTeleportEntries, 10);
});
check('low-device tier skips heavy W162 runtime meshes and keeps static fallback', () => {
  assert.equal(lowTier.enabled, false);
  assert.equal(lowLayer.group, null);
  assert.equal(lowLayer.stats.mobileHeavyMeshes, 0);
  assert.equal(lowLayer.stats.objectCount, 0);
});
check('receipt records W162 without mutating user data or rewards', () => {
  const store = new Map();
  const storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
  const receipt = recordW157W165CertificationReceipt(storage, { plan: cityPlan, score: cityScore });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.gameplayClarityCards, 10);
  assert.equal(receipt.roomTeleportClarityCount, 10);
  assert.equal(receipt.minimapPinCount, 10);
  assert.equal(receipt.onboardingChecklistStepCount, 8);
  assert.equal(receipt.gameplayNoDeadEnds, true);
  assert.equal(receipt.gameplayNavigationTapRequired, true);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(receipt.rewardCodeMutation, false);
  assert.equal(receipt.marketStarterDropMutation, false);
  assert.equal(receipt.vaultPersistenceMutation, false);
});
check('realm page and proof module expose W162 markers', () => {
  const html = read('realm.html');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const proof = read('assets/js/realm3d/w157-w165-certification-proof.js');
  assert.match(html, /w157-w165-certification-proof\.js/);
  assert.match(panels, /W157–W165 Landmarks \+ NPC Identity \+ Private Office \+ Photo Lab \+ Atmosphere \+ Onboarding \+ Generated Realm Parity \+ Performance \+ Final Certification/);
  assert.match(panels, /W162 gameplay clarity safety/);
  assert.match(proof, /w162GameplayClarityOnboarding/);
  assert.match(proof, /w162NavigationRequiresTap/);
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
check('W162 code does not touch Monetag, starter NFT, Vault, or destructive storage APIs', () => {
  const runtime = read('assets/js/realm3d/engine/EonCityW157W165CertificationRuntime.js');
  assert.doesNotMatch(runtime, /show_11111741/);
  assert.doesNotMatch(runtime, /ensureMarketStarterDrop/);
  assert.doesNotMatch(runtime, /localStorage\.removeItem|indexedDB\.deleteDatabase/);
});

if (failures.length) {
  console.error('W162 Gameplay Clarity and Onboarding gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/W162_GAMEPLAY_CLARITY_ONBOARDING_STATS_2026-06-14.json', `${JSON.stringify({
  schema: 'eon.qa.w162.gameplay-clarity-onboarding.stats.v1',
  ok: true,
  completedPhases: cityPlan.completedPhases,
  plannedPhases: cityPlan.plannedPhases,
  clarityCards: cityPlan.gameplayClarityOnboarding.coverage.clarityCards,
  roomTeleportEntries: cityPlan.gameplayClarityOnboarding.coverage.roomTeleportEntries,
  minimapPins: cityPlan.gameplayClarityOnboarding.coverage.minimapPins,
  onboardingChecklistSteps: cityPlan.gameplayClarityOnboarding.coverage.onboardingChecklistSteps,
  controlHints: cityPlan.gameplayClarityOnboarding.coverage.controlHints,
  noDeadInteractions: cityPlan.gameplayClarityOnboarding.coverage.noDeadInteractions,
  runtimeObjects: ultraLayer.stats.objectCount,
  w162RuntimeObjects: ultraLayer.stats.gameplayClarityRuntimeObjects,
  mobileHeavyMeshes: lowLayer.stats.mobileHeavyMeshes,
  safety: cityPlan.gameplayClarityOnboarding.safety
}, null, 2)}\n`);

console.log('W162 Gameplay Clarity and Onboarding gate passed: 14/14');
console.log(`Completed phases: ${cityPlan.completedPhases.join(', ')}`);
console.log(`Clarity cards: ${cityPlan.gameplayClarityOnboarding.coverage.clarityCards}`);
console.log(`Room teleport entries: ${cityPlan.gameplayClarityOnboarding.coverage.roomTeleportEntries}`);
console.log(`Minimap pins: ${cityPlan.gameplayClarityOnboarding.coverage.minimapPins}`);
console.log(`Onboarding checklist steps: ${cityPlan.gameplayClarityOnboarding.coverage.onboardingChecklistSteps}`);
console.log(`Control hints: ${cityPlan.gameplayClarityOnboarding.coverage.controlHints}`);
console.log(`No-dead-interaction cards: ${cityPlan.gameplayClarityOnboarding.coverage.noDeadInteractions}`);
console.log(`Runtime objects: ${ultraLayer.stats.objectCount}`);
console.log(`W162 runtime objects: ${ultraLayer.stats.gameplayClarityRuntimeObjects}`);
console.log(`Mobile heavy meshes: ${lowLayer.stats.mobileHeavyMeshes}`);
console.log(`Remaining planned phases: ${cityPlan.plannedPhases.join(', ') || 'none'}`);
