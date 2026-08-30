/**
 * W365 — shared original material policy for future authored EON City assets.
 *
 * This is a numeric/PBR direction contract, not a texture loader. Assets use
 * the rule set only after the provenance catalog has released them locally.
 */
import { CITY_PLAY_NEON_COMMAND_PALETTE } from './eon-city-play-art-direction.js';

export const CITY_MATERIAL_POLICY_SCHEMA = 'eon.city.material-policy.w365.v1';

export const CITY_MATERIAL_PROFILES = Object.freeze({
  lite: Object.freeze({
    maxEmissiveIntensity: 0.72,
    maxMaterialVariants: 8,
    wetSurfaceVariation: false,
    reflectionProbe: false,
    expectedUse: 'reduced-effects and weak-device fallback'
  }),
  balanced: Object.freeze({
    maxEmissiveIntensity: 1.05,
    maxMaterialVariants: 16,
    wetSurfaceVariation: true,
    reflectionProbe: false,
    expectedUse: 'default City scene quality'
  }),
  cinematic: Object.freeze({
    maxEmissiveIntensity: 1.28,
    maxMaterialVariants: 24,
    wetSurfaceVariation: true,
    reflectionProbe: true,
    expectedUse: 'capable desktop opt-in quality'
  })
});

export const CITY_MATERIAL_FAMILIES = Object.freeze([
  Object.freeze({
    id: 'command-steel',
    baseColor: CITY_PLAY_NEON_COMMAND_PALETTE.steel,
    metallic: 0.62,
    roughness: 0.34,
    emissiveRole: 'none',
    contrastRole: 'structural-base'
  }),
  Object.freeze({
    id: 'wet-pavement',
    baseColor: CITY_PLAY_NEON_COMMAND_PALETTE.night,
    metallic: 0.42,
    roughness: 0.28,
    emissiveRole: 'reflected-accent-only',
    contrastRole: 'walkable-surface'
  }),
  Object.freeze({
    id: 'command-glass',
    baseColor: CITY_PLAY_NEON_COMMAND_PALETTE.glass,
    metallic: 0.22,
    roughness: 0.16,
    emissiveRole: 'restrained-cyan-violet',
    contrastRole: 'panel-and-window'
  }),
  Object.freeze({
    id: 'review-signal',
    baseColor: CITY_PLAY_NEON_COMMAND_PALETTE.amber,
    metallic: 0.18,
    roughness: 0.24,
    emissiveRole: 'review-only',
    contrastRole: 'approval-attention'
  }),
  Object.freeze({
    id: 'verified-signal',
    baseColor: CITY_PLAY_NEON_COMMAND_PALETTE.mint,
    metallic: 0.18,
    roughness: 0.24,
    emissiveRole: 'completion-only',
    contrastRole: 'verified-outcome'
  }),
  Object.freeze({
    id: 'operator-fabric',
    baseColor: '#20344d',
    metallic: 0.08,
    roughness: 0.72,
    emissiveRole: 'none',
    contrastRole: 'readable-character-silhouette'
  })
]);

export function normalizeCityMaterialQuality(quality = 'balanced') {
  return Object.prototype.hasOwnProperty.call(CITY_MATERIAL_PROFILES, quality) ? quality : 'balanced';
}

export function getCityMaterialProfile(quality = 'balanced') {
  return CITY_MATERIAL_PROFILES[normalizeCityMaterialQuality(quality)];
}

export function getCityMaterialFamily(id) {
  return CITY_MATERIAL_FAMILIES.find((family) => family.id === id) || null;
}

export function validateCityMaterialSpec(spec = {}, { quality = 'balanced' } = {}) {
  const errors = [];
  const profile = getCityMaterialProfile(quality);
  const family = getCityMaterialFamily(spec.family);
  if (!family) errors.push('Unknown material family.');
  for (const key of ['metallic', 'roughness']) {
    const value = Number(spec[key] ?? family?.[key]);
    if (!Number.isFinite(value) || value < 0 || value > 1) errors.push(`${key} must be between 0 and 1.`);
  }
  const emissive = Number(spec.emissiveIntensity || 0);
  if (!Number.isFinite(emissive) || emissive < 0 || emissive > profile.maxEmissiveIntensity) errors.push('Emissive intensity exceeds this quality profile.');
  if (spec.remoteTexture === true || spec.userData === true) errors.push('Materials cannot use remote textures or user data.');
  if (spec.signalRole === 'review' && family?.id !== 'review-signal') errors.push('Only the review material family may imply review attention.');
  if (spec.signalRole === 'verified' && family?.id !== 'verified-signal') errors.push('Only the verified material family may imply completion.');
  return Object.freeze({
    schema: CITY_MATERIAL_POLICY_SCHEMA,
    ok: errors.length === 0,
    quality: normalizeCityMaterialQuality(quality),
    profile,
    family: family?.id || null,
    errors: Object.freeze(errors),
    remoteNetwork: false,
    containsUserData: false
  });
}

export function getCityMaterialPolicySummary(quality = 'balanced') {
  const profile = getCityMaterialProfile(quality);
  return Object.freeze({
    schema: CITY_MATERIAL_POLICY_SCHEMA,
    quality: normalizeCityMaterialQuality(quality),
    profile,
    familyCount: CITY_MATERIAL_FAMILIES.length,
    originalPalette: true,
    remoteNetwork: false,
    containsUserData: false
  });
}
