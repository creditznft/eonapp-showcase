import assert from 'node:assert/strict';
import test from 'node:test';
import { W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT, validateW462TrustAccessibilitySourceAuditContract } from '../../config/w462-trust-accessibility-source-audit-contract.mjs';
import { inspectW462TrustAccessibilitySourceAudit } from '../../scripts/w462-trust-accessibility-source-audit.mjs';
import { inspectW462TrustAccessibilitySourceAuditGate } from '../../scripts/w462-trust-accessibility-source-audit-gate.mjs';

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W462.1 consolidates current a11y, language, voice and security source controls without claiming external proof', () => {
  assert.deepEqual(validateW462TrustAccessibilitySourceAuditContract(), []);
  const report = inspectW462TrustAccessibilitySourceAudit();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.deepEqual(report.memberGates.map((entry) => entry.id), ['W271-A0', 'W272-A0', 'W287-A0', 'W394C']);
  assert.equal(report.memberGates.every((entry) => entry.pass), true);
  assert.equal(report.fullProductLanguageCodes.length, 11);
  assert.equal(report.fullProductLanguageCodes.includes('ar'), true);
  assert.equal(report.fullProductLanguageCodes.includes('hi'), true);
  assert.equal(report.networkRequestCreated, false);
  assert.equal(report.deviceEvidenceCaptured, false);
  assert.equal(report.accessibilityCertified, false);
  assert.equal(report.localeContentCertified, false);
  assert.equal(report.microphonePermissionVerified, false);
  assert.equal(report.cspEdgeHeaderVerified, false);
  assert.equal(report.supplyChainApproved, false);
  assert.equal(report.liveReleaseApproved, false);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W462.1 static gate preserves the source-only external-evidence fence', () => {
  const gate = inspectW462TrustAccessibilitySourceAuditGate();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 7);
  assert.equal(W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.externalEvidence.length >= 7, true);
  assert.match(gate.limitations.join(' '), /cannot certify/i);
});
