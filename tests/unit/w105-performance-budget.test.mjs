import test from 'node:test';
import assert from 'node:assert/strict';
import {
  W105_PERFORMANCE_SCHEMA,
  buildW105PerformanceDebt,
  buildW105RouteSummary,
  classifyW105Route,
  normalizeW105Route,
  resolveW105Budget
} from '../../assets/js/utils/w105-performance-budget.js';

test('W105 normalizes and tiers routes for full-route performance budgets', () => {
  assert.equal(normalizeW105Route('trade.html?utm=x#top'), '/trade.html');
  assert.equal(normalizeW105Route('/index.html'), '/');
  assert.equal(classifyW105Route('/trade'), 'critical');
  assert.equal(classifyW105Route('/creator-studio'), 'heavy');
  assert.equal(classifyW105Route('/blog/how-to-run-ai-missions-free'), 'content');
  assert.equal(resolveW105Budget('/realm').tier, 'heavy');
});

test('W105 route summaries enforce HTML, preload, transfer and safeguard budgets', () => {
  const summary = buildW105RouteSummary('/trade', {
    htmlBytes: 40_000,
    htmlGzipBytes: 9_000,
    modulePreloads: 7,
    stylesheets: 4,
    scripts: 1,
    initialTransferGzipBytes: 260_000,
    safeguards: ['route-inventory', 'desktop-budget', 'mobile-budget', 'cls-cap', 'no-secret-assets']
  });
  assert.equal(summary.schema, W105_PERFORMANCE_SCHEMA);
  assert.equal(summary.ok, true);
  assert.equal(summary.tier, 'critical');
});

test('W105 budget failure reports exact failing dimensions', () => {
  const summary = buildW105RouteSummary('/chat', {
    htmlBytes: 140_000,
    htmlGzipBytes: 40_000,
    modulePreloads: 99,
    stylesheets: 3,
    scripts: 1,
    initialTransferGzipBytes: 1_000_000,
    safeguards: ['route-inventory']
  });
  assert.equal(summary.ok, false);
  assert.ok(summary.failures.some((failure) => failure.name === 'htmlBytes'));
  assert.ok(summary.failures.some((failure) => failure.name === 'modulePreloads'));
  assert.ok(summary.failures.some((failure) => failure.name === 'initialTransferGzipBytes'));
  assert.ok(summary.failures.some((failure) => failure.name === 'namedSafeguards'));
});

test('W105 performance debt ranks the heaviest routes first', () => {
  const debt = buildW105PerformanceDebt([
    buildW105RouteSummary('/a', { initialTransferGzipBytes: 10, safeguards: ['a','b','c','d','e'] }),
    buildW105RouteSummary('/b', { initialTransferGzipBytes: 100, safeguards: ['a','b','c','d','e'] })
  ]);
  assert.equal(debt[0].route, '/b');
});
