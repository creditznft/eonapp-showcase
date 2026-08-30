/**
 * W649H — honest device/residency policy for the integrated GLB library.
 *
 * The shipped files are transfer-optimised LOD0 candidates plus decoder-free
 * fallbacks. This module does not label them as geometric LOD1/LOD2. Until a
 * headed visual reduction pass exists, Lite bounds population and chooses the
 * decoder-free path while procedural silhouettes remain the distant LOD.
 */
export const EON_CITY_W649_PERFORMANCE_PROFILE_SCHEMA = 'eon.city.w649.performance-profile.v1';
const freeze = (value) => Object.freeze(value);

export const EON_CITY_W649_PERFORMANCE_PROFILES = freeze({
  lite: freeze({
    id: 'lite',
    maxResidentDistricts: 1,
    maxPopulationCharactersPerDistrict: 1,
    preferDecoderFree: true,
    distantRepresentation: 'procedural-silhouette',
    optionalCharacters: false,
    dynamicShadowOwners: 0,
    targetDprCeiling: 1,
    particles: 'minimal'
  }),
  balanced: freeze({
    id: 'balanced',
    maxResidentDistricts: 2,
    maxPopulationCharactersPerDistrict: 3,
    preferDecoderFree: false,
    distantRepresentation: 'procedural-silhouette',
    optionalCharacters: true,
    dynamicShadowOwners: 0,
    targetDprCeiling: 1.5,
    particles: 'bounded'
  }),
  cinematic: freeze({
    id: 'cinematic',
    maxResidentDistricts: 2,
    maxPopulationCharactersPerDistrict: 3,
    preferDecoderFree: false,
    distantRepresentation: 'procedural-silhouette',
    optionalCharacters: true,
    dynamicShadowOwners: 1,
    targetDprCeiling: 2,
    particles: 'rich-bounded'
  })
});

export function getEonCityW649PerformanceProfile(quality = 'balanced', { reducedMotion = false, reducedData = false } = {}) {
  const requested = String(quality || '').trim().toLowerCase();
  const resolved = reducedData ? 'lite' : (EON_CITY_W649_PERFORMANCE_PROFILES[requested] ? requested : 'balanced');
  return freeze({
    schema: EON_CITY_W649_PERFORMANCE_PROFILE_SCHEMA,
    ...EON_CITY_W649_PERFORMANCE_PROFILES[resolved],
    requestedQuality: requested || 'balanced',
    reducedMotion: Boolean(reducedMotion),
    reducedEffects: Boolean(reducedMotion),
    reducedData: Boolean(reducedData),
    geometricLodReady: false,
    geometricLodCertificationPending: true,
    transferOptimizedLod0: true,
    collisionPolicy: 'primitive-proxies-only',
    preloadAll: false,
    localOnly: true,
    remoteTelemetry: false
  });
}

export function getEonCityW649PerformanceTruth() {
  return freeze({
    schema: EON_CITY_W649_PERFORMANCE_PROFILE_SCHEMA,
    profiles: freeze(Object.keys(EON_CITY_W649_PERFORMANCE_PROFILES)),
    maxResidentDistricts: 2,
    signedOutHeavyRequests: 0,
    distantRepresentation: 'procedural-silhouette',
    transferOptimizedLod0: true,
    geometricLodReady: false,
    geometricLodCertificationPending: true,
    primitiveCollisionOnly: true,
    reducedMotionPreservesVisualDetail: true,
    visualPerformanceClaim: false,
    ownerApprovalRequired: true,
    localOnly: true
  });
}
