import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_WORLD_LEGACY_KEYS,
  CITY_WORLD_STATE_KEY,
  CITY_WORLD_STATE_VERSION,
  createCityWorldState,
  ensureCityWorldState,
  getCityWorldPublicSummary,
  recordCityDistrictVisit
} from '../../assets/js/contracts/city/city-world-state.js';
import {
  CITY_COLLIDERS,
  CITY_DISTRICTS,
  buildCityObjective,
  cityPointIsWalkable,
  getCityDistrictAt,
  getNearbyCityDistrict,
  findCityWalkPath,
  resolveCityMovement
} from '../../assets/js/city/eon-city-2d-engine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); }
  };
}

test('W221 creates a versioned local CityWorldState with no Vault or private-chat payload', () => {
  const state = createCityWorldState({ now: 100, worldId: 'city-unit', citySeed: 'unit-seed' });
  assert.equal(state.version, CITY_WORLD_STATE_VERSION);
  assert.equal(state.worldId, 'city-unit');
  assert.deepEqual(state.districtGraph, CITY_DISTRICTS.map((district) => district.id));
  assert.deepEqual(state.unlockedDistricts, ['command']);
  assert.equal(state.ownerRef, null);
  assert.equal(state.realmId, null);
  assert.equal(state.safeInventoryRefs.length, 0);
  assert.doesNotMatch(JSON.stringify(state), /apiKey|private chat|seed phrase|wallet/i);
  assert.equal(buildCityObjective(state).id, 'visit-command-centre');
});

test('W221 migrates a legacy City preference without deleting the original record or carrying secrets forward', () => {
  const legacyKey = CITY_WORLD_LEGACY_KEYS[0];
  const legacyRaw = JSON.stringify({
    worldId: 'city-legacy',
    citySeed: 'legacy-seed',
    avatar: { name: 'Legacy Operator', x: 0.41, y: 0.72, apiKey: 'must-not-copy' },
    progress: { lastDistrictId: 'market', visitCounts: { market: 2 }, privateChat: 'must-not-copy' },
    safeInventoryRefs: ['preview-safe', 'wallet-secret-should-not-match?'],
    vaultSecret: 'must-not-copy'
  });
  const storage = memoryStorage({ [legacyKey]: legacyRaw });
  const loaded = ensureCityWorldState({ storage, now: 200 });
  assert.equal(loaded.migrated, true);
  assert.equal(loaded.preservedLegacySource, true);
  assert.equal(storage.getItem(legacyKey), legacyRaw);
  const saved = JSON.parse(storage.getItem(CITY_WORLD_STATE_KEY));
  assert.equal(saved.worldId, 'city-legacy');
  assert.equal(saved.avatar.name, 'Legacy Operator');
  assert.equal(saved.progress.lastDistrictId, 'market');
  assert.deepEqual(saved.safeInventoryRefs, ['preview-safe']);
  assert.doesNotMatch(JSON.stringify(saved), /apiKey|privateChat|vaultSecret|must-not-copy/i);
});

test('W221 resolves real movement around City scenery and records a local Command Centre interaction', () => {
  const canal = CITY_COLLIDERS.find((item) => item.label === 'canal');
  assert.equal(cityPointIsWalkable({ x: canal.x + 0.01, y: canal.y + 0.01 }), false);
  const before = { x: canal.x - 0.02, y: canal.y + canal.height / 2 };
  const after = resolveCityMovement(before, { x: 0.1, y: 0 });
  assert.ok(after.x < canal.x + 0.01, 'avatar must not cross the canal collider');
  const command = CITY_DISTRICTS.find((district) => district.id === 'command');
  const path = findCityWalkPath({ x: 0.5, y: 0.82 }, { x: command.x + command.width / 2, y: command.y + command.height / 2 });
  assert.ok(path.length > 3, 'tap-to-walk needs a route around City scenery');
  assert.equal(path.every(cityPointIsWalkable), true);
  assert.equal(getCityDistrictAt({ x: command.x + 0.05, y: command.y + 0.05 })?.id, 'command');
  assert.equal(getNearbyCityDistrict({ x: command.x + 0.05, y: command.y + 0.05 })?.id, 'command');
  const storage = memoryStorage();
  ensureCityWorldState({ storage, now: 300 });
  const visited = recordCityDistrictVisit('command', { storage, now: 301 });
  assert.equal(visited.state.progress.completedObjectives.includes('visit-command-centre'), true);
  assert.equal(visited.state.progress.activeObjective, 'first-circuit');
  assert.equal(buildCityObjective(visited.state).id, 'visit-workspace');
  assert.equal(buildCityObjective(visited.state).complete, false);
  const publicSummary = getCityWorldPublicSummary(visited.state);
  assert.doesNotMatch(JSON.stringify(publicSummary), /secret|key|wallet/i);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W221 ships an actual canvas-based 2D City input contract with no hidden economy or legacy 3D boot', () => {
  const page = read('eoncity-lite.html');
  const map = read('assets/js/eon-operator-map.js');
  const engine = read('assets/js/city/eon-city-2d-engine.js');
  const store = read('assets/js/contracts/city/city-world-state.js');
  assert.match(page, /EON City Overview.*local-first 2\.5D City/i);
  assert.match(map, /data-city-canvas/);
  assert.match(map, /arrow keys or WASD/i);
  assert.match(map, /navigator\.getGamepads/);
  assert.match(map, /recordCityDistrictVisit/);
  assert.match(map, /Nothing runs, earns, or purchases in the background/i);
  assert.doesNotMatch(map, /realm3d|EngineBoot|wallet seed|api key vault/i);
  assert.match(engine, /CITY_COLLIDERS/);
  assert.match(engine, /resolveCityMovement/);
  assert.match(engine, /findCityWalkPath/);
  assert.match(store, /CITY_WORLD_STATE_VERSION = 2/);
  assert.match(store, /preservedLegacySource/);
});
