/** W416 — dependency-free renderer truth record, safe for browser and Node source gates. */
export const EON_CITY_PROCEDURAL_RENDERER_PROFILE = Object.freeze({
  schema: 'eon.city.procedural-renderer.w416.v1',
  primaryWorldMaterial: 'PBRMetallicRoughnessMaterial',
  displayMaterial: 'StandardMaterial (local DynamicTexture panels only)',
  shadows: Object.freeze({ lite: false, balanced: false, cinematic: true }),
  finalBinaryArt: false,
  remoteAssets: false,
  localOnly: true
});

export function getEonCityProceduralRendererProfile() {
  return EON_CITY_PROCEDURAL_RENDERER_PROFILE;
}
