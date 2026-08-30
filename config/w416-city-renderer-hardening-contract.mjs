/** W416 — renderer hardening contract for the source-controlled City fallback. */
export const W416_CITY_RENDERER_HARDENING_CONTRACT = Object.freeze({
  id: 'W416',
  title: 'City procedural renderer material and cinematic-shadow hardening',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/city/eon-city-procedural-renderer-profile.js',
    'assets/js/city/eon-city-material-policy.js',
    'config/w416-city-renderer-hardening-contract.mjs',
    'scripts/w416-city-renderer-hardening-gate.mjs',
    'tests/unit/w416-city-renderer-hardening.test.mjs',
    'docs/W416_CITY_RENDERER_HARDENING_2026-06-28.md'
  ]),
  rendererProfile: Object.freeze({
    primaryWorldMaterial: 'PBRMetallicRoughnessMaterial',
    dynamicPanelMaterial: 'StandardMaterial (local DynamicTexture panels only)',
    shadowQualities: Object.freeze({ lite: false, balanced: false, cinematic: true }),
    remoteAssets: false,
    finalBinaryArt: false
  }),
  forbiddenClaims: Object.freeze([
    'final licensed City art is shipped',
    'real-device visual certification is complete',
    'a shadow setting proves performance on a physical device',
    'the procedural fallback is an institutional final-art delivery'
  ])
});

export function validateW416CityRendererHardeningContract(contract = W416_CITY_RENDERER_HARDENING_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W416') errors.push('W416 identifier is invalid.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 6) errors.push('W416 must enumerate its renderer, gate, test and documentation files.');
  if (contract?.rendererProfile?.primaryWorldMaterial !== 'PBRMetallicRoughnessMaterial') errors.push('W416 requires a PBR metal/roughness world-material workflow.');
  if (contract?.rendererProfile?.shadowQualities?.cinematic !== true || contract?.rendererProfile?.shadowQualities?.balanced !== false || contract?.rendererProfile?.shadowQualities?.lite !== false) errors.push('W416 must limit real-time shadows to cinematic opt-in quality.');
  if (contract?.rendererProfile?.remoteAssets !== false || contract?.rendererProfile?.finalBinaryArt !== false) errors.push('W416 cannot imply binary art or network asset activation.');
  if (!Array.isArray(contract?.forbiddenClaims) || contract.forbiddenClaims.length < 4) errors.push('W416 must preserve its final-art evidence boundary.');
  return Object.freeze(errors);
}
