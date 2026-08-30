import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createCityWorldState } from '../../assets/js/city/city-world-state.js';
import { buildLocalEncryptedExportPayload, restoreLocalEncryptedExportPayload } from '../../assets/js/local-first/eon-local-encrypted-export.js';
import { CITY_DISTRICTS } from '../../assets/js/city/eon-city-2d-engine.js';
import {
  CITY_3D_PREFERENCES_KEY,
  CITY_3D_RENDERER_SCHEMA,
  buildCity3dSceneModel,
  getCity3dPreferences,
  normalizeCity3dQuality,
  saveCity3dPreferences
} from '../../assets/js/city/eon-city-3d-model.js';
import { getEonCity3dCapability } from '../../assets/js/eon-city-3d-station.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) || null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] || null; }
}

test('W224 projects only safe shared CityWorldState into the optional 3D scene model', () => {
  const state = createCityWorldState({ now: Date.UTC(2026, 5, 24), citySeed: 'city-w224', worldId: 'city-w224-world' });
  state.avatar = { ...state.avatar, name: 'Maya Operator', x: 0.24, y: 0.61, appearance: 'aurora' };
  state.realmId = 'eonrealm_AQEBAQEBAQEBAQEBAQEBAQ';
  state.realmAppearance = { palette: 'aurora', landmark: 'realm' };
  state.unlockedDistricts = ['command', 'market', 'realm'];
  state.progress = { ...state.progress, lastDistrictId: 'market', visitCounts: { command: 1, market: 3 } };
  state.safeInventoryRefs = ['private-preview-1'];
  state.apiKey = 'must-not-enter-3d';
  state.privateChat = 'must-not-enter-3d';

  const model = buildCity3dSceneModel(state, { now: Date.UTC(2026, 5, 24) });
  assert.equal(model.schema, CITY_3D_RENDERER_SCHEMA);
  assert.equal(model.worldId, 'city-w224-world');
  assert.equal(model.avatar.name, 'Maya Operator');
  assert.equal(model.palette, 'aurora');
  assert.deepEqual(model.districts.map((district) => district.id), CITY_DISTRICTS.map((district) => district.id));
  assert.equal(model.districts.find((district) => district.id === 'market')?.active, true);
  assert.equal(model.districts.find((district) => district.id === 'market')?.visits, 3);
  assert.doesNotMatch(JSON.stringify(model), /must-not-enter-3d|private-preview-1|apiKey|privateChat/);
});

test('W224 quality preference is local, bounded, and carries an automatic City Overview fallback preference', () => {
  const storage = new MemoryStorage();
  const saved = saveCity3dPreferences({ preferredQuality: 'HIGH', automaticFallbackTo2d: true }, { storage, now: Date.UTC(2026, 5, 24) });
  assert.equal(saved.preferredQuality, 'high');
  assert.equal(saved.automaticFallbackTo2d, true);
  assert.equal(normalizeCity3dQuality('unsafe', 'low'), 'low');
  assert.match(storage.getItem(CITY_3D_PREFERENCES_KEY), /"preferredQuality":"high"/);
  const loaded = getCity3dPreferences({ storage, fallbackQuality: 'balanced' });
  assert.equal(loaded.preferredQuality, 'high');
  assert.equal(loaded.automaticFallbackTo2d, true);
});


test('W224 backs up only the safe local 3D quality preference and restores it without renderer or private state', () => {
  const storage = new MemoryStorage();
  saveCity3dPreferences({ preferredQuality: 'low', automaticFallbackTo2d: true }, { storage, now: Date.UTC(2026, 5, 24) });
  storage.setItem('eon:city:3d:runtime', JSON.stringify({ debug: 'must-not-back-up' }));
  storage.setItem('eon:city:world-state:v1', JSON.stringify({ citySeed: 'safe', privateChat: 'must-not-back-up' }));
  const payload = buildLocalEncryptedExportPayload({ storage, now: Date.UTC(2026, 5, 24) });
  assert.deepEqual(payload.records.map((record) => record.key), [CITY_3D_PREFERENCES_KEY, 'eon:city:world-state:v1']);
  assert.doesNotMatch(JSON.stringify(payload), /must-not-back-up/);
  const restored = new MemoryStorage();
  const result = restoreLocalEncryptedExportPayload(payload, { storage: restored });
  assert.equal(result.restored, 2);
  assert.match(restored.getItem(CITY_3D_PREFERENCES_KEY), /"preferredQuality":"low"/);
});

test('W224 capability gate requires a real WebGL-capable, non-reduced, non-data-saver device', () => {
  const canvas = { getContext: (name) => (name === 'webgl2' ? {} : null) };
  const capable = getEonCity3dCapability({
    window: {
      navigator: { hardwareConcurrency: 8, deviceMemory: 8, connection: { saveData: false } },
      innerWidth: 1440,
      innerHeight: 900,
      matchMedia: () => ({ matches: false }),
      document: { createElement: () => canvas }
    },
    document: { createElement: () => canvas }
  });
  assert.equal(capable.capable, true);
  assert.equal(capable.webgl2, true);
  assert.equal(capable.recommendedQuality, 'high');
  const reduced = getEonCity3dCapability({
    window: {
      navigator: { hardwareConcurrency: 8, deviceMemory: 8, connection: { saveData: false } },
      innerWidth: 1440,
      innerHeight: 900,
      matchMedia: () => ({ matches: true }),
      document: { createElement: () => canvas }
    },
    document: { createElement: () => canvas }
  });
  assert.equal(reduced.capable, false);
  assert.match(reduced.reasons.join(' '), /Reduced motion/i);
});

test('W224 replaces the CSS portal-only route with an explicit dynamically-loaded WebGL renderer sharing 2D district routes', () => {
  const html = read('eoncity-3d.html');
  const station = read('assets/js/eon-city-3d-station.js');
  const renderer = read('assets/js/city/eon-city-3d-renderer.js');
  const model = read('assets/js/city/eon-city-3d-model.js');
  const city2d = read('eoncity-lite.html');
  assert.match(html, /Spatial Command Space/i);
  assert.match(station, /getEonCity3dCapability/);
  assert.match(station, /import\('\.\/city\/eon-city-3d-renderer\.js'\)/);
  assert.match(station, /automaticFallbackTo2d/);
  assert.match(model, /CITY_DISTRICTS/);
  assert.match(model, /buildCity3dSceneModel/);
  assert.match(renderer, /WebGLRenderer/);
  assert.match(renderer, /emitFallback/);
  assert.doesNotMatch(`${html}\n${station}`, /realm3d\/eon-city-app\.js|EngineBoot\.js/i);
  assert.match(station, /does not introduce a second inventory, game economy, NPC crowd, market, reward loop, or background simulation/i);
  assert.doesNotMatch(city2d, /eon-city-3d-renderer\.js|three\.module/);
});
