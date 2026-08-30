import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W731_FUTURE_GATEWAYS,
  EON_CITY_W731_STATIONS,
  EON_CITY_W731_WORLD_BOUNDS,
  clampEonCityW731Position
} from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W732 provides one complete compact atrium with ten nearby purposeful stations', () => {
  assert.equal(EON_CITY_W731_STATIONS.length, 10);
  assert.equal(new Set(EON_CITY_W731_STATIONS.map((station) => station.id)).size, 10);
  assert.equal(EON_CITY_W731_STATIONS.filter((station) => station.ring === 'inner').length, 5);
  assert.equal(EON_CITY_W731_STATIONS.filter((station) => station.ring === 'outer').length, 5);
  assert.ok(EON_CITY_W731_STATIONS.every((station) => Math.hypot(station.position.x, station.position.z) < EON_CITY_W731_WORLD_BOUNDS.safetyRadius));
});

test('W732 closes every launch boundary and exposes no reachable empty world', () => {
  assert.equal(EON_CITY_W731_FUTURE_GATEWAYS.length, 3);
  assert.ok(EON_CITY_W731_FUTURE_GATEWAYS.every((gateway) => gateway.available === false));
  const clamped = clampEonCityW731Position({ x: 100, y: 0, z: 100 });
  assert.equal(clamped.clamped, true);
  assert.ok(Math.hypot(clamped.x, clamped.z) <= EON_CITY_W731_WORLD_BOUNDS.safetyRadius + 0.001);
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /accessibleEmptyAreas: 0/);
  assert.match(runtime, /w737-complete-playable-boundary/);
  assert.match(runtime, /w731-closed-future-gateway/);
});

test('W732 uses readable screen-space labels and responsive City Menu UI', () => {
  const css = read('assets/css/eon-city-play.css');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /eon-city-command-labels/);
  assert.match(runtime, /eon-city-command-menu/);
  assert.match(css, /\.eon-city-command-labels/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media \(forced-colors:active\)/);
});
