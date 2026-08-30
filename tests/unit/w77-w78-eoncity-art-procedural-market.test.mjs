import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildProceduralCityChunks, buildRealmTemplateCatalog, buildUnifiedUpgradeMarketBlueprint, scoreEonCityArtQuality } from '../../assets/js/realm3d/engine/EonCityProceduralCity.js';

const mapSource = fs.readFileSync('assets/js/realm3d/engine/EonCityMap.js', 'utf8');
const worldSource = fs.readFileSync('assets/js/realm3d/engine/VoxelWorld.js', 'utf8');
const panelsSource = fs.readFileSync('assets/js/realm3d/engine/WorldPanels.js', 'utf8');
const blueprintSource = fs.readFileSync('assets/js/realm3d/engine/EonCityMegaBlueprint.js', 'utf8');
const blockSource = fs.readFileSync('assets/js/realm3d/engine/BlockPalette.js', 'utf8');

test('EON City now builds dense procedural chunks, skyline, billboards, and weather metadata', () => {
  const world = buildEonCityVoxelWorld();
  assert.equal(world.proceduralCity.schema, 'eon.realm3d.procedural-city.w77.v1');
  assert.ok(world.proceduralCity.chunks.length >= 8);
  assert.ok(world.blocks.some((block) => block.type === 'holoBillboard'));
  assert.ok(world.blocks.some((block) => block.type === 'skylineGlass'));
  assert.ok(world.blocks.some((block) => block.type === 'laneGlow'));
  assert.deepEqual(world.atmosphere.weather.includes('soft-rain'), true);
  assert.ok(world.artQualityScore.total >= 85);
});

test('one unified AI Upgrade Market replaces confusing separate store layers', () => {
  const market = buildUnifiedUpgradeMarketBlueprint();
  const city = buildEonCityVoxelWorld();
  assert.equal(market.id, 'ai-upgrade-market');
  assert.ok(market.replacesConfusingStores.includes('marketplace'));
  assert.ok(market.replacesConfusingStores.includes('eon-team-store'));
  assert.ok(market.replacesConfusingStores.includes('realm-store'));
  assert.ok(market.categories.length >= 6);
  assert.match(market.economyRule, /temporary access/i);
  assert.equal(market.noInvestmentPromise, true);
  assert.equal(city.unifiedMarket.label, 'AI Upgrade Market');
  assert.match(blockSource, /Unified AI Upgrade Market/);
});

test('generated user realms have high-quality safe templates and mini-city chunks', () => {
  const templates = buildRealmTemplateCatalog();
  const realm = buildMyRealmVoxelWorld({ username: 'artist', seed: 'w78' });
  assert.ok(templates.length >= 6);
  assert.ok(realm.seedEnvelope.template);
  assert.equal(realm.seedEnvelope.safeTemplatesOnly, true);
  assert.equal(realm.seedEnvelope.noArbitraryHtml, true);
  assert.ok(realm.proceduralCity.chunks.length >= 8);
  assert.ok(realm.workstationScreens.length >= 6);
  assert.ok(realm.artQualityScore.total >= 85);
});

test('EON City visual runtime includes weather, skyline, and art-direction panel support', () => {
  assert.match(worldSource, /addWeatherAndSkylineEffects/);
  assert.match(worldSource, /weather-particles/);
  assert.match(worldSource, /skyline-impostor-ring/);
  assert.match(panelsSource, /renderEonBotDialogue/);
  assert.match(panelsSource, /buildUnifiedUpgradeMarketBlueprint/);
  assert.match(panelsSource, /one ad\/share can unlock temporary access only/i);
});

test('W77-W84 overview remains encoded for the remaining phases', () => {
  assert.match(blueprintSource, /EON_CITY_REMAINING_WAVES/);
  assert.match(blueprintSource, /w79/);
  assert.match(blueprintSource, /NFT generator and unified AI Upgrade Market UI/);
  assert.match(blueprintSource, /w84/);
});

test('procedural chunks are deterministic for same seed and diverse across chunk types', () => {
  const a = buildProceduralCityChunks({ seed: 'same', radius: 2 });
  const b = buildProceduralCityChunks({ seed: 'same', radius: 2 });
  assert.deepEqual(a.map((chunk) => [chunk.id, chunk.type, chunk.blocks.length]), b.map((chunk) => [chunk.id, chunk.type, chunk.blocks.length]));
  assert.ok(new Set(a.map((chunk) => chunk.type)).size >= 3);
  assert.ok(scoreEonCityArtQuality({ blocks: a.flatMap((chunk) => chunk.blocks), proceduralCity: { chunks: a }, unifiedMarket: buildUnifiedUpgradeMarketBlueprint(), realmTemplates: buildRealmTemplateCatalog(), workstationScreens: new Array(6), atmosphere: { weather: ['rain', 'haze', 'aurora'] } }).total >= 85);
});
