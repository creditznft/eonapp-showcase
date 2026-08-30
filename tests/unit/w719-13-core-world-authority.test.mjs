import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';
import {
  EON_CITY_W719_CORE_WORLD_SCHEMA,
  clampEonCityW719CorePoint,
  projectEonCityW719CoreWorldAuthority
} from '../../assets/js/city/w719/eon-city-w719-core-world-authority.js';

test('W719.13 retires the stale ±13 clamp for the complete connected Core', () => {
  const authority = projectEonCityW719CoreWorldAuthority(buildEonCityConnectedCorePlan({ quality: 'balanced' }));
  assert.equal(authority.schema, EON_CITY_W719_CORE_WORLD_SCHEMA);
  assert.ok(authority.worldBound >= 92);
  assert.equal(authority.districtCount, 9);
  assert.equal(authority.legacyWorldBoundRetired, true);
  assert.equal(authority.gatewayReachable, true);
  assert.equal(authority.gatewayApproachReachable, true);
});

test('W719.13 Orientation Hall arrival and Expanse approach share the same reachable authority', () => {
  const authority = projectEonCityW719CoreWorldAuthority(buildEonCityConnectedCorePlan({ quality: 'balanced' }));
  assert.deepEqual(authority.arrival, { districtId: 'orientation-hall', x: -2.4, y: 0, z: 40.8, heading: 0 });
  assert.equal(authority.gateway.z, 59.2);
  assert.equal(authority.gatewayApproach.z, 55.8);
  assert.deepEqual(clampEonCityW719CorePoint(authority.gatewayApproach, authority), { x: 0, y: 0, z: 55.8 });
});

test('W719.13 active Babylon source uses connected Core bounds for movement and guidance', async () => {
  const source = await import('node:fs').then(({ readFileSync }) => readFileSync(new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url), 'utf8'));
  assert.match(source, /projectEonCityW719CoreWorldAuthority/);
  assert.match(source, /const CORE_WORLD_BOUND = Math\.max\(LEGACY_CORE_WORLD_BOUND, coreWorldAuthority\.worldBound\)/);
  assert.match(source, /bounds: livingNexusSummary\.destination === 'core' \? CORE_WORLD_BOUND/);
  assert.doesNotMatch(source, /const MAX_WORLD = 13/);
  assert.match(source, /operator\.position\.set\(initialCoreArrival\.x/);
  assert.match(source, /resolveEonCityW719ArrivalCamera/);
});
