import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_PLAY_ART_BIBLE,
  CITY_PLAY_ART_BUDGETS,
  CITY_PLAY_ART_DIRECTION_SCHEMA,
  CITY_PLAY_NEON_COMMAND_PALETTE,
  CITY_PLAY_ORIGINAL_ASSET_LEDGER,
  getCityPlayArtBudget
} from '../../assets/js/city/eon-city-play-art-direction.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W252 art direction is original, source-controlled and cannot introduce a runtime asset fetch', () => {
  assert.equal(CITY_PLAY_ART_DIRECTION_SCHEMA, 'eon.city.play.art-direction.w252.v1');
  assert.equal(CITY_PLAY_ORIGINAL_ASSET_LEDGER.length, 4);
  for (const asset of CITY_PLAY_ORIGINAL_ASSET_LEDGER) {
    assert.equal(asset.runtimeNetwork, false);
    assert.equal(asset.userData, false);
    assert.match(asset.kind, /^procedural-(?:geometry|text-canvas)$|^source-colour-system$/);
    assert.match(asset.origin, /^EONAPP original/);
    assert.match(asset.licence, /^EONAPP controlled original work$/);
    assert.match(asset.sourcePath, /^assets\/js\/city\//);
    assert.doesNotMatch(JSON.stringify(asset), /https?:|cdn|marketplace|stock|copied/i);
  }
  assert.match(CITY_PLAY_ART_BIBLE.performance, /no remote assets/i);
  assert.match(CITY_PLAY_ART_BIBLE.accessibility, /reduced-effects/i);
  assert.equal(CITY_PLAY_NEON_COMMAND_PALETTE.cyan, '#7cf9ff');
});

test('W252 profiles impose bounded original-art detail instead of promising one graphics level for every device', () => {
  const lite = getCityPlayArtBudget('lite');
  const balanced = getCityPlayArtBudget('balanced');
  const cinematic = getCityPlayArtBudget('cinematic');
  assert.equal(getCityPlayArtBudget('unknown'), balanced);
  for (const budget of [lite, balanced, cinematic]) {
    assert.ok(budget.facadeFins > 0 && budget.facadeFins <= 7);
    assert.ok(budget.streetProps > 0 && budget.streetProps <= 16);
    assert.ok(budget.skylineTowers > 0 && budget.skylineTowers <= 10);
    assert.ok(budget.signCount > 0 && budget.signCount <= 6);
    assert.ok(budget.textureMaxPx <= 1024);
  }
  assert.ok(lite.facadeFins < balanced.facadeFins && balanced.facadeFins < cinematic.facadeFins);
  assert.ok(lite.streetProps < balanced.streetProps && balanced.streetProps < cinematic.streetProps);
  assert.equal(CITY_PLAY_ART_BUDGETS.lite.particleCap, 0);
});

test('W252/W649 Babylon scene preserves the original procedural shell while loading only approved same-origin binary art', () => {
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const art = read('assets/js/city/eon-city-play-art-direction.js');
  const core = read('assets/js/city/w649/eon-city-w649-babylon-core-runtime.js');
  const districts = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  const manifest = read('assets/js/city/w649/eon-city-w649-character-manifest.js');
  assert.match(scene, /getCityPlayArtBudget/);
  assert.match(scene, /CITY_PLAY_NEON_COMMAND_PALETTE/);
  assert.match(scene, /DynamicTexture/);
  assert.match(scene, /createDistrictSign/);
  assert.match(scene, /addDistrictFurnishings/);
  assert.match(scene, /createEonCityW649BabylonCoreRuntime/);
  assert.match(scene, /createEonCityW649DistrictRuntime/);
  assert.match(core, /SceneLoader\.LoadAssetContainerAsync/);
  assert.match(core, /\/assets\/vendor\/babylon\/meshopt_decoder\.js/);
  assert.match(districts, /\/assets\/city\/w649\//);
  assert.match(manifest, /\/assets\/city\/w649\/(?:primary|fallback)\/characters\//);
  assert.doesNotMatch(`${scene}\n${art}\n${core}\n${districts}\n${manifest}`, /https?:\/\//);
  assert.doesNotMatch(`${scene}\n${art}\n${core}\n${districts}`, /XMLHttpRequest|WebSocket|EventSource/);
  assert.match(art, /provenance|original/i);
  assert.match(art, /No copied|original/i);
});
