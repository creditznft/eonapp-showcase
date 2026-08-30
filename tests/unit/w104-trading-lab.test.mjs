import test from 'node:test';
import assert from 'node:assert/strict';
import { auditMarketIntelligenceSafety } from '../../scripts/w375-market-intelligence-safety-gate.mjs';

test('W104 compatibility now certifies the W375 Research Lab replacement, not retired live-trading code', () => {
  const report = auditMarketIntelligenceSafety({ root: process.cwd() });
  assert.equal(report.ok, true, JSON.stringify(report.failures));
  assert.equal(report.boundary.externalNetwork, false);
  assert.equal(report.boundary.liveExecution, false);
});
