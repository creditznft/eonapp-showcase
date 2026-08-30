/** W642 — one truthful product vocabulary and one calm, local-only return loop. */
const freeze = (value) => Object.freeze(value);
export const W642_CONTINUE_SCHEMA = 'eonapp.continue-candidate.w642.v1';
export const W642_RETENTION_EVENT_SCHEMA = 'eonapp.retention-event.w642.v1';
export const W642_PRODUCT_TRUTH_RETENTION_CONTRACT = freeze({
  schema: 'eonapp.product-truth-retention.w642.v1',
  wave: 'W642',
  canonicalPreviewRoute: '/preview-studio',
  compatibilityPreviewRoute: '/market',
  canonicalReferralSurface: '/eon-keys',
  retiredRewardRoute: '/rewards',
  returnLoop: freeze({
    label: 'Continue', localOnly: true, onePrimaryCandidate: true, automaticNavigation: false,
    browserPush: false, email: false, sms: false, socialPressure: false, darkPatterns: false,
    dismissalDays: 7, telemetryContainsUserContent: false, telemetryRemoteUpload: false
  }),
  candidatePriority: freeze(['project', 'creator-job', 'creator-outcome', 'setup', 'city-mission', 'city-resume', 'chat', 'creator-library']),
  terminology: freeze({ market: 'Preview Studio', rewards: 'EONKEYS', realm: 'Realm Studio' })
});
export function validateW642ProductTruthRetentionContract(value = W642_PRODUCT_TRUTH_RETENTION_CONTRACT) {
  const checks = freeze({
    identity: value?.schema === 'eonapp.product-truth-retention.w642.v1' && value?.wave === 'W642',
    routes: value?.canonicalPreviewRoute === '/preview-studio' && value?.compatibilityPreviewRoute === '/market' && value?.canonicalReferralSurface === '/eon-keys' && value?.retiredRewardRoute === '/rewards',
    calm: value?.returnLoop?.onePrimaryCandidate === true && value?.returnLoop?.automaticNavigation === false && value?.returnLoop?.browserPush === false && value?.returnLoop?.email === false && value?.returnLoop?.sms === false && value?.returnLoop?.socialPressure === false && value?.returnLoop?.darkPatterns === false,
    local: value?.returnLoop?.localOnly === true && value?.returnLoop?.telemetryContainsUserContent === false && value?.returnLoop?.telemetryRemoteUpload === false,
    priorities: Array.isArray(value?.candidatePriority) && value.candidatePriority.length >= 5
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}
