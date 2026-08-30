import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(path.join(root, 'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'), 'utf8');

test('RT96 remembers the selected-quality render floor before adaptive protection', () => {
  assert.match(source, /baselineHardwareScalingLevel = currentHardwareScalingLevel/);
  assert.match(source, /Math\.max\(baselineHardwareScalingLevel, Number\(\(previous - 0\.2\)\.toFixed\(2\)\)\)/);
});

test('RT96 only recovers after sustained eligible headroom with wide hysteresis', () => {
  assert.match(source, /const recoveryFpsFloor = resolvedQuality === 'cinematic' \? 55 : resolvedQuality === 'balanced' \? 52 : 45/);
  assert.match(source, /highFpsSamples >= 8/);
  assert.match(source, /frameAt - lastPerformanceProtectionAt >= 15_000/);
  assert.match(source, /frameAt - lastPerformanceRecoveryAt >= 15_000/);
  assert.match(source, /performanceProtectionLevel > 0/);
});

test('RT96 restores both render scale and decorative scene detail without changing selected quality', () => {
  assert.match(source, /performanceProtectionLevel = Math\.max\(0, performanceProtectionLevel - 1\)/);
  assert.match(source, /applyAdaptiveSceneDetail\(performanceProtectionLevel\)/);
  assert.match(source, /RT96_FPS_RECOVERY/);
  assert.match(source, /lastPerformanceRecoveryReason/);
  assert.match(source, /baselineHardwareScalingLevel/);
});
