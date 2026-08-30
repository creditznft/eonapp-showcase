import assert from 'node:assert/strict';
import test from 'node:test';
import { runW301HistorySecretRemediationGate } from '../../scripts/w301-history-secret-remediation-gate.mjs';

test('W301 keeps remote Git history remediation explicit, owner-gated, and free of copied secret-shaped literals', () => {
  const report = runW301HistorySecretRemediationGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
