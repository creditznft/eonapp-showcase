import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  W641_CANDIDATE_MANIFEST_SCHEMA,
  W641_CANDIDATE_PROVENANCE_SCHEMA,
  W641_ENVIRONMENT_PROTECTION_SCHEMA,
  W641_OPTIONAL_GATED_LANES,
  W641_OWNER_GO_SCHEMA,
  W641_PREVIEW_RECEIPT_SCHEMA,
  W641_REQUIRED_CORE_LANES,
  W641_REQUIRED_REHEARSAL_DOMAINS
} from '../../config/w641-release-governance-contract.mjs';

const freeze = (value) => Object.freeze(value);
const HEX64 = /^[a-f0-9]{64}$/;
const SHA40 = /^[a-f0-9]{40}$/;
const ID = /^[A-Za-z0-9._:-]{6,180}$/;

export function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function stableDigest(value) {
  return sha256(Buffer.from(stable(value), 'utf8'));
}

function relativeFiles(directory, prefix = '') {
  if (!fs.existsSync(directory)) return [];
  const rows = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) rows.push(...relativeFiles(absolute, relative));
    else if (entry.isFile()) rows.push(relative.replaceAll('\\', '/'));
  }
  return rows;
}

export function buildCandidateFileRows(directory, { excludeReleaseMetadata = false } = {}) {
  const files = relativeFiles(directory).filter((relative) => !(excludeReleaseMetadata && relative.startsWith('release/')));
  return freeze(files.map((relative) => {
    const body = fs.readFileSync(path.join(directory, ...relative.split('/')));
    return freeze({ path: relative, bytes: body.length, sha256: sha256(body) });
  }));
}

export function buildCandidatePayloadDigest(rows = []) {
  return stableDigest(rows.map(({ path: filePath, bytes, sha256: digest }) => ({ path: filePath, bytes, sha256: digest })));
}

export function buildCandidateManifest(directory) {
  const files = buildCandidateFileRows(directory);
  const payloadDigest = buildCandidatePayloadDigest(files);
  return freeze({
    schema: W641_CANDIDATE_MANIFEST_SCHEMA,
    wave: 'W641',
    fileCount: files.length,
    payloadDigest,
    files
  });
}

function validIso(value) {
  const time = Date.parse(String(value || ''));
  return Number.isFinite(time);
}

export function validateCandidateProvenance(value = {}) {
  const issues = [];
  if (value.schema !== W641_CANDIDATE_PROVENANCE_SCHEMA) issues.push('candidate-schema-invalid');
  if (value.wave !== 'W641') issues.push('candidate-wave-invalid');
  if (!SHA40.test(String(value.commitSha || ''))) issues.push('candidate-commit-invalid');
  for (const field of ['candidateDigest', 'sourceFingerprint', 'predeployReceiptDigest', 'packageLockDigest', 'routeContractDigest', 'migrationDigest', 'w638IndexDigest', 'w639FreezeDigest', 'distPayloadDigest']) {
    if (!HEX64.test(String(value[field] || ''))) issues.push(`${field}-invalid`);
  }
  if (!Number.isInteger(value.fileCount) || value.fileCount < 1) issues.push('candidate-file-count-invalid');
  if (!validIso(value.generatedAt)) issues.push('candidate-generated-at-invalid');
  const expected = stableDigest({
    schema: value.schema,
    wave: value.wave,
    commitSha: value.commitSha,
    sourceFingerprint: value.sourceFingerprint,
    predeployReceiptDigest: value.predeployReceiptDigest,
    packageLockDigest: value.packageLockDigest,
    routeContractDigest: value.routeContractDigest,
    migrationDigest: value.migrationDigest,
    w638IndexDigest: value.w638IndexDigest,
    w639FreezeDigest: value.w639FreezeDigest,
    distPayloadDigest: value.distPayloadDigest,
    fileCount: value.fileCount,
    generatedAt: value.generatedAt
  });
  if (value.candidateDigest !== expected) issues.push('candidate-digest-mismatch');
  return freeze({ ok: issues.length === 0, issues: freeze(issues), expectedCandidateDigest: expected });
}

