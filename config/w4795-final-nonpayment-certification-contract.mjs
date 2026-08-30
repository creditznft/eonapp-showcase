export const W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT = Object.freeze({
  schema: 'eon.release.final-nonpayment-certification.w4795.v1',
  wave: 'W479.5',
  phase: 'final-nonpayment-certification-before-codex',
  sourceBaseline: 'W479-R final City remediation source',
  requiredSourceCommands: Object.freeze([
    'npm run lint -- --max-warnings=0',
    'npm run release:verify',
    'npm run qa:w479r-city-remediation',
    'npm run qa:w4795-final-nonpayment-certification',
    'npm run test:unit',
    'npm run build',
    'npm run smoke:build',
    'npm run audit:site',
    'npm run launch:readiness'
  ]),
  codexEvidenceRows: Object.freeze([
    'currentMainRebase',
    'sourceValidation',
    'productionBuild',
    'cityDesktopColdWarm90s',
    'cityConsoleNetworkPerformance',
    'cityPortraitLandscapeTabletScreens',
    'cityAndroidPhysical',
    'cityIphoneSafariPhysical',
    'cityTabletPhysical',
    'serviceWorkerUpdateRollbackPersistence',
    'coreRoutesCspOauthSyncTruth',
    'humanGoNoGo'
  ]),
  certificationTruth: Object.freeze({
    sourcePatchReadyForCodex: true,
    productionCertifiedBySourceBundle: false,
    physicalDeviceProofIncluded: false,
    commerceApproved: false,
    dodoCheckoutActive: false,
    directSocialConnectorsActive: false,
    localImageVideoAdaptersActive: false,
    automaticPostingActive: false
  }),
  blockedUntilCodexProof: Object.freeze([
    'Live eonapp.ch deployment/rebase evidence against current main.',
    'Raw 90-second City witness: console, request, page-error, FPS/long-frame/resource counts.',
    'Physical Android, iPhone Safari, and tablet evidence.',
    'Service worker update/rollback plus localStorage/IndexedDB survival proof.',
    'Human owner GO/NO-GO after proof review.'
  ]),
  failClosedRoutes: Object.freeze(['payments', 'checkout', 'direct-social-oauth', 'local-media-generation'])
});

export function validateW4795FinalNonpaymentCertificationContract(contract = W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT) {
  const errors = [];
  const ensure = (value, message) => { if (!value) errors.push(message); };
  ensure(contract.schema === 'eon.release.final-nonpayment-certification.w4795.v1', 'schema must stay W479.5 final non-payment certification v1');
  ensure(contract.wave === 'W479.5', 'wave must be W479.5');
  ensure(contract.requiredSourceCommands.includes('npm run qa:w479r-city-remediation'), 'W479-R City remediation gate must remain in final chain');
  ensure(contract.codexEvidenceRows.includes('currentMainRebase'), 'Codex must prove current-main rebase/merge before deployment');
  ensure(contract.codexEvidenceRows.includes('cityAndroidPhysical') && contract.codexEvidenceRows.includes('cityIphoneSafariPhysical') && contract.codexEvidenceRows.includes('cityTabletPhysical'), 'physical Android/iPhone/tablet rows must remain explicit');
  ensure(contract.codexEvidenceRows.includes('humanGoNoGo'), 'human owner GO/NO-GO must remain required');
  ensure(contract.certificationTruth.sourcePatchReadyForCodex === true, 'source patch can be ready for Codex');
  ensure(contract.certificationTruth.productionCertifiedBySourceBundle === false, 'source bundle must not certify production');
  ensure(contract.certificationTruth.physicalDeviceProofIncluded === false, 'source bundle must not claim physical device proof');
  ensure(contract.certificationTruth.commerceApproved === false && contract.certificationTruth.dodoCheckoutActive === false, 'commerce must remain fail-closed');
  ensure(contract.certificationTruth.directSocialConnectorsActive === false, 'direct social connectors must remain inactive');
  ensure(contract.certificationTruth.localImageVideoAdaptersActive === false, 'local image/video adapters must remain inactive');
  ensure(contract.certificationTruth.automaticPostingActive === false, 'automatic posting must remain inactive');
  ensure(contract.blockedUntilCodexProof.length >= 5, 'Codex proof blockers must stay visible');
  return errors;
}
