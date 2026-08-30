import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEonForgeRepositoryIntelligence,
  buildEonForgeTestReleaseReviewPlan,
  validateEonForgeRepositoryIntelligence
} from '../../assets/js/forge/eon-forge-repository-intelligence.js';

test('RT92 Forge repository intelligence validates as a projection over the existing lane', () => {
  const report = validateEonForgeRepositoryIntelligence();
  assert.equal(report.ok, true, report.errors.join('\n'));
});

test('RT92 Forge repository intelligence never performs GitHub or deployment actions', () => {
  const model = buildEonForgeRepositoryIntelligence({
    sourceInspection: { ok: true, staticEligible: true, blockers: [] },
    githubConnection: { connected: true },
    publishReceipt: { status: 'staged' },
    ci: { status: 'success' }
  });
  assert.equal(model.readiness, 'review-ready');
  assert.equal(model.sourceAuthority, 'existing-forge-and-github-review-lane');
  for (const field of ['repositoryReadStarted','networkRequestCreated','branchCreated','pullRequestCreated','ciRunStarted','deploymentStarted','mergeStarted','credentialRead','parallelDevelopmentStarted']) assert.equal(model[field], false, field);
});

test('RT92 Forge test/release orchestration is review planning only', () => {
  const plan = buildEonForgeTestReleaseReviewPlan({ sourceInspection: { ok: true, staticEligible: true } });
  assert.equal(plan.orchestrationMode, 'review-plan-only');
  assert.equal(plan.autonomousExecution, false);
  assert.equal(plan.networkRequestCreated, false);
  assert.equal(plan.steps.every((step) => step.automatic === false), true);
  assert.deepEqual(plan.steps.map((step) => step.id), ['source', 'review', 'ci', 'publish', 'rollback']);
});
