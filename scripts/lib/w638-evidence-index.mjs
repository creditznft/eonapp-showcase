import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  W638_EVIDENCE_BOARD_SCHEMA,
  W638_EVIDENCE_INDEX_SCHEMA,
  W638_EVIDENCE_KINDS,
  W638_EVIDENCE_RECORD_SCHEMA,
  W638_EVIDENCE_STATUSES,
  W638_NON_CERTIFYING_KINDS,
  W638_EVIDENCE_LANES,
  getW638Lane,
  getW638Requirement
} from '../../config/w638-evidence-convergence-contract.mjs';

const freeze = (value) => Object.freeze(value);
const TEXT_EXTENSIONS = new Set(['.json', '.md', '.txt', '.log', '.csv', '.yaml', '.yml']);
const MAX_TEXT_SCAN_BYTES = 2 * 1024 * 1024;

const SENSITIVE_PATTERNS = freeze([
  freeze({ id: 'authorization-bearer', pattern: /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]{8,}/i }),
  freeze({ id: 'cookie-header', pattern: /\b(?:Cookie|Set-Cookie)\s*:/i }),
  freeze({ id: 'dodo-secret', pattern: /\b(?:DODO_(?:PAYMENTS_)?API_KEY|DODO_WEBHOOK_SECRET|EON_ENTITLEMENT_SIGNING_KEY)\s*[=:]\s*\S+/i }),
  freeze({ id: 'webhook-secret', pattern: /\bwhsec_[A-Za-z0-9+/=_-]{12,}/i }),
  freeze({ id: 'common-api-key', pattern: /\b(?:sk|pk|rk)_[A-Za-z0-9_-]{16,}/i }),
  freeze({ id: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i }),
  freeze({ id: 'full-email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i }),
  freeze({ id: 'raw-customer-id', pattern: /\b(?:customer|subscription|payment|invoice|account)[_-]?id\s*[=:]\s*["']?[A-Za-z0-9_-]{12,}/i })
]);

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function normalizeRelativeArtifactPath(input = '') {
  const value = String(input || '').replaceAll('\\', '/').trim();
  if (!value || path.isAbsolute(value) || /^[A-Za-z]:\//.test(value)) return null;
  const normalized = path.posix.normalize(value);
  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) return null;
  if (!normalized.startsWith('evidence/w638/')) return null;
  return normalized;
}

function scanTextForSensitiveMaterial(text = '') {
  const findings = [];
  for (const entry of SENSITIVE_PATTERNS) {
    if (entry.pattern.test(text)) findings.push(entry.id);
  }
  return freeze(findings);
}

function inspectArtifact(root, relativePath) {
  const normalized = normalizeRelativeArtifactPath(relativePath);
  if (!normalized) return freeze({ ok: false, path: String(relativePath || ''), issues: freeze(['artifact-path-invalid']) });
  const absolute = path.join(root, ...normalized.split('/'));
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    return freeze({ ok: false, path: normalized, issues: freeze(['artifact-missing']) });
  }
  const stat = fs.statSync(absolute);
  const buffer = fs.readFileSync(absolute);
  const issues = [];
  const extension = path.extname(normalized).toLowerCase();
  if (TEXT_EXTENSIONS.has(extension)) {
    if (stat.size > MAX_TEXT_SCAN_BYTES) issues.push('text-artifact-too-large-to-redaction-scan');
    else issues.push(...scanTextForSensitiveMaterial(buffer.toString('utf8')).map((id) => `sensitive:${id}`));
  }
  return freeze({
    ok: issues.length === 0,
    path: normalized,
    bytes: stat.size,
    sha256: sha256(buffer),
    issues: freeze(issues)
  });
}

function validIsoInstant(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function validateSubjectDigests(value) {
  if (value == null) return true;
  if (!Array.isArray(value)) return false;
  return value.every((item) => /^sha256:[a-f0-9]{12,64}$/i.test(String(item || '')));
}

export function validateW638EvidenceRecord(record, { root = process.cwd() } = {}) {
  const issues = [];
  const lane = getW638Lane(record?.laneId);
  const requirement = getW638Requirement(record?.laneId, record?.requirementId);
  const status = String(record?.status || '');
  const kind = String(record?.evidenceKind || '');
  if (record?.schema !== W638_EVIDENCE_RECORD_SCHEMA) issues.push('record-schema-invalid');
  if (!lane) issues.push('lane-unknown');
  if (!requirement) issues.push('requirement-unknown');
  if (!W638_EVIDENCE_STATUSES.includes(status)) issues.push('status-invalid');
  if (kind && !W638_EVIDENCE_KINDS.includes(kind)) issues.push('evidence-kind-invalid');
  if (!validateSubjectDigests(record?.subjectDigests)) issues.push('subject-digests-invalid');
  if (record && ('customerId' in record || 'subscriptionId' in record || 'paymentId' in record || 'email' in record || 'rawPayload' in record || 'secret' in record)) {
    issues.push('raw-sensitive-field-forbidden');
  }

  const artifacts = Array.isArray(record?.artifactPaths)
    ? record.artifactPaths.map((item) => inspectArtifact(root, item))
    : [];
  if (artifacts.some((item) => !item.ok)) issues.push('artifact-validation-failed');

  if (status === 'pass') {
    if (!kind) issues.push('pass-evidence-kind-required');
    if (W638_NON_CERTIFYING_KINDS.includes(kind)) issues.push('non-certifying-kind-cannot-pass');
    if (requirement && !requirement.acceptedKinds.includes(kind)) issues.push('evidence-kind-not-accepted-for-requirement');
    if (record?.ownerReviewed !== true) issues.push('owner-review-required');
    if (!validIsoInstant(record?.occurredAt)) issues.push('occurred-at-required');
    if (artifacts.length === 0) issues.push('artifact-required');
    if (record?.redaction?.reviewed !== true || record?.redaction?.secretsRemoved !== true || record?.redaction?.directIdentifiersRemoved !== true) {
      issues.push('redaction-declaration-required');
    }
    if (requirement?.destructive === true) {
      if (record?.actionReview?.approvedBeforeAction !== true || !validIsoInstant(record?.actionReview?.approvedAt) || !normalizeRelativeArtifactPath(record?.actionReview?.approvalArtifactPath)) {
        issues.push('prior-owner-action-approval-required');
      } else {
        const approval = inspectArtifact(root, record.actionReview.approvalArtifactPath);
        if (!approval.ok) issues.push('approval-artifact-invalid');
      }
    }
  } else {
    if (!String(record?.reason || '').trim()) issues.push('non-pass-reason-required');
  }

  return freeze({
    ok: issues.length === 0,
    issues: freeze([...new Set(issues)]),
    laneId: record?.laneId || '',
    requirementId: record?.requirementId || '',
    status,
    evidenceKind: kind,
    artifacts: freeze(artifacts)
  });
}

function deriveRequirementState(records, lane, requirement, root) {
  const matching = records.filter((record) => record?.laneId === lane.id && record?.requirementId === requirement.id);
  const validations = matching.map((record) => freeze({ record, validation: validateW638EvidenceRecord(record, { root }) }));
  const acceptedPass = validations.find(({ record, validation }) => validation.ok && record.status === 'pass');
  const validNoGo = validations.find(({ record, validation }) => validation.ok && record.status === 'no-go');
  const validNotRun = validations.find(({ record, validation }) => validation.ok && record.status === 'not-run');
  const status = acceptedPass ? 'pass' : validNoGo ? 'no-go' : 'not-run';
  return freeze({
    id: requirement.id,
    destructive: requirement.destructive,
    status,
    acceptedRecordId: acceptedPass?.record?.id || validNoGo?.record?.id || validNotRun?.record?.id || null,
    recordCount: matching.length,
    invalidRecordCount: validations.filter(({ validation }) => !validation.ok).length,
    validationIssues: freeze(validations.flatMap(({ validation }) => validation.issues))
  });
}

function deriveLaneState(records, lane, root) {
  const requirements = lane.requirements.map((requirement) => deriveRequirementState(records, lane, requirement, root));
  const passed = requirements.filter((item) => item.status === 'pass').length;
  const noGo = requirements.filter((item) => item.status === 'no-go').length;
  const invalid = requirements.reduce((sum, item) => sum + item.invalidRecordCount, 0);
  const status = passed === requirements.length && invalid === 0 ? 'pass' : noGo > 0 || invalid > 0 ? 'no-go' : 'not-run';
  return freeze({ id: lane.id, title: lane.title, status, total: requirements.length, passed, noGo, notRun: requirements.length - passed - noGo, invalidRecords: invalid, requirements: freeze(requirements) });
}

export function buildW638EvidenceIndex(board, { root = process.cwd(), generatedAt = new Date().toISOString() } = {}) {
  const boardIssues = [];
  if (board?.schema !== W638_EVIDENCE_BOARD_SCHEMA) boardIssues.push('board-schema-invalid');
  if (board?.wave !== 'W638') boardIssues.push('board-wave-invalid');
  if (!Array.isArray(board?.records)) boardIssues.push('board-records-invalid');
  const records = Array.isArray(board?.records) ? board.records : [];
  const duplicateIds = records.map((record) => record?.id).filter(Boolean).filter((id, index, values) => values.indexOf(id) !== index);
  if (duplicateIds.length) boardIssues.push('duplicate-record-id');
  const recordValidations = records.map((record) => validateW638EvidenceRecord(record, { root }));
  if (recordValidations.some((result) => !result.ok)) boardIssues.push('invalid-records-present');
  const lanes = W638_EVIDENCE_LANES.map((lane) => deriveLaneState(records, lane, root));
  const status = lanes.every((lane) => lane.status === 'pass') && boardIssues.length === 0
    ? 'pass'
    : lanes.some((lane) => lane.status === 'no-go') || boardIssues.length > 0
      ? 'no-go'
      : 'not-run';
  const artifactRows = recordValidations.flatMap((result) => result.artifacts).filter((artifact) => artifact.ok);
  const uniqueArtifacts = [...new Map(artifactRows.map((artifact) => [artifact.path, artifact])).values()].sort((a, b) => a.path.localeCompare(b.path));
  const immutablePayload = JSON.stringify({ lanes, artifacts: uniqueArtifacts.map(({ path: artifactPath, bytes, sha256: digest }) => ({ path: artifactPath, bytes, sha256: digest })) });
  return freeze({
    schema: W638_EVIDENCE_INDEX_SCHEMA,
    wave: 'W638',
    generatedAt,
    sourceGateOk: boardIssues.length === 0,
    productionVerdict: status,
    productionCertified: status === 'pass',
    boardIssues: freeze(boardIssues),
    recordCount: records.length,
    invalidRecordCount: recordValidations.filter((result) => !result.ok).length,
    lanes: freeze(lanes),
    artifacts: freeze(uniqueArtifacts),
    indexDigest: sha256(Buffer.from(immutablePayload, 'utf8')),
    boundaries: freeze({ syntheticCanCertify: false, sourceCanCertify: false, secretsIncluded: false, fullCustomerIdentifiersIncluded: false })
  });
}

export function loadW638EvidenceBoard(root = process.cwd(), relativePath = 'config/w638-evidence-convergence-board.json') {
  const absolute = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}
