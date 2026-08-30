import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateEonConcurrencyAdmission,
  evaluateEonPremiumWorkloadAdmission,
  validateEonPremiumWorkloadBudget
} from '../../assets/js/capabilities/eon-premium-workload-budget.js';

test('RT92 premium workload budget validates capability vs capacity separation', () => {
  const report = validateEonPremiumWorkloadBudget();
  assert.equal(report.ok, true, report.errors.join('\n'));
});

test('RT92 Ultimate-style software access cannot authorize unlimited EONAPP-funded hosted AI', () => {
  const denied = evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'platform-hosted', capacityAuthority: 'subscription', serverVerifiedCapacity: false, limit: 100 });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'server-verified-capacity-required');
  assert.equal(denied.ultimateAloneProvidesHostedCapacity, false);
  assert.equal(denied.browserPaidGrantCreated, false);
});

test('RT92 hosted capacity is finite and fails closed at limit', () => {
  const admitted = evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'platform-hosted', capacityAuthority: 'subscription', serverVerifiedCapacity: true, currentUsage: 9, requestedUnits: 1, limit: 10 });
  assert.equal(admitted.allowed, true);
  assert.equal(admitted.remainingAfterAdmission, 0);
  const denied = evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'platform-hosted', capacityAuthority: 'subscription', serverVerifiedCapacity: true, currentUsage: 10, requestedUnits: 1, limit: 10 });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'capacity-limit-reached');
});

test('RT92 local and BYOK workloads use explicit user-funded capacity authorities', () => {
  assert.equal(evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'local', capacityAuthority: 'local-device' }).allowed, true);
  assert.equal(evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'byok', capacityAuthority: 'byok' }).allowed, true);
  assert.equal(evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'platform-hosted', capacityAuthority: 'byok', serverVerifiedCapacity: true, limit: 999 }).allowed, false);
});

test('RT92 parallel work enforces concurrency independently of software unlock', () => {
  const denied = evaluateEonConcurrencyAdmission({ softwareAccess: true, capacityAuthority: 'subscription', serverVerifiedCapacity: true, activeJobs: 4, requestedJobs: 1, concurrencyLimit: 4 });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'capacity-limit-reached');
  assert.equal(denied.softwareAccess, true);
});
