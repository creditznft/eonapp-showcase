import assert from 'node:assert/strict';
import test from 'node:test';
import { listEonAppDeckCards, validateEonAppDeckCatalog } from '../../assets/js/apps/eon-app-deck-catalog.js';
import { W452A_CANONICAL_DESTINATIONS, validateW452aActiveCanonicalDestinationContract } from '../../config/w452a-active-canonical-destination-contract.mjs';
import { inspectW452aActiveCanonicalDestination } from '../../scripts/w452a-active-canonical-destination-gate.mjs';

test('W452.1 makes every active Research Lab card use canonical /insights desk routes', () => {
  assert.deepEqual(validateW452aActiveCanonicalDestinationContract(), []);
  assert.deepEqual(validateEonAppDeckCatalog(), []);
  assert.deepEqual(listEonAppDeckCards('insights').map((card) => card.route), [
    '/insights?desk=market',
    '/insights?desk=business',
    '/insights?desk=forecast',
    '/insights?desk=research',
    '/insights?desk=data'
  ]);
  assert.equal(W452A_CANONICAL_DESTINATIONS.research, '/insights');
});

test('W452.1 keeps retired Research Lab routes inbound-only and Dodo approval-gated', () => {
  const report = inspectW452aActiveCanonicalDestination();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.deepEqual(report.retiredResearchAliases, ['/trade', '/trade.html']);
  assert.match(report.limitations.join(' '), /approval-pending/i);
});
