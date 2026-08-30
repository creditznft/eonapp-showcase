import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_ACCESSIBILITY_DEFAULTS, EON_CITY_AUDIO_CHANNELS, EON_CITY_INPUT_MODES, createEonCityAccessibilityDeviceController, getEonCityDeviceClass, normalizeEonCityAccessibilityPreferences } from '../../assets/js/city/eon-city-accessibility-device-system.js';
import { validateW624kAccessibilityDeviceContract } from '../../config/w624k-accessibility-device-contract.mjs';
const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const memoryStorage = () => { const map = new Map(); return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), dump: () => Object.fromEntries(map) }; };

test('W624K defaults to captions and fully muted channels', () => {
  assert.equal(EON_CITY_AUDIO_CHANNELS.length, 6);
  assert.equal(EON_CITY_ACCESSIBILITY_DEFAULTS.captions, true);
  assert.equal(EON_CITY_ACCESSIBILITY_DEFAULTS.muted, true);
  assert.ok(Object.values(EON_CITY_ACCESSIBILITY_DEFAULTS.audio).every((value) => value === 0));
});

test('W624K normalizes accessibility, input and controller preferences', () => {
  const result = normalizeEonCityAccessibilityPreferences({ muted: false, audio: { master: 2, ui: .4 }, textScale: .2, inputMode: 'keyboard-only', controllerMap: { interact: 'Enter', bogus: 'Q' } });
  assert.equal(result.audio.master, 1);
  assert.equal(result.audio.ui, .4);
  assert.equal(result.textScale, .9);
  assert.equal(result.inputMode, 'keyboard-only');
  assert.equal(result.controllerMap.interact, 'Enter');
  assert.equal('bogus' in result.controllerMap, false);
});

test('W624K derives bounded low, mid and high device recommendations without claiming certification', () => {
  assert.equal(getEonCityDeviceClass({ width: 600, coarsePointer: true, deviceMemory: 2, hardwareConcurrency: 2 }).id, 'low');
  assert.equal(getEonCityDeviceClass({ width: 700, coarsePointer: true, deviceMemory: 4, hardwareConcurrency: 4 }).id, 'mid');
  const high = getEonCityDeviceClass({ width: 1400, deviceMemory: 8, hardwareConcurrency: 8 });
  assert.equal(high.id, 'high');
  assert.equal(high.hardwareClaimed, false);
  assert.equal(high.diagnosticsOnly, true);
});

test('W624K updates are explicit, local and never start sound or sensors', () => {
  const controller = createEonCityAccessibilityDeviceController({ storage: memoryStorage(), environment: { innerWidth: 700, matchMedia: () => ({ matches: true }), navigator: { deviceMemory: 4, hardwareConcurrency: 4 } } });
  assert.equal(controller.update({ reducedMotion: true }).reason, 'explicit-user-action-required');
  const result = controller.update({ muted: false, audio: { master: .7 }, reducedMotion: true, reducedSensory: true, inputMode: 'touch-only' }, { explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(result.audioStarted, false);
  assert.equal(result.sensorRequested, false);
  assert.equal(result.snapshot.preferences.weatherVfx, 'off');
  assert.equal(result.snapshot.touchOnlySupported, true);
});

test('W624K non-3D fallback and root application remain review-first', () => {
  const controller = createEonCityAccessibilityDeviceController({ storage: memoryStorage(), environment: { innerWidth: 1200, matchMedia: () => ({ matches: false }), navigator: {} } });
  controller.update({ inputMode: EON_CITY_INPUT_MODES[1], highContrast: true }, { explicitUserAction: true });
  assert.equal(controller.requestNon3dFallback().reason, 'explicit-user-action-required');
  const fallback = controller.requestNon3dFallback({ explicitUserAction: true });
  assert.equal(fallback.automaticNavigation, false);
  const root = { dataset: {}, style: { setProperty() {} } };
  assert.equal(controller.applyTo(root).ok, true);
  assert.equal(root.dataset.eonCityInputMode, 'keyboard-only');
});

test('W624K source gate preserves W624B-J and accessibility CSS', async () => {
  const result = await validateW624kAccessibilityDeviceContract();
  assert.equal(result.ok, true, result.checks.filter((entry) => !entry.pass).map((entry) => entry.id).join(', '));
  assert.ok(result.total >= 30);
  assert.match(read('assets/js/eon-city-play-station.js'), /w624k-accessibility-device/);
  assert.match(read('assets/js/eon-city-play-station.js'), /bindEonCitySharingCenter/);
  assert.match(read('assets/css/eon-city-play.css'), /W624K · accessibility/);
});
