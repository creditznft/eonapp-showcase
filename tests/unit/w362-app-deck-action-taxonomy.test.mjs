import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_APP_DECK_CATEGORY_IDS,
  EON_APP_DECK_W362_BASE_CATEGORY_IDS,
  EON_APP_DECK_SELECTION_KEY,
  createEonAppDeckLaunchIntent,
  getEonAppDeckBlueprint,
  listEonAppDeckCards,
  readEonAppDeckLaunchIntent,
  validateEonAppDeckCatalog
} from '../../assets/js/apps/eon-app-deck-catalog.js';
import {
  EON_ACTION_CLASS_IDS,
  getEonActionPolicy,
  normalizeEonActionClass,
  validateEonActionTaxonomy
} from '../../assets/js/automation/eon-action-taxonomy.js';
import { CITY_MODE_ROUTES, getCityModeForPath } from '../../assets/js/contracts/city/city-mode-transition.js';
import { inspectW362AppDeckActionTaxonomy } from '../../scripts/w362-app-deck-action-taxonomy-gate.mjs';
import {
  W362_APP_DECK_ACTION_TAXONOMY_CONTRACT,
  validateW362AppDeckActionTaxonomyContract
} from '../../config/w362-app-deck-action-taxonomy-contract.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W362 historical base categories remain present alongside the expanded App Deck and seven action classes', () => {
  assert.deepEqual(EON_APP_DECK_W362_BASE_CATEGORY_IDS, ['workrooms', 'crew', 'connections', 'blueprints']);
  for (const category of EON_APP_DECK_W362_BASE_CATEGORY_IDS) assert.equal(EON_APP_DECK_CATEGORY_IDS.includes(category), true);
  assert.deepEqual(EON_ACTION_CLASS_IDS, ['read', 'draft', 'write', 'publish', 'spend', 'delete', 'admin']);
  assert.deepEqual(validateEonAppDeckCatalog(), []);
  assert.deepEqual(validateEonActionTaxonomy(), []);
  assert.deepEqual(validateW362AppDeckActionTaxonomyContract(), []);
  for (const category of EON_APP_DECK_CATEGORY_IDS) assert.ok(listEonAppDeckCards(category).length >= 4);
  assert.equal(getEonAppDeckBlueprint('friday-event-launch')?.externalExecutionActive, false);
  assert.equal(W362_APP_DECK_ACTION_TAXONOMY_CONTRACT.boundaries.oauthActive, false);
});

test('W362 keeps Blueprint selection local and requires a later workflow-save click', () => {
  const storage = memoryStorage();
  const selected = createEonAppDeckLaunchIntent({ category: 'blueprints', itemId: 'website-launch-protocol', storage, now: 1700000000000 });
  assert.equal(selected.ok, true);
  assert.equal(selected.intent.requiresConfirmationBeforeDraftSave, true);
  assert.match(storage.getItem(EON_APP_DECK_SELECTION_KEY), /website-launch-protocol/);
  const loaded = readEonAppDeckLaunchIntent({ storage });
  assert.equal(loaded?.category, 'blueprints');
  assert.equal(loaded?.externalExecutionActive, false);
  assert.equal(readEonAppDeckLaunchIntent({ storage, consume: true })?.itemId, 'website-launch-protocol');
  assert.equal(readEonAppDeckLaunchIntent({ storage }), null);
});

test('W362 maps legacy approval labels safely and blocks financial/destructive/admin actions', () => {
  assert.equal(normalizeEonActionClass('submit'), 'write');
  assert.equal(normalizeEonActionClass('sensitive'), 'admin');
  assert.equal(normalizeEonActionClass('unknown-value'), 'draft');
  assert.equal(getEonActionPolicy('publish').explicitApprovalRequired, true);
  assert.equal(getEonActionPolicy('spend').currentRuntime, 'blocked');
  assert.equal(getEonActionPolicy('delete').currentRuntime, 'blocked');
  assert.equal(getEonActionPolicy('admin').currentRuntime, 'blocked');
});

test('W362 keeps /apps as a shared City-mapped Forge utility surface and source gate', () => {
  assert.equal(CITY_MODE_ROUTES.apps, '/apps');
  assert.equal(getCityModeForPath('/apps/'), 'apps');
  const report = inspectW362AppDeckActionTaxonomy();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 20);
  assert.match(report.limitations.join(' '), /No OAuth/i);
});
