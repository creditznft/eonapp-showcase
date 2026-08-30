import assert from 'node:assert/strict';
import test from 'node:test';
import { W451_CLEANUP_GUARANTEES, validateW451CleanupExecutionContract } from '../../config/w451-cleanup-execution-contract.mjs';
import { buildW451CleanupExecutionHandoff } from '../../scripts/w451-cleanup-execution-handoff.mjs';

test('W451.1 produces a proof-gated Codex cleanup manifest without authorising deletion', () => {
  assert.deepEqual(validateW451CleanupExecutionContract(), []);
  const report = buildW451CleanupExecutionHandoff({ writeArtifact: false });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.equal(report.noHistoricalActiveImports, true);
  assert.equal(W451_CLEANUP_GUARANTEES.automaticDelete, false);
  assert.equal(W451_CLEANUP_GUARANTEES.automaticMove, false);
  assert.ok(report.manifest.actionCounts.active > 0);
  assert.ok(report.manifest.actionCounts.compatibility > 0);
  assert.ok(report.manifest.actionCounts.historical > 0);
  assert.ok(report.manifest.rootHistoryFiles.every((file) => !file.includes('/')));
});
