import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES, EON_CITY_COMMAND_DISTRICT_SPAWN, findEonCityCommandDistrictUnstuckPoint } from '../../assets/js/city/eon-city-command-district-vertical-slice.js';
import {
  createEonCityWayfinderStateDirector,
  EON_CITY_WAYFINDER_CAMERA_PROFILES,
  EON_CITY_WAYFINDER_INPUT_CONTRACT,
  EON_CITY_WAYFINDER_STATES,
  EON_CITY_WAYFINDER_VISUAL_PROFILE,
  resolveEonCityWayfinderCamera,
  resolveEonCityWayfinderState,
  validateEonCityWayfinderExperience
} from '../../assets/js/city/eon-city-wayfinder-experience.js';
import { validateW624dWayfinderCameraContract } from '../../config/w624d-wayfinder-camera-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W624D freezes nine inclusive cosmetic-only Wayfinder states', () => {
  assert.equal(validateEonCityWayfinderExperience().ok, true);
  assert.deepEqual(EON_CITY_WAYFINDER_STATES, ['idle', 'walk', 'run', 'turn', 'interact', 'inspect', 'celebrate', 'sit-work', 'recovery']);
  assert.equal(EON_CITY_WAYFINDER_VISUAL_PROFILE.inclusive, true);
  assert.equal(EON_CITY_WAYFINDER_VISUAL_PROFILE.sexualized, false);
  assert.equal(EON_CITY_WAYFINDER_VISUAL_PROFILE.payToWin, false);
  assert.equal(EON_CITY_WAYFINDER_VISUAL_PROFILE.bodyTypeStatEffect, false);
});

test('W624D resolves motion and transient states deterministically with reduced-motion fallback', () => {
  assert.equal(resolveEonCityWayfinderState({ moving: true, speed: 4.8 }), 'walk');
  assert.equal(resolveEonCityWayfinderState({ moving: true, speed: 5.4 }), 'run');
  assert.equal(resolveEonCityWayfinderState({ turnRate: 2 }), 'turn');
  assert.equal(resolveEonCityWayfinderState({ transient: 'celebrate', reducedMotion: true }), 'inspect');
  let clock = 1000;
  const director = createEonCityWayfinderStateDirector({ now: () => clock });
  assert.equal(director.request('sit-work', { durationMs: 500 }).ok, true);
  assert.equal(director.update({}).state, 'sit-work');
  clock = 1600;
  assert.equal(director.update({}).state, 'idle');
});

test('W624D camera collision contracts clip before every W624C landmark volume', () => {
  for (const collider of EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES) {
    const start = { x: collider.x - collider.radius - 2.2, y: 1.22, z: collider.z };
    const result = resolveEonCityWayfinderCamera({ target: start, alpha: 0, beta: Math.PI / 2, radius: 8, minRadius: 1.2, maxRadius: 12, colliders: [{ ...collider, type: 'circle' }] });
    assert.equal(result.clipped, true, collider.id);
    assert.equal(result.collisionId, collider.id);
    assert.equal(result.safeRadius < result.requestedRadius, true);
    assert.equal(result.camera.x < collider.x - collider.radius, true);
  }
});

test('W624D camera remains stable on clear sightlines and provides five user-selectable views', () => {
  const result = resolveEonCityWayfinderCamera({ target: { x: 0, y: 1.2, z: 0 }, alpha: 0, beta: 1, radius: 9, colliders: [] });
  assert.equal(result.clipped, false);
  assert.equal(result.safeRadius, 9);
  assert.deepEqual(EON_CITY_WAYFINDER_CAMERA_PROFILES.map((entry) => entry.id), ['follow', 'shoulder-left', 'shoulder-right', 'close', 'wide']);
});

test('W624D preserves spawn/Unstuck and all input paths remain visible and non-automatic', () => {
  assert.equal(EON_CITY_COMMAND_DISTRICT_SPAWN.id, 'arrival-plaza-spawn');
  assert.equal(findEonCityCommandDistrictUnstuckPoint({ x: 4.8, z: 1.8 }).id, 'agent-approach');
  assert.equal(EON_CITY_WAYFINDER_INPUT_CONTRACT.hiddenAutoNavigation, false);
  assert.equal(EON_CITY_WAYFINDER_INPUT_CONTRACT.automaticInteraction, false);
  assert.equal(EON_CITY_WAYFINDER_INPUT_CONTRACT.automaticRouteOpen, false);
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(renderer, /KeyC/);
  assert.match(renderer, /KeyR/);
  assert.match(renderer, /GAMEPAD_CAMERA_CYCLE_BUTTON/);
  assert.match(station, /data-eon-play-camera-cycle/);
  assert.match(station, /data-eon-play-wayfinder-state="recovery"/);
});

test('W624D source gate preserves W624B ownership and blocks visual overclaim', () => {
  const result = validateW624dWayfinderCameraContract();
  assert.equal(result.ok, true, result.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
  assert.equal(result.total, 20);
});
