import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  stableDigest,
  validateCandidateProvenance,
  validateProductionPromotionPackage
} from '../../scripts/lib/w641-release-governance.mjs';
import {
  W641_CANDIDATE_PROVENANCE_SCHEMA,
  W641_ENVIRONMENT_PROTECTION_SCHEMA,
  W641_OWNER_GO_SCHEMA,
  W641_PREVIEW_RECEIPT_SCHEMA,
  W641_REQUIRED_REHEARSAL_DOMAINS,
  validateW641ReleaseGovernanceContract
} from '../../config/w641-release-governance-contract.mjs';

const H = (char) => char.repeat(64);
const C = '1'.repeat(40);
const ISO = '2026-07-11T12:00:00.000Z';
const EXPIRES = '2026-07-11T13:00:00.000Z';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function candidate() {
  const core = {
    schema: W641_CANDIDATE_PROVENANCE_SCHEMA,
    wave: 'W641',
    commitSha: C,
    sourceFingerprint: H('a'),
    predeployReceiptDigest: H('b'),
    packageLockDigest: H('c'),
    routeContractDigest: H('d'),
    migrationDigest: H('e'),
    w638IndexDigest: H('f'),
    w639FreezeDigest: H('1'),
    distPayloadDigest: H('2'),
    fileCount: 482,
    generatedAt: ISO
  };
  return { ...core, candidateDigest: stableDigest(core) };
}

function packageContext() {
  const c = candidate();
  const evidenceIndex = {
    indexDigest: c.w638IndexDigest,
    lanes: [
      { id: 'billing', status: 'pass' },
      { id: 'local-creator', status: 'pass' },
      { id: 'referral', status: 'not-run' },
      { id: 'direct-provider', status: 'not-run' },
      { id: 'companion', status: 'not-run' }
    ]
  };
  const preview = {
    schema: W641_PREVIEW_RECEIPT_SCHEMA,
    wave: 'W641',
    deploymentId: 'preview-123456',
    previewUrl: 'https://candidate.example.pages.dev',
    candidateDigest: c.candidateDigest,
    distPayloadDigest: c.distPayloadDigest,
    commitSha: c.commitSha,
    machineChecksPassed: true,
    ownerReviewed: true,
    redactionReviewed: true,
    deployedAt: ISO
  };
  const environmentCore = {
    schema: W641_ENVIRONMENT_PROTECTION_SCHEMA,
    environment: 'production',
    requiredReviewerRulePresent: true,
    requiredReviewerCount: 1,
    productionSecretsScoped: true,
    branchPolicyVerified: true,
    capturedAt: ISO
  };
  const environment = { ...environmentCore, digest: stableDigest(environmentCore), redactionReviewed: true };
  const rehearsal = {
    productionVerdict: 'pass',
    productionRehearsalPassed: true,
    launchCandidateFrozen: true,
    freezeDigest: c.w639FreezeDigest,
    evidenceIndexDigest: evidenceIndex.indexDigest,
    buildDigest: H('3'),
    domains: W641_REQUIRED_REHEARSAL_DOMAINS.map((id) => ({ id, status: 'pass' }))
  };
  const rehearsalDigest = stableDigest({
    productionVerdict: rehearsal.productionVerdict,
    launchCandidateFrozen: rehearsal.launchCandidateFrozen,
    freezeDigest: rehearsal.freezeDigest,
    evidenceIndexDigest: rehearsal.evidenceIndexDigest,
    buildDigest: rehearsal.buildDigest,
    domains: rehearsal.domains.map(({ id, status }) => ({ id, status }))
  });
  const owner = {
    schema: W641_OWNER_GO_SCHEMA,
    wave: 'W646',
    ownerDecision: 'go',
    ownerReviewed: true,
    redactionReviewed: true,
    issuedAt: ISO,
    expiresAt: EXPIRES,
    candidateDigest: c.candidateDigest,
    sourceFingerprint: c.sourceFingerprint,
    commitSha: c.commitSha,
    previewDeploymentId: preview.deploymentId,
    evidenceIndexDigest: evidenceIndex.indexDigest,
    freezeDigest: rehearsal.freezeDigest,
    rehearsalDigest,
    environmentProtectionDigest: environment.digest,
    rollbackDeploymentId: 'production-654321',
    laneDecisions: {
      billing: { decision: 'pass' },
      'local-creator': { decision: 'pass' },
      referral: { decision: 'gated', publicGateClosed: true, publicCopyTruthful: true, ownerReviewed: true },
      'direct-provider': { decision: 'gated', publicGateClosed: true, publicCopyTruthful: true, ownerReviewed: true },
      companion: { decision: 'gated', publicGateClosed: true, publicCopyTruthful: true, ownerReviewed: true }
    }
  };
  return { candidate: c, evidenceIndex, preview, environment, rehearsal, owner };
}

test('W641 contract is fail-closed and immutable', () => {
  const result = validateW641ReleaseGovernanceContract();
  assert.equal(result.ok, true);
});

test('candidate digest detects provenance tampering', () => {
  const value = candidate();
  assert.equal(validateCandidateProvenance(value).ok, true);
  assert.equal(validateCandidateProvenance({ ...value, fileCount: value.fileCount + 1 }).ok, false);
});

