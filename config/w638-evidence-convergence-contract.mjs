/** W638 — billing, referral, Creator and provider evidence convergence contract. */
const freeze = (value) => Object.freeze(value);
const row = (id, acceptedKinds, options = {}) => freeze({ id, acceptedKinds: freeze([...acceptedKinds]), destructive: options.destructive === true });

export const W638_EVIDENCE_RECORD_SCHEMA = 'eonapp.production-evidence-record.w638.v1';
export const W638_EVIDENCE_BOARD_SCHEMA = 'eonapp.production-evidence-board.w638.v1';
export const W638_EVIDENCE_INDEX_SCHEMA = 'eonapp.production-evidence-index.w638.v1';
export const W638_EVIDENCE_STATUSES = freeze(['pass', 'no-go', 'not-run']);
export const W638_EVIDENCE_KINDS = freeze(['production', 'provider', 'device', 'owner-observation', 'synthetic', 'source']);
export const W638_NON_CERTIFYING_KINDS = freeze(['synthetic', 'source']);

export const W638_EVIDENCE_LANES = freeze([
  freeze({
    id: 'billing',
    title: 'Dodo billing lifecycle',
    requirements: freeze([
      row('realCheckout', ['production', 'provider']),
      row('providerWebhook', ['production', 'provider']),
      row('d1Ledger', ['production']),
      row('entitlementActivation', ['production']),
      row('crossSessionRefresh', ['production', 'device']),
      row('portal', ['production', 'provider']),
      row('cancellation', ['production', 'provider'], { destructive: true }),
      row('reactivation', ['production', 'provider'], { destructive: true }),
      row('failedPayment', ['production', 'provider']),
      row('refund', ['production', 'provider'], { destructive: true }),
      row('dispute', ['production', 'provider'], { destructive: true }),
      row('duplicateReplay', ['production', 'provider']),
      row('outOfOrder', ['production', 'provider']),
      row('forgedRejected', ['production', 'provider']),
      row('tierChange', ['production', 'provider'], { destructive: true }),
      row('receiptTaxLinks', ['production', 'provider']),
      row('rollbackSupport', ['production', 'owner-observation'])
    ])
  }),
  freeze({
    id: 'referral',
    title: 'Distinct-account referral and EONKEY lifecycle',
    requirements: freeze([
      row('signedInviterIdentity', ['production']),
      row('inviteAccepted', ['production']),
      row('selfReferralRejected', ['production']),
      row('tamperedLinkRejected', ['production']),
      row('oneLevelOnly', ['production']),
      row('browserGrantRejected', ['production']),
      row('activationReceiptConsumedOnce', ['production']),
      row('clickShareNoGrant', ['production']),
      row('paidRetentionPending', ['production']),
      row('paidRetentionVested', ['production']),
      row('yearlyCapEnforced', ['production']),
      row('duplicateEventIdempotent', ['production']),
      row('refundReversal', ['production'], { destructive: true }),
      row('disputeReversal', ['production'], { destructive: true }),
      row('redeemedUnlockRevoked', ['production'], { destructive: true }),
      row('raceConditionSafe', ['production']),
      row('vaultRevealMigrated', ['production', 'device']),
      row('privateFieldsRedacted', ['production', 'owner-observation']),
      row('supportAuditReadable', ['production', 'owner-observation'])
    ])
  }),
  freeze({
    id: 'local-creator',
    title: 'Local image and video execution',
    requirements: freeze([
      row('realImageSaveReopen', ['device']),
      row('realVideoSaveReopen', ['device']),
      row('ownerFourGbFallback', ['device']),
      row('supportedReferenceDevice', ['device']),
      row('cancellation', ['device']),
      row('resourceBoundary', ['device']),
      row('failureRecovery', ['device']),
      row('libraryProjectContinuation', ['device'])
    ])
  }),
  freeze({
    id: 'direct-provider',
    title: 'Direct BYOK provider execution',
    requirements: freeze([
      row('reviewedRegistry', ['provider', 'owner-observation']),
      row('realImageExecution', ['provider']),
      row('realVideoExecution', ['provider']),
      row('spendReview', ['provider', 'owner-observation']),
      row('outageHandling', ['provider']),
      row('moderationHandling', ['provider']),
      row('cancellation', ['provider']),
      row('savedResult', ['provider', 'device'])
    ])
  }),
  freeze({
    id: 'companion',
    title: 'Signed loopback companion',
    requirements: freeze([
      row('signedRelease', ['owner-observation']),
      row('install', ['device']),
      row('update', ['device']),
      row('uninstall', ['device']),
      row('diagnostic', ['device']),
      row('loopbackAuthentication', ['device']),
      row('credentialCustody', ['device'])
    ])
  })
]);

