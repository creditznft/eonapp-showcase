#!/usr/bin/env node
/** Create an owner GO receipt only after all machine evidence validates. */
import fs from 'node:fs';
import path from 'node:path';
import {
  validateCandidateProvenance,
  validateEnvironmentProtection,
  validateLaunchScopeEvidence,
  validateOwnerAuthorization,
  validatePreviewReceipt,
  validateProductionPromotionPackage,
  validateRehearsalBoard
} from './lib/w641-release-governance.mjs';
import { W641_OWNER_GO_SCHEMA } from '../config/w641-release-governance-contract.mjs';

const [candidateRootArg, previewArg, evidenceRootArg, environmentArg, rollbackDeploymentId, outputArg] = process.argv.slice(2);
if (!candidateRootArg || !previewArg || !evidenceRootArg || !environmentArg || !rollbackDeploymentId) throw new Error('Usage: candidateRoot previewReceipt evidenceRoot environmentReceipt rollbackDeploymentId [outputDirectory]');
const candidateRoot = path.resolve(candidateRootArg);
const evidenceRoot = path.resolve(evidenceRootArg);
const output = path.resolve(outputArg || 'artifacts/w641-owner-authorization');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const candidate = read(path.join(candidateRoot, 'candidate-provenance.json'));
const preview = { ...read(path.resolve(previewArg)), ownerReviewed: true, redactionReviewed: true };
const evidenceIndex = read(path.join(evidenceRoot, 'w638-evidence-index.json'));
const rehearsal = read(path.join(evidenceRoot, 'w639-rehearsal-board.json'));
const laneDecisions = read(path.join(evidenceRoot, 'lane-decisions.json'));
const environment = read(path.resolve(environmentArg));

const preliminary = {
  candidate: validateCandidateProvenance(candidate),
  preview: validatePreviewReceipt(preview, candidate),
  environment: validateEnvironmentProtection(environment),
  rehearsal: validateRehearsalBoard(rehearsal),
  evidence: validateLaunchScopeEvidence(evidenceIndex, laneDecisions)
};
const preliminaryIssues = Object.values(preliminary).flatMap((result) => result.issues || []);
if (preliminaryIssues.length) throw new Error(`Cannot issue owner GO: ${[...new Set(preliminaryIssues)].join(', ')}`);

const issuedAt = process.env.EON_OWNER_GO_ISSUED_AT || new Date().toISOString();
const minutes = Math.min(240, Math.max(15, Number(process.env.EON_OWNER_GO_EXPIRY_MINUTES || 60)));
const expiresAt = new Date(Date.parse(issuedAt) + minutes * 60_000).toISOString();
const owner = {
  schema: W641_OWNER_GO_SCHEMA,
  wave: 'W646',
  ownerDecision: 'go',
  ownerReviewed: true,
  issuedAt,
  expiresAt,
  candidateDigest: candidate.candidateDigest,
  sourceFingerprint: candidate.sourceFingerprint,
  commitSha: candidate.commitSha,
  previewDeploymentId: preview.deploymentId,
  previewUrl: preview.previewUrl,
  evidenceIndexDigest: evidenceIndex.indexDigest,
  freezeDigest: rehearsal.freezeDigest,
  rehearsalDigest: preliminary.rehearsal.digest,
  environmentProtectionDigest: preliminary.environment.digest,
  rollbackDeploymentId,
  laneDecisions,
  redactionReviewed: true,
  notes: 'Issued by the protected launch-authorization environment after exact-candidate, Preview, evidence, freeze, environment and rollback validation.'
};
const context = { candidate, preview, evidenceIndex, rehearsal, environment, owner };
const ownerCheck = validateOwnerAuthorization(owner, { ...context, rehearsalDigest: preliminary.rehearsal.digest }, { now: Date.parse(issuedAt) });
if (!ownerCheck.ok) throw new Error(`Owner authorization self-check failed: ${ownerCheck.issues.join(', ')}`);
const packageCheck = validateProductionPromotionPackage(context, { now: Date.parse(issuedAt) });
if (!packageCheck.ok) throw new Error(`Promotion package self-check failed: ${packageCheck.issues.join(', ')}`);

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const files = {
  'owner-go-receipt.json': owner,
  'preview-receipt.json': preview,
  'environment-protection.json': environment,
  'w638-evidence-index.json': evidenceIndex,
  'w639-rehearsal-board.json': rehearsal,
  'lane-decisions.json': laneDecisions,
  'candidate-provenance.json': candidate,
  'promotion-validation.json': packageCheck
};
for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(output, name), `${JSON.stringify(value, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, output, candidateDigest: candidate.candidateDigest, expiresAt }, null, 2));
