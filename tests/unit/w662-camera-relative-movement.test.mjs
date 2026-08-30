import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_CAMERA_RELATIVE_MOVEMENT_SCHEMA,
  resolveEonCityCameraGroundBasis,
  resolveEonCityCameraRelativeMovement,
  resolveEonCityWorldTargetMovement
} from '../../assets/js/city/eon-city-camera-relative-movement.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const near = (actual, expected, message = '') => assert.ok(Math.abs(actual - expected) <= 1e-9, `${message} expected ${expected}, received ${actual}`);

function assertDirection(actual, expected, label) {
  assert.equal(actual.active, true, `${label}: movement must be active`);
  near(actual.x, expected.x, `${label}: x`);
  near(actual.z, expected.z, `${label}: z`);
  near(Math.hypot(actual.x, actual.z), 1, `${label}: normalized`);
}

test('W662B resolves W and D from the actual horizontal camera pose at four cardinal rotations', () => {
  const target = { x: 0, y: 0.8, z: 0 };
  const cases = [
    { label: 'camera south', cameraPosition: { x: 0, y: 8, z: -10 }, forward: { x: 0, z: 1 }, right: { x: 1, z: 0 } },
    { label: 'camera east', cameraPosition: { x: 10, y: 8, z: 0 }, forward: { x: -1, z: 0 }, right: { x: 0, z: 1 } },
    { label: 'camera north', cameraPosition: { x: 0, y: 8, z: 10 }, forward: { x: 0, z: -1 }, right: { x: -1, z: 0 } },
    { label: 'camera west', cameraPosition: { x: -10, y: 8, z: 0 }, forward: { x: 1, z: 0 }, right: { x: 0, z: -1 } }
  ];

  for (const row of cases) {
    assertDirection(resolveEonCityCameraRelativeMovement({ inputForward: 1, cameraPosition: row.cameraPosition, cameraTarget: target }), row.forward, `${row.label} W`);
    assertDirection(resolveEonCityCameraRelativeMovement({ inputRight: 1, cameraPosition: row.cameraPosition, cameraTarget: target }), row.right, `${row.label} D`);
  }
});

test('W662B ArcRotate alpha fallback remains deterministic when camera pose is unavailable', () => {
  const cases = [
    { alpha: -Math.PI / 2, forward: { x: 0, z: 1 }, right: { x: 1, z: 0 } },
    { alpha: 0, forward: { x: -1, z: 0 }, right: { x: 0, z: 1 } },
    { alpha: Math.PI / 2, forward: { x: 0, z: -1 }, right: { x: -1, z: 0 } },
    { alpha: Math.PI, forward: { x: 1, z: 0 }, right: { x: 0, z: -1 } }
  ];
  for (const row of cases) {
    const basis = resolveEonCityCameraGroundBasis({ cameraAlpha: row.alpha });
    near(basis.forward.x, row.forward.x, 'fallback forward x');
    near(basis.forward.z, row.forward.z, 'fallback forward z');
    near(basis.right.x, row.right.x, 'fallback right x');
    near(basis.right.z, row.right.z, 'fallback right z');
    assert.equal(basis.source, 'camera-alpha');
  }
});

test('W662B normalizes diagonal and mixed digital/analogue intent without changing speed', () => {
  const result = resolveEonCityCameraRelativeMovement({
    inputRight: 2,
    inputForward: 2,
    cameraPosition: { x: 0, y: 4, z: -5 },
    cameraTarget: { x: 0, y: 0, z: 0 }
  });
  assert.equal(result.schema, EON_CITY_CAMERA_RELATIVE_MOVEMENT_SCHEMA);
  assert.equal(result.active, true);
  near(result.x, Math.SQRT1_2, 'diagonal x');
  near(result.z, Math.SQRT1_2, 'diagonal z');
  near(Math.hypot(result.x, result.z), 1, 'diagonal speed');

  const idle = resolveEonCityCameraRelativeMovement({ inputRight: 0.01, inputForward: -0.01, deadZone: 0.04 });
  assert.equal(idle.active, false);
  assert.deepEqual({ x: idle.x, z: idle.z }, { x: 0, z: 0 });
});

test('W662B guided world targets remain world-relative and stop inside the arrival radius', () => {
  const moving = resolveEonCityWorldTargetMovement({ position: { x: 1, z: 1 }, target: { x: 4, z: 5 } });
  assert.equal(moving.active, true);
  assert.equal(moving.arrived, false);
  near(moving.x, 0.6, 'guided x');
  near(moving.z, 0.8, 'guided z');

  const arrived = resolveEonCityWorldTargetMovement({ position: { x: 3.9, z: 5 }, target: { x: 4, z: 5 }, arrivalRadius: 0.32 });
  assert.equal(arrived.active, false);
  assert.equal(arrived.arrived, true);
});

test('current Command Hub uses camera-relative movement, protects focus and removes fixed-world-axis direction math', () => {
  const source = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(source, /camera\.getForwardRay\(1\)\.direction/);
  // W765R6 centralizes the lateral basis in the canonical camera-relative
  // movement authority. The Command Hub must delegate instead of reintroducing
  // an inline perpendicular formula that can drift or invert A/D semantics.
  assert.match(source, /import \{ resolveEonCityCameraRelativeMovement \} from '\.\.\/eon-city-camera-relative-movement\.js';/);
  assert.match(source, /resolveEonCityCameraRelativeMovement\(\{/);
  assert.match(source, /inputRight: input\.right/);
  assert.match(source, /inputForward: input\.forward/);
  assert.doesNotMatch(source, /const right = new Vector3\(-forward\.z, 0, forward\.x\)/);
  assert.match(source, /isTyping/);
  assert.match(source, /input', 'textarea', 'select/);
  // W759R1 records why held movement was cleared; retain the blur safety contract
  // while allowing its named handler to carry that diagnostic reason.
  assert.match(source, /const onWindowBlur = \(\) => clearInput\('window-blur'\)/);
  assert.match(source, /globalThis\.addEventListener\?\.\('blur', onWindowBlur\)/);
  assert.match(source, /globalThis\.removeEventListener\?\.\('blur', onWindowBlur\)/);
  assert.match(source, /heldKeys/);
  assert.match(source, /getInputDiagnostics/);
  assert.doesNotMatch(source, /const direction = \{ x: x \/ length, z: -z \/ length \};/);
  assert.doesNotMatch(source, /playerAnchor\.rotation\.y = Math\.atan2\(x, -z\);/);
});
