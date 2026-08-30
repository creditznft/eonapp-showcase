/**
 * L95 RT90 — shared distance-streaming policy for optional Open World detail.
 *
 * Gameplay-critical terrain/player/collision assets are outside this policy.
 * This contract exists for optional authored GLBs and future landscape dressing
 * so a world can become visually dense without eagerly decoding the whole map.
 * It owns no timers, fetches, scenes, render loops or persistence.
 */
export const EON_CITY_L95_WORLD_STREAMING_POLICY_SCHEMA = 'eon.city.l95.world-streaming-policy.rt90.v1';

const freeze = Object.freeze;
const PROFILES = freeze({
  lite: freeze({ nearRadius: 16, warmRadius: 24, distantRadius: 38, focusIntervalMs: 320 }),
  balanced: freeze({ nearRadius: 20, warmRadius: 30, distantRadius: 42, focusIntervalMs: 250 }),
  cinematic: freeze({ nearRadius: 24, warmRadius: 34, distantRadius: 46, focusIntervalMs: 220 })
});

export function getEonCityL95WorldStreamingProfile(quality = 'balanced') {
  return PROFILES[String(quality || '').trim().toLowerCase()] || PROFILES.balanced;
}

export function deriveEonCityL95WorldStreamingFocus({ playerPosition = null, worldOffset = null, quality = 'balanced' } = {}) {
  const profile = getEonCityL95WorldStreamingProfile(quality);
  const px = Number(playerPosition?.x);
  const pz = Number(playerPosition?.z);
  const ox = Number(worldOffset?.x || 0);
  const oz = Number(worldOffset?.z || 0);
  const valid = Number.isFinite(px) && Number.isFinite(pz);
  return freeze({
    schema: EON_CITY_L95_WORLD_STREAMING_POLICY_SCHEMA,
    valid,
    x: valid ? px - ox : 0,
    z: valid ? pz - oz : 0,
    nearRadius: profile.nearRadius,
    warmRadius: profile.warmRadius,
    distantRadius: profile.distantRadius,
    focusIntervalMs: profile.focusIntervalMs,
    bootCriticalOutsidePolicy: true,
    nearTier: 'interactive-and-character-detail',
    warmTier: 'public-infrastructure-and-landmarks',
    distantTier: 'lod-or-impostor-only',
    retainValidatedSameSessionAssets: true,
    hiddenWorldStartsOptionalLoads: false
  });
}

export function distanceToEonCityL95StreamingFocus(focus = null, position = null) {
  if (focus?.valid !== true) return Number.POSITIVE_INFINITY;
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return Number.POSITIVE_INFINITY;
  return Math.hypot(x - Number(focus.x || 0), z - Number(focus.z || 0));
}

export default freeze({
  EON_CITY_L95_WORLD_STREAMING_POLICY_SCHEMA,
  getEonCityL95WorldStreamingProfile,
  deriveEonCityL95WorldStreamingFocus,
  distanceToEonCityL95StreamingFocus
});
