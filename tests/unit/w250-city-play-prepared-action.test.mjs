import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_PREPARED_ACTION_STORAGE_KEY,
  CITY_PREPARED_ACTION_TTL_MS,
  CITY_PLAY_ACTION_DESTINATIONS,
  confirmPreparedCityAction,
  prepareCityPlayAction,
  readPreparedCityActions
} from '../../assets/js/city/city-prepared-action.js';
import {
  CITY_WORLD_STATE_VERSION,
  createCityWorldState,
  getCityWorldPublicSummary,
  normalizeCityWorldState,
  recordCityPlayLandmark,
  updateCityPlayPreferences
} from '../../assets/js/contracts/city/city-world-state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W250 migrates CityWorldState V1 into allowlisted V2 Play preferences without carrying private fields', () => {
  const migrated = normalizeCityWorldState({
    version: 1,
    worldId: 'city-v1', citySeed: 'seed',
    avatar: { name: 'Operator', x: .4, y: .7 },
    progress: { privateChat: 'must-not-copy' },
    play: { preferredQuality: 'cinematic', reducedEffects: true, lastLandmarkId: 'observatory', deviceFingerprint: 'must-not-copy' },
    vaultSecret: 'must-not-copy'
  }, { now: 100 });
  assert.equal(CITY_WORLD_STATE_VERSION, 2);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.play, { preferredQuality: 'cinematic', reducedEffects: true, lastLandmarkId: 'observatory' });
  assert.doesNotMatch(JSON.stringify(migrated), /privateChat|vaultSecret|deviceFingerprint|must-not-copy/i);
  assert.deepEqual(getCityWorldPublicSummary(migrated).play, migrated.play);
});

test('W250 only prepares registered internal City routes and requires a fresh separate confirmation', () => {
  const storage = memoryStorage();
  const prepared = prepareCityPlayAction('command-centre', { storage, now: 1000 });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.action.route, '/');
  assert.equal(prepared.action.requiresUserConfirmation, true);
  assert.equal(prepared.action.dataScope, 'route-only-no-private-data');
  assert.deepEqual(Object.keys(prepared.action).sort(), ['confirmedAt', 'dataScope', 'destinationId', 'destinationLabel', 'expiresAt', 'id', 'landmarkId', 'landmarkLabel', 'preparedAt', 'purpose', 'requiresUserConfirmation', 'route', 'schema', 'source', 'state'].sort());
  assert.equal(confirmPreparedCityAction('missing', { storage, now: 1001 }).ok, false);
  const confirmed = confirmPreparedCityAction(prepared.action.id, { storage, now: 1001 });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.href, '/');
  assert.equal(confirmed.action.state, 'confirmed');
  assert.equal(readPreparedCityActions({ storage })[0].state, 'confirmed');
  const expired = prepareCityPlayAction('workshop', { storage, now: 2000 });
  assert.equal(confirmPreparedCityAction(expired.action.id, { storage, now: 2000 + CITY_PREPARED_ACTION_TTL_MS }).reason, 'prepared-action-expired');
  assert.equal(CITY_PREPARED_ACTION_STORAGE_KEY, 'eon:city:prepared-actions:v1');
});

test('W250 destination registry is finite, internal, and excludes value-bearing or remote routes', () => {
  const destinations = Object.values(CITY_PLAY_ACTION_DESTINATIONS);
  assert.equal(destinations.length, 5);
  for (const destination of destinations) {
    assert.match(destination.route, /^\/(?:$|projects|workspace|realm-studio|local-ai)$/);
    assert.doesNotMatch(JSON.stringify(destination), /wallet|payment|token|reward|loot|referral|contract|https?:/i);
  }
  assert.equal(prepareCityPlayAction('unknown', { storage: memoryStorage(), now: 10 }).reason, 'unknown-landmark');
});

test('W250 Babylon interaction exposes nearby landmarks and a review sheet but never navigates from code', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(scene, /CITY_PLAY_LANDMARKS/);
  assert.match(scene, /getNearestLandmark/);
  assert.match(scene, /onLandmarkChange/);
  assert.match(station, /prepareCityPlayAction/);
  assert.match(station, /confirmPreparedCityAction/);
  assert.match(station, /data-eon-play-action-review/);
  assert.match(station, /Prepared route · review required/);
  assert.match(station, /Only the route[\s\S]*opaque mission receipt[\s\S]*no private City, chat, Vault, provider, project, or account data moves with it/);
  assert.doesNotMatch(station, /location\.assign|window\.location/);
  assert.match(css, /eon-play-action-review/);
});

test('W250 stores only a user-selected Play preference and landmark marker in CityWorldState', () => {
  const storage = memoryStorage();
  storage.setItem('eon:city:world-state:v1', JSON.stringify(createCityWorldState({ now: 1 })));
  const settings = updateCityPlayPreferences({ preferredQuality: 'lite', reducedEffects: true, privateNote: 'must-not-copy' }, { storage, now: 2 });
  const marked = recordCityPlayLandmark('workshop', { storage, now: 3 });
  assert.deepEqual(settings.state.play, { preferredQuality: 'lite', reducedEffects: true, lastLandmarkId: null });
  assert.deepEqual(marked.state.play, { preferredQuality: 'lite', reducedEffects: true, lastLandmarkId: 'workshop' });
  assert.doesNotMatch(JSON.stringify(marked.state), /privateNote|must-not-copy/i);
});
