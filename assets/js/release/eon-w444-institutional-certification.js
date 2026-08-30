import { getEonProjectDistrictTruth } from '../city/eon-city-project-district-manifest.js';
import { getEonCityAgentSignalTruth } from '../city/eon-city-agent-signal.js';
import { getEonPwaRolloutTruth } from '../eon-pwa-rollout-guard.js';
import { getEonActionGatewayReviewPilotTruth } from '../action-gateway/eon-action-gateway-review-pilot.js';
import { getEonConnectorConsentTruth } from '../connectors/eon-connector-consent-registry.js';
import { getEonCommercialDecisionTruth } from '../commercial/eon-commercial-decision-gate.js';

/**
 * W444 — institutional release certification board.
 *
 * Source code can assemble a transparent board. It cannot manufacture browser,
 * device, OAuth, provider, accessibility, Lighthouse, security-review, rollback
 * or CEO approval evidence. Therefore the board remains blocked by default.
 */
export const EON_W444_CERTIFICATION_SCHEMA = 'eon.release.institutional-certification.w444.v1';
export const EON_W444_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  'validLighthouseArtifacts', 'manualDesktopAndMobileCityProof', 'googleOAuthProductionMatrix', 'syncDeviceRecoveryMatrix', 'notificationDeliveryAndUnsubscribeProof', 'pwaInstallUpdateRollbackProof', 'actionGatewayExecutionPilotProof', 'connectorConsentAndRevokeProof', 'commercialPolicyDecisionRecord', 'securityAndAccessibilityReview', 'rollbackAndCEOApproval'
]);
const freeze = (value) => Object.freeze(value);

export function buildEonW444InstitutionalCertificationBoard({ externalEvidence = {} } = {}) {
  const evidence = Object.fromEntries(EON_W444_REQUIRED_EXTERNAL_EVIDENCE.map((id) => [id, externalEvidence?.[id] === true]));
  const missing = EON_W444_REQUIRED_EXTERNAL_EVIDENCE.filter((id) => evidence[id] !== true);
  const sources = freeze({
    w438: getEonProjectDistrictTruth(),
    w439: getEonCityAgentSignalTruth(),
    w440: getEonPwaRolloutTruth(),
    w441: getEonActionGatewayReviewPilotTruth(),
    w442: getEonConnectorConsentTruth(),
    w443: getEonCommercialDecisionTruth()
  });
  return freeze({
    schema: EON_W444_CERTIFICATION_SCHEMA,
    sourceFoundationsPresent: true,
    externalEvidence: freeze(evidence),
    missingExternalEvidence: freeze(missing),
    sourceTruth: sources,
    status: missing.length === 0 ? 'evidence-submitted-awaiting-human-release-review' : 'blocked-external-evidence-required',
    certified: false,
    deploymentApproved: false,
    commercialActivationApproved: false,
    needsHumanReleaseReview: true
  });
}

export function assertEonW444InstitutionalRelease(board = buildEonW444InstitutionalCertificationBoard()) {
  if (board?.certified === true) return board;
  throw new Error(`W444 certification is not available: ${Array.isArray(board?.missingExternalEvidence) ? board.missingExternalEvidence.join(', ') : 'external evidence required'}`);
}

export function getEonW444CertificationTruth() {
  const board = buildEonW444InstitutionalCertificationBoard();
  return freeze({ schema: EON_W444_CERTIFICATION_SCHEMA, sourceCertificationBoard: true, certified: false, deploymentApproved: false, externalEvidenceComplete: board.missingExternalEvidence.length === 0, productionReleaseProof: false, humanCEOApproval: false });
}
