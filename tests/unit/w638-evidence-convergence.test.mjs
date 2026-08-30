import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  W638_EVIDENCE_BOARD_SCHEMA,
  W638_EVIDENCE_CONVERGENCE_CONTRACT,
  W638_EVIDENCE_RECORD_SCHEMA,
  validateW638EvidenceConvergenceContract
} from '../../config/w638-evidence-convergence-contract.mjs';
import {
  buildW638EvidenceIndex,
  validateW638EvidenceRecord
} from '../../scripts/lib/w638-evidence-index.mjs';
import { inspectW638EvidenceConvergence } from '../../scripts/w638-evidence-convergence-gate.mjs';

function withEvidenceRoot(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eonapp-w638-'));
  fs.mkdirSync(path.join(root, 'evidence', 'w638'), { recursive: true });
  try { return callback(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

function writeArtifact(root, name, body = 'redacted evidence\n') {
  const relative = `evidence/w638/${name}`;
  fs.writeFileSync(path.join(root, relative), body, 'utf8');
  return relative;
}

function passRecord(overrides = {}) {
  return {
    schema: W638_EVIDENCE_RECORD_SCHEMA,
    id: 'record-1',
    laneId: 'local-creator',
    requirementId: 'realImageSaveReopen',
    status: 'pass',
    evidenceKind: 'device',
    occurredAt: '2026-07-11T12:00:00.000Z',
    ownerReviewed: true,
    artifactPaths: ['evidence/w638/device-proof.md'],
    subjectDigests: ['sha256:0123456789abcdef'],
    redaction: { reviewed: true, secretsRemoved: true, directIdentifiersRemoved: true },
    ...overrides
  };
}

function board(records = []) {
  return { schema: W638_EVIDENCE_BOARD_SCHEMA, wave: 'W638', records };
}

test('W638 canonical contract keeps production certification derived and source/synthetic proof non-certifying', () => {
  const result = validateW638EvidenceConvergenceContract();
  assert.equal(result.ok, true);
  assert.equal(W638_EVIDENCE_CONVERGENCE_CONTRACT.productionCertified, false);
  assert.deepEqual(W638_EVIDENCE_CONVERGENCE_CONTRACT.nonCertifyingKinds, ['synthetic', 'source']);
  assert.equal(inspectW638EvidenceConvergence().ok, true);
  assert.equal(inspectW638EvidenceConvergence().productionCertified, false);
});

test('W638 empty evidence board is honestly NOT-RUN rather than PASS', () => withEvidenceRoot((root) => {
  const index = buildW638EvidenceIndex(board(), { root, generatedAt: '2026-07-11T12:00:00.000Z' });
  assert.equal(index.sourceGateOk, true);
  assert.equal(index.productionVerdict, 'not-run');
  assert.equal(index.productionCertified, false);
  assert.equal(index.lanes.every((lane) => lane.status === 'not-run'), true);
}));

test('W638 accepts a redacted genuine device artifact and records its digest', () => withEvidenceRoot((root) => {
  writeArtifact(root, 'device-proof.md');
  const record = passRecord();
  const validation = validateW638EvidenceRecord(record, { root });
  assert.equal(validation.ok, true);
  assert.match(validation.artifacts[0].sha256, /^[a-f0-9]{64}$/);
  const index = buildW638EvidenceIndex(board([record]), { root, generatedAt: '2026-07-11T12:00:00.000Z' });
  const requirement = index.lanes.find((lane) => lane.id === 'local-creator').requirements.find((item) => item.id === 'realImageSaveReopen');
  assert.equal(requirement.status, 'pass');
  assert.equal(index.productionCertified, false);
}));

test('W638 rejects source or synthetic fixtures presented as production PASS', () => withEvidenceRoot((root) => {
  writeArtifact(root, 'device-proof.md');
  for (const evidenceKind of ['source', 'synthetic']) {
    const validation = validateW638EvidenceRecord(passRecord({ evidenceKind }), { root });
    assert.equal(validation.ok, false);
    assert.equal(validation.issues.includes('non-certifying-kind-cannot-pass'), true);
  }
}));

test('W638 rejects secrets, cookies, full emails and raw customer identifiers in text artifacts', () => withEvidenceRoot((root) => {
  writeArtifact(root, 'device-proof.md', [
    'Authorization: Bearer hidden-token-value',
    'Cookie: session=abc',
    'customer_id=cus_123456789012345',
    'person@example.com'
  ].join('\n'));
  const validation = validateW638EvidenceRecord(passRecord(), { root });
  assert.equal(validation.ok, false);
  assert.equal(validation.issues.includes('artifact-validation-failed'), true);
  assert.equal(validation.artifacts[0].issues.some((item) => item.startsWith('sensitive:')), true);
}));

test('W638 requires explicit prior owner approval for destructive billing evidence', () => withEvidenceRoot((root) => {
  writeArtifact(root, 'billing-cancel.md');
  const record = passRecord({
    laneId: 'billing',
    requirementId: 'cancellation',
    evidenceKind: 'production',
    artifactPaths: ['evidence/w638/billing-cancel.md']
  });
  const rejected = validateW638EvidenceRecord(record, { root });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.issues.includes('prior-owner-action-approval-required'), true);

  writeArtifact(root, 'owner-approval.md', 'owner approval recorded before controlled cancellation\n');
  const accepted = validateW638EvidenceRecord({
    ...record,
    actionReview: {
      approvedBeforeAction: true,
      approvedAt: '2026-07-11T11:55:00.000Z',
      approvalArtifactPath: 'evidence/w638/owner-approval.md'
    }
  }, { root });
  assert.equal(accepted.ok, true);
}));

test('W638 rejects artifact traversal and raw sensitive fields even when the record claims redaction', () => withEvidenceRoot((root) => {
  const validation = validateW638EvidenceRecord(passRecord({
    artifactPaths: ['../secret.env'],
    customerId: 'cus_should_never_be_here'
  }), { root });
  assert.equal(validation.ok, false);
  assert.equal(validation.issues.includes('raw-sensitive-field-forbidden'), true);
  assert.equal(validation.issues.includes('artifact-validation-failed'), true);
}));
