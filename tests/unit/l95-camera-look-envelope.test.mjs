import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_W747_CAMERA_POSES,
  deriveEonCityW747CameraPosition,
  inspectEonCityW747CameraFloorSafety
} from '../../assets/js/city/w747/eon-city-w747-spatial-foundation.js';
import { EON_CITY_W731_WORLD_BOUNDS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('L95 Command Hub exposes a natural near-horizontal look-up envelope', () => {
  assert.equal(EON_CITY_W731_WORLD_BOUNDS.cameraBetaMax, 1.6);
  assert.equal(EON_CITY_W747_CAMERA_POSES.follow.upperBetaLimit, 1.6);
  assert.ok(EON_CITY_W747_CAMERA_POSES.follow.upperBetaLimit > 1.5);
});

test('L95 widened upper pitch keeps the authored follow camera above floor clearance', () => {
  const pose = {
    ...EON_CITY_W747_CAMERA_POSES.follow,
    beta: EON_CITY_W747_CAMERA_POSES.follow.upperBetaLimit,
    radius: EON_CITY_W747_CAMERA_POSES.follow.upperRadiusLimit
  };
  const position = deriveEonCityW747CameraPosition(pose);
  const safety = inspectEonCityW747CameraFloorSafety({
    position,
    target: pose.target,
    beta: pose.beta,
    lowerBetaLimit: pose.lowerBetaLimit,
    upperBetaLimit: pose.upperBetaLimit
  });
  assert.equal(safety.ok, true);
  assert.ok(position.y >= safety.minimumCameraY);
});

test('L95 pointer look preserves mouse direction and only widens the clamp', () => {
  const controller = read('assets/js/city/eon-city-third-person-controller.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const legacy = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(controller, /movementY\) \* sensitivity/);
  assert.match(runtime, /camera\.beta = Number\(pose\.beta\)/);
  assert.match(legacy, /nextCamera\.upperBetaLimit = 1\.6/);
});
