/** W645 — exact-candidate production evidence convergence and rehearsal closure. */
const freeze = (value) => Object.freeze(value);

export const W645_DOMAIN_BOARD_SCHEMA = 'eonapp.production-domain-evidence-board.w645.v1';
export const W645_KILL_SWITCH_RECEIPT_SCHEMA = 'eonapp.kill-switch-rehearsal.w645.v1';
export const W645_EVIDENCE_SUMMARY_SCHEMA = 'eonapp.production-evidence-summary.w645.v1';
export const W645_REQUIRED_DOMAINS = freeze([
  'routes', 'account', 'projects', 'forge', 'automations', 'city', 'creator', 'billing', 'referral', 'backup-recovery', 'incidents-rollback'
]);
export const W645_KILL_SWITCHES = freeze([
  freeze({ id: 'auth', setting: 'EON_AUTH_ROLLOUT', safeValue: 'disabled', expectedEffect: 'new cloud sign-in unavailable; browser-local work preserved' }),
  freeze({ id: 'billing', setting: 'EON_BILLING_ROLLOUT', safeValue: 'disabled', expectedEffect: 'new checkout and subscription actions unavailable; existing ledger preserved' }),
  freeze({ id: 'referral', setting: 'EON_REFERRAL_ROLLOUT', safeValue: 'disabled', expectedEffect: 'new grants and redemption unavailable; sharing and ledger preserved' }),
  freeze({ id: 'city', setting: 'EON_CITY_ACCESS_MODE', safeValue: 'public-preview', expectedEffect: 'heavy authenticated renderer unavailable to guests; recovery copy remains visible' })
]);

export const W645_PRODUCTION_EVIDENCE_CONTRACT = freeze({
  schema: 'eonapp.production-evidence-closure.w645.v1',
  wave: 'W645',
  exactCandidateRequired: true,
  exactPreviewRequired: true,
  requiredDomains: W645_REQUIRED_DOMAINS,
  evidence: freeze({
    artifactExistenceRequired: true,
    artifactSha256Required: true,
    ownerReviewRequired: true,
    redactionReviewRequired: true,
    typedPassCannotCertify: true,
    sourceOrSyntheticCannotCertify: true,
    secretsForbidden: true,
    directIdentifiersForbidden: true,
    absolutePathsForbidden: true
  }),
  commerce: freeze({
    billingCoreMustPass: true,
    destructiveActionRequiresPriorOwnerApproval: true,
    designatedTestAccountRequired: true,
    realCustomerMutationForbidden: true,
    forgedWebhookCannotCertify: true
  }),
  optionalLanes: freeze({
    referralMayBeGated: true,
    directProviderMayBeGated: true,
    companionMayBeGated: true,
    localVideoMayBeGated: true,
    publicCopyMustMatchGate: true
  }),
  recovery: freeze({
    killSwitchReceiptRequired: true,
    previousProductionDeploymentRequired: true,
    dataDestructiveRollbackForbidden: true,
    D1ResetForbidden: true,
    rollbackMustPreserveBrowserAndServerData: true
  }),
  productionDefault: 'not-run'
});

export function validateW645ProductionEvidenceContract(value = W645_PRODUCTION_EVIDENCE_CONTRACT) {
  const checks = freeze({
    identity: value?.schema === 'eonapp.production-evidence-closure.w645.v1' && value?.wave === 'W645',
    candidate: value?.exactCandidateRequired === true && value?.exactPreviewRequired === true,
    domains: value?.requiredDomains?.length === 11 && value.requiredDomains.every((id) => W645_REQUIRED_DOMAINS.includes(id)),
    artifacts: value?.evidence?.artifactExistenceRequired === true && value?.evidence?.artifactSha256Required === true && value?.evidence?.typedPassCannotCertify === true,
    privacy: value?.evidence?.secretsForbidden === true && value?.evidence?.directIdentifiersForbidden === true && value?.evidence?.absolutePathsForbidden === true,
    commerce: value?.commerce?.billingCoreMustPass === true && value?.commerce?.destructiveActionRequiresPriorOwnerApproval === true && value?.commerce?.realCustomerMutationForbidden === true,
    gating: value?.optionalLanes?.referralMayBeGated === true && value?.optionalLanes?.directProviderMayBeGated === true && value?.optionalLanes?.companionMayBeGated === true && value?.optionalLanes?.localVideoMayBeGated === true,
    rollback: value?.recovery?.killSwitchReceiptRequired === true && value?.recovery?.previousProductionDeploymentRequired === true && value?.recovery?.D1ResetForbidden === true,
    default: value?.productionDefault === 'not-run' && W645_KILL_SWITCHES.length === 4
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}
