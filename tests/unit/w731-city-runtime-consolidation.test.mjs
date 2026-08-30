import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W731_RETIRED_LAUNCH_LAYERS,
  EON_CITY_W731_RUNTIME_OWNER_SCHEMA,
  validateEonCityW731CommandHubContract
} from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { EON_CITY_W731_LAUNCH_ASSET_MANIFEST, validateEonCityW731LaunchAssetManifest } from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W731 establishes one compact runtime owner and removes retired world layers from the launch import graph', () => {
  assert.equal(validateEonCityW731CommandHubContract().ok, true);
  assert.equal(EON_CITY_W731_RUNTIME_OWNER_SCHEMA, 'eon.city.runtime-owner.w731.v1');
  assert.ok(EON_CITY_W731_RETIRED_LAUNCH_LAYERS.length >= 6);
  const entry = read('assets/js/city/eon-city-play-core.js');
  assert.match(entry, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.doesNotMatch(entry, /from ['"][^'"]*(?:w689|w690|w709|living-nexus|expanse)/i);
});

test('W731 launch assets are local, content-hashed and never block the first playable frame', () => {
  const result = validateEonCityW731LaunchAssetManifest();
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  const declaredAssetCount = ['coreLazy', 'coreWorld', 'stationWorld', 'stationProps', 'discoveryWorld', 'roleCharacters', 'ambientAssets']
    .reduce((count, key) => count + EON_CITY_W731_LAUNCH_ASSET_MANIFEST[key].length, 0);
  assert.equal(result.assetCount, declaredAssetCount);
  assert.ok(result.assetCount >= 8);
  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(loader, /same-origin content-hashed character and authored environment assets/i);
  assert.match(loader, /loadCore/);
  assert.match(loader, /loadRole/);
  assert.match(loader, /loadStationProp/);
  assert.match(loader, /loadAmbient/);
});

test('W731 active runtime owns exactly one engine, scene and render loop', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\(/g) || []).length, 1);
  assert.match(runtime, /oldDistrictBeltsActive: false/);
  assert.match(runtime, /expanseActive: expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'/);
});
