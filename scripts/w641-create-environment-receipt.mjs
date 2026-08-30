#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { stableDigest } from './lib/w641-release-governance.mjs';
import { W641_ENVIRONMENT_PROTECTION_SCHEMA } from '../config/w641-release-governance-contract.mjs';

const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const output = process.argv[3] || 'environment-protection.json';
const protectionRules = Array.isArray(input.protection_rules) ? input.protection_rules : [];
const reviewers = protectionRules.find((rule) => rule.type === 'required_reviewers');
const nativeRequiredReviewerCount = Array.isArray(reviewers?.reviewers)
  ? reviewers.reviewers.length
  : Number(reviewers ? 1 : 0);
const branchPolicy = input.deployment_branch_policy || {};
const nativeBranchPolicyVerified = branchPolicy.protected_branches === true
  || branchPolicy.custom_branch_policies === true;
const productionSecretsScoped = process.env.EON_PRODUCTION_SECRETS_SCOPED === 'true';
const capturedAt = process.env.EON_CAPTURED_AT || new Date().toISOString();

const repository = String(process.env.REPO || process.env.GITHUB_REPOSITORY || '');
const expectedCommit = String(process.env.EXPECTED_COMMIT || process.env.GITHUB_SHA || '');
const certifiedCandidateDigest = String(process.env.CERTIFIED_PREVIEW_DIGEST || '');
const workflowRef = String(process.env.GITHUB_REF || '');
const workflowRefName = String(process.env.GITHUB_REF_NAME || '');
const expectedWorkflowRefName = 'codex/eoncity-stage4-repair';
const token = String(process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '');
const apiUrl = String(process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');

let emergencyOwnerCommitReviewVerified = false;
let emergencyOwnerLogin = '';
let emergencyOwnerUserId = 0;
let emergencyOwnerIdentitySource = '';
let emergencyOwnerCommitMessage = '';
let emergencyWorkflowRefVerified = false;
let emergencyVerificationError = '';

const nativeReviewVerified = Boolean(reviewers) && nativeRequiredReviewerCount >= 1;

if (!nativeReviewVerified || !nativeBranchPolicyVerified) {
  try {
    if (!repository.includes('/')) throw new Error('repository-invalid');
    if (!/^[a-f0-9]{40}$/.test(expectedCommit)) throw new Error('expected-commit-invalid');
    if (!/^[a-f0-9]{64}$/.test(certifiedCandidateDigest)) throw new Error('certified-candidate-digest-invalid');
    if (!token) throw new Error('github-token-missing');

    emergencyWorkflowRefVerified = workflowRefName === expectedWorkflowRefName
      && workflowRef === `refs/heads/${expectedWorkflowRefName}`;
    if (!emergencyWorkflowRefVerified) throw new Error('workflow-ref-not-authorized');

    const headers = {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'eonapp-w641-owner-review'
    };
    const [repositoryResponse, commitResponse] = await Promise.all([
      fetch(`${apiUrl}/repos/${repository}`, { headers }),
      fetch(`${apiUrl}/repos/${repository}/commits/${expectedCommit}`, { headers })
    ]);
    if (!repositoryResponse.ok) throw new Error(`repository-authority-http-${repositoryResponse.status}`);
    if (!commitResponse.ok) throw new Error(`commit-authority-http-${commitResponse.status}`);

    const repositoryAuthority = await repositoryResponse.json();
    const commitAuthority = await commitResponse.json();
    emergencyOwnerLogin = String(repositoryAuthority?.owner?.login || '');
    emergencyOwnerUserId = Number(repositoryAuthority?.owner?.id || 0);
    emergencyOwnerCommitMessage = String(commitAuthority?.commit?.message || '');

    const linkedActors = [
      {
        source: 'author',
        login: String(commitAuthority?.author?.login || ''),
        id: Number(commitAuthority?.author?.id || 0)
      },
      {
        source: 'committer',
        login: String(commitAuthority?.committer?.login || ''),
        id: Number(commitAuthority?.committer?.id || 0)
      }
    ];
    const ownerActor = linkedActors.find((actor) => actor.id > 0
      && actor.id === emergencyOwnerUserId
      && actor.login.toLowerCase() === emergencyOwnerLogin.toLowerCase());
    emergencyOwnerIdentitySource = String(ownerActor?.source || '');

    const exactOwner = emergencyOwnerLogin.length > 0
      && emergencyOwnerUserId > 0
      && Boolean(ownerActor);
    const exactCommit = String(commitAuthority?.sha || '') === expectedCommit;
    const explicitGo = emergencyOwnerCommitMessage.includes('[EONAPP-STAGE4-OWNER-GO]');
    emergencyOwnerCommitReviewVerified = exactOwner && exactCommit && explicitGo;
    if (!emergencyOwnerCommitReviewVerified) throw new Error('exact-owner-go-commit-not-verified');
  } catch (error) {
    emergencyVerificationError = String(error?.message || error || 'owner-review-verification-failed');
  }
}

const effectiveOwnerReviewVerified = nativeReviewVerified || emergencyOwnerCommitReviewVerified;
const effectiveBranchRestrictionVerified = nativeBranchPolicyVerified || emergencyWorkflowRefVerified;
const protectionMode = nativeReviewVerified && nativeBranchPolicyVerified
  ? 'github-environment-native-review'
  : emergencyOwnerCommitReviewVerified && emergencyWorkflowRefVerified
    ? 'exact-owner-go-commit-plus-workflow-ref'
    : 'unverified';

const legacyCore = {
  schema: W641_ENVIRONMENT_PROTECTION_SCHEMA,
  environment: 'production',
  requiredReviewerRulePresent: Boolean(reviewers),
  requiredReviewerCount: nativeRequiredReviewerCount,
  productionSecretsScoped,
  branchPolicyVerified: nativeBranchPolicyVerified,
  capturedAt
};
const emergencyAuthority = {
  emergencyOwnerCommitReviewVerified,
  emergencyOwnerLogin,
  emergencyOwnerUserId,
  emergencyOwnerIdentitySource,
  emergencyOwnerCommitSha: emergencyOwnerCommitReviewVerified ? expectedCommit : '',
  emergencyOwnerCandidateDigest: emergencyOwnerCommitReviewVerified ? certifiedCandidateDigest : '',
  emergencyWorkflowRefVerified,
  emergencyWorkflowRefName: emergencyWorkflowRefVerified ? workflowRefName : '',
  effectiveOwnerReviewVerified,
  effectiveBranchRestrictionVerified,
  protectionMode
};
const nativeProtectionComplete = nativeReviewVerified && nativeBranchPolicyVerified;
const digest = nativeProtectionComplete
  ? stableDigest(legacyCore)
  : stableDigest({ ...legacyCore, ...emergencyAuthority });
const receipt = {
  ...legacyCore,
  ...emergencyAuthority,
  digest,
  digestMode: nativeProtectionComplete ? 'w641-native-v1' : 'w641-stage4-emergency-owner-go-v1',
  redactionReviewed: true,
  ...(emergencyVerificationError ? { emergencyVerificationError } : {})
};
fs.writeFileSync(path.resolve(output), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));

if (!effectiveOwnerReviewVerified
  || !productionSecretsScoped
  || !effectiveBranchRestrictionVerified
  || protectionMode === 'unverified') {
  process.exitCode = 1;
}
