import assert from 'node:assert/strict';
import test from 'node:test';
import { ALL_ROUTE_ROWS } from '../../config/route-contract.mjs';
import { CAPABILITY_TRUTH_REGISTRY } from '../../assets/js/capabilities/capability-truth-registry.js';
import {
  W522_GATE_RISK_REGISTRY,
  W522_TRUTH,
  validateW522GateRiskConvergenceContract,
  validateW522RouteRecoveryCapabilityState
} from '../../config/w522-gate-risk-convergence-contract.mjs';
import {
  inspectW522GateRiskConvergence,
  parseCanonicalReleaseGates,
  validateW522CanonicalCoverage
} from '../../scripts/w522-gate-risk-convergence-gate.mjs';

test('W522 converges current source controls without assigning a launch or device result', () => {
  assert.deepEqual(validateW522GateRiskConvergenceContract(), []);
  const report = inspectW522GateRiskConvergence();
  assert.equal(report.ok, true, report.issues.join('\n'));
  assert.equal(report.truth, W522_TRUTH);
  assert.equal(report.truth.sourceOnly, true);
  assert.equal(report.truth.productionApproved, false);
  assert.equal(report.truth.physicalDeviceCertified, false);
  assert.ok(report.activeGateCount >= 18);
  assert.ok(report.historicalGateCount >= 5);
});

test('W522 rejects stale route/recovery and blocked-capability reactivation fixtures', () => {
  const staleRoutes = ALL_ROUTE_ROWS.map((row) => row.from === '/vault/backup'
    ? { ...row, to: '/vault-backup.html', status: 200, lifecycle: 'live' }
    : row);
  const staleCapabilities = CAPABILITY_TRUTH_REGISTRY.map((entry) => entry.id === 'legacy-social-publisher'
    ? { ...entry, lifecycle: 'active-local', routes: ['/workspace'] }
    : entry);
  const issues = validateW522RouteRecoveryCapabilityState({ routeRows: staleRoutes, capabilityRecords: staleCapabilities });
  assert.ok(issues.includes('required-route-invalid:/vault/backup'));
  assert.ok(issues.includes('legacy-backup-reactivated'));
  assert.ok(issues.includes('capability-lifecycle-invalid:legacy-social-publisher'));
});

test('W522 rejects lifecycle and canonical coverage drift fixtures', () => {
  const driftedRegistry = W522_GATE_RISK_REGISTRY.map((entry) => entry.id === 'w522-source'
    ? { ...entry, lifecycle: 'archival', canonicalGateId: '' }
    : entry);
  const contractIssues = validateW522GateRiskConvergenceContract({
    schema: 'eonapp.w522.gate-risk-convergence.v1',
    registry: driftedRegistry,
    truth: W522_TRUTH,
    sourceFiles: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
  });
  assert.ok(contractIssues.includes('required-active-gate-missing:w522-source'));

  const parsed = parseCanonicalReleaseGates("Object.freeze({ id: 'unit', command: [npm, 'run', 'test:unit'] })");
  const coverageIssues = validateW522CanonicalCoverage({
    registry: W522_GATE_RISK_REGISTRY,
    packageScripts: { 'qa:w520-core-modularisation': 'echo missing-nested-gate' },
    canonicalGates: parsed
  });
  assert.ok(coverageIssues.some((entry) => entry.startsWith('canonical-command-missing-or-mismatched:')));
  assert.ok(coverageIssues.includes('nested-command-missing:w519-source:qa:w520-core-modularisation'));
});
