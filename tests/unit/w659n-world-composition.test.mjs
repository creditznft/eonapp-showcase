import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityW659nWorldPolishPlan } from '../../assets/js/city/w659n/eon-city-w659n-product-layer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('W659N perimeter composition keeps duplicate procedural landmarks away from active district centres', () => {
  const plan = getEonCityW659nWorldPolishPlan('cinematic');
  assert.equal(plan.schema, 'eon.city.w659n.world-polish-plan.v2');
  assert.equal(plan.quality, 'cinematic');
  assert.ok(plan.landmarkScale <= 0.42);
  assert.equal(plan.landmarks.length, 5);
  for (const landmark of plan.landmarks) {
    assert.ok(Math.hypot(landmark.x, landmark.z) >= 15, `${landmark.type} must remain a perimeter silhouette`);
  }
});

test('W659N decorative polish cannot intercept interaction or camera-occlusion picking', () => {
  const source = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(source, /mesh\.isPickable = false/);
  assert.match(source, /mesh\.checkCollisions = false/);
  assert.match(source, /eonCityCameraOcclusion: false/);
  assert.match(source, /residentAssetDuplicate: true/);
});

test('City runtime summary uses dedicated non-recursive residency readers', () => {
  const core = read('assets/js/city/eon-city-play-core.js');
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const districtRuntime = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  const coreRuntime = read('assets/js/city/w649/eon-city-w649-babylon-core-runtime.js');
  assert.match(core, /getCoreResidencySummary:\s*readCoreResidencySummary/);
  assert.match(core, /w649CoreRuntime\?\.getResidencySummary\?\.\(\)/);
  assert.match(core, /districtRuntime\?\.getResidencySummary\?\.\(\)/);
  assert.match(product, /coreRuntime\?\.getCoreResidencySummary\?\.\(\)/);
  assert.match(districtRuntime, /const getResidencySummary = \(\) =>/);
  assert.match(coreRuntime, /getResidencySummary\(\)/);
  assert.doesNotMatch(product, /getResidency[\s\S]{0,240}getRuntimeSummary/);
});

test('Core world keeps Orientation Hall and Command Centre as distinct navigable landmarks', () => {
  const core = read('assets/js/city/eon-city-play-core.js');
  assert.match(core, /id: 'orientation', districtId: 'orientation-hall'/);
  assert.match(core, /id: 'command', districtId: 'command-centre'/);
  assert.match(core, /focusCommandDeck\(\) \{ return this\.focusLandmark\('command'\); \}/);
});

test('Decorative skyline and elevated transit stay outside the default district camera corridor', () => {
  const noir = read('assets/js/city/eon-city-noir-architecture.js');
  assert.match(noir, /y: 11\.2, z: -24\.4/);
  assert.match(noir, /\[-18\.8, -28\.8/);
  assert.doesNotMatch(noir, /y: 7\.6, z: -8\.8/);
});
