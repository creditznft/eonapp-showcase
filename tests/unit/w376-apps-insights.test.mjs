import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_APP_DECK_CATEGORY_IDS,
  EON_APP_DECK_VERSION,
  EON_APP_DECK_W376_BASE_VERSION,
  EON_APP_DECK_W362_BASE_CATEGORY_IDS,
  createEonAppDeckLaunchIntent,
  listEonAppDeckCards
} from '../../assets/js/apps/eon-app-deck-catalog.js';
import {
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS,
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376,
  WORKFLOW_TEMPLATE_FAMILIES,
  createWorkflowFromTemplate
} from '../../assets/js/utils/automation-workflow-engine.js';
import { inspectW376AppsInsights } from '../../scripts/w376-apps-insights-gate.mjs';
import {
  W376_APPS_INSIGHTS_CONTRACT,
  validateW376AppsInsightsContract
} from '../../config/w376-apps-insights-contract.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, String(value)); }, removeItem(key) { values.delete(key); } };
}

test('W376 makes Insights & Forecasts an Apps collection while retaining the W362 base', () => {
  assert.equal(EON_APP_DECK_W376_BASE_VERSION, 2);
  assert.ok(EON_APP_DECK_VERSION >= EON_APP_DECK_W376_BASE_VERSION);
  assert.deepEqual(EON_APP_DECK_CATEGORY_IDS, W376_APPS_INSIGHTS_CONTRACT.categories);
  for (const id of EON_APP_DECK_W362_BASE_CATEGORY_IDS) assert.equal(EON_APP_DECK_CATEGORY_IDS.includes(id), true);
  assert.equal(listEonAppDeckCards('insights').length, 5);
  assert.deepEqual(validateW376AppsInsightsContract(), []);
});

test('W376 ships twenty versioned free official Blueprints with a local workflow handoff', () => {
  const cards = listEonAppDeckCards('blueprints');
  const baseline = cards.filter((card) => card.packVersion === '1.0.0');
  assert.equal(baseline.length, W376_APPS_INSIGHTS_CONTRACT.historicalOfficialBlueprintCount);
  assert.ok(cards.length >= W376_APPS_INSIGHTS_CONTRACT.minimumOfficialBlueprintCount);
  for (const card of baseline) {
    assert.equal(card.kind, 'official-blueprint');
    assert.equal(card.packVersion, '1.0.0');
    assert.equal(Boolean(card.workflowTemplateId), true);
    assert.equal(card.checkoutActive, false);
    assert.equal(card.entitlementActive, false);
  }
});

test('W376 insight selection records a local direct-route intent but starts no external work', () => {
  const storage = memoryStorage();
  const selected = createEonAppDeckLaunchIntent({ category: 'insights', itemId: 'forecast-studio-desk', storage, now: 1700000000000 });
  assert.equal(selected.ok, true);
  assert.equal(selected.intent.directRouteOnly, true);
  assert.equal(selected.intent.externalExecutionActive, false);
  assert.equal(selected.intent.requiresConfirmationBeforeDraftSave, false);
});

test('W376 official workflow templates use only local runner and retain an approval checkpoint', () => {
  assert.equal(OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376.length, W376_APPS_INSIGHTS_CONTRACT.historicalOfficialLocalWorkflowCount);
  assert.ok(OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.length >= W376_APPS_INSIGHTS_CONTRACT.minimumOfficialLocalWorkflowCount);
  assert.ok(WORKFLOW_TEMPLATE_FAMILIES.filter((template) => template.localOnly).length >= W376_APPS_INSIGHTS_CONTRACT.minimumOfficialLocalWorkflowCount);
  for (const id of OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376) {
    const workflow = createWorkflowFromTemplate(id);
    assert.equal(workflow.steps.every((step) => step.providerId === 'local-runner'), true);
    assert.equal(workflow.steps.some((step) => step.type === 'approval'), true);
  }
});

test('W376 source gate keeps commerce, providers and live execution inactive', () => {
  const report = inspectW376AppsInsights();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 16);
  assert.match(report.limitations.join(' '), /No merchant account/i);
});
