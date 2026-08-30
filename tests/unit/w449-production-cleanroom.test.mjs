import assert from 'node:assert/strict';
import test from 'node:test';
import { W449_QUARANTINE_OUTPUT_EXCEPTIONS, validateW449ProductionCleanroomContract } from '../../config/w449-production-cleanroom-contract.mjs';
import { inspectW449ProductionCleanroom } from '../../scripts/w449-production-cleanroom-gate.mjs';

test('W449 makes production HTML entrypoints explicit and keeps legacy source outside the active graph', () => {
  assert.deepEqual(validateW449ProductionCleanroomContract(), []);
  const report = inspectW449ProductionCleanroom();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.equal(report.activeFenceOk, true);
  assert.equal(report.unplannedRootHtml.length, 0);
  assert.equal(report.allowedEntryCount, 51);
  assert.deepEqual(W449_QUARANTINE_OUTPUT_EXCEPTIONS.archive.allowedOutputFiles, ['index.html']);
});
