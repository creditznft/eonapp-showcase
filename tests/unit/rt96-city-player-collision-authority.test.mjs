import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_W765R6_PLAYER_COLLISION_RADIUS,
  createEonCityW765R6PlayerCollisionZones,
  resolveEonCityW765R6PlayerCollision,
  findEonCityW765R6NearestSafePosition,
  isEonCityW765R6PositionCollisionFree
} from '../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('RT96 deterministic player collision blocks station-core penetration while preserving approach space', () => {
  const station = EON_CITY_W731_STATIONS.find((entry) => entry.id === 'create-forge');
  const zones = createEonCityW765R6PlayerCollisionZones([{ id: `station:${station.id}`, position: station.position, footprintRadius: station.footprintRadius }]);
  assert.equal(zones.length, 1);
  assert.equal(zones[0].radius, station.footprintRadius + EON_CITY_W765R6_PLAYER_COLLISION_RADIUS);
  const previous = { x: station.position.x, y: 0, z: station.position.z + zones[0].radius + 0.5 };
  const requested = { x: station.position.x, y: 0, z: station.position.z + 0.1 };
  const resolved = resolveEonCityW765R6PlayerCollision(requested, previous, zones);
  assert.equal(resolved.collisionBlocked, true);
  assert.ok(Math.hypot(resolved.x - station.position.x, resolved.z - station.position.z) >= zones[0].radius - 1e-9);
  assert.deepEqual(resolved.collisionZoneIds, [`station:${station.id}`]);
});

test('RT96 collision authority permits a legacy inside-zone pose to move outward', () => {
  const zones = createEonCityW765R6PlayerCollisionZones([{ id: 'core', position: { x: 0, z: 0 }, footprintRadius: 2 }]);
  const resolved = resolveEonCityW765R6PlayerCollision({ x: 1.2, y: 0, z: 0 }, { x: 0.4, y: 0, z: 0 }, zones);
  assert.equal(resolved.collisionBlocked, false);
  assert.equal(resolved.x, 1.2);
});

test('RT96 W731 movement applies footprint collision after world bounds and before player position assignment', () => {
  assert.match(runtime, /const next = expanseMovementActive[\s\S]{0,520}resolveEonCityW765R6PlayerCollision\(next, playerAnchor\.position, playerCollisionZones\)/);
  assert.match(runtime, /playerAnchor\.position\.set\(resolvedNext\.x, expanseMovementActive \? 0\.15 : 0, resolvedNext\.z\)/);
  assert.match(runtime, /data|eonCityPlayerCollision/);
});


test('RT96 unstuck recovery finds a nearby deterministic safe pose before falling back to spawn', () => {
  const zones = createEonCityW765R6PlayerCollisionZones([{ id: 'core', position: { x: 0, z: 0 }, footprintRadius: 2 }]);
  const result = findEonCityW765R6NearestSafePosition({ x: 0, y: 0, z: 0 }, zones, { fallback: { x: 0, y: 0, z: 8.8 }, step: 0.5, rings: 12, samplesPerRing: 16 });
  assert.equal(result.ok, true);
  assert.equal(result.recovered, true);
  assert.equal(result.reason, 'nearest-safe-ring');
  assert.equal(isEonCityW765R6PositionCollisionFree(result.position, zones).ok, true);
  assert.ok(result.distance < 8.8);
});

test('RT96 runtime unstuck uses nearest-safe collision recovery and persists the repaired pose', () => {
  assert.match(runtime, /findEonCityW765R6NearestSafePosition\(playerAnchor\.position, playerCollisionZones/);
  assert.match(runtime, /writeResume\(playerAnchor\.position, playerAnchor\.rotation\.y, activeStationId\)/);
  assert.match(runtime, /eonCityLastUnstuckReason/);
});
