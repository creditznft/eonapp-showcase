import test from 'node:test';
import assert from 'node:assert/strict';
import { runRt97ProfitabilityAcquisitionReadinessGate } from '../../scripts/rt97-profitability-acquisition-readiness-gate.mjs';

test('RT97 profitability/acquisition gate is code-ready but keeps paid traffic closed until real provider evidence and LTV exist', () => {
  const result = runRt97ProfitabilityAcquisitionReadinessGate();
  assert.equal(result.codeReady, true, result.errors.join('\n'));
  assert.equal(result.status, 'code-pass-provider-evidence-pending');
  assert.equal(result.releaseReady, false);
  assert.equal(result.paidTrafficScaleReady, false);
  assert.equal(result.telemetryTrust.revenue, 'provider_reconciled');
  assert.ok(result.externalPending.length >= 4);
});
