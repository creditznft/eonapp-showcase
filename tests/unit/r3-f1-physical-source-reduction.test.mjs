import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { auditW393ALeanHandoverIntegrity } from '../../scripts/w393a-lean-handover-integrity-gate.mjs';
import { getW393ALeanHandoverStatus } from '../../config/w393a-lean-handover-integrity-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('R3-F1 current-source boundary remains clean in the lean continuation handover', () => {
  const report = auditW393ALeanHandoverIntegrity({ root });
  const status = getW393ALeanHandoverStatus();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(status.historicArchiveVerification, 'not-certified-by-this-handover');
  assert.equal(report.historicEvidence.verified, false);
  assert.deepEqual(report.currentSourceBoundary.restoredActivePaths, []);
  assert.deepEqual(report.currentSourceBoundary.legacyPrefixHits, []);
  assert.deepEqual(report.currentSourceBoundary.legacyValueHits, []);
  assert.deepEqual(report.currentSourceBoundary.evmAddressLiteralHits, []);
});
