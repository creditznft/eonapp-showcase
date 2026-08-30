import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  resolveEonCityW719KeyboardCode,
  resolveEonCityW719MovementDirection
} from '../../assets/js/city/w719/eon-city-w719-input-authority.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W719.13 resolves W/A/S/D and arrows when KeyboardEvent.code is missing', () => {
  assert.equal(resolveEonCityW719KeyboardCode({ key: 'w' }), 'KeyW');
  assert.equal(resolveEonCityW719KeyboardCode({ key: 'ArrowLeft' }), 'ArrowLeft');
  assert.equal(resolveEonCityW719KeyboardCode({ code: 'KeyD', key: 'x' }), 'KeyD');
  assert.equal(resolveEonCityW719MovementDirection({ key: 'W' }), 'up');
  assert.equal(resolveEonCityW719MovementDirection({ key: 's' }), 'down');
  assert.equal(resolveEonCityW719MovementDirection({ key: 'a' }), 'left');
  assert.equal(resolveEonCityW719MovementDirection({ key: 'd' }), 'right');
});

test('W719.13 active W731 City runtime consumes the shared keyboard authority', () => {
  const entrypoint = read('assets/js/city/eon-city-play-core.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(entrypoint, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(runtime, /resolveEonCityW719KeyboardCode/);
  assert.match(runtime, /const keyboardCode = resolveEonCityW719KeyboardCode\(event\)/);
  assert.match(runtime, /canvas\.addEventListener\('pointerdown', restoreCanvasFocus\)/);
  assert.match(runtime, /canvas\.focus\?\.\(\{ preventScroll: true \}\)/);
});

test('W719.13 flagship arrival camera target survives the frame loop and reset', () => {
  const source = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(source, /let activeCameraTargetOffset = Object\.freeze\(\{ \.\.\.arrivalCamera\.targetOffset \}\)/);
  assert.match(source, /const syncCameraTarget = \(\) =>/);
  assert.match(source, /const cameraTarget = syncCameraTarget\(\)/);
  assert.match(source, /applyCoreArrivalCamera\(\)/);
  assert.doesNotMatch(source, /const cameraTarget = operator\.position\.add\(new Vector3\(0, wayfinderCameraProfile\.targetHeight, 0\)\)/);
});
