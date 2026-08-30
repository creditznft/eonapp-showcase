import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { EON_CITY_W649_CHARACTER_MANIFEST } from '../../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from '../../assets/js/city/w649/eon-city-w649-district-manifest.js';
import {
  EON_CITY_W666_ASSET_FUNCTIONS,
  getEonCityW666AssetFunction,
  validateEonCityW666AssetFunctions
} from '../../assets/js/city/w666/eon-city-w666-asset-function-registry.js';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W666B assigns every shipped character, prop and landmark one truthful function', () => {
  const validation = validateEonCityW666AssetFunctions();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.assetCount, EON_CITY_W649_CHARACTER_MANIFEST.entries.length + EON_CITY_W649_WORLD_MANIFEST.entries.length);
  assert.equal(validation.assignedAssetCount, validation.assetCount);
  assert.equal(EON_CITY_W666_ASSET_FUNCTIONS.length, 33);
  assert.equal(validation.everyShippedAssetHasFunction, true);
});

test('W666B every district asset resolves to a real review-first action set', () => {
  for (const district of EON_CITY_W649_DISTRICT_MANIFEST.districts) {
    for (const assetId of district.assets) {
      const entry = getEonCityW666AssetFunction(assetId);
      assert.ok(entry, `${district.id}:${assetId}`);
      assert.ok(entry.actions.length >= 1, assetId);
      assert.ok(entry.actions.every((action) => action.reviewRequired && action.explicitUserAction && !action.autoExecute && !action.autoNavigate && !action.privateDataRead), assetId);
    }
  }
});

test('W666B retains all alternate and specialist character roles', () => {
  const required = [
    'eoncity-pathfinder-prime-11clips',
    'eoncity-pathfinder-a-vanguard-6clips',
    'eoncity-eonbot-orbit',
    'eoncity-eonbot-charging-station',
    'eoncity-vault-steward-6clips',
    'eoncity-vault-steward-male-6clips',
    'security-sentinel-6clips',
    'forge-device-lab-specialist-6clips',
    'citizen-variant-6clips',
    'eon-x1-worker-9clips'
  ];
  for (const assetId of required) assert.ok(getEonCityW666AssetFunction(assetId), assetId);
});

test('current loaded GLB anchors and procedural station meshes expose exact functions to click and E interaction', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(runtime, /stationMetadata/);
  assert.match(runtime, /surface: station\.surface/);
  assert.match(runtime, /PointerEventTypes\.POINTERPICK/);
  assert.match(runtime, /keyboardCode === 'KeyE'/);
  assert.match(runtime, /event\.repeat !== true/);
  assert.match(runtime, /openSurfaceForStation/);
  assert.match(runtime, /explicitUserActionRequired: true/);
  assert.match(loader, /loadRole/);
  assert.match(loader, /loadCore/);
});

test('W666B keeps the interaction panel simple instead of showing a control wall', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(product, /\.slice\(0, 4\)/);
  assert.match(product, /Landmark interaction/);
  assert.doesNotMatch(product, /\.slice\(0, 10\).*assetActions/);
});
