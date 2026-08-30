import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W633_ADVANCED_NAVIGATION_DESTINATIONS,
  W633_SOURCE_ONLY_ALIAS_DOCUMENTS,
  getW633PublicRoute,
  resolveW633CanonicalRoute,
  validateW633RouteGraph
} from '../../config/w633-every-route-audit-contract.mjs';
import {
  getEonShellNavigationId,
  getEonShellPageLabel,
  renderEonShellNavigationMarkup,
  resolveEonShellPage
} from '../../assets/js/shell/eon-shell-navigation.js';
import { inspectW633EveryRouteAudit } from '../../scripts/w633-every-route-audit-gate.mjs';


test('W633 validates the whole route graph and source-only alias inventory', () => {
  const report = validateW633RouteGraph();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.sourceOnlyAliasDocumentCount, 5);
  assert.equal(W633_SOURCE_ONLY_ALIAS_DOCUMENTS.includes('apps.html'), true);
});

test('W633 resolves every retained alias directly to a live route', () => {
  for (const [alias, canonical] of [
    ['/onboarding', '/'],
    ['/start', '/'],
    ['/apps', '/create'],
    ['/trade', '/insights'],
    ['/realmworld', '/eoncity'],
    ['/vault/backup', '/capsule']
  ]) {
    const result = resolveW633CanonicalRoute(alias);
    assert.equal(result.ok, true, alias);
    assert.equal(result.canonical, canonical, alias);
    assert.equal(result.hops.length, 1, alias);
  }
  assert.equal(resolveW633CanonicalRoute('/definitely-unknown').reason, 'unknown-route');
});

test('W633 keeps every advanced work destination canonical and public', () => {
  assert.deepEqual(W633_ADVANCED_NAVIGATION_DESTINATIONS.map((entry) => entry.href), [
    '/workspace', '/forge', '/automations', '/local-ai', '/insights', '/realm-studio'
  ]);
  assert.equal(W633_ADVANCED_NAVIGATION_DESTINATIONS.every((entry) => getW633PublicRoute(entry.href)?.status === 200), true);
});

test('W633 separates real page identity from its parent navigation context', () => {
  assert.equal(resolveEonShellPage({ pathname: '/forge', explicit: 'forge' }), 'forge');
  assert.equal(resolveEonShellPage({ pathname: '/forge' }), 'create');
  assert.equal(getEonShellPageLabel('forge'), 'EON Forge');
  assert.equal(getEonShellNavigationId('forge'), 'create');
  assert.match(renderEonShellNavigationMarkup('forge'), /href="\/create"[^>]*aria-current="page"/);
});

test('W633 standalone every-route audit passes without claiming production proof', () => {
  const report = inspectW633EveryRouteAudit();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
  assert.equal(report.passed, 11);
  assert.equal(report.publicCertification, 'NO-GO');
  assert.equal(report.canonicalIssues.length, 0);
  assert.equal(report.linkIssues.length, 0);
});
