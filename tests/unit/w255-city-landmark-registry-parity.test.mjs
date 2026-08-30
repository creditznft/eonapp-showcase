import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES } from '../../config/route-contract.mjs';
import {
  CITY_ACTIONABLE_LANDMARK_IDS,
  CITY_LANDMARKS,
  CITY_STATE_DISTRICT_IDS,
  getCityLandmarkAction,
  getCityLandmarkByDistrictId
} from '../../assets/js/contracts/city/city-landmark-registry.js';
import { CITY_DISTRICTS } from '../../assets/js/city/eon-city-2d-engine.js';
import { CITY_DISTRICT_IDS, createCityWorldState, getCityWorldPublicSummary } from '../../assets/js/contracts/city/city-world-state.js';
import {
  CITY_PREPARED_ACTION_STORAGE_KEY,
  confirmPreparedCityAction,
  prepareCityAction,
  readPreparedCityActions
} from '../../assets/js/city/city-prepared-action.js';

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

test('W255 makes the landmark registry the stable identity bridge across City state and 2D districts', () => {
  assert.equal(CITY_LANDMARKS.length, 8);
  assert.deepEqual(CITY_STATE_DISTRICT_IDS, ['command', 'workspace', 'market', 'realm', 'library', 'trade', 'vault', 'orientation']);
  assert.deepEqual(CITY_DISTRICT_IDS, CITY_STATE_DISTRICT_IDS);
  assert.deepEqual(CITY_DISTRICTS.map((district) => district.id), CITY_STATE_DISTRICT_IDS);
  assert.deepEqual(CITY_DISTRICTS.map((district) => district.landmarkId), CITY_LANDMARKS.map((landmark) => landmark.id));
  assert.equal(getCityLandmarkByDistrictId('workspace')?.id, 'workshop');
  assert.equal(getCityLandmarkByDistrictId('library')?.id, 'archive');
  assert.equal(getCityLandmarkByDistrictId('trade')?.id, 'observatory');
  assert.equal(getCityLandmarkByDistrictId('orientation')?.id, 'orientation-hall');

  const summary = getCityWorldPublicSummary(createCityWorldState({ now: 1, worldId: 'w255-city' }));
  assert.deepEqual(summary.districtGraph, CITY_STATE_DISTRICT_IDS);
  assert.doesNotMatch(JSON.stringify(summary), /wallet|payment|token|reward|loot|referral|credential|apiKey|privateChat/i);
});

test('W255 exposes the same five finite canonical routes in every City mode and leaves value-sensitive markers inert', () => {
  const primaryRoutes = new Set(PRIMARY_APP_ROUTES.map((entry) => entry.from));
  const routes = CITY_ACTIONABLE_LANDMARK_IDS.map((id) => getCityLandmarkAction(id)?.route);
  assert.deepEqual([...routes].sort(), ['/', '/local-ai', '/projects', '/realm-studio', '/workspace']);
  for (const landmarkId of CITY_ACTIONABLE_LANDMARK_IDS) {
    const action = getCityLandmarkAction(landmarkId);
    assert.ok(action);
    assert.ok(primaryRoutes.has(action.route), `${landmarkId} must use a canonical primary route`);
    assert.match(action.route, /^(?:\/|\/(?:projects|workspace|realm-studio|local-ai))$/);
    assert.doesNotMatch(JSON.stringify(action), /wallet|payment|token|reward|loot|referral|contract|https?:/i);
  }
  assert.equal(getCityLandmarkAction('preview-gallery'), null);
  assert.equal(getCityLandmarkAction('vault-safehouse'), null);
  assert.equal(getCityLandmarkAction('orientation-hall'), null);
  assert.equal(CITY_PREPARED_ACTION_STORAGE_KEY, 'eon:city:prepared-actions:v1');
});

test('W255 prepares and confirms the same canonical action record from City Lite, Visual Tour and Play', () => {
  const storage = memoryStorage();
  const cases = [
    ['city-lite', 'command-centre', '/'],
    ['visual-tour', 'workshop', '/projects'],
    ['city-play', 'archive', '/workspace']
  ];
  for (const [index, [source, landmarkId, route]] of cases.entries()) {
    const prepared = prepareCityAction(landmarkId, { storage, now: 1_000 + index, source });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.action.source, source);
    assert.equal(prepared.action.route, route);
    const confirmed = confirmPreparedCityAction(prepared.action.id, { storage, now: 1_100 + index });
    assert.equal(confirmed.ok, true);
    assert.equal(confirmed.href, route);
    assert.equal(confirmed.action.source, source);
  }
  assert.equal(prepareCityAction('preview-gallery', { storage, source: 'city-lite' }).reason, 'unknown-landmark');
  assert.equal(prepareCityAction('vault-safehouse', { storage, source: 'visual-tour' }).reason, 'unknown-landmark');
  assert.equal(readPreparedCityActions({ storage }).every((action) => ['city-lite', 'visual-tour', 'city-play'].includes(action.source)), true);
});

test('W255 removes duplicated route tables and makes each renderer consume the registry-backed City contract', () => {
  const registry = read('assets/js/contracts/city/city-landmark-registry.js');
  const engine = read('assets/js/city/eon-city-2d-engine.js');
  const state = read('assets/js/contracts/city/city-world-state.js');
  const visualModel = read('assets/js/city/eon-city-3d-model.js');
  const visualStation = read('assets/js/eon-city-3d-station.js');
  const map = read('assets/js/eon-operator-map.js');
  const play = read('assets/js/city/eon-city-play-babylon.js');
  const actions = read('assets/js/city/city-prepared-action.js');

  assert.match(registry, /CITY_LANDMARK_REGISTRY_SCHEMA/);
  assert.match(engine, /CITY_LANDMARKS/);
  assert.match(state, /CITY_STATE_DISTRICT_IDS/);
  assert.match(visualModel, /CITY_DISTRICTS/);
  assert.match(play, /CITY_LANDMARKS/);
  assert.match(actions, /getCityLandmarkAction/);
  assert.match(map, /prepareCityAction/);
  assert.match(visualStation, /prepareCityAction/);
  assert.match(visualStation, /confirmPreparedCityAction/);
  assert.doesNotMatch(engine, /route:\s*'\/(?:market|trade|vault)'/);
  assert.doesNotMatch(play, /CITY_PLAY_LANDMARKS\s*=\s*Object\.freeze\(\[/);
  assert.doesNotMatch(`${map}\n${visualStation}`, /location\.assign|location\.href\s*=|window\.location\s*=/);
});
