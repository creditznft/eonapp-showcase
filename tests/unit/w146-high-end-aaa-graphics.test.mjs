import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

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
} from '../../assets/js/realm3d/engine/EonCityW146HighEndAaaGraphicsRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.get(String(key)) || null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

test('W146 graphics tier enables desktop neon and protects mobile/low devices', () => {
  const neon = resolveW146GraphicsTier({ quality: 'neon', mobile: false, touch: false, deviceMemory: 16, hardwareConcurrency: 12, webgl2: true });
  const low = resolveW146GraphicsTier({ quality: 'neon', mobile: true, touch: true, deviceMemory: 2, hardwareConcurrency: 2, webgl2: true, saveData: true });
  assert.equal(neon.id, 'desktop-neon');
  assert.equal(neon.enabled, true);
  assert.equal(neon.desktopOnly, true);
  assert.equal(neon.maxDynamicLights >= 10, true);
  assert.equal(low.id, 'protected-low');
  assert.equal(low.mobileProtected, true);
  assert.equal(low.maxDynamicLights, 0);
  assert.equal(low.maxSkylineDepthObjects, 0);
});

test('W146 plan scores 100 with all desktop AAA proof layers', () => {
  const city = buildEonCityVoxelWorld();
  const plan = buildW146HighEndAaaGraphicsPlan({ worldKind: city.kind, quality: 'neon', world: city, device: { deviceMemory: 16, hardwareConcurrency: 12, webgl2: true } });
  const score = scoreW146HighEndAaaGraphicsPlan(plan);
  assert.equal(plan.schema, W146_HIGH_END_AAA_SCHEMA);
  assert.equal(score.score, 100);
  assert.equal(score.ok, true);
  assert.equal(W146_GRAPHICS_LAYERS.length >= 6, true);
  assert.equal(plan.layers.some((layer) => layer.id === 'desktop-cinematic-lighting'), true);
  assert.equal(plan.layers.some((layer) => layer.id === 'hero-npc-skins'), true);
  assert.equal(plan.layers.some((layer) => layer.id === 'mobile-performance-guard'), true);
  assert.equal(plan.districtDressing.length >= 8, true);
  assert.equal(plan.heroNpcSkins.length >= 6, true);
  assert.equal(plan.screenshotPlan.length >= 5, true);
  assert.equal(plan.budgets.mobileHeavyMeshes, 0);
  assert.equal(plan.safety.secretValuesIncluded, false);
  assert.equal(plan.safety.userDataMutation, false);
  assert.equal(plan.safety.noFinancialPromises, true);
});

test('W146 decorates city, private workstation, and generated realm worlds', () => {
  for (const world of [buildEonCityVoxelWorld(), buildPrivateWorkstationVoxelWorld({ owner: 'unit' }), buildMyRealmVoxelWorld({ username: 'unit' })]) {
    applyW146HighEndAaaGraphicsPlanToWorld(world, { quality: 'neon', device: { deviceMemory: 16, hardwareConcurrency: 12, webgl2: true } });
    assert.equal(world.w146HighEndAaaGraphicsPlan.schema, W146_HIGH_END_AAA_SCHEMA);
    assert.equal(world.w146HighEndAaaGraphicsScore.score, 100);
    assert.equal(world.w146HighEndAaaGraphicsPlan.budgets.mobileHeavyMeshes, 0);
    assert.ok(world.npcs.some((npc) => npc.w146HeroSkin?.schema), `${world.kind} missing hero NPC skin`);
  }
});

test('W146 runtime layer creates desktop visuals and skips low mode', () => {
  const city = buildEonCityVoxelWorld();
  const neon = createW146HighEndAaaGraphicsLayer({ map: city, quality: 'neon' });
  assert.ok(neon.group);
  assert.equal(neon.stats.skipped, false);
  assert.equal(neon.stats.objectCount > 20, true);
  assert.equal(neon.stats.lightCount > 0, true);
  assert.equal(neon.stats.mobileHeavyMeshes, 0);
  const low = createW146HighEndAaaGraphicsLayer({ map: city, quality: 'low' });
  assert.equal(low.group, null);
  assert.equal(low.stats.skipped, true);
  assert.equal(low.stats.objectCount, 0);
});

test('W146 receipt is local, redacted, and does not mutate protected app data', () => {
  const storage = new MemoryStorage();
  const plan = buildW146HighEndAaaGraphicsPlan({ worldKind: 'eon-city', quality: 'neon', world: buildEonCityVoxelWorld(), device: { deviceMemory: 16, hardwareConcurrency: 12, webgl2: true } });
  const score = scoreW146HighEndAaaGraphicsPlan(plan);
  const receipt = recordW146HighEndAaaGraphicsReceipt(storage, { plan, score });
  assert.equal(receipt.key, W146_HIGH_END_AAA_RECEIPT_KEY);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.secretValuesIncluded, false);
  assert.equal(receipt.userDataMutation, false);
  assert.equal(JSON.stringify(receipt).includes('sk-live'), false);
  assert.equal(Boolean(storage.getItem(W146_HIGH_END_AAA_RECEIPT_KEY)), true);
});

test('W146 engine, panel, CSS, route, and package scripts are wired', () => {
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /realmHighEndAaaGraphicsSession\s*=\s*'w146'/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /getW146HighEndAaaGraphicsState/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /data-w146-high-end-aaa-tier/);
  assert.match(read('assets/js/realm3d/engine/VoxelWorld.js'), /addW146HighEndAaaGraphicsLayer/);
  assert.match(read('assets/js/realm3d/engine/WorldPanels.js'), /data-w146-high-end-aaa-graphics="true"/);
  assert.match(read('assets/css/realm3d.css'), /W146 EON City high-end AAA graphics expansion/);
  assert.match(read('realm.html'), /w146-high-end-aaa-proof\.js/);
  assert.match(read('realm.html'), /data-w146-proof-status/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['qa:w146-high-end-aaa-graphics']);
  assert.ok(pkg.scripts['qa:w121-w146-visual-overhaul']);
});

test('W146 remaining phase summary moves to W147 and W148', () => {
  const summary = getW146RemainingPhaseSummary();
  assert.equal(summary.completedPhase, 'W146');
  assert.equal(summary.highEndAaaGraphicsDone, true);
  assert.equal(summary.phases.some((phase) => phase.id === 'W146'), false);
  assert.ok(summary.phases.some((phase) => phase.id === 'W147'));
  assert.ok(summary.phases.some((phase) => phase.id === 'W148'));
});

test('W146 generated stats prove completion after gate runs', () => {
  const statsPath = path.join(root, 'artifacts', 'W146_HIGH_END_AAA_GRAPHICS_STATS_2026-06-13.json');
  if (!fs.existsSync(statsPath)) return;
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W146_HIGH_END_AAA_SCHEMA);
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
  assert.equal(stats.receiptKey, W146_HIGH_END_AAA_RECEIPT_KEY);
});
