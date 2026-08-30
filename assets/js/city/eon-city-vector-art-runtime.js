/** W419 — local Babylon texture runtime for the original vector art pack. */
import { createSafeCityTexture } from './eon-city-safe-texture-runtime.js';
import { getCityVectorArtAsset, getCityVectorArtPath, getCityVectorArtPlan, normalizeCityVectorArtQuality } from './eon-city-vector-art-kit.js';

export const EON_CITY_VECTOR_ART_RUNTIME_SCHEMA = 'eon.city.vector-art-runtime.w419.v1';

function freeze(value) { return Object.freeze(value); }

function textureKey(id, options = {}) {
  return `${id}:${Number(options.uScale || 1)}:${Number(options.vScale || 1)}:${options.clamp ? 'clamp' : 'repeat'}`;
}

export class EonCityVectorArtRuntime {
  constructor(scene, { quality = 'balanced' } = {}) {
    this.scene = scene;
    this.quality = normalizeCityVectorArtQuality(quality);
    this.textures = new Map();
    this.textureRecords = new Map();
    this.motionCallback = null;
    this.motionEnabled = false;
    this.motionTextureCount = 0;
    this.disposed = false;
  }

  getTexture(id, options = {}) {
    if (this.disposed || !this.scene) return null;
    const entry = getCityVectorArtAsset(id);
    if (!entry || !entry.qualities.includes(this.quality)) return null;
    const key = textureKey(id, options);
    if (this.textures.has(key)) return this.textures.get(key);
    const texture = createSafeCityTexture(this.scene, getCityVectorArtPath(id), {
      name: `eon-city-vector-${id}`,
      width: entry.width,
      height: entry.height,
      alpha: Boolean(entry.alpha || options.alpha),
      clamp: Boolean(options.clamp),
      uScale: Number(options.uScale || 1),
      vScale: Number(options.vScale || 1),
      anisotropicFilteringLevel: this.quality === 'cinematic' ? 4 : 2,
      // W479-R: vector/UI/decal SVGs intentionally do not request mipmaps.
      mipmap: false
    });
    this.textures.set(key, texture);
    this.textureRecords.set(key, Object.freeze({ id, texture, clamp: Boolean(options.clamp), alpha: Boolean(entry.alpha || options.alpha) }));
    return texture;
  }

  /**
   * Applies low-cost texture drift to repeatable original SVG surfaces. This
   * is real in-engine motion (u/v texture offsets), not a fake progress or
   * reward animation. Decals and clamped heraldry remain still so labels stay
   * legible. The loop respects the City pause and reduced-effects flags.
   */
  attachSubtleMotion({ enabled = true, reducedMotion = false } = {}) {
    if (this.disposed || !this.scene?.registerBeforeRender || this.motionCallback) {
      return freeze({ enabled: false, textureCount: this.motionTextureCount, reason: this.disposed ? 'disposed' : 'already-bound-or-unavailable' });
    }
    const canAnimate = enabled && !reducedMotion && this.quality !== 'lite';
    this.motionEnabled = canAnimate;
    this.motionCallback = () => {
      if (!this.motionEnabled || this.disposed || this.scene?.metadata?.playPaused || this.scene?.metadata?.playReducedEffects) return;
      const now = Number(globalThis.performance?.now?.() || Date.now()) * 0.000045;
      let active = 0;
      for (const record of this.textureRecords.values()) {
        if (record.clamp || !record.texture) continue;
        const texture = record.texture;
        if (record.id === 'wet-street') {
          texture.vOffset = (now * 0.36) % 1;
          active += 1;
        } else if (record.id === 'neon-circuit') {
          texture.uOffset = (now * 0.52) % 1;
          active += 1;
        } else if (record.id === 'glass-grid') {
          texture.vOffset = (now * 0.14) % 1;
          active += 1;
        } else if (record.id === 'carbon-weave' || record.id === 'brushed-graphite') {
          texture.uOffset = (now * 0.05) % 1;
          active += 1;
        }
      }
      this.motionTextureCount = active;
    };
    this.scene.registerBeforeRender(this.motionCallback);
    return freeze({ enabled: this.motionEnabled, textureCount: this.motionTextureCount, quality: this.quality, localOnly: true, remoteNetwork: false });
  }

  getSummary() {
    const plan = getCityVectorArtPlan({ quality: this.quality });
    return freeze({
      schema: EON_CITY_VECTOR_ART_RUNTIME_SCHEMA,
      quality: this.quality,
      declaredAssets: plan.entries.length,
      createdTextures: this.textures.size,
      motionEnabled: this.motionEnabled,
      animatedTextureCount: this.motionTextureCount,
      localSameOriginOnly: true,
      remoteNetwork: false,
      finalBinaryArt: false,
      disposed: this.disposed
    });
  }

  dispose() {
    if (this.disposed) return;
    if (this.motionCallback && this.scene?.unregisterBeforeRender) {
      try { this.scene.unregisterBeforeRender(this.motionCallback); } catch {}
    }
    this.motionCallback = null;
    this.motionEnabled = false;
    for (const texture of this.textures.values()) {
      try { texture.dispose(); } catch {}
    }
    this.textures.clear();
    this.textureRecords.clear();
    this.disposed = true;
  }
}

export function createCityVectorArtRuntime(scene, options = {}) {
  return new EonCityVectorArtRuntime(scene, options);
}
