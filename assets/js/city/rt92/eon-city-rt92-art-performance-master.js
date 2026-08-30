/** RT92 Wave 9 — shared cadence and visual-complexity mastering. Presentation policy only. */
export const EON_CITY_RT92_ART_PERFORMANCE_SCHEMA = 'eon.city.art-performance-master.rt92.v1';
const freeze = Object.freeze;

export const EON_CITY_RT92_ART_PERFORMANCE_PROFILES = freeze({
  lite: freeze({ animationHz: 18, serviceLifeHz: 14, cinematicVfxHz: 18, maxServiceActors: 2, maxVfxNodes: 7, highDetailRadius: 26, warmRadius: 58, farMotionFactor: 0.18, maxOptionalArtBytes: 8_000_000 }),
  balanced: freeze({ animationHz: 30, serviceLifeHz: 24, cinematicVfxHz: 30, maxServiceActors: 4, maxVfxNodes: 13, highDetailRadius: 34, warmRadius: 72, farMotionFactor: 0.28, maxOptionalArtBytes: 10_000_000 }),
  cinematic: freeze({ animationHz: 45, serviceLifeHz: 36, cinematicVfxHz: 45, maxServiceActors: 6, maxVfxNodes: 19, highDetailRadius: 42, warmRadius: 88, farMotionFactor: 0.35, maxOptionalArtBytes: 12_000_000 })
});

export const EON_CITY_RT92_ART_SHARPNESS_MASTER = freeze({
  neutralStructureShareMin: 0.7,
  emissiveShareMax: 0.1,
  worldCardVectorBytesMax: 300_000,
  newRasterBytesTarget: 0,
  newGlbBytesTarget: 8_000_000,
  bloom: 'focal-events-only',
  ambientBloomForbidden: true,
  readableSilhouetteRequired: true,
  nearMidFarSeparationRequired: true,
  reducedMotionStillFrameComplete: true
});

export function normalizeEonCityRt92ArtPerformanceQuality(value = 'balanced') {
  const id = String(value || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(EON_CITY_RT92_ART_PERFORMANCE_PROFILES, id) ? id : 'balanced';
}

export function buildEonCityRt92ArtPerformancePlan({ quality = 'balanced', reducedMotion = false, coarsePointer = false } = {}) {
  const id = normalizeEonCityRt92ArtPerformanceQuality(quality);
  const base = EON_CITY_RT92_ART_PERFORMANCE_PROFILES[id];
  const mobileFactor = coarsePointer ? 0.84 : 1;
  const motionFactor = reducedMotion ? 0.12 : 1;
  return freeze({
    schema: EON_CITY_RT92_ART_PERFORMANCE_SCHEMA,
    quality: id,
    reducedMotion: Boolean(reducedMotion),
    coarsePointer: Boolean(coarsePointer),
    animationHz: reducedMotion ? 4 : base.animationHz,
    serviceLifeHz: reducedMotion ? 2 : base.serviceLifeHz,
    cinematicVfxHz: reducedMotion ? 2 : base.cinematicVfxHz,
    maxServiceActors: base.maxServiceActors,
    maxVfxNodes: base.maxVfxNodes,
    highDetailRadius: Math.round(base.highDetailRadius * mobileFactor),
    warmRadius: Math.round(base.warmRadius * mobileFactor),
    farMotionFactor: Number((base.farMotionFactor * motionFactor).toFixed(3)),
    maxOptionalArtBytes: base.maxOptionalArtBytes,
    firstFrameNewBinaryBytes: 0,
    sharpness: EON_CITY_RT92_ART_SHARPNESS_MASTER,
    hiddenWorldsSuspended: true,
    oneEngine: true,
    oneScene: true,
    oneRenderLoop: true,
    ownsRenderLoop: false,
    ownsScene: false,
    ownsEngine: false
  });
}

export function createEonCityRt92ArtCadence({ quality = 'balanced', reducedMotion = false, coarsePointer = false } = {}) {
  const plan = buildEonCityRt92ArtPerformancePlan({ quality, reducedMotion, coarsePointer });
  const last = new Map();
  const channelHz = (channel) => channel === 'service-life' ? plan.serviceLifeHz : channel === 'cinematic-vfx' ? plan.cinematicVfxHz : plan.animationHz;
  return freeze({
    schema: EON_CITY_RT92_ART_PERFORMANCE_SCHEMA,
    plan,
    shouldUpdate(channel = 'ambient', seconds = 0, { force = false } = {}) {
      const id = String(channel || 'ambient');
      const now = Math.max(0, Number(seconds || 0));
      const hz = Math.max(1, Number(channelHz(id) || 1));
      const interval = 1 / hz;
      const previous = Number(last.get(id) ?? -Infinity);
      if (!force && now - previous < interval) return freeze({ ok: true, update: false, channel: id, interval, elapsed: Math.max(0, now - previous) });
      last.set(id, now);
      return freeze({ ok: true, update: true, channel: id, interval, elapsed: Number.isFinite(previous) ? Math.max(0, now - previous) : Infinity });
    },
    reset(channel = '') {
      if (channel) last.delete(String(channel));
      else last.clear();
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_CITY_RT92_ART_PERFORMANCE_SCHEMA, EON_CITY_RT92_ART_PERFORMANCE_PROFILES, EON_CITY_RT92_ART_SHARPNESS_MASTER, buildEonCityRt92ArtPerformancePlan, createEonCityRt92ArtCadence });
