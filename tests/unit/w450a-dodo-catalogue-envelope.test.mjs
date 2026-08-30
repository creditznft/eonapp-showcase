import assert from 'node:assert/strict';
import test from 'node:test';
import { W450_DODO_CATALOGUE_ENVELOPE } from '../../config/w450-dodo-approval-readiness-contract.mjs';
import { W450A_PAID_TIER_IDS, validateW450aDodoCatalogueEnvelopeContract } from '../../config/w450a-dodo-catalogue-envelope-contract.mjs';
import { inspectW450aDodoCatalogueEnvelope } from '../../scripts/w450a-dodo-catalogue-envelope-gate.mjs';

test('W450.1 locks a non-public Dodo paid-tier envelope and one trial-eligible tier set', () => {
  assert.deepEqual(validateW450aDodoCatalogueEnvelopeContract(), []);
  assert.equal(W450_DODO_CATALOGUE_ENVELOPE.maximumMonthlyUsd, 49.99);
  assert.deepEqual(W450A_PAID_TIER_IDS, ['eon-plus', 'eon-studio', 'eon-power', 'eon-max']);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W450.1 keeps pricing, trial and checkout out of public billing until external proof', () => {
  const report = inspectW450aDodoCatalogueEnvelope();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.match(report.limitations.join(' '), /not a Dodo catalogue/i);
});