export function validatePreviewReceipt(value = {}, candidate = {}) {
  const issues = [];
  if (value.schema !== W641_PREVIEW_RECEIPT_SCHEMA) issues.push('preview-schema-invalid');
  if (value.wave !== 'W641') issues.push('preview-wave-invalid');
  if (!ID.test(String(value.deploymentId || ''))) issues.push('preview-deployment-id-invalid');
  if (!/^https:\/\//.test(String(value.previewUrl || ''))) issues.push('preview-url-invalid');
  if (value.candidateDigest !== candidate.candidateDigest) issues.push('preview-candidate-digest-mismatch');
  if (value.distPayloadDigest !== candidate.distPayloadDigest) issues.push('preview-dist-digest-mismatch');
  if (value.commitSha !== candidate.commitSha) issues.push('preview-commit-mismatch');
  if (value.machineChecksPassed !== true) issues.push('preview-machine-checks-not-pass');
  if (value.ownerReviewed !== true) issues.push('preview-owner-review-required');
  if (value.redactionReviewed !== true) issues.push('preview-redaction-review-required');
  if (!validIso(value.deployedAt)) issues.push('preview-deployed-at-invalid');
  return freeze({ ok: issues.length === 0, issues: freeze(issues) });
}

export function validateEnvironmentProtection(value = {}) {
  const issues = [];
  if (value.schema !== W641_ENVIRONMENT_PROTECTION_SCHEMA) issues.push('environment-schema-invalid');
  if (value.environment !== 'production') issues.push('environment-name-invalid');
  if (value.requiredReviewerRulePresent !== true) issues.push('required-reviewer-rule-missing');
  if (!Number.isInteger(value.requiredReviewerCount) || value.requiredReviewerCount < 1) issues.push('required-reviewer-count-invalid');
  if (value.productionSecretsScoped !== true) issues.push('production-secrets-not-scoped');
  if (value.branchPolicyVerified !== true) issues.push('production-branch-policy-not-verified');
  if (value.redactionReviewed !== true) issues.push('environment-redaction-review-required');
  if (!validIso(value.capturedAt)) issues.push('environment-captured-at-invalid');
  const digest = stableDigest({
    schema: value.schema,
    environment: value.environment,
    requiredReviewerRulePresent: value.requiredReviewerRulePresent,
    requiredReviewerCount: value.requiredReviewerCount,
    productionSecretsScoped: value.productionSecretsScoped,
    branchPolicyVerified: value.branchPolicyVerified,
    capturedAt: value.capturedAt
  });
  if (value.digest !== digest) issues.push('environment-digest-mismatch');
  return freeze({ ok: issues.length === 0, issues: freeze(issues), digest });
}

function laneMap(index = {}) {
  return Object.fromEntries((Array.isArray(index?.lanes) ? index.lanes : []).map((lane) => [lane.id, lane.status]));
}

export function validateLaunchScopeEvidence(index = {}, laneDecisions = {}) {
  const issues = [];
  const statuses = laneMap(index);
  if (!HEX64.test(String(index.indexDigest || ''))) issues.push('evidence-index-digest-invalid');
  for (const lane of W641_REQUIRED_CORE_LANES) {
    const decision = laneDecisions?.[lane] || {};
    if (lane === 'local-creator' && statuses[lane] !== 'pass') {
      const creator = (Array.isArray(index?.lanes) ? index.lanes : []).find((row) => row.id === 'local-creator');
      const requirementStatus = Object.fromEntries((creator?.requirements || []).map((row) => [row.id, row.status]));
      const requiredImageScope = ['realImageSaveReopen', 'ownerFourGbFallback', 'resourceBoundary', 'failureRecovery', 'libraryProjectContinuation'];
      const partialOk = decision.decision === 'image-pass-video-gated'
        && requiredImageScope.every((id) => requirementStatus[id] === 'pass')
        && decision.publicGateClosed === true && decision.publicCopyTruthful === true && decision.ownerReviewed === true;
      if (!partialOk) issues.push('core-lane-not-pass:local-creator');
      continue;
    }
    if (statuses[lane] !== 'pass') issues.push(`core-lane-not-pass:${lane}`);
    if (decision.decision !== 'pass') issues.push(`core-lane-owner-decision-not-pass:${lane}`);
  }
  for (const lane of W641_OPTIONAL_GATED_LANES) {
    const decision = laneDecisions?.[lane] || {};
    if (statuses[lane] === 'pass') {
      if (decision.decision !== 'pass') issues.push(`optional-lane-pass-not-accepted:${lane}`);
      continue;
    }
    if (decision.decision !== 'gated') issues.push(`optional-lane-must-pass-or-gate:${lane}`);
    if (decision.publicGateClosed !== true || decision.publicCopyTruthful !== true || decision.ownerReviewed !== true) issues.push(`optional-lane-gate-proof-invalid:${lane}`);
  }
  return freeze({ ok: issues.length === 0, issues: freeze(issues), statuses: freeze(statuses) });
}

export function validateRehearsalBoard(value = {}) {
  const issues = [];
  const domains = Array.isArray(value.domains) ? value.domains : [];
  const ids = domains.map((domain) => domain.id);
  if (domains.length !== W641_REQUIRED_REHEARSAL_DOMAINS.length) issues.push('rehearsal-domain-count-invalid');
  for (const id of W641_REQUIRED_REHEARSAL_DOMAINS) {
    const domain = domains.find((row) => row.id === id);
    if (!domain) issues.push(`rehearsal-domain-missing:${id}`);
    else if (domain.status !== 'pass') issues.push(`rehearsal-domain-not-pass:${id}`);
  }
  if (new Set(ids).size !== ids.length) issues.push('rehearsal-domain-duplicate');
  if (value.productionRehearsalPassed !== true || value.launchCandidateFrozen !== true || value.productionVerdict !== 'pass') issues.push('rehearsal-not-frozen-pass');
  if (!HEX64.test(String(value.freezeDigest || '')) || !HEX64.test(String(value.evidenceIndexDigest || ''))) issues.push('rehearsal-link-digest-invalid');
  const digest = stableDigest({
    productionVerdict: value.productionVerdict,
    launchCandidateFrozen: value.launchCandidateFrozen,
    freezeDigest: value.freezeDigest,
    evidenceIndexDigest: value.evidenceIndexDigest,
    buildDigest: value.buildDigest,
    domains: domains.map(({ id, status }) => ({ id, status }))
  });
  return freeze({ ok: issues.length === 0, issues: freeze(issues), digest });
}

export function validateOwnerAuthorization(value = {}, context = {}, { now = Date.now() } = {}) {
  const issues = [];
  if (value.schema !== W641_OWNER_GO_SCHEMA) issues.push('owner-schema-invalid');
  if (value.wave !== 'W646') issues.push('owner-wave-invalid');
  if (value.ownerDecision !== 'go' || value.ownerReviewed !== true) issues.push('owner-go-required');
  if (value.redactionReviewed !== true) issues.push('owner-redaction-review-required');
  if (!validIso(value.issuedAt) || !validIso(value.expiresAt)) issues.push('owner-time-invalid');
  const issued = Date.parse(String(value.issuedAt || ''));
  const expires = Date.parse(String(value.expiresAt || ''));
  if (Number.isFinite(issued) && Number.isFinite(expires) && (expires <= issued || expires - issued > 24 * 60 * 60 * 1000)) issues.push('owner-expiry-window-invalid');
  if (Number.isFinite(expires) && now > expires) issues.push('owner-authorization-expired');
  const expectedFields = {
    candidateDigest: context.candidate?.candidateDigest,
    sourceFingerprint: context.candidate?.sourceFingerprint,
    commitSha: context.candidate?.commitSha,
    previewDeploymentId: context.preview?.deploymentId,
    evidenceIndexDigest: context.evidenceIndex?.indexDigest,
    freezeDigest: context.rehearsal?.freezeDigest,
    rehearsalDigest: context.rehearsalDigest,
    environmentProtectionDigest: context.environment?.digest
  };
  for (const [field, expected] of Object.entries(expectedFields)) if (!expected || value[field] !== expected) issues.push(`owner-${field}-mismatch`);
  if (!ID.test(String(value.rollbackDeploymentId || ''))) issues.push('owner-rollback-id-invalid');
  if (value.rollbackDeploymentId === value.previewDeploymentId) issues.push('rollback-cannot-be-preview');
  const evidence = validateLaunchScopeEvidence(context.evidenceIndex, value.laneDecisions);
  issues.push(...evidence.issues);
  return freeze({ ok: issues.length === 0, issues: freeze([...new Set(issues)]), evidence });
}

export function validateProductionPromotionPackage(context = {}, options = {}) {
  const candidate = validateCandidateProvenance(context.candidate);
  const preview = validatePreviewReceipt(context.preview, context.candidate);
  const environment = validateEnvironmentProtection(context.environment);
  const rehearsal = validateRehearsalBoard(context.rehearsal);
  const owner = validateOwnerAuthorization(context.owner, { ...context, environment: { ...context.environment, digest: environment.digest }, rehearsalDigest: rehearsal.digest }, options);
  const issues = [...candidate.issues, ...preview.issues, ...environment.issues, ...rehearsal.issues, ...owner.issues];
  if (context.rehearsal?.evidenceIndexDigest !== context.evidenceIndex?.indexDigest) issues.push('rehearsal-evidence-index-mismatch');
  if (context.rehearsal?.freezeDigest !== context.candidate?.w639FreezeDigest) issues.push('candidate-freeze-mismatch');
  if (context.evidenceIndex?.indexDigest !== context.candidate?.w638IndexDigest) issues.push('candidate-evidence-index-mismatch');
  return freeze({
    ok: issues.length === 0,
    issues: freeze([...new Set(issues)]),
    checks: freeze({ candidate, preview, environment, rehearsal, owner })
  });
}
