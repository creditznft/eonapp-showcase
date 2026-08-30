/**
 * W356 — fail-closed local release-governance board.
 *
 * This browser can display local readiness status, but it cannot verify remote
 * Git history, recover canonical evidence, conduct independent review, certify
 * a release, deploy a build, or release the product.
 */

export const EON_RELEASE_GOVERNANCE_BOARD_SCHEMA = 'eonapp.local-release-governance-board.v1';

export const EON_RELEASE_GOVERNANCE_EXTERNAL_BLOCKERS = Object.freeze([
  Object.freeze({
    id: 'canonical-evidence-recovery-required',
    label: 'Canonical release-evidence recovery',
    detail: 'The supplied snapshot is missing authoritative release-evidence boards. Recover and verify them from the authoritative Git history; do not recreate or invent evidence locally.'
  }),
  Object.freeze({
    id: 'git-history-secret-remediation-owner-required',
    label: 'Git-history secret remediation',
    detail: 'Historical secret-scan remediation must be completed and verified in the authoritative repository with an owner-approved plan. A source snapshot cannot prove that work.'
  }),
  Object.freeze({
    id: 'independent-release-review-required',
    label: 'Independent release review',
    detail: 'A local checklist is not an independent security, browser, device, accessibility, legal, or release review.'
  })
]);

function normaliseReadiness(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.freeze({
    status: String(source.status || 'not-ready'),
    blockers: Object.freeze(Array.isArray(source.blockers) ? source.blockers.map((item) => String(item || '').trim()).filter(Boolean) : []),
    deviceEvidenceStatus: String(source.deviceEvidenceStatus || 'incomplete')
  });
}

export function createEonLocalReleaseGovernanceBoard({ betaReadiness = {} } = {}) {
  const readiness = normaliseReadiness(betaReadiness);
  const blockers = [];
  if (readiness.status !== 'ready-for-invite-only-beta') blockers.push(...readiness.blockers);
  blockers.push(...EON_RELEASE_GOVERNANCE_EXTERNAL_BLOCKERS.map((item) => item.id));
  return Object.freeze({
    schema: EON_RELEASE_GOVERNANCE_BOARD_SCHEMA,
    status: 'blocked',
    betaReadiness: readiness,
    blockers: Object.freeze([...new Set(blockers)]),
    externalBlockers: EON_RELEASE_GOVERNANCE_EXTERNAL_BLOCKERS,
    localChecklistCanSupport: true,
    localChecklistCanCertify: false,
    independentReviewVerified: false,
    evidenceRecoveryVerified: false,
    gitHistoryRemediationVerified: false,
    deploymentCreated: false,
    betaEnrollmentCreated: false,
    releaseApproved: false,
    nextStep: readiness.status === 'ready-for-invite-only-beta'
      ? 'Complete authoritative evidence recovery, Git-history remediation, real-device proof, and independent review before any release decision.'
      : 'Close the local beta-readiness gaps first, then complete authoritative evidence recovery, Git-history remediation, real-device proof, and independent review.'
  });
}

export function getEonLocalReleaseGovernanceTruth() {
  return Object.freeze({
    schema: EON_RELEASE_GOVERNANCE_BOARD_SCHEMA,
    failClosed: true,
    localChecklistCanCertify: false,
    releaseApproved: false,
    deploymentCreated: false,
    betaEnrollmentCreated: false,
    remoteTelemetryCreated: false,
    commercialActivation: false
  });
}

export default Object.freeze({
  EON_RELEASE_GOVERNANCE_BOARD_SCHEMA,
  EON_RELEASE_GOVERNANCE_EXTERNAL_BLOCKERS,
  createEonLocalReleaseGovernanceBoard,
  getEonLocalReleaseGovernanceTruth
});
