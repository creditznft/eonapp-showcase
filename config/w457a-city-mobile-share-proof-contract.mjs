/** W457.1 contract: device/share evidence is a human-run export, not a certification. */
export const W457A_CITY_MOBILE_SHARE_PROOF_CONTRACT = Object.freeze({
  wave: 'W457.1',
  schema: 'eon.city.mobile-share-proof.w457.1.v1',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-mobile-share-proof.js',
    'assets/js/eon-city-play-station.js',
    'assets/js/city/eon-city-art-review.js',
    'assets/js/share/eon-share-pack.js',
    'assets/js/share/eon-remix-card.js',
    'tests/unit/w457a-city-mobile-share-proof.test.mjs'
  ]),
  deviceCaseIds: Object.freeze([
    'android-portrait-companion',
    'android-landscape-explore-rotation',
    'ios-portrait-companion',
    'ios-landscape-touch-exit',
    'keyboard-controller-fullscreen'
  ]),
  sharePrivacyCaseIds: Object.freeze([
    'manual-cinematic-view-selection',
    'share-pack-copy-redaction',
    'native-share-cancel-boundary',
    'manual-postcard-destination-review'
  ]),
  minimumCinematicViews: 6,
  truth: Object.freeze({
    localExportOnly: true,
    phoneProbeCreated: false,
    screenshotCaptureCreated: false,
    nativeShareOpened: false,
    remoteTelemetryCreated: false,
    remoteEvidenceUploadCreated: false,
    autoPosting: false,
    oauthConnections: false,
    trackingCreated: false,
    referralRewardCreated: false,
    automaticPass: false,
    deviceCertification: false,
    releaseApproval: false
  })
});

export function validateW457ACityMobileShareProofContract(contract = W457A_CITY_MOBILE_SHARE_PROOF_CONTRACT) {
  const errors = [];
  if (contract.wave !== 'W457.1') errors.push('wave-mismatch');
  if (contract.schema !== 'eon.city.mobile-share-proof.w457.1.v1') errors.push('schema-mismatch');
  if (contract.minimumCinematicViews < 6) errors.push('cinematic-views-too-low');
  for (const [key, expected] of Object.entries(contract.truth || {})) {
    if (contract.truth[key] !== expected) errors.push(`truth-${key}-mismatch`);
  }
  return Object.freeze(errors);
}
