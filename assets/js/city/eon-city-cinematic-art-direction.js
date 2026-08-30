/** W420 — local cinematic color and atmosphere discipline for EON City. */
export const EON_CITY_CINEMATIC_ART_DIRECTION_SCHEMA = 'eon.city.cinematic-art-direction.w420.v1';

const freeze = (value) => Object.freeze(value);
const profiles = freeze({
  lite: freeze({
    id: 'lite',
    toneMapping: 'standard',
    exposure: 1.0,
    contrast: 1.02,
    vignette: freeze({ enabled: false, weight: 0, color: freeze([0.01, 0.02, 0.06, 1]) }),
    dithering: freeze({ enabled: false, intensity: 0 }),
    clearColor: '#071126',
    fogColor: '#0a1830',
    fogDensityMultiplier: 1.08,
    visualIntent: 'clean legibility and stable mobile fallback'
  }),
  balanced: freeze({
    id: 'balanced',
    toneMapping: 'aces',
    exposure: 1.02,
    contrast: 1.05,
    vignette: freeze({ enabled: true, weight: 0.52, color: freeze([0.008, 0.018, 0.052, 1]) }),
    dithering: freeze({ enabled: false, intensity: 0 }),
    clearColor: '#07152a',
    fogColor: '#0b1d36',
    fogDensityMultiplier: 0.92,
    visualIntent: 'open noir street legibility without screen grain or crushed shadows'
  }),
  cinematic: freeze({
    id: 'cinematic',
    toneMapping: 'aces',
    exposure: 1.0,
    contrast: 1.08,
    vignette: freeze({ enabled: true, weight: 0.68, color: freeze([0.006, 0.014, 0.044, 1]) }),
    dithering: freeze({ enabled: false, intensity: 0 }),
    clearColor: '#061329',
    fogColor: '#0a1b33',
    fogDensityMultiplier: 0.84,
    visualIntent: 'authored-district review with readable materials, faces and open skyline depth'
  })
});

export const EON_CITY_CINEMATIC_ART_DIRECTION = profiles;

export function normalizeCityCinematicArtQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return Object.hasOwn(profiles, quality) ? quality : 'balanced';
}

export function getCityCinematicArtDirection({ quality = 'balanced' } = {}) {
  const resolvedQuality = normalizeCityCinematicArtQuality(quality);
  const profile = profiles[resolvedQuality];
  return freeze({
    schema: EON_CITY_CINEMATIC_ART_DIRECTION_SCHEMA,
    quality: resolvedQuality,
    ...profile,
    localOnly: true,
    remoteLut: false,
    userData: false,
    finalBinaryArt: false,
    finalVisualCertification: false
  });
}

export function validateCityCinematicArtDirection(source = profiles) {
  const errors = [];
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const profile = source?.[quality];
    if (!profile || profile.id !== quality) errors.push(`${quality} profile missing.`);
    if (!['standard', 'aces'].includes(profile?.toneMapping)) errors.push(`${quality} tone mapping is invalid.`);
    if (!Number.isFinite(profile?.exposure) || profile.exposure < 0.75 || profile.exposure > 1.2) errors.push(`${quality} exposure is out of bounded range.`);
    if (!Number.isFinite(profile?.contrast) || profile.contrast < 0.95 || profile.contrast > 1.25) errors.push(`${quality} contrast is out of bounded range.`);
    if (!Number.isFinite(profile?.fogDensityMultiplier) || profile.fogDensityMultiplier < 0.75 || profile.fogDensityMultiplier > 1.2) errors.push(`${quality} fog multiplier is out of bounded range.`);
    if (!/^#[0-9a-f]{6}$/i.test(profile?.clearColor || '') || !/^#[0-9a-f]{6}$/i.test(profile?.fogColor || '')) errors.push(`${quality} colors must be local hex literals.`);
    if (!Array.isArray(profile?.vignette?.color) || profile.vignette.color.length !== 4 || !profile.vignette.color.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) errors.push(`${quality} vignette color is invalid.`);
    if (profile?.remoteLut === true || profile?.userData === true) errors.push(`${quality} cannot use remote LUTs or user data.`);
  }
  return freeze({ schema: EON_CITY_CINEMATIC_ART_DIRECTION_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true });
}