export const W638_EVIDENCE_CONVERGENCE_CONTRACT = freeze({
  schema: 'eonapp.billing-referral-creator-provider-evidence-convergence.w638.v1',
  wave: 'W638',
  sourceCertified: true,
  productionCertified: false,
  statuses: W638_EVIDENCE_STATUSES,
  evidenceKinds: W638_EVIDENCE_KINDS,
  nonCertifyingKinds: W638_NON_CERTIFYING_KINDS,
  lanes: W638_EVIDENCE_LANES,
  passRules: freeze({
    derivedOnly: true,
    ownerReviewed: true,
    artifactDigestRequired: true,
    redactionReviewed: true,
    directIdentifiersForbidden: true,
    secretsForbidden: true,
    destructiveActionRequiresPriorOwnerApproval: true,
    sourceOrSyntheticCannotCertify: true
  }),
  handling: freeze({
    rawProviderKeysForbidden: true,
    sessionCookiesForbidden: true,
    fullPaymentCustomerIdentifiersForbidden: true,
    fullEmailAddressesForbidden: true,
    absoluteArtifactPathsForbidden: true,
    artifactTraversalForbidden: true,
    receiptMutationForbidden: true
  }),
  permanentCommand: freeze(['npm ci', 'npm run verify:codex-predeploy'])
});

export function getW638Lane(laneId = '') {
  return W638_EVIDENCE_LANES.find((lane) => lane.id === String(laneId || '')) || null;
}

export function getW638Requirement(laneId = '', requirementId = '') {
  return getW638Lane(laneId)?.requirements.find((requirement) => requirement.id === String(requirementId || '')) || null;
}

export function validateW638EvidenceConvergenceContract(value = W638_EVIDENCE_CONVERGENCE_CONTRACT) {
  const lanes = Array.isArray(value?.lanes) ? value.lanes : [];
  const requirementIds = lanes.flatMap((lane) => (lane.requirements || []).map((item) => `${lane.id}:${item.id}`));
  const checks = freeze({
    schema: value?.schema === 'eonapp.billing-referral-creator-provider-evidence-convergence.w638.v1',
    sourceFence: value?.sourceCertified === true && value?.productionCertified === false,
    laneSet: lanes.length === 5 && new Set(lanes.map((lane) => lane.id)).size === lanes.length,
    requirementSet: requirementIds.length >= 58 && new Set(requirementIds).size === requirementIds.length,
    kindFence: W638_NON_CERTIFYING_KINDS.every((kind) => value?.nonCertifyingKinds?.includes(kind)),
    derivedPass: value?.passRules?.derivedOnly === true && value?.passRules?.sourceOrSyntheticCannotCertify === true,
    redactionFence: value?.passRules?.redactionReviewed === true && value?.handling?.rawProviderKeysForbidden === true && value?.handling?.sessionCookiesForbidden === true && value?.handling?.fullPaymentCustomerIdentifiersForbidden === true,
    destructiveFence: value?.passRules?.destructiveActionRequiresPriorOwnerApproval === true,
    command: Array.isArray(value?.permanentCommand) && value.permanentCommand.join('|') === 'npm ci|npm run verify:codex-predeploy'
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}
