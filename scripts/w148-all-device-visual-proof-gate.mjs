#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY,
  W148_ALL_DEVICE_VISUAL_PROOF_SCHEMA,
  W148_DEVICE_PROFILES,
  applyW148AllDeviceVisualProofToWorld,
  buildW148AllDeviceVisualProofLab,
  buildW148GeneratedRealmQualityParity,
  getW148FinalPhaseSummary,
  recordW148AllDeviceVisualProofReceipt,
  scoreW148AllDeviceVisualProofLab
} from '../assets/js/realm3d/engine/EonCityW148AllDeviceVisualProofRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';

const root = process.cwd();
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.get(String(key)) || null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

const city = buildEonCityVoxelWorld();
const privateWorld = buildPrivateWorkstationVoxelWorld({ owner: 'gate' });
const myRealm = buildMyRealmVoxelWorld({ username: 'gate', seed: 'w148' });
const plan = buildW148AllDeviceVisualProofLab({ worldKind: city.kind, world: city });
const score = scoreW148AllDeviceVisualProofLab(plan);
const realmParity = buildW148GeneratedRealmQualityParity({ realmWorld: myRealm, cityWorld: city });
const realmPlan = buildW148AllDeviceVisualProofLab({ worldKind: myRealm.kind, world: myRealm, cityReferenceWorld: city });
const realmScore = scoreW148AllDeviceVisualProofLab(realmPlan);
const storage = new MemoryStorage();
const receipt = recordW148AllDeviceVisualProofReceipt(storage, { plan: realmPlan, score: realmScore });
const finalSummary = getW148FinalPhaseSummary();
const pkg = JSON.parse(read('package.json'));
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const voxel = read('assets/js/realm3d/engine/VoxelWorld.js');
const map = read('assets/js/realm3d/engine/EonCityMap.js');
const generator = read('assets/js/realm3d/engine/EonCityRealmGeneratorV2.js');
const css = read('assets/css/realm3d.css');
const realmHtml = read('realm.html');

assert(W148_DEVICE_PROFILES.length >= 7, 'W148 must define at least seven device profiles');
assert(plan.schema === W148_ALL_DEVICE_VISUAL_PROOF_SCHEMA, 'W148 plan schema missing');
assert(score.score === 100 && score.ok === true, 'W148 city plan score is not 100');
assert(realmScore.score === 100 && realmScore.ok === true, 'W148 generated realm plan score is not 100');
assert(realmParity.ok === true && realmParity.score === 100, 'W148 generated realm parity is not 100');
assert(plan.devicePolicies.lowPhoneProtected === true, 'W148 low phone is not protected');
assert(plan.devicePolicies.reducedMotionProtected === true, 'W148 reduced motion is not protected');
assert(plan.devicePolicies.saveDataProtected === true, 'W148 save-data is not protected');
assert(plan.devicePolicies.highDesktopAaaEnabled === true, 'W148 high desktop AAA is not enabled');
assert(Number(plan.devicePolicies.mobileHeavyMeshes || 0) === 0, 'W148 mobile heavy mesh budget must be zero');
assert(plan.screenshotPlan.length >= 7, 'W148 screenshot proof plan missing profiles');
assert(plan.upstreamProof.w146.ok === true && plan.upstreamProof.w147.ok === true, 'W148 upstream W146/W147 proof missing');
assert(myRealm.eonCityQualityGeneratedRealm === true, 'My Realm is not marked as EON City-quality generated realm');
assert(myRealm.w148GeneratedRealmQualityParity?.ok === true, 'My Realm missing W148 parity proof');
assert(myRealm.workstationScreens.length >= 10 && myRealm.districts.length >= 7 && myRealm.npcs.length >= 6, 'My Realm does not have enough EON City-quality content');
assert(myRealm.realmGeneratorV2?.w148EonCityQualityBridge?.target?.includes('EON City-quality'), 'Realm Generator V2 missing W148 quality bridge');
for (const [label, world] of [['city', city], ['private', privateWorld], ['my-realm', myRealm]]) {
  applyW148AllDeviceVisualProofToWorld(world, { cityReferenceWorld: label === 'my-realm' ? city : null });
  assert(world.w148AllDeviceVisualProofScore?.score === 100, `${label} W148 score is not 100`);
}
assert(receipt?.key === W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY && receipt.ok === true && receipt.generatedRealmParityOk === true, 'W148 receipt failed');
assert(receipt.secretValuesIncluded === false && receipt.userDataMutation === false && receipt.noFinancialPromises === true, 'W148 receipt safety failed');
assert(Boolean(storage.getItem(W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY)), 'W148 receipt was not saved');
assert(finalSummary.completedPhase === 'W148' && finalSummary.remainingPhases.length === 0, 'W148 final summary still has remaining phases');
assert(/realmAllDeviceProofSession\s*=\s*'w148'/.test(engine), 'EngineBoot missing W148 dataset');
assert(/getW148AllDeviceVisualProofState/.test(engine), 'EngineBoot missing W148 state');
assert(/data-w148-all-device-visual-proof="true"/.test(panels), 'WorldPanels missing W148 proof card');
assert(/w148AllDeviceVisualProof/.test(voxel), 'VoxelWorld missing W148 telemetry');
assert(/applyW148AllDeviceVisualProofToWorld/.test(map), 'EonCityMap missing W148 world finalizer');
assert(/w148EonCityQualityBridge/.test(generator), 'Realm generator missing W148 bridge');
assert(/W148 EON City all-device visual proof lab/.test(css), 'CSS missing W148 marker');
assert(/w148-all-device-proof-lab\.js/.test(realmHtml), 'realm.html missing W148 proof script');
assert(/data-w148-proof-status/.test(realmHtml), 'realm.html missing W148 proof status');
assert(Boolean(pkg.scripts?.['qa:w148-all-device-visual-proof']), 'package missing W148 QA script');
assert(Boolean(pkg.scripts?.['qa:w121-w148-visual-overhaul']), 'package missing W121-W148 cumulative script');
assert(Boolean(pkg.scripts?.['qa:final-codex-merge-handoff']), 'package missing final Codex merge handoff script');

const stats = {
  schema: W148_ALL_DEVICE_VISUAL_PROOF_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  receiptKey: W148_ALL_DEVICE_VISUAL_PROOF_RECEIPT_KEY,
  deviceProfiles: W148_DEVICE_PROFILES.map((profile) => profile.id),
  cityScore: score.score,
  myRealmScore: realmScore.score,
  generatedRealmParity: realmParity,
  finalSummary,
  packageMode: 'compact-codex-merge-zip',
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w148-all-device-visual-proof-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W148_ALL_DEVICE_VISUAL_PROOF_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W148] all-device visual proof gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W148] all-device visual proof passed (${stats.score}/100): ${stats.deviceProfiles.length} profiles, My Realm parity ${realmParity.score}/100, mobile heavy meshes 0.`);
