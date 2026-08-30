import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CITY_MODE_IDS,
  CITY_MODE_ROUTES,
  createCityModeTransition,
  enterCityMode,
  getCityModeForPath,
  getCityModeReturnTarget,
  prepareCityModeTransition
} from '../../assets/js/contracts/city/city-mode-transition.js';
import { CITY_NAVIGATION_MODE_IDS, ensureCityWorldState } from '../../assets/js/contracts/city/city-world-state.js';
import { inspectW361CityModeTransition } from '../../scripts/w361-city-mode-transition-gate.mjs';
import {
  W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT,
  validateW361CityWorldStateModeTransitionContract
} from '../../config/w361-cityworldstate-mode-transition-contract.mjs';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W361 locks one finite City/native mode set and canonical route map', () => {
  assert.deepEqual(CITY_MODE_IDS, CITY_NAVIGATION_MODE_IDS);
  assert.deepEqual(validateW361CityWorldStateModeTransitionContract(), []);
  assert.equal(W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT.architecture.privacy.localOnly, true);
  assert.equal(CITY_MODE_ROUTES.automations, '/automations');
  assert.equal(CITY_MODE_ROUTES.apps, '/apps');
  assert.equal(getCityModeForPath('/eoncity/tour/'), 'command-space');
  assert.equal(getCityModeForPath('/no-such-route'), null);
});

test('W361 records only a bounded local navigation receipt and confirms a user-selected handoff', () => {
  const storage = createMemoryStorage();
  const initial = ensureCityWorldState({ storage, now: 1700000000000 });
  assert.equal(initial.state.navigation.currentMode, 'portal');
  const transition = createCityModeTransition({ fromMode: 'portal', toMode: 'automations', entry: 'portal', landmarkId: 'automation' , now: 1700000000010 });
  assert.equal(transition.fromMode, 'portal');
  assert.equal(transition.toMode, 'automations');
  assert.equal(transition.landmarkId, null, 'unknown landmark ids are discarded');
  const prepared = prepareCityModeTransition({ storage, now: 1700000000020, fromMode: 'portal', toMode: 'automations', entry: 'portal' });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.state.navigation.pendingTransition.toMode, 'automations');
  const entered = enterCityMode('automations', { storage, now: 1700000000030 });
  assert.equal(entered.ok, true);
  assert.equal(entered.handoff, true);
  assert.equal(entered.state.navigation.currentMode, 'automations');
  assert.equal(entered.state.navigation.pendingTransition, null);
  assert.equal(getCityModeReturnTarget({ storage }).href, '/eoncity');
});

test('W361 source gate is green without confusing source verification for production proof', () => {
  const report = inspectW361CityModeTransition();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 30);
  assert.match(report.limitations.join(' '), /Static source verification only/i);
  assert.match(report.limitations.join(' '), /No Cloudflare deployment/i);
});
