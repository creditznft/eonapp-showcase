#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W156_ULTRA_SHOWCASE_LAYERS,
  W156_ULTRA_SHOWCASE_RECEIPT_KEY,
  W156_ULTRA_SHOWCASE_ROADMAP,
  W156_ULTRA_SHOWCASE_SCHEMA,
  applyW156UltraShowcasePlanToWorld,
  buildW156EonCityUltraShowcasePlan,
  createW156UltraShowcaseLayer,
  recordW156UltraShowcaseReceipt,
  resolveW156UltraShowcaseTier,
  scoreW156UltraShowcasePlan
} from '../assets/js/realm3d/engine/EonCityW156UltraShowcaseRuntime.js';

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
const plan = buildW156EonCityUltraShowcasePlan({ worldKind: city.kind, quality: 'neon', world: city, device: highDevice });
const score = scoreW156UltraShowcasePlan(plan);
const highTier = resolveW156UltraShowcaseTier({ quality: 'neon', ...highDevice });
const lowTier = resolveW156UltraShowcaseTier({ quality: 'neon', ...lowDevice });
const runtime = createW156UltraShowcaseLayer({ map: city, quality: 'neon', device: highDevice });
const lowRuntime = createW156UltraShowcaseLayer({ map: city, quality: 'low', device: lowDevice });
const storage = new MemoryStorage();
const receipt = recordW156UltraShowcaseReceipt(storage, { plan, score });
const pkg = JSON.parse(read('package.json'));
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const voxel = read('assets/js/realm3d/engine/VoxelWorld.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const css = read('assets/css/realm3d.css');
const realmHtml = read('realm.html');

assert(W156_ULTRA_SHOWCASE_LAYERS.length >= 9, 'W156 must define at least nine ultra showcase layers');
assert(W156_ULTRA_SHOWCASE_ROADMAP.length >= 10, 'W156 roadmap must plan the next sessions through final certification');
assert(plan.schema === W156_ULTRA_SHOWCASE_SCHEMA, 'W156 plan schema missing');
assert(score.ok === true && score.score === 100, 'W156 score must be 100/100');
assert(highTier.id === 'desktop-ultra' && highTier.enabled === true && highTier.maxSkylineObjects >= 50, 'desktop ultra tier not enabled or too weak');
assert(lowTier.id === 'protected-low' && lowTier.enabled === false && lowTier.maxSkylineObjects === 0, 'low/touch/save-data/reduced-motion tier must be protected');
assert(plan.cinematicEntrance?.runwayStops?.length >= 4, 'cinematic entrance must expose guided runway stops');
assert(plan.roomAudit?.allRoomsSafe === true && plan.roomAudit.rows.length >= 8, 'room/workspace audit is incomplete');
assert(plan.npcFaceKits.length >= 6 && plan.npcFaceKits.every((kit) => kit.readableFace && kit.secretSafe), 'NPC readable face kits missing or unsafe');
assert(plan.photoModeSpots.length >= 8 && plan.photoModeSpots.every((spot) => spot.privateDataExcluded), 'photo-mode proof spots incomplete');
assert(plan.portalShowcase.every((portal) => portal.userTapRequired === true && portal.autoNavigate === false), 'portal showcase must require user tap');
assert(plan.gpuGovernor.mobileHeavyMeshes === 0 && plan.gpuGovernor.reducedMotionDisablesAnimation === true && plan.gpuGovernor.saveDataDisablesHeavyMeshes === true, 'GPU governor does not protect low modes');
assert(plan.safety.secretValuesIncluded === false && plan.safety.userDataMutation === false && plan.safety.noFinancialPromises === true, 'W156 safety boundary failed');
assert(runtime.group && runtime.stats.objectCount >= 100 && runtime.stats.animatedCount >= 40 && runtime.stats.mobileHeavyMeshes === 0, 'desktop runtime layer is not rich enough or lacks mobile guard proof');
assert(lowRuntime.group === null && lowRuntime.stats.skipped === true && lowRuntime.stats.objectCount === 0, 'low runtime must skip ultra visuals');
for (const [label, world] of [['city', city], ['private', privateWorld], ['my-realm', myRealm]]) {
  applyW156UltraShowcasePlanToWorld(world, { quality: 'neon', device: highDevice });
  assert(world.w156UltraShowcaseScore?.score === 100, `${label} W156 score is not 100`);
  assert(Array.isArray(world.ultraShowcaseRoadmap) && world.ultraShowcaseRoadmap.length >= 10, `${label} roadmap missing`);
  assert((world.npcs || []).some((npc) => npc.w156HeroFaceKit?.schema === `${W156_ULTRA_SHOWCASE_SCHEMA}.npc-face-kit`), `${label} missing W156 hero face kits`);
}
assert(receipt?.key === W156_ULTRA_SHOWCASE_RECEIPT_KEY && receipt.ok === true && receipt.secretValuesIncluded === false && receipt.userDataMutation === false, 'W156 receipt failed');
assert(Boolean(storage.getItem(W156_ULTRA_SHOWCASE_RECEIPT_KEY)), 'W156 receipt was not saved');
assert(/realmUltraShowcaseSession\s*=\s*'w156'/.test(engine), 'EngineBoot missing W156 dataset');
assert(/getW156UltraShowcaseState/.test(engine), 'EngineBoot missing W156 state');
assert(/addW156UltraShowcaseLayer/.test(voxel) && /animateW156UltraShowcaseLayer/.test(voxel), 'VoxelWorld missing W156 layer or animation');
assert(/data-w156-ultra-showcase="true"/.test(panels), 'WorldPanels missing W156 proof card');
assert(/W156 EON City Ultra Showcase/.test(css), 'CSS missing W156 marker');
assert(/w156-ultra-showcase-proof\.js/.test(realmHtml), 'realm.html missing W156 proof script');
assert(Boolean(pkg.scripts?.['qa:w156-ultra-showcase']), 'package missing W156 QA script');
assert(Boolean(pkg.scripts?.['qa:w121-w156-visual-overhaul']), 'package missing W121-W156 cumulative script');

const stats = {
  schema: W156_ULTRA_SHOWCASE_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  receiptKey: W156_ULTRA_SHOWCASE_RECEIPT_KEY,
  highTier,
  lowTier,
  layers: W156_ULTRA_SHOWCASE_LAYERS.length,
  roadmap: W156_ULTRA_SHOWCASE_ROADMAP,
  roomAuditCount: plan.roomAudit.rows.length,
  npcFaceKitCount: plan.npcFaceKits.length,
  photoSpotCount: plan.photoModeSpots.length,
  runtimeStats: runtime.stats,
  lowRuntimeStats: lowRuntime.stats,
  safety: plan.safety,
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w156-ultra-showcase-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W156_ULTRA_SHOWCASE_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W156] Ultra Showcase gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W156] Ultra Showcase passed (${stats.score}/100): ${stats.roomAuditCount} rooms audited, ${stats.npcFaceKitCount} NPC face kits, ${stats.photoSpotCount} photo spots, ${stats.runtimeStats.objectCount} runtime objects, low devices protected.`);
