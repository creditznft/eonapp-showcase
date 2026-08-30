/** W644 — owner-reviewed, real authenticated EON City flagship closure. */
const freeze = (value) => Object.freeze(value);

export const W644_CITY_OWNER_RECEIPT_SCHEMA = 'eonapp.city-owner-certification.w644.v1';
export const W644_CITY_ARTIFACT_SCHEMA = 'eonapp.city-owner-artifact.w644.v1';
export const W644_CITY_REQUIRED_CATEGORIES = freeze([
  'visual-art-direction',
  'controls-input',
  'purpose-workflow',
  'performance-stability',
  'mobile-responsive',
  'accessibility-recovery',
  'authentication-data-custody',
  'console-network-cleanliness'
]);
export const W644_CITY_REQUIRED_VIEWPORTS = freeze([
  'desktop-1440x900',
  'mobile-portrait-390x844',
  'mobile-landscape-844x390'
]);

export const W644_CITY_OWNER_CERTIFICATION_CONTRACT = freeze({
  schema: 'eonapp.city-owner-certification-contract.w644.v1',
  wave: 'W644',
  route: '/eoncity',
  access: freeze({
    guestHeavyRendererMustRemainBlocked: true,
    authenticatedGoogleSessionRequired: true,
    manualSignInOnly: true,
    cookieOrTokenCaptureForbidden: true,
    bypassForbidden: true
  }),
  candidateLinkage: freeze({
    immutableCandidateRequired: true,
    candidateDigestRequired: true,
    commitShaRequired: true,
    deploymentIdRequired: true,
    visibleReleaseIdentityRequired: true
  }),
  quality: freeze({
    overallMinimum: 9.5,
    categoryMinimum: 9.0,
    categories: W644_CITY_REQUIRED_CATEGORIES,
    ownerReviewRequired: true,
    ownerVisualApprovalRequired: true
  }),
  evidence: freeze({
    viewports: W644_CITY_REQUIRED_VIEWPORTS,
    screenshotDigestRequired: true,
    screenRecordingRequired: true,
    pageErrorsMaximum: 0,
    consoleErrorsMaximum: 0,
    firstPartyHttpErrorsMaximum: 0,
    requestFailuresMustBeReviewed: true,
    refreshRecoveryRequired: true,
    reducedMotionProofRequired: true,
    keyboardAndPointerProofRequired: true,
    mobileTouchProofRequired: true,
    secretsForbidden: true,
    personalIdentityForbidden: true,
    absolutePathsForbidden: true
  }),
  certification: freeze({
    sourceChecksCannotCertifyProduction: true,
    automationCannotAssignOwnerScores: true,
    productionEvidenceDefault: 'not-run'
  })
});

export function validateW644CityOwnerCertificationContract(value = W644_CITY_OWNER_CERTIFICATION_CONTRACT) {
  const checks = freeze({
    identity: value?.schema === 'eonapp.city-owner-certification-contract.w644.v1' && value?.wave === 'W644',
    route: value?.route === '/eoncity',
    access: value?.access?.guestHeavyRendererMustRemainBlocked === true && value?.access?.authenticatedGoogleSessionRequired === true && value?.access?.manualSignInOnly === true && value?.access?.bypassForbidden === true,
    privacy: value?.access?.cookieOrTokenCaptureForbidden === true && value?.evidence?.secretsForbidden === true && value?.evidence?.personalIdentityForbidden === true,
    candidate: value?.candidateLinkage?.immutableCandidateRequired === true && value?.candidateLinkage?.visibleReleaseIdentityRequired === true,
    scores: value?.quality?.overallMinimum === 9.5 && value?.quality?.categoryMinimum === 9 && value?.quality?.categories?.length === 8,
    viewports: value?.evidence?.viewports?.length === 3 && value.evidence.viewports.every((id) => W644_CITY_REQUIRED_VIEWPORTS.includes(id)),
    diagnostics: value?.evidence?.pageErrorsMaximum === 0 && value?.evidence?.consoleErrorsMaximum === 0 && value?.evidence?.firstPartyHttpErrorsMaximum === 0,
    manualBoundary: value?.certification?.sourceChecksCannotCertifyProduction === true && value?.certification?.automationCannotAssignOwnerScores === true && value?.certification?.productionEvidenceDefault === 'not-run'
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}
