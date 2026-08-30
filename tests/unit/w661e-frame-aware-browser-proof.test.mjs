import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(path.join(rootDir, 'scripts', 'w660j-touch-route-browser-proof.mjs'), 'utf8');

test('W661E browser proof waits for rendered movement instead of assuming 320ms contains a frame', () => {
  assert.match(source, /const HELD_MOVEMENT_TIMEOUT_MS = 3_200;/);
  assert.match(source, /const waitForObservedMovement = async/);
  assert.match(source, /minimumMs: HELD_MOVEMENT_MIN_MS/);
  assert.match(source, /held\.observed/);
  assert.doesNotMatch(source, /page\.mouse\.down\(\);\s*await page\.waitForTimeout\(320\);\s*await page\.mouse\.up\(\);/s);
});

test('W661E browser proof captures input and progressive runtime diagnostics on movement failure', () => {
  assert.match(source, /__eonCityReadInputState/);
  assert.match(source, /__eonCityClearInputState/);
  assert.match(source, /productiveCollision/);
  assert.match(source, /progressiveStatus/);
  assert.match(source, /inputEngaged/);
});

test('W661E browser proof requires stable released input as well as low positional drift', () => {
  assert.match(source, /const inputIsReleased =/);
  assert.match(source, /RELEASE_STABLE_SAMPLE_COUNT = 3/);
  assert.match(source, /stableSamples >= RELEASE_STABLE_SAMPLE_COUNT/);
  assert.match(source, /final\?\.released === true/);
});

test('W661E browser proof keeps the real Orientation Hall pose and all four physical directions', () => {
  assert.match(source, /SAFE_DIRECTION_TEST_POSE = Object\.freeze\(\{ x: 0, z: 5\.35, districtId: 'orientation-hall' \}\)/);
  assert.match(source, /const directions = \['forward', 'backward', 'left', 'right'\]/);
  assert.match(source, /HELD_MOVEMENT_MIN_DISTANCE = 0\.06/);
  assert.match(source, /frameAwareMovementVerified/);
});
