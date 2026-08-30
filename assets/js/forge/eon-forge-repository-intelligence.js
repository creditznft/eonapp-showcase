/**
 * RT92 Forge repository-intelligence foundation.
 *
 * Pure projection over data already obtained by the existing Forge/GitHub
 * review lane. It performs no GitHub request, branch write, PR write, merge,
 * deploy, test run or checkout. The existing GitHub lane remains authority.
 */
export const EON_FORGE_REPOSITORY_INTELLIGENCE_SCHEMA = 'eonapp.forge.repository-intelligence.rt92.v1';
const freeze = (value) => Object.freeze(value);

function text(value = '', max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function signal(id, status, label, detail = '') {
  return freeze({ id, status, label: text(label), detail: text(detail, 400) });
}

export function buildEonForgeRepositoryIntelligence(input = {}) {
  const source = input?.sourceInspection && typeof input.sourceInspection === 'object' ? input.sourceInspection : {};
  const connection = input?.githubConnection && typeof input.githubConnection === 'object' ? input.githubConnection : {};
  const receipt = input?.publishReceipt && typeof input.publishReceipt === 'object' ? input.publishReceipt : {};
  const ci = input?.ci && typeof input.ci === 'object' ? input.ci : {};
  const signals = [];

  signals.push(signal('source-check', source.ok === true ? 'ready' : 'needs-attention', 'Source safety', source.ok === true ? 'Current local source passed the supplied Forge source inspection.' : (source.blockers || []).slice(0, 3).join(' · ') || 'Run the existing Forge source check.'));
  signals.push(signal('static-eligibility', source.staticEligible === true ? 'ready' : 'needs-attention', 'Static publish eligibility', source.staticEligible === true ? 'Source is eligible for the existing static GitHub Pages lane.' : 'Backend/database/native deployment is outside the current Forge GitHub v1 lane.'));
  signals.push(signal('github-connection', connection.connected === true ? 'ready' : 'not-connected', 'GitHub connection', connection.connected === true ? 'Existing GitHub App connection is available.' : 'Connect GitHub through the existing Forge review lane before remote publishing.'));

  const ciStatus = text(ci.status || receipt.ciStatus, 40).toLowerCase();
  signals.push(signal('ci', ciStatus === 'success' ? 'ready' : ciStatus ? 'needs-attention' : 'unknown', 'Exact-SHA CI', ciStatus === 'success' ? 'Recorded CI status is successful.' : ciStatus ? `Recorded CI status: ${ciStatus}.` : 'No current exact-SHA CI proof was supplied to this projection.'));

  const publishStatus = text(receipt.status, 40).toLowerCase();
  signals.push(signal('publish-state', ['published', 'deployed', 'complete', 'completed'].includes(publishStatus) ? 'ready' : publishStatus ? 'review' : 'not-started', 'Publish review state', publishStatus ? `Existing Forge receipt status: ${publishStatus}.` : 'No Forge GitHub publish receipt is active.'));

  const readyCount = signals.filter((entry) => entry.status === 'ready').length;
  const attentionCount = signals.filter((entry) => entry.status === 'needs-attention').length;
  const recommendations = [];
  if (source.ok !== true) recommendations.push('Run or repair the existing Forge source check before preparing remote review.');
  if (source.ok === true && connection.connected !== true) recommendations.push('Use the existing GitHub connection flow; do not paste a PAT or create a second GitHub credential path.');
  if (receipt.status === 'staged' && ciStatus !== 'success') recommendations.push('Refresh the existing exact-SHA CI proof before final publish approval.');
  if (source.ok === true && source.staticEligible === true && connection.connected === true && !receipt.status) recommendations.push('The project is ready to enter the existing review-branch → PR → CI lane after explicit user approval.');

  return freeze({
    schema: EON_FORGE_REPOSITORY_INTELLIGENCE_SCHEMA,
    signals: freeze(signals),
    recommendations: freeze(recommendations),
    readiness: attentionCount > 0 ? 'needs-attention' : readyCount >= 3 ? 'review-ready' : 'incomplete',
    sourceAuthority: 'existing-forge-and-github-review-lane',
    repositoryReadStarted: false,
    networkRequestCreated: false,
    branchCreated: false,
    pullRequestCreated: false,
    ciRunStarted: false,
    deploymentStarted: false,
    mergeStarted: false,
    credentialRead: false,
    parallelDevelopmentStarted: false
  });
}

export function buildEonForgeTestReleaseReviewPlan(input = {}) {
  const intelligence = buildEonForgeRepositoryIntelligence(input);
  const steps = [
    freeze({ id: 'source', label: 'Validate local source', authority: 'existing Forge source check', automatic: false }),
    freeze({ id: 'review', label: 'Prepare review branch and pull request', authority: 'existing GitHub publish lane', automatic: false }),
    freeze({ id: 'ci', label: 'Verify exact reviewed SHA in CI', authority: 'existing GitHub status proof', automatic: false }),
    freeze({ id: 'publish', label: 'Request separate final publish approval', authority: 'existing GitHub publish lane', automatic: false }),
    freeze({ id: 'rollback', label: 'Retain exact-tree rollback evidence', authority: 'existing Forge rollback contract', automatic: false })
  ];
  return freeze({
    schema: 'eonapp.forge.test-release-review-plan.rt92.v1',
    intelligence,
    steps: freeze(steps),
    orchestrationMode: 'review-plan-only',
    autonomousExecution: false,
    networkRequestCreated: false
  });
}

export function validateEonForgeRepositoryIntelligence() {
  const errors = [];
  const model = buildEonForgeRepositoryIntelligence({ sourceInspection: { ok: true, staticEligible: true }, githubConnection: { connected: true }, ci: { status: 'success' } });
  if (model.readiness !== 'review-ready') errors.push('Reviewed source + GitHub connection + successful CI should be review-ready.');
  if (model.networkRequestCreated || model.branchCreated || model.pullRequestCreated || model.deploymentStarted || model.credentialRead) errors.push('Repository intelligence must be projection-only.');
  const plan = buildEonForgeTestReleaseReviewPlan({ sourceInspection: { ok: true, staticEligible: true } });
  if (plan.autonomousExecution || plan.networkRequestCreated || plan.steps.some((step) => step.automatic)) errors.push('Test/release plan must remain review-only.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_FORGE_REPOSITORY_INTELLIGENCE_SCHEMA });
}

export default freeze({
  EON_FORGE_REPOSITORY_INTELLIGENCE_SCHEMA,
  buildEonForgeRepositoryIntelligence,
  buildEonForgeTestReleaseReviewPlan,
  validateEonForgeRepositoryIntelligence
});
