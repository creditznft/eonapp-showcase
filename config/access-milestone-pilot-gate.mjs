/** W236 — fail-closed approval contract for any future Access Milestone pilot. */
export const ACCESS_MILESTONE_PILOT_GATE_SCHEMA = 'eon.access-milestones.pilot-gate.v1';
export const ACCESS_MILESTONE_PILOT_MODE = 'no-go';

// Every value intentionally defaults to false. No UI, environment variable or
// client-side setting can flip this contract to an active program.
export const ACCESS_MILESTONE_REQUIRED_APPROVALS = Object.freeze({
  ownerReleaseApproval: false,
  legalAndConsumerReview: false,
  privacyNoticeReview: false,
  disclosureCopyReview: false,
  eligibilityAndAntiAbuseReview: false,
  supportAndAppealRunbook: false,
  serverLedgerAndIdempotencyProof: false,
  previewDeviceEvidence: false,
  rollbackAndKillSwitchDrill: false,
  retentionAndDeletionPolicy: false
});

export const ACCESS_MILESTONE_PILOT_CONSTRAINTS = Object.freeze([
  'Cosmetic-only or equally non-financial, non-transferable, clearly expiring capability.',
  'No subscription entitlement, cloud AI credit, cash, wallet, coin, Pool Point, EON Lite, crypto, payout, resale or investment wording.',
  'Verified account activation plus retention/abuse window; never clicks, shares, impressions, ad views or self-report.',
  'One program-level disclosure and a visible support/appeal path before enrollment.',
  'Server ledger is authoritative only after a separately reviewed Worker/D1 deployment; browser storage is never entitlement authority.',
  'All pilot controls are reversible through a tested server kill switch and an owner-approved rollback.'
]);

export function evaluateAccessMilestonePilotGate(approvals = ACCESS_MILESTONE_REQUIRED_APPROVALS) {
  const missing = Object.entries(ACCESS_MILESTONE_REQUIRED_APPROVALS)
    .filter(([key]) => approvals?.[key] !== true)
    .map(([key]) => key);
  return Object.freeze({
    schema: ACCESS_MILESTONE_PILOT_GATE_SCHEMA,
    mode: ACCESS_MILESTONE_PILOT_MODE,
    go: false,
    active: false,
    missing,
    constraints: ACCESS_MILESTONE_PILOT_CONSTRAINTS,
    reason: 'No pilot is authorised. A future activation requires every approval to be independently evidenced in a new reviewed release.'
  });
}

export function requestAccessMilestonePilotActivation() {
  return Object.freeze({
    ok: false,
    active: false,
    reason: 'pilot-no-go',
    gate: evaluateAccessMilestonePilotGate()
  });
}

export default {
  ACCESS_MILESTONE_PILOT_GATE_SCHEMA,
  ACCESS_MILESTONE_PILOT_MODE,
  ACCESS_MILESTONE_REQUIRED_APPROVALS,
  ACCESS_MILESTONE_PILOT_CONSTRAINTS,
  evaluateAccessMilestonePilotGate,
  requestAccessMilestonePilotActivation
};