test('complete package allows core PASS with optional lanes explicitly gated', () => {
  const context = packageContext();
  const result = validateProductionPromotionPackage(context, { now: Date.parse('2026-07-11T12:30:00.000Z') });
  assert.deepEqual(result.issues, []);
  assert.equal(result.ok, true);
});

test('expired authorization fails closed', () => {
  const context = packageContext();
  const result = validateProductionPromotionPackage(context, { now: Date.parse('2026-07-11T14:00:00.000Z') });
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('owner-authorization-expired'));
});

test('missing core billing proof cannot be replaced by a gated decision', () => {
  const context = packageContext();
  context.evidenceIndex.lanes[0].status = 'not-run';
  context.owner.laneDecisions.billing = { decision: 'gated', publicGateClosed: true, publicCopyTruthful: true, ownerReviewed: true };
  const result = validateProductionPromotionPackage(context, { now: Date.parse('2026-07-11T12:30:00.000Z') });
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('core-lane-not-pass:billing'));
  assert.ok(result.issues.includes('core-lane-owner-decision-not-pass:billing'));
});

test('optional lane without closed truthful public gate fails', () => {
  const context = packageContext();
  context.owner.laneDecisions.referral.publicCopyTruthful = false;
  const result = validateProductionPromotionPackage(context, { now: Date.parse('2026-07-11T12:30:00.000Z') });
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('optional-lane-gate-proof-invalid:referral'));
});

test('owner 4 GB Creator lane can launch image-first only with five real requirements and truthful video gate', () => {
  const context = packageContext();
  context.evidenceIndex.lanes[1] = {
    id: 'local-creator',
    status: 'not-run',
    requirements: [
      'realImageSaveReopen', 'ownerFourGbFallback', 'resourceBoundary', 'failureRecovery', 'libraryProjectContinuation'
    ].map((id) => ({ id, status: 'pass' }))
  };
  context.owner.laneDecisions['local-creator'] = { decision: 'image-pass-video-gated', publicGateClosed: true, publicCopyTruthful: true, ownerReviewed: true };
  const result = validateProductionPromotionPackage(context, { now: Date.parse('2026-07-11T12:30:00.000Z') });
  assert.equal(result.ok, true);
});

test('image-first Creator launch fails when owner 4 GB fallback proof is missing', () => {
  const context = packageContext();
  context.evidenceIndex.lanes[1] = {
    id: 'local-creator', status: 'not-run',
    requirements: ['realImageSaveReopen', 'resourceBoundary', 'failureRecovery', 'libraryProjectContinuation'].map((id) => ({ id, status: 'pass' }))
  };
  context.owner.laneDecisions['local-creator'] = { decision: 'image-pass-video-gated', publicGateClosed: true, publicCopyTruthful: true, ownerReviewed: true };
  const result = validateProductionPromotionPackage(context, { now: Date.parse('2026-07-11T12:30:00.000Z') });
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('core-lane-not-pass:local-creator'));
});

test('preview and production workflows enforce exact-candidate parity, protected authorization and rollback', () => {
  const preview = fs.readFileSync(path.join(root, '.github/workflows/preview.yml'), 'utf8');
  const deploy = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');

  assert.match(preview, /default:\s*w646-owner-evidence/);
  assert.match(preview, /previewAliasUrl/);
  assert.match(preview, /api-surface-receipt\.json/);
  assert.match(preview, /eonapp\.preview-api-surface-receipt\.w646\.v1/);
  assert.match(preview, /\/api\/auth\/session/);
  assert.match(preview, /deployment-ids-before\.txt/);
  assert.match(preview, /created_on >= \$started/);
  assert.match(preview, /\.aliases\[0\]/);
  assert.match(preview, /eon\.city\.access\.w649b\.v1/);
  assert.match(preview, /eonapp-preview-diagnostics-/);
  assert.match(preview, /working-directory:\s*source/);

  assert.match(deploy, /workflow_dispatch/);
  assert.match(deploy, /environment:\s*\n\s*name:\s*production/);
  assert.match(deploy, /verify:codex-predeploy/);
  assert.match(deploy, /npm run release:candidate -- --commit/);
  assert.match(deploy, /release:candidate:verify/);
  assert.match(deploy, /w641-verify-release-candidate/);
  assert.match(deploy, /w660l-stage-pages-deploy-root/);
  assert.match(deploy, /PREVIEW_BRANCH:\s*stage4-production-gate/);
  assert.ok((deploy.match(/DEPLOY_ROOT:\s*\$\{\{\s*steps\.stage\.outputs\.root\s*\}\}/g) || []).length >= 2);
  assert.match(deploy, /candidateDigest/);
  assert.match(deploy, /distPayloadDigest/);
  assert.match(deploy, /eon\.city\.access\.w649b\.v1/);
  assert.match(deploy, /\/api\/billing\/status/);
  assert.match(deploy, /a15-stage4-production-bundle-proof/);
  assert.match(deploy, /--branch=main/);
  assert.match(deploy, /if:\s*failure\(\)/);
  assert.match(deploy, /deployments\/\$ROLLBACK_ID\/rollback/);
  assert.doesNotMatch(deploy, /actions\/(?:upload|download)-artifact|gh run download/);
});
