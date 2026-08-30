import assert from 'node:assert/strict';
import test from 'node:test';
import { W452B_CANONICAL_ROUTE_FAMILIES, W452B_RETIRED_EMISSION_ALIASES, validateW452bProductionRouteEmissionCleanupContract } from '../../config/w452b-production-route-emission-cleanup-contract.mjs';
import { inspectW452bProductionRouteEmissionCleanup } from '../../scripts/w452b-production-route-emission-cleanup-gate.mjs';

test('W452.2 keeps current sources on canonical route families and declared aliases inbound-only', () => {
  assert.deepEqual(validateW452bProductionRouteEmissionCleanupContract(), []);
  assert.equal(W452B_CANONICAL_ROUTE_FAMILIES.chat, '/');
  assert.equal(W452B_CANONICAL_ROUTE_FAMILIES.research, '/insights');
  assert.equal(W452B_CANONICAL_ROUTE_FAMILIES.city, '/eoncity');
  assert.deepEqual(W452B_RETIRED_EMISSION_ALIASES.slice(0, 4), ['/chat', '/chat.html', '/trade', '/trade.html']);
});

test('W452.2 finds no retired alias emitted by current HTML or reachable runtime modules', () => {
  const report = inspectW452bProductionRouteEmissionCleanup();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.equal(report.htmlRetiredAliasHits.length, 0);
  assert.equal(report.activeRuntimeRetiredAliasHits.length, 0);
  assert.ok(report.activeModuleCount > 0);
});
