import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_RT96_MOBILE_CAMERA_SCHEMA,
  deriveEonCityRt96CameraInputPolicy,
  applyEonCityRt96CameraInputPolicy
} from '../../assets/js/city/eon-city-mobile-camera-policy.js';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const controls = fs.readFileSync(new URL('../../assets/js/city/eon-city-immersive-controls.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');

test('RT96 touch camera policy keeps one Babylon pointer owner and enables simultaneous movement/look', () => {
  const policy = deriveEonCityRt96CameraInputPolicy({ coarsePointer: true, width: 390, height: 844 });
  assert.equal(policy.schema, EON_CITY_RT96_MOBILE_CAMERA_SCHEMA);
  assert.equal(policy.mode, 'touch-drag');
  assert.equal(policy.simultaneousMovementAndLook, true);
  assert.equal(policy.panningSensibility, 0);
  assert.equal(policy.touchAction, 'none');
});

test('RT96 camera policy safely tunes available Babylon pointer input without requiring it', () => {
  const pointers = { angularSensibilityX: 0, angularSensibilityY: 0, multiTouchPanning: true, multiTouchPanAndZoom: true };
  const camera = { inputs: { attached: { pointers } }, panningSensibility: 1, wheelDeltaPercentage: 1 };
  const canvas = { style: {} };
  const policy = deriveEonCityRt96CameraInputPolicy({ coarsePointer: true, width: 360, height: 640 });
  const receipt = applyEonCityRt96CameraInputPolicy(camera, canvas, policy);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.pointerInputAvailable, true);
  assert.equal(pointers.multiTouchPanning, false);
  assert.equal(pointers.multiTouchPanAndZoom, false);
  assert.equal(canvas.style.touchAction, 'none');
});

test('RT96 joystick owns its captured pointer while the canvas remains the camera drag surface', () => {
  assert.match(controls, /zone\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(css, /\.eon-play-canvas-host,\.eon-play-canvas\{[^}]*touch-action:none/);
  assert.match(runtime, /camera\.attachControl\(canvas, true\)[\s\S]{0,700}applyEonCityRt96CameraInputPolicy\(camera, canvas, rt96CameraPolicy\)/);
  assert.match(runtime, /eonCitySimultaneousMoveLook/);
});
