/** W341 — invite-only local-first beta readiness evaluator. */

import { createEonDeviceEvidenceMatrix } from './eon-device-evidence-matrix.js';

export const EON_LOCAL_BETA_READINESS_SCHEMA = 'eonapp.local-beta-readiness.v1';

export function assessEonLocalBetaReadiness({
  deviceEvidence = [],
  backupRecoveryDrill = false,
  privacyReview = false,
  incidentOwnerRoster = false,
  inviteOnly = false,
  remoteTelemetryEnabled = false,
  commercialFeaturesEnabled = false
} = {}) {
  const matrix = createEonDeviceEvidenceMatrix(deviceEvidence);
  const blockers = [];
  if (matrix.status !== 'complete') blockers.push('device-evidence-incomplete');
  if (backupRecoveryDrill !== true) blockers.push('backup-recovery-drill-required');
  if (privacyReview !== true) blockers.push('privacy-review-required');
  if (incidentOwnerRoster !== true) blockers.push('incident-owner-roster-required');
  if (inviteOnly !== true) blockers.push('invite-only-policy-required');
  if (remoteTelemetryEnabled === true) blockers.push('remote-telemetry-must-remain-off');
  if (commercialFeaturesEnabled === true) blockers.push('commercial-features-out-of-scope');
  return Object.freeze({
    schema: EON_LOCAL_BETA_READINESS_SCHEMA,
    status: blockers.length ? 'not-ready' : 'ready-for-invite-only-beta',
    blockers: Object.freeze(blockers),
    deviceEvidenceStatus: matrix.status,
    remoteTelemetryEnabled: false,
    commercialFeaturesEnabled: false,
    automaticEnrollment: false,
    serverWorkspaceData: false,
    nextStep: blockers.length
      ? 'Close each listed local-first proof gap before any beta invitation.'
      : 'Run a small invite-only beta with manual user-owned support export and no automatic data collection.'
  });
}

export function getEonLocalBetaReadinessTruth() {
  return Object.freeze({
    schema: EON_LOCAL_BETA_READINESS_SCHEMA,
    inviteOnlyRequired: true,
    remoteTelemetryAllowed: false,
    commercialFeaturesAllowed: false,
    automaticEnrollment: false,
    serverWorkspaceData: false
  });
}
