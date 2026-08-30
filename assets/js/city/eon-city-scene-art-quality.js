/**
 * W604 — pure Command Horizon art quality selection.
 *
 * This module deliberately has no Babylon/browser import so the quality
 * contract can be unit-tested in Node. It never fetches or authorizes assets;
 * the scene-art runtime remains responsible for validated local loading.
 */
export const EON_CITY_SCENE_ART_QUALITY_SCHEMA = 'eon.city.scene-art-quality.w604.v1';

export function resolveEonCitySceneArtAssetId({ assetId, texturedAssetId, quality = 'balanced' } = {}) {
  const normalizedQuality = String(quality || 'balanced').toLowerCase();
  // Lite keeps W603's textureless local kit as an intentional low-memory
  // fallback. Balanced/Cinematic select the W604 original embedded-PNG PBR
  // candidate if the catalogued textured asset is available.
  return normalizedQuality === 'lite' || !texturedAssetId ? assetId : texturedAssetId;
}

export function getEonCitySceneArtTextureMode(quality = 'balanced') {
  return String(quality || 'balanced').toLowerCase() === 'lite'
    ? 'textureless-pbr-fallback'
    : 'source-generated-png-pbr';
}
