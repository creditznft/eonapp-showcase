/** W421 — make shipped original City art and bounded cinematic views inspectable. */
export const W421_CITY_ART_REVIEW_CONTRACT = Object.freeze({
  id: 'W421',
  title: 'City art review panel and bounded cinematic composition views',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-art-review.js',
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/eon-city-play-station.js',
    'assets/css/eon-city-play.css',
    'config/w421-city-art-review-contract.mjs',
    'scripts/w421-city-art-review-gate.mjs',
    'tests/unit/w421-city-art-review.test.mjs',
    'docs/W421_CITY_ART_REVIEW_AND_CINEMATIC_VIEWS_2026-06-28.md'
  ]),
  requiredShotIds: Object.freeze(['arrival-gate', 'command-deck', 'creator-atrium', 'forge-bay', 'signal-tower', 'archive-gardens']),
  boundaries: Object.freeze({ localOnly: true, remoteNetwork: false, screenshotCapture: false, mediaUpload: false, deviceProbe: false, finalVisualCertification: false, finalInstitutionalArtClaim: false }),
  nonClaims: Object.freeze([
    'art review creates screenshots or proof media',
    'art review certifies visual quality or device performance',
    'vector art means final binary City art is approved',
    'a cinematic view opens a work route or private data'
  ])
});

export function validateW421CityArtReviewContract(contract = W421_CITY_ART_REVIEW_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W421') errors.push('W421 identifier is invalid.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 8) errors.push('W421 must enumerate art, runtime, UI, CSS, gate, test and docs.');
  if (!Array.isArray(contract?.requiredShotIds) || contract.requiredShotIds.join(',') !== 'arrival-gate,command-deck,creator-atrium,forge-bay,signal-tower,archive-gardens') errors.push('W421 shot list is incomplete.');
  const b = contract?.boundaries || {};
  if (b.localOnly !== true || b.remoteNetwork !== false || b.screenshotCapture !== false || b.mediaUpload !== false || b.deviceProbe !== false || b.finalVisualCertification !== false || b.finalInstitutionalArtClaim !== false) errors.push('W421 boundaries are invalid.');
  if (!Array.isArray(contract?.nonClaims) || contract.nonClaims.length < 4) errors.push('W421 must retain proof and final-art limitations.');
  return Object.freeze(errors);
}
