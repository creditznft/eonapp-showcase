import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_LITE_ART_DIRECTION_SCHEMA,
  EON_CITY_LITE_VISUAL_PREFERENCES_KEY,
  getCityLiteDistrictArt,
  listCityLiteDistrictArt,
  readCityLiteVisualPreferences,
  resolveCityLiteVisualProfile,
  saveCityLiteVisualPreferences,
  validateCityLiteArtDirection
} from '../../assets/js/city/eon-city-lite-art-direction.js';
import { validateW363CityLiteArtContract } from '../../config/w363-city-lite-art-contract.mjs';
import { inspectW363CityLiteArt } from '../../scripts/w363-city-lite-art-gate.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W363 keeps City Lite art deterministic, complete and local-only', () => {
  assert.equal(EON_CITY_LITE_ART_DIRECTION_SCHEMA, 'eon.city.lite-art-direction.v1');
  assert.deepEqual(validateCityLiteArtDirection(), []);
  assert.deepEqual(validateW363CityLiteArtContract(), []);
  assert.equal(listCityLiteDistrictArt().length, 8);
  assert.equal(getCityLiteDistrictArt('command').silhouette, 'command-spire');
  assert.equal(getCityLiteDistrictArt('missing').transitStop, 'City Loop');
});

test('W363 persists only a local visual-detail preference', () => {
  const storage = memoryStorage();
  assert.equal(readCityLiteVisualPreferences({ storage }).quality, 'auto');
  const saved = saveCityLiteVisualPreferences({ quality: 'high' }, { storage });
  assert.equal(saved.quality, 'high');
  assert.match(storage.getItem(EON_CITY_LITE_VISUAL_PREFERENCES_KEY), /"quality":"high"/);
  assert.equal(readCityLiteVisualPreferences({ storage }).quality, 'high');
  assert.equal(saveCityLiteVisualPreferences({ quality: 'not-real' }, { storage }).quality, 'auto');
});

test('W363 accessibility and device limits override cosmetic High detail', () => {
  assert.equal(resolveCityLiteVisualProfile({ quality: 'high', reducedMotion: true, deviceMemory: 12 }).quality, 'conserve');
  assert.equal(resolveCityLiteVisualProfile({ quality: 'high', saveData: true, deviceMemory: 12 }).rain, false);
  assert.equal(resolveCityLiteVisualProfile({ quality: 'high', deviceMemory: 2 }).particles, 0);
  assert.equal(resolveCityLiteVisualProfile({ quality: 'auto', deviceMemory: 8 }).quality, 'high');
  assert.equal(resolveCityLiteVisualProfile({ quality: 'auto', deviceMemory: 4 }).quality, 'balanced');
});

test('W363 source gate passes and declares its proof limits', () => {
  const report = inspectW363CityLiteArt();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 20);
  assert.match(report.limitations.join(' '), /No GLB assets/i);
});
