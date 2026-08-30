/** W420 — local cinematic color and atmosphere pass. */
export const W420_CITY_CINEMATIC_ART_DIRECTION_CONTRACT = Object.freeze({
  id: 'W420',
  title: 'Cinematic color, fog and vignette discipline without external LUT assets',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-cinematic-art-direction.js',
    'assets/js/city/eon-city-play-babylon.js',
    'config/w420-city-cinematic-art-direction-contract.mjs',
    'scripts/w420-city-cinematic-art-direction-gate.mjs',
    'tests/unit/w420-city-cinematic-art-direction.test.mjs',
    'docs/W420_CITY_CINEMATIC_ART_DIRECTION_2026-06-28.md'
  ]),
  requiredQualities: Object.freeze(['lite', 'balanced', 'cinematic']),
  boundary: Object.freeze({ localOnly: true, remoteLut: false, userData: false, finalBinaryArt: false, finalVisualCertification: false }),
  nonClaims: Object.freeze([
    'color settings prove final flagship visuals',
    'external color grading or LUT assets are loaded',
    'device performance is certified',
    'final binary City art is approved'
  ])
});

export function validateW420CityCinematicArtDirectionContract(contract = W420_CITY_CINEMATIC_ART_DIRECTION_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W420') errors.push('W420 identifier is invalid.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 6) errors.push('W420 must enumerate source, integration, gate, test and docs.');
  if (!Array.isArray(contract?.requiredQualities) || contract.requiredQualities.join(',') !== 'lite,balanced,cinematic') errors.push('W420 requires all three quality profiles.');
  if (contract?.boundary?.localOnly !== true || contract?.boundary?.remoteLut !== false || contract?.boundary?.userData !== false || contract?.boundary?.finalBinaryArt !== false || contract?.boundary?.finalVisualCertification !== false) errors.push('W420 boundary is invalid.');
  if (!Array.isArray(contract?.nonClaims) || contract.nonClaims.length < 4) errors.push('W420 must preserve visual-proof limitations.');
  return Object.freeze(errors);
}
