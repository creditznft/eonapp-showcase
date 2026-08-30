import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CITY_SOUNDSCAPE_DEFAULTS,
  CITY_SOUNDSCAPE_PREFERENCES_KEY,
  createCityAdaptiveSoundscape,
  getCitySoundscapeTruth,
  readCitySoundscapePreferences,
  saveCitySoundscapePreferences
} from '../../assets/js/city/eon-city-adaptive-soundscape.js';
import { W369_ADAPTIVE_SOUNDSCAPE_CONTRACT, validateW369AdaptiveSoundscapeContract } from '../../config/w369-adaptive-soundscape-contract.mjs';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, String(value)) };
}

function mockAudioEnvironment() {
  const calls = { created: 0, stopped: 0, closed: 0 };
  class MockAudioContext {
    constructor() { calls.created += 1; this.currentTime = 0; this.destination = {}; }
    resume() { return Promise.resolve(); }
    close() { calls.closed += 1; return Promise.resolve(); }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    createOscillator() { return { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {}, start() {}, stop() { calls.stopped += 1; }, type: 'sine' }; }
  }
  return { AudioContext: MockAudioContext, setTimeout: (callback) => { callback(); return 1; }, calls };
}

test('W369 sound preferences are local, default-off and bounded', () => {
  const storage = memoryStorage();
  assert.deepEqual(CITY_SOUNDSCAPE_DEFAULTS, { music: false, ambience: false, ui: false, voice: false, reducedSensory: false });
  assert.deepEqual(readCitySoundscapePreferences(storage), CITY_SOUNDSCAPE_DEFAULTS);
  const saved = saveCitySoundscapePreferences({ music: true, ambience: true, ui: true, voice: true, reducedSensory: false }, storage);
  assert.equal(saved.music, true);
  assert.equal(saved.ambience, true);
  assert.match(storage.getItem(CITY_SOUNDSCAPE_PREFERENCES_KEY), /"ambience":true/);
});

test('W369 starts local audio only after explicit activation and disposes it', () => {
  const environment = mockAudioEnvironment();
  const controller = createCityAdaptiveSoundscape({ preferences: { ambience: true, ui: true }, environment });
  assert.equal(controller.getSummary().active, false);
  const start = controller.activateFromUserGesture();
  assert.equal(start.ok, true);
  assert.equal(controller.getSummary().active, true);
  assert.equal(controller.cue('confirm'), true);
  controller.setPreferences({ ambience: false, ui: true, reducedSensory: true });
  assert.equal(controller.getSummary().ambienceActive, false);
  controller.dispose();
  assert.equal(environment.calls.closed, 1);
});

test('W369 truth and contract prohibit remote audio, microphone and automatic voice', () => {
  assert.deepEqual(validateW369AdaptiveSoundscapeContract(), []);
  const truth = getCitySoundscapeTruth();
  assert.equal(truth.remoteAudio, false);
  assert.equal(truth.microphone, false);
  assert.equal(truth.automaticAudio, false);
  assert.equal(W369_ADAPTIVE_SOUNDSCAPE_CONTRACT.truthRules.captionsFirst, true);
});
