import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  MY_REALM_STATE_KEY,
  ensureMyRealmState,
  getMyRealmPublicIdentity,
  getMyRealmReturnSummary,
  recordMyRealmReturn,
  updateMyRealmState
} from '../../assets/js/realm/realm-state.js';
import { CITY_WORLD_STATE_KEY } from '../../assets/js/contracts/city/city-world-state.js';
import {
  EONBOT_ACTION_RECEIPTS_KEY,
  findLatestEonbotActionReceiptForRoute,
  markEonbotActionReceiptDestinationOpened,
  markEonbotActionReceiptUserConfirmed,
  recordEonbotActionTap
} from '../../assets/js/chat/eonbot-action-receipts.js';
import {
  buildEonbotCommandHubPlan,
  detectEonbotCommandHubAction
} from '../../assets/js/chat/eonbot-command-hub.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    snapshot() { return Object.fromEntries(values); }
  };
}

function installStorage(storage) {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage;
  return () => {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  };
}

test('W232 gives My Realm a local-only return loop and sends only landmark style into CityWorldState', () => {
  const storage = memoryStorage({ 'eon:profile:v1': JSON.stringify({ displayName: 'Northstar Atelier', username: 'northstar' }) });
  const restore = installStorage(storage);
  try {
    const created = ensureMyRealmState({ storage, now: 100 });
    const styled = updateMyRealmState((state) => ({ ...state, landmark: 'garden', entryDistrict: 'workspace' }), { storage, now: 101 });
    const first = recordMyRealmReturn({ intent: 'realm-studio' }, { storage, now: 102 });
    const second = recordMyRealmReturn({ intent: 'city-return' }, { storage, now: 103 });

    assert.equal(created.state.returnLoop.returnCount, 0);
    assert.equal(styled.state.landmark, 'garden');
    assert.equal(first.state.returnLoop.returnCount, 1);
    assert.equal(second.state.returnLoop.returnCount, 2);
    assert.equal(second.state.returnLoop.lastIntent, 'city-return');
    assert.equal(second.state.returnLoop.lastReturnedAt, new Date(103).toISOString());

    const city = JSON.parse(storage.getItem(CITY_WORLD_STATE_KEY));
    assert.equal(city.realmAppearance.palette, 'graphite');
    assert.equal(city.realmAppearance.landmark, 'workspace');
    assert.equal(city.realmAppearance.landmarkStyle, 'garden');
    assert.doesNotMatch(JSON.stringify(city), /Northstar|northstar|showcase|reward|payout|wallet|attribution/i);

    const summary = getMyRealmReturnSummary(second.state);
    assert.equal(summary.returnCount, 2);
    assert.equal(summary.landmark, 'garden');
    assert.match(summary.note, /not shared, rewarded, attributed/i);

    const publicIdentity = getMyRealmPublicIdentity(second.state);
    assert.equal(Object.hasOwn(publicIdentity, 'landmark'), false);
    assert.equal(Object.hasOwn(publicIdentity, 'returnLoop'), false);
    assert.equal(Object.hasOwn(publicIdentity, 'returnCount'), false);
    assert.equal(Object.hasOwn(publicIdentity, 'showcaseRefs'), false);
    const localRealm = JSON.parse(storage.getItem(MY_REALM_STATE_KEY));
    assert.equal(Object.hasOwn(localRealm, 'rewardBalance'), false);
    assert.equal(Object.hasOwn(localRealm, 'poolPoints'), false);
    assert.equal(Object.hasOwn(localRealm, 'coin'), false);
    assert.equal(Object.hasOwn(localRealm, 'commission'), false);
    assert.equal(localRealm.safety.payoutActive, false);
  } finally {
    restore();
  }
});

test('W232 writes a private EONBOT route receipt only after a user-tap and never stores chat text or creates value', () => {
  const storage = memoryStorage();
  const heard = 'Take me to My Realm. My private recovery phrase must never be stored here.';
  const tapped = recordEonbotActionTap({
    heard,
    interpretedAs: 'return-to-my-realm',
    actionType: 'city-guidance',
    route: '/eoncity?target=realm&return=realm'
  }, { storage, now: 1000 });
  assert.equal(tapped.ok, true);
  assert.equal(tapped.receipt.status, 'user-tapped');
  assert.equal(tapped.receipt.externalEffect, false);
  assert.equal(tapped.receipt.completed, false);
  assert.equal(tapped.receipt.targetDistrictId, 'realm');

  const raw = storage.getItem(EONBOT_ACTION_RECEIPTS_KEY);
  assert.equal(raw.includes(heard), false);
  assert.doesNotMatch(raw, /recovery phrase|reward|payout|token|wallet|attribution/i);

  const found = findLatestEonbotActionReceiptForRoute('/eoncity?target=realm&return=realm', { storage, now: 1001, actionType: 'city-guidance' });
  assert.equal(found?.id, tapped.receipt.id);
  const opened = markEonbotActionReceiptDestinationOpened(found.id, { storage, now: 1002 });
  assert.equal(opened.ok, true);
  assert.equal(opened.receipt.status, 'destination-opened');
  assert.equal(opened.receipt.completed, false);
  const confirmed = markEonbotActionReceiptUserConfirmed(found.id, { storage, now: 1003 });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.receipt.status, 'user-confirmed');
  assert.equal(confirmed.receipt.completed, true);
  assert.equal(confirmed.receipt.externalEffect, false);
});

test('W232 lets EONBOT prepare, but not perform, a My Realm return route', () => {
  const plan = buildEonbotCommandHubPlan('return to my realm');
  assert.equal(plan.commandId, 'return-to-my-realm');
  assert.equal(plan.route, '/eoncity?target=realm&return=realm');
  assert.equal(plan.actionType, 'city-guidance');
  assert.equal(plan.commandReceipt.execution, 'prepared-user-tap');
  assert.equal(plan.commandReceipt.completed, false);
  assert.equal(plan.commandReceipt.externalEffect, false);
  assert.match(plan.truthNote, /local return route/i);
  assert.equal(detectEonbotCommandHubAction('take me home to my realm').id, 'return-to-my-realm');
});

test('W232 wires a safe landmark editor, City confirmation panel, and Chat tap receipt without a benefit program', () => {
  const page = read('realm-studio.html');
  const studio = read('assets/js/realm-studio-page.js');
  const state = read('assets/js/realm/realm-state.js');
  const city = read('assets/js/eon-operator-map.js');
  const chat = read('assets/js/chat-page.js');
  const receipts = read('assets/js/chat/eonbot-action-receipts.js');

  assert.match(page, /id="realm-studio-landmark"/);
  assert.match(page, /id="realm-studio-return-city-inline"/);
  assert.match(studio, /MY_REALM_LANDMARKS/);
  assert.match(studio, /getMyRealmReturnSummary/);
  assert.match(state, /recordMyRealmReturn/);
  assert.match(state, /public publishing, marketplace placement, commissions, payouts, and seller tools are not active/i);
  assert.match(city, /data-city-command-receipt/);
  assert.match(city, /markEonbotActionReceiptUserConfirmed/);
  assert.match(city, /realmLandmarkStyle/);
  assert.match(chat, /recordEonbotActionTap/);
  assert.match(receipts, /contains no chat text/i);
  assert.doesNotMatch(`${page}\n${studio}\n${state}\n${city}\n${chat}\n${receipts}`, /auto[-_ ]?grant|automatic[-_ ]?reward|grant(?:s|ed)?\s+(?:cash|coin|token)|withdrawal endpoint/i);
});
