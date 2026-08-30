import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W248/W360 keep the identity-gated City entry, City Overview and Three.js Spatial Command Space distinct', () => {
  const portal = read('eoncity.html');
  const cityLite = read('eoncity-lite.html');
  const visualTour = read('eoncity-3d.html');
  const station = read('assets/js/eon-city-3d-station.js');
  assert.match(portal, /Checking City access/);
  assert.match(portal, /eon-city-access-station\.js/);
  assert.match(cityLite, /EON City Overview/);
  assert.match(visualTour, /Spatial Command Space/);
  assert.doesNotMatch(visualTour, /Optional 3D City View/);
  assert.match(station, /Spatial Command Space/);
  assert.match(station, /import\('\.\/city\/eon-city-3d-renderer\.js'\)/);
  assert.match(station, /pagehide/);
  assert.doesNotMatch(station, /pagehide[^\n]*\{\s*once:\s*true\s*\}/);
  assert.match(station, /pageshow/);
  assert.match(station, /destroy\?\./);
});

test('W248 makes City destination routing prepare, review, and require a separate user confirmation', () => {
  const map = read('assets/js/eon-operator-map.js');
  const station = read('assets/js/eon-city-3d-station.js');
  assert.match(map, /data-city-prepare-open/);
  assert.match(map, /data-city-confirm-open/);
  assert.match(map, /data-city-cancel-open/);
  assert.match(map, /Destination review/);
  assert.doesNotMatch(map, /data-city-open/);
  assert.match(station, /data-eon3-route-review/);
  assert.match(station, /data-eon3-confirm-district/);
  assert.match(station, /data-eon3-cancel-district/);
  assert.doesNotMatch(station, /location\.assign/);
  assert.match(station, /Nothing has opened yet/);
});

test('W248 keeps City Overview and Spatial Command Space on one safe CityWorldState rather than a second game state', () => {
  const map = read('assets/js/eon-operator-map.js');
  const station = read('assets/js/eon-city-3d-station.js');
  const state = read('assets/js/contracts/city/city-world-state.js');
  assert.match(map, /ensureCityWorldState/);
  assert.match(station, /ensureCityWorldState/);
  assert.match(state, /Vault secrets, API credentials, chat content/);
  assert.doesNotMatch(`${map}\n${station}`, /wallet.*authority|payment receiver/i);
});
