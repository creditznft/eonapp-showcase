import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectW654GrandCeoAudit } from '../../scripts/w654-eoncity-grand-ceo-audit-gate.mjs';
test('W654 grand CEO audit clears 9.5 source readiness while reserving visual certification', () => {
  const report = inspectW654GrandCeoAudit();
  assert.equal(report.ok, true, report.failures.join('\n'));
  assert.ok(report.weightedPrevisualReadiness >= 95);
  assert.equal(report.visualCertificationPending, true);
  assert.equal(report.productionBlocked, true);
});
