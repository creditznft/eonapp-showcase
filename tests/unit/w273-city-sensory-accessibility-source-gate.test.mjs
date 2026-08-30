import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  CITY_SENSORY_DEFAULTS,
  CITY_SENSORY_PREFERENCES_KEY,
  readCitySensoryPreferences,
  saveCitySensoryPreferences,
  triggerCitySensoryFeedback
} from '../../assets/js/city/city-sensory-preferences.js';

const root = process.cwd();
const gate = path.join(root, 'scripts', 'w273-city-sensory-accessibility-source-gate.mjs');
const preferencesPath = path.join(root, 'assets', 'js', 'city', 'city-sensory-preferences.js');

function createStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)) };
}

function createAudioEnvironment() {
  const calls = { audio: 0, haptics: [] };
  class MockAudioContext {
    constructor() { calls.audio += 1; this.currentTime = 0; this.destination = {}; }
    createOscillator() { return { frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  return {
    calls,
    AudioContext: MockAudioContext,
    navigator: { vibrate: (pattern) => { calls.haptics.push(pattern); return true; } },
    setTimeout: (callback) => callback()
  };
}

test('W273 keeps City sensory preferences local and default-off', () => {
  const storage = createStorage();
  assert.deepEqual(CITY_SENSORY_DEFAULTS, { sound: false, haptics: false });
  assert.deepEqual(readCitySensoryPreferences(storage), { sound: false, haptics: false });
  const saved = saveCitySensoryPreferences({ sound: true, haptics: true }, storage);
  assert.deepEqual(saved, { sound: true, haptics: true });
  assert.match(storage.getItem(CITY_SENSORY_PREFERENCES_KEY), /"sound":true/);
});

test('W273 emits no sound or vibration without explicit preference and only emits after a local action', () => {
  const environment = createAudioEnvironment();
  assert.deepEqual(triggerCitySensoryFeedback({ sound: false, haptics: false }, 'confirm', environment), { sound: false, haptics: false });
  assert.equal(environment.calls.audio, 0);
  assert.equal(environment.calls.haptics.length, 0);
  assert.deepEqual(triggerCitySensoryFeedback({ sound: true, haptics: true }, 'resume', environment), { sound: true, haptics: true });
  assert.equal(environment.calls.audio, 1);
  assert.equal(environment.calls.haptics.length, 1);
});

test('W273 source gate passes and fails closed if default-off is changed', () => {
  execFileSync(process.execPath, [gate], { cwd: root, stdio: 'pipe' });
  const original = fs.readFileSync(preferencesPath, 'utf8');
  try {
    fs.writeFileSync(preferencesPath, original.replace('sound: false, haptics: false', 'sound: true, haptics: false'));
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /explicitDefaultOff/);
  } finally {
    fs.writeFileSync(preferencesPath, original);
  }
});
