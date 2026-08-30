import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  resolveEonCityW660iDistrictAtPosition,
  resolveEonCityW660iDistrictTransition
} from '../../assets/js/city/w660i/eon-city-w660i-district-config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W665 district hysteresis rejects boundary jitter but switches after clear entry', () => {
  assert.equal(resolveEonCityW660iDistrictAtPosition({ x: 0, z: 4 })?.id, 'transit-network', 'raw nearest changes early');
  assert.equal(resolveEonCityW660iDistrictTransition({ x: 0, z: 4 }, { currentDistrictId: 'orientation-hall' })?.id, 'orientation-hall', 'hysteresis should keep the current authored room');
  assert.equal(resolveEonCityW660iDistrictTransition({ x: 0, z: 3.7 }, { currentDistrictId: 'orientation-hall' })?.id, 'orientation-hall');
  assert.equal(resolveEonCityW660iDistrictTransition({ x: 0, z: 2 }, { currentDistrictId: 'orientation-hall' })?.id, 'transit-network', 'clear entry should switch');
  assert.equal(resolveEonCityW660iDistrictTransition({ x: 0, z: 3.9 }, { currentDistrictId: 'transit-network' })?.id, 'transit-network', 'return jitter should not immediately switch back');
});

test('W665/W671/W675 keep compatible hysteresis across expanded product and paid-asset district authorities', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const district = read('assets/js/city/w649/eon-city-w649-district-runtime.js');

  // W675 expanded the product-level resolver beyond the original W660I room map,
  // while W671 retained explicit boundary stabilization for that larger authority.
  assert.match(product, /resolveEonCityW675DistrictAtPosition/);
  assert.match(product, /createEonCityW671DistrictBoundaryStabilizer/);
  assert.match(product, /nearestDistrict\(currentPosition, currentDistrict\.id\)/);
  assert.match(product, /districtBoundary\.update/);

  // W675 also expanded the loaded W649 paid-asset authority. It retains
  // current-district hysteresis plus its own residency-radius safety checks.
  assert.match(district, /resolveEonCityW675DistrictAtPosition/);
  assert.match(district, /resolveEonCityW649DistrictAtPosition\(position, \{ currentDistrictId: activeDistrictId \}\)/);
  assert.match(district, /insideCurrentExit/);
});

test('W665 keeps two balanced/cinematic district residencies and never unloads the old room before the new room is ready', () => {
  const performance = read('assets/js/city/w649/eon-city-w649-performance-profile.js');
  const district = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  assert.match(performance, /balanced: freeze\(\{[\s\S]*?maxResidentDistricts: 2/);
  assert.match(performance, /cinematic: freeze\(\{[\s\S]*?maxResidentDistricts: 2/);
  assert.match(district, /const MAX_RESIDENT_DISTRICTS = 2/);
  assert.match(district, /enforceResidentLimit\('district-overlap-complete'\)/);
  assert.match(district, /previousActiveDistrictId/);
  assert.doesNotMatch(district, /for \(const residentId of \[\.\.\.residents\.keys\(\)\]\) if \(residentId !== districtId\) unloadDistrict/);
});

test('W665 procedural composition cross-fades outgoing and incoming districts instead of one-frame replacement', () => {
  const composition = read('assets/js/city/w660i/eon-city-w660i-district-composition.js');
  assert.match(composition, /DISTRICT_OVERLAP_SECONDS = 0\.85/);
  assert.match(composition, /let retiring = null/);
  assert.match(composition, /overlap-start/);
  assert.match(composition, /setRecordVisibility\(retiring, 1 - progress\)/);
  assert.match(composition, /setRecordVisibility\(active, reducedMotion \? 1 : 0\.16 \+ progress \* 0\.84\)/);
  assert.match(composition, /overlap-complete/);
  assert.match(composition, /maxResidentDistrictCount: 2/);
});
