/**
 * W479-R: guarded Babylon texture lifecycle for EON City.
 *
 * This module is intentionally small and local-only. It prevents SVG/canvas/UI
 * art from reaching WebGL with unknown dimensions, disables mipmaps for vector
 * decals by default, and gives callers a valid fallback texture instead of a
 * black missing-looking slab or noisy texImage2D path.
 */
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

export const EON_CITY_SAFE_TEXTURE_SCHEMA = 'eon.city.safe-texture-runtime.w479r.v1';
export const EON_CITY_SAFE_TEXTURE_DEFAULT_SIZE = Object.freeze({ width: 128, height: 128 });

function finiteDimension(value, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && number > 0 ? Math.max(1, Math.min(4096, number)) : fallback;
}

export function normalizeCityTextureDimensions(input = {}) {
  const width = finiteDimension(input.width, EON_CITY_SAFE_TEXTURE_DEFAULT_SIZE.width);
  const height = finiteDimension(input.height, EON_CITY_SAFE_TEXTURE_DEFAULT_SIZE.height);
  return Object.freeze({ width, height, valid: width > 0 && height > 0 });
}

export function createCityFallbackTexture(scene, name = 'eon-city-fallback-texture', input = {}) {
  if (!scene) return null;
  const size = normalizeCityTextureDimensions(input);
  try {
    const texture = new DynamicTexture(String(name), { width: size.width, height: size.height }, scene, false);
    const ctx = texture.getContext?.();
    if (!ctx || typeof ctx.fillRect !== 'function') {
      texture.dispose?.();
      return null;
    }
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = '#07111f';
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.strokeStyle = '#45f6ff';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(size.width, size.height) * 0.04));
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, size.width - ctx.lineWidth * 2, size.height - ctx.lineWidth * 2);
    ctx.fillStyle = 'rgba(69,246,255,.16)';
    ctx.fillRect(size.width * 0.18, size.height * 0.18, size.width * 0.64, size.height * 0.64);
    texture.hasAlpha = true;
    texture.update(false);
    texture.metadata = { schema: EON_CITY_SAFE_TEXTURE_SCHEMA, fallback: true, width: size.width, height: size.height, mipmaps: false };
    return texture;
  } catch {
    return null;
  }
}

export function createSafeCityTexture(scene, url, options = {}) {
  if (!scene || !url) return createCityFallbackTexture(scene, `${options.name || 'eon-city'}-fallback`, options);
  const size = normalizeCityTextureDimensions(options);
  const noMipmap = options.mipmap === true ? false : true;
  try {
    const texture = new Texture(String(url), scene, noMipmap, false, Texture.TRILINEAR_SAMPLINGMODE);
    texture.name = String(options.name || `eon-city-safe-${String(url).split('/').pop() || 'texture'}`);
    texture.hasAlpha = Boolean(options.alpha);
    texture.uScale = Number(options.uScale || 1);
    texture.vScale = Number(options.vScale || 1);
    texture.wrapU = options.clamp ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
    texture.wrapV = options.clamp ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
    texture.anisotropicFilteringLevel = Number(options.anisotropicFilteringLevel || 1);
    texture.metadata = {
      schema: EON_CITY_SAFE_TEXTURE_SCHEMA,
      safeUpload: true,
      url: String(url),
      width: size.width,
      height: size.height,
      mipmaps: !noMipmap,
      vectorUiDefault: options.mipmap !== true,
      fallback: false
    };
    return texture;
  } catch {
    return createCityFallbackTexture(scene, `${options.name || 'eon-city'}-fallback`, size);
  }
}

export function inspectCityTexturePolicyFromSource(source = '') {
  const rawTextureCalls = [...String(source).matchAll(/new\s+Texture\s*\(/g)].length;
  const dynamicTextureCalls = [...String(source).matchAll(/new\s+DynamicTexture\s*\(/g)].length;
  return Object.freeze({ schema: EON_CITY_SAFE_TEXTURE_SCHEMA, rawTextureCalls, dynamicTextureCalls });
}
