#!/usr/bin/env node
/** W376 source gate: make Apps expansion useful without activating commerce or external execution. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_APP_DECK_CATEGORY_IDS,
  EON_APP_DECK_VERSION,
  EON_APP_DECK_W376_BASE_VERSION,
  EON_APP_DECK_W362_BASE_CATEGORY_IDS,
  getEonAppDeckTruth,
  listEonAppDeckCards,
  validateEonAppDeckCatalog
} from '../assets/js/apps/eon-app-deck-catalog.js';
import {
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS,
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376,
  WORKFLOW_TEMPLATE_FAMILIES,
  getWorkflowTemplate
} from '../assets/js/utils/automation-workflow-engine.js';
import {
  W376_APPS_INSIGHTS_CONTRACT,
  validateW376AppsInsightsContract
} from '../config/w376-apps-insights-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => existsSync(path.join(root, relative));
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW376AppsInsights({ sourceRoot = root } = {}) {
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push({ id, pass: Boolean(condition), detail });
    ensure(condition, `${id}: ${detail}`);
  };
  const appPage = read('assets/js/apps/eon-app-deck-page.js');
  const automationPage = read('assets/js/eon-automations-page.js');
  // `trade.html` is the physical source document behind canonical public /insights.
  const insightsHtml = read('trade.html');
  const insightsPage = read('assets/js/trade/eon-trade-page.js');
  const shell = read('assets/js/eon-app-shell.js');
  const shellNavigation = read('assets/js/shell/eon-shell-navigation.js');
  const siteShell = read('assets/js/utils/site-shell.js');
  const decision = read('docs/R4_APPS_BLUEPRINTS_COMMERCE_DECISION_2026-06-26.md');
  const activeText = [appPage, automationPage, insightsHtml, insightsPage].join('\n');
  const blueprints = listEonAppDeckCards('blueprints');
  const insights = listEonAppDeckCards('insights');

  check('contract-valid', validateW376AppsInsightsContract().length === 0, 'W376 contract has no internal violations');
  check('catalog-valid', validateEonAppDeckCatalog().length === 0, 'expanded App Deck catalog has no incomplete or unsafe cards');
  check('w376-baseline-preserved', EON_APP_DECK_W376_BASE_VERSION === 2 && EON_APP_DECK_VERSION >= EON_APP_DECK_W376_BASE_VERSION, 'W376 catalog baseline remains represented as the source evolves');
  check('five-resolved-categories', JSON.stringify(EON_APP_DECK_CATEGORY_IDS) === JSON.stringify(W376_APPS_INSIGHTS_CONTRACT.categories), 'Apps has the resolved five-category order');
  check('w362-base-retained', EON_APP_DECK_W362_BASE_CATEGORY_IDS.every((id) => EON_APP_DECK_CATEGORY_IDS.includes(id)), 'all W362 historical base categories remain available');
  const w376Blueprints = blueprints.filter((card) => card.packVersion === '1.0.0');
  check('twenty-versioned-blueprints', w376Blueprints.length === W376_APPS_INSIGHTS_CONTRACT.historicalOfficialBlueprintCount && w376Blueprints.every((card) => card.kind === 'official-blueprint' && card.workflowTemplateId), 'twenty W376 official Blueprints retain an explicit local workflow handoff while later packs may expand the catalog');
  check('five-insights-desks', insights.length === 5 && insights.every((card) => /^\/insights\?desk=(market|business|forecast|research|data)$/.test(card.route || '') && card.localOnly === true && card.externalExecutionActive === false), 'five local Insights & Forecasts desks emit canonical /insights routes');
  check('local-template-count', OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376.length === W376_APPS_INSIGHTS_CONTRACT.historicalOfficialLocalWorkflowCount && OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.length >= W376_APPS_INSIGHTS_CONTRACT.minimumOfficialLocalWorkflowCount && WORKFLOW_TEMPLATE_FAMILIES.filter((item) => item.localOnly === true).length >= W376_APPS_INSIGHTS_CONTRACT.minimumOfficialLocalWorkflowCount, 'ten W376 official local workflow templates remain registered while later templates may expand the catalog');
  check('local-template-boundary', OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.every((id) => {
    const template = getWorkflowTemplate(id);
    return template?.localOnly === true && template?.source === 'official-blueprint-pack' && template.steps.every((step) => step.providerId === 'local-runner');
  }), 'official Blueprint workflows use only the local runner');
  check('blueprint-exact-template-handoff', /createBlueprintWorkflow/.test(automationPage) && /OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS/.test(automationPage) && /official-blueprint-pack/.test(automationPage), 'selected Blueprint creates its matching local workflow draft');
  check('apps-insights-action', /openInsightsDesk/.test(appPage) && /data-app-deck-open-insights/.test(appPage) && /window\.location\.assign\(card\.route\)/.test(appPage), 'Apps offers a visible foreground route to an Insights desk');
  check('apps-no-network', !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|navigator\.sendBeacon)\b/.test(appPage), 'Apps expansion adds no network or background execution API');
  check('research-desk-navigation', /data-mi-desk="market"/.test(insightsHtml) && /mi-business-desk/.test(insightsHtml) && /mi-forecast-desk/.test(insightsHtml) && /mi-research-desk/.test(insightsHtml) && /mi-data-desk/.test(insightsHtml), 'canonical Research Lab document exposes five accessible local desk anchors');
  check('research-query-routing', /INSIGHTS_DESKS/.test(insightsPage) && /applyInsightsDeskRoute/.test(insightsPage) && /new URLSearchParams\(window\.location\.search\)/.test(insightsPage), 'canonical Research Lab route interprets Apps desk links locally');
  check(
    'shell-insights-routing',
    !/id: 'trade'/.test(shellNavigation)
      && !/label: 'Apps'/.test(shellNavigation)
      && /'\/insights': 'forge'/.test(shellNavigation)
      && /'\/trade': 'forge'/.test(shellNavigation)
      && /'\/apps': 'forge'/.test(shellNavigation)
      && !/href: '\/trade'/.test(siteShell),
    'primary shells keep Insights and inbound /trade compatibility under the Forge utility surface without restoring Apps as a competing top-level identity'
  );
  check('commerce-not-active', !/razorpay|payu|cashfree|nowpayments|createCheckout|openCheckout|startSubscription|grantEntitlement|paymentSuccess|merchantWebhook/i.test(activeText), 'active Apps, Automations and Insights source does not activate a payment processor, checkout or entitlement path');
  check('decision-record-present', exists('docs/R4_APPS_BLUEPRINTS_COMMERCE_DECISION_2026-06-26.md') && /Dodo Payments is the single approval-pending planning candidate/.test(decision) && /No prices, payment buttons/.test(decision), 'commerce strategy records Dodo as approval-pending without an activation claim');
  const truth = getEonAppDeckTruth();
  check('truth-boundary', truth.neverDoes.includes('creates a subscription or entitlement') && truth.neverDoes.includes('spends money'), 'runtime truth keeps entitlement and spend paths disabled');
  return Object.freeze({
    wave: W376_APPS_INSIGHTS_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    categories: [...EON_APP_DECK_CATEGORY_IDS],
    blueprintCount: blueprints.length,
    localWorkflowTemplateCount: OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.length,
    limitations: Object.freeze([
      'Source and unit verification only.',
      'No merchant account, KYC, tax review, payment processor, hosted checkout, webhook, subscription, entitlement, live data, broker connection, browser/device proof or Cloudflare deployment was performed.'
    ])
  });
}

export function runW376AppsInsightsGate({ writeArtifact = true } = {}) {
  const result = inspectW376AppsInsights();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w376-apps-insights-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW376AppsInsightsGate();
  process.stdout.write(`W376 Apps + Insights gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
