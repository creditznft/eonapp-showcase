#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W146_GRAPHICS_LAYERS,
  W146_HIGH_END_AAA_RECEIPT_KEY,
  W146_HIGH_END_AAA_SCHEMA,
  applyW146HighEndAaaGraphicsPlanToWorld,
  buildW146HighEndAaaGraphicsPlan,
  createW146HighEndAaaGraphicsLayer,
  getW146RemainingPhaseSummary,
  recordW146HighEndAaaGraphicsReceipt,
  resolveW146GraphicsTier,
  scoreW146HighEndAaaGraphicsPlan
} from '../assets/js/realm3d/engine/EonCityW146HighEndAaaGraphicsRuntime.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.get(String(key)) || null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

const highDevice = { mobile: false, touch: false, deviceMemory: 16, hardwareConcurrency: 12, webgl2: true, saveData: false, reducedMotion: false };
const lowDevice = { mobile: true, touch: true, deviceMemory: 2, hardwareConcurrency: 2, webgl2: true, saveData: true, reducedMotion: true };
const city = buildEonCityVoxelWorld();
const privateWorld = buildPrivateWorkstationVoxelWorld({ owner: 'gate' });
const myRealm = buildMyRealmVoxelWorld({ username: 'gate' });
const plan = buildW146HighEndAaaGraphicsPlan({ worldKind: city.kind, quality: 'neon', world: city, device: highDevice });
const score = scoreW146HighEndAaaGraphicsPlan(plan);
const highTier = resolveW146GraphicsTier({ quality: 'neon', ...highDevice });
const lowTier = resolveW146GraphicsTier({ quality: 'neon', ...lowDevice });
const runtime = createW146HighEndAaaGraphicsLayer({ map: city, quality: 'neon' });
const lowRuntime = createW146HighEndAaaGraphicsLayer({ map: city, quality: 'low' });
const storage = new MemoryStorage();
const receipt = recordW146HighEndAaaGraphicsReceipt(storage, { plan, score });
const summary = getW146RemainingPhaseSummary();
const pkg = JSON.parse(read('package.json'));
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const voxel = read('assets/js/realm3d/engine/VoxelWorld.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const css = read('assets/css/realm3d.css');
const realmHtml = read('realm.html');

assert(W146_GRAPHICS_LAYERS.length >= 6, 'W146 must define six proof layers');
assert(plan.schema === W146_HIGH_END_AAA_SCHEMA, 'W146 plan schema missing');
assert(score.score === 100 && score.ok === true, 'W146 plan score is not 100');
assert(highTier.id === 'desktop-neon' && highTier.enabled === true && highTier.desktopOnly === true, 'high desktop tier is not enabled');
assert(lowTier.id === 'protected-low' && lowTier.enabled === false && lowTier.maxDynamicLights === 0, 'low/mobile tier is not protected');
assert(plan.districtDressing.length >= 8, 'missing district dressing proof');
assert(plan.heroNpcSkins.length >= 6, 'missing hero NPC skin proof');
assert(plan.skylineDepth.length >= 5, 'missing skyline depth proof');
assert(plan.screenshotPlan.length >= 5, 'missing screenshot proof plan');
assert(plan.budgets.mobileHeavyMeshes === 0, 'mobile heavy mesh budget must stay zero');
assert(plan.safety.secretValuesIncluded === false && plan.safety.userDataMutation === false && plan.safety.noFinancialPromises === true, 'W146 safety boundary failed');
assert(runtime.group && runtime.stats.objectCount > 20 && runtime.stats.lightCount > 0, 'desktop runtime layer did not create enough visuals');
assert(lowRuntime.group === null && lowRuntime.stats.skipped === true && lowRuntime.stats.objectCount === 0, 'low runtime should skip high-end layer');
for (const [label, world] of [['city', city], ['private', privateWorld], ['my-realm', myRealm]]) {
  applyW146HighEndAaaGraphicsPlanToWorld(world, { quality: 'neon', device: highDevice });
  assert(world.w146HighEndAaaGraphicsScore?.score === 100, `${label} world W146 score is not 100`);
  assert((world.npcs || []).some((npc) => npc.w146HeroSkin?.schema === `${W146_HIGH_END_AAA_SCHEMA}.hero-npc-skin`), `${label} world missing W146 hero NPC skins`);
}
assert(receipt?.key === W146_HIGH_END_AAA_RECEIPT_KEY && receipt.ok === true && receipt.secretValuesIncluded === false && receipt.userDataMutation === false, 'W146 receipt failed');
assert(Boolean(storage.getItem(W146_HIGH_END_AAA_RECEIPT_KEY)), 'W146 receipt was not saved');
assert(summary.highEndAaaGraphicsDone === true && !summary.phases.some((phase) => phase.id === 'W146') && summary.phases.some((phase) => phase.id === 'W147') && summary.phases.some((phase) => phase.id === 'W148'), 'W146 remaining phase summary invalid');
assert(/realmHighEndAaaGraphicsSession\s*=\s*'w146'/.test(engine), 'EngineBoot missing W146 dataset');
assert(/getW146HighEndAaaGraphicsState/.test(engine), 'EngineBoot missing W146 state');
assert(/addW146HighEndAaaGraphicsLayer/.test(voxel), 'VoxelWorld missing W146 layer');
assert(/data-w146-high-end-aaa-graphics="true"/.test(panels), 'WorldPanels missing W146 proof card');
assert(/W146 EON City high-end AAA graphics expansion/.test(css), 'CSS missing W146 marker');
assert(/w146-high-end-aaa-proof\.js/.test(realmHtml), 'realm.html missing W146 proof script');
assert(/data-w146-proof-status/.test(realmHtml), 'realm.html missing W146 proof status');
assert(Boolean(pkg.scripts?.['qa:w146-high-end-aaa-graphics']), 'package missing W146 QA script');
assert(Boolean(pkg.scripts?.['qa:w121-w146-visual-overhaul']), 'package missing W121-W146 cumulative script');

const stats = {
  schema: W146_HIGH_END_AAA_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  receiptKey: W146_HIGH_END_AAA_RECEIPT_KEY,
  highTier,
  lowTier,
  districtDressingCount: plan.districtDressing.length,
  heroNpcSkinCount: plan.heroNpcSkins.length,
  skylineDepthCount: plan.skylineDepth.length,
  screenshotSpotCount: plan.screenshotPlan.length,
  runtimeStats: runtime.stats,
  mobileRuntimeStats: lowRuntime.stats,
  remainingPhases: summary.phases,
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w146-high-end-aaa-graphics-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W146_HIGH_END_AAA_GRAPHICS_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W146] High-end AAA graphics gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W146] High-end AAA graphics passed (${stats.score}/100): ${stats.districtDressingCount} district dressings, ${stats.heroNpcSkinCount} hero NPC skins, ${stats.skylineDepthCount} skyline depth objects, ${stats.screenshotSpotCount} screenshot spots. Low devices skip heavy meshes.`);
