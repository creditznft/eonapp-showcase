import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W254 adds a bounded local frame-time protection path without changing work or selected preferences', () => {
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(scene, /applyPerformanceProtection/);
  assert.match(scene, /frameCount >= 150/);
  assert.match(scene, /warmupAverage > 36/);
  assert.match(scene, /playReducedEffects = true/);
  assert.match(scene, /rain\?\.setEnabled\(false\)/);
  assert.match(scene, /glow\.intensity = 0/);
  assert.match(scene, /setHardwareScalingLevel/);
  assert.match(scene, /performanceGovernor/);
  assert.doesNotMatch(scene, /localStorage|updateCityPlayPreferences|location\.assign|window\.location|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
});

test('W254 surfaces local performance protection honestly and keeps EON City available', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(station, /onPerformanceChange/);
  assert.match(station, /Performance protection is active locally/);
  assert.match(station, /Reduced effects are in use; EON City remains available/);
  assert.match(scene, /Your selected profile is not overwritten/);
  assert.doesNotMatch(station, /location\.assign|window\.location/);
});
