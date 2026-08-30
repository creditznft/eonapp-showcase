import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  W108_CORE_ROUTES,
  W108_PERFORMANCE_BUDGETS,
  W108_USER_JOURNEYS,
  getW108CertificationRoute,
  summarizeW108Certification
} from '../../assets/js/utils/w108-route-certification.js';

test('W108E certification covers the public core routes', () => {
  const routeSet = new Set(W108_CORE_ROUTES.map((entry) => entry.route));
  for (const route of ['/', '/chat.html', '/eon-browser.html', '/market', '/marketplace', '/vault', '/realm', '/create', '/build', '/trust']) {
    assert.equal(routeSet.has(route), true, `${route} should be certified`);
  }
});

test('W108E certification keeps EON City, Market starter drops, and Device Lab explicit', () => {
  const home = getW108CertificationRoute('/');
  const market = getW108CertificationRoute('/market');
  const realm = getW108CertificationRoute('/realm');
  assert.match(home.firstImpression, /EON City/i);
  assert.match(market.firstImpression, /starter drop/i);
  assert.match(realm.firstImpression, /Device Lab/i);
});

test('W108E budgets keep mobile heavy pages honest', () => {
  assert.equal(W108_PERFORMANCE_BUDGETS.heavyPageMobileMinimum >= 0.82, true);
  assert.equal(W108_PERFORMANCE_BUDGETS.cumulativeLayoutShiftMaximum <= 0.1, true);
  assert.equal(W108_PERFORMANCE_BUDGETS.consoleErrorBudget, 0);
});

test('W108E user journeys include the NFT and IoT paths', () => {
  const journeys = W108_USER_JOURNEYS.map((journey) => journey.join(' ')).join('\n');
  assert.match(journeys, /starter NFT/i);
  assert.match(journeys, /Device Lab/i);
});

test('W108E summary reports a complete route manifest', () => {
  const summary = summarizeW108Certification();
  assert.equal(summary.schema, 'eon.w108.route-certification.v1');
  assert.equal(summary.routeCount, W108_CORE_ROUTES.length);
  assert.equal(summary.criticalRoutes >= 7, true);
});
