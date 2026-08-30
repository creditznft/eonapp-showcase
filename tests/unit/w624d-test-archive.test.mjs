import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectW624dTestArchive } from '../../scripts/w624d-test-archive-gate.mjs';

test('W624D preserves superseded exact-copy tests in a non-certifying checksummed archive', () => {
  const report = inspectW624dTestArchive();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
  assert.equal(report.archiveFiles, 36);
  assert.equal(report.archivedAssertions, 47);
});
