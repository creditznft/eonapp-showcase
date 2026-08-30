/**
 * RT92 Grand Master Art Bible.
 *
 * This is the shared visual authority for Command Hub, Signal Frontier,
 * Storm Sector and My Frontier. It intentionally owns no Babylon engine,
 * scene, render loop, progression or network fetching. World presenters use
 * this plan to spend visual complexity where it is visible and useful.
 */
export const EON_CITY_RT92_GRAND_ART_SCHEMA = 'eon.city.grand-master-art.rt92.v1';

const freeze = Object.freeze;

export const EON_CITY_RT92_VISUAL_LAYERS = freeze([
  'hero-silhouette',
  'skyline-depth',
  'major-architecture',
  'secondary-structures',
  'ground-language',
  'vertical-detail',
  'environment-props',
  'micro-detail',
  'vector-graphics',
  'lighting-hierarchy',
  'atmosphere',
  'ambient-motion',
  'population',
  'environmental-story',
  'cinematic-composition'
]);

export const EON_CITY_RT92_MATERIAL_FAMILIES = freeze([
  freeze({ id: 'graphite-composite', metallic: 0.56, roughness: 0.42, emission: 0, role: 'primary-structure' }),
  freeze({ id: 'brushed-dark-metal', metallic: 0.78, roughness: 0.3, emission: 0, role: 'mechanical-frame' }),
  freeze({ id: 'ceramic-shell', metallic: 0.08, roughness: 0.48, emission: 0, role: 'civic-shell' }),
  freeze({ id: 'machined-titanium', metallic: 0.9, roughness: 0.22, emission: 0, role: 'precision-detail' }),
  freeze({ id: 'smoked-architectural-glass', metallic: 0.16, roughness: 0.16, emission: 0.04, role: 'window-and-canopy' }),
  freeze({ id: 'holographic-glass', metallic: 0.05, roughness: 0.1, emission: 0.22, role: 'information-layer' }),
  freeze({ id: 'circuit-surface', metallic: 0.38, roughness: 0.34, emission: 0.18, role: 'ground-data-language' }),
  freeze({ id: 'industrial-damaged-metal', metallic: 0.64, roughness: 0.58, emission: 0.01, role: 'storm-industrial' }),
  freeze({ id: 'frontier-weathered-shell', metallic: 0.25, roughness: 0.67, emission: 0.02, role: 'signal-frontier' }),
  freeze({ id: 'storm-burned-surface', metallic: 0.44, roughness: 0.73, emission: 0.03, role: 'storm-ground' }),
  freeze({ id: 'living-city-facade', metallic: 0.28, roughness: 0.37, emission: 0.05, role: 'my-frontier-urban' }),
  freeze({ id: 'vault-ceremonial', metallic: 0.72, roughness: 0.26, emission: 0.08, role: 'vault-reveal' })
]);

export const EON_CITY_RT92_WORLD_IDENTITIES = freeze({
  'command-hub': freeze({
    label: 'Command Hub',
    thesis: 'technological-heart',
    primarySilhouette: 'living-nexus-citadel',
    architecture: freeze(['monumental-civic-tech', 'ringed-nexus', 'motherboard-floor', 'vertical-observation']),
    palette: freeze({ base: '#111816', secondary: '#22312d', accent: '#78e6d7', warm: '#e6bd78', warning: '#e69b63' }),
    emissionShareMax: 0.1,
    density: freeze({ near: 1, mid: 0.82, far: 0.62 }),
    atmosphere: freeze(['clear-depth-haze', 'subtle-data-particles']),
    motion: freeze(['nexus-rings', 'signal-packets', 'distant-transit', 'maintenance-life']),
    requiredLayers: EON_CITY_RT92_VISUAL_LAYERS
  }),
  'signal-frontier': freeze({
    label: 'Signal Frontier',
    thesis: 'lost-frontier-restoration',
    primarySilhouette: 'horizon-vault-and-broken-signal-arch',
    architecture: freeze(['weathered-relay', 'archive-ruin', 'fractured-transit', 'recovery-scaffold']),
    palette: freeze({ base: '#111a1b', secondary: '#26383a', accent: '#77ddd8', archive: '#8ed5b5', warning: '#dfaf72' }),
    emissionShareMax: 0.09,
    density: freeze({ near: 0.88, mid: 0.7, far: 0.74 }),
    atmosphere: freeze(['frontier-haze', 'wind-particles', 'signal-interference']),
    motion: freeze(['beacon-alignment', 'recovery-machinery', 'distant-survey-drones', 'signal-restoration']),
    requiredLayers: EON_CITY_RT92_VISUAL_LAYERS
  }),
  'storm-sector': freeze({
    label: 'Storm Sector',
    thesis: 'dangerous-industrial-weather-system',
    primarySilhouette: 'command-spire-stabilizer-transit-gate',
    architecture: freeze(['storm-industrial', 'grounding-network', 'maintenance-gantry', 'emergency-infrastructure']),
    palette: freeze({ base: '#111517', secondary: '#2b3335', electric: '#78d7e5', hazard: '#e3b467', emergency: '#dc756d' }),
    emissionShareMax: 0.075,
    density: freeze({ near: 0.94, mid: 0.78, far: 0.58 }),
    atmosphere: freeze(['layered-storm-cloud', 'directional-rain', 'electrical-haze']),
    motion: freeze(['lightning', 'wind-response', 'storm-machinery', 'hazard-beacons']),
    requiredLayers: EON_CITY_RT92_VISUAL_LAYERS
  }),
  'my-frontier': freeze({
    label: 'My Frontier',
    thesis: 'persistent-living-user-city',
    primarySilhouette: 'authored-seven-district-skyline',
    architecture: freeze(['civic-core', 'creator-sculptural', 'knowledge-observatory', 'systems-industrial', 'signal-vertical', 'transit-linear', 'personal-calm']),
    palette: freeze({ base: '#111816', secondary: '#25322e', civic: '#78d8cc', creator: '#aa91d8', knowledge: '#8fd8bb', systems: '#d5ad72', personal: '#9fc8b0' }),
    emissionShareMax: 0.09,
    density: freeze({ near: 1, mid: 0.9, far: 0.72 }),
    atmosphere: freeze(['clean-city-depth', 'district-specific-ambient-cues']),
    motion: freeze(['citizen-life', 'construction-ceremony', 'transit', 'district-machinery']),
    requiredLayers: EON_CITY_RT92_VISUAL_LAYERS
  })
});

export const EON_CITY_RT92_QUALITY_BUDGETS = freeze({
  lite: freeze({
    visualDensity: 0.68,
    skylineFactor: 0.62,
    populationFactor: 0.48,
    particleFactor: 0.34,
    movingPropFactor: 0.45,
    highDetailRingRadius: 26,
    warmRingRadius: 58,
    maxNewOptionalBinaryBytes: 8_000_000,
    firstFrameNewBinaryBytes: 0
  }),
  balanced: freeze({
    visualDensity: 0.9,
    skylineFactor: 0.84,
    populationFactor: 0.74,
    particleFactor: 0.68,
    movingPropFactor: 0.76,
    highDetailRingRadius: 34,
    warmRingRadius: 72,
    maxNewOptionalBinaryBytes: 10_000_000,
    firstFrameNewBinaryBytes: 0
  }),
  cinematic: freeze({
    visualDensity: 1,
    skylineFactor: 1,
    populationFactor: 1,
    particleFactor: 1,
    movingPropFactor: 1,
    highDetailRingRadius: 42,
    warmRingRadius: 88,
    maxNewOptionalBinaryBytes: 12_000_000,
    firstFrameNewBinaryBytes: 0
  })
});

export const EON_CITY_RT92_SHARPNESS_RULES = freeze({
  neutralStructureShareMin: 0.7,
  secondarySurfaceShareMax: 0.2,
  emissiveShareMax: 0.1,
  bloomPolicy: 'hero-events-and-focal-systems-only',
  giantFloatingParagraphsAllowed: false,
  repeatedNeighbourAssetAllowed: false,
  textureHeavyArchitectureAllowed: false,
  readableNearMidFarSeparationRequired: true,
  spawnHeroCompositionRequired: true,
  mobileHeroSilhouetteRequired: true
});

export function normalizeEonCityRt92Quality(value = 'balanced') {
  const id = String(value || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(EON_CITY_RT92_QUALITY_BUDGETS, id) ? id : 'balanced';
}

export function buildEonCityRt92GrandArtPlan({ quality = 'balanced', reducedMotion = false, coarsePointer = false } = {}) {
  const resolvedQuality = normalizeEonCityRt92Quality(quality);
  const budget = EON_CITY_RT92_QUALITY_BUDGETS[resolvedQuality];
  const motionMultiplier = reducedMotion ? 0.22 : 1;
  const mobileMultiplier = coarsePointer ? 0.82 : 1;
  return freeze({
    schema: EON_CITY_RT92_GRAND_ART_SCHEMA,
    quality: resolvedQuality,
    layers: EON_CITY_RT92_VISUAL_LAYERS,
    layerCount: EON_CITY_RT92_VISUAL_LAYERS.length,
    worlds: EON_CITY_RT92_WORLD_IDENTITIES,
    worldCount: Object.keys(EON_CITY_RT92_WORLD_IDENTITIES).length,
    materialFamilies: EON_CITY_RT92_MATERIAL_FAMILIES,
    materialFamilyCount: EON_CITY_RT92_MATERIAL_FAMILIES.length,
    sharpness: EON_CITY_RT92_SHARPNESS_RULES,
    streaming: freeze({
      ringA: freeze({ id: 'near-detail', radius: Math.round(budget.highDetailRingRadius * mobileMultiplier), fullGeometry: true, animatedPopulation: true }),
      ringB: freeze({ id: 'warm-adjacent', radius: Math.round(budget.warmRingRadius * mobileMultiplier), lowLod: true, reducedUpdateRate: true }),
      ringC: freeze({ id: 'far-silhouette', beyondRadius: Math.round(budget.warmRingRadius * mobileMultiplier), impostorEligible: true, ambientMotionFactor: Number((budget.movingPropFactor * 0.35 * motionMultiplier).toFixed(3)) }),
      hiddenWorldsSuspended: true,
      abandonedOptionalAssetsDisposable: true,
      sameOriginOnly: true,
      contentAddressedPreferred: true
    }),
    runtimeBudget: freeze({
      ...budget,
      particleFactor: Number((budget.particleFactor * motionMultiplier).toFixed(3)),
      movingPropFactor: Number((budget.movingPropFactor * motionMultiplier).toFixed(3)),
      populationFactor: Number((budget.populationFactor * mobileMultiplier).toFixed(3))
    }),
    binaryBudget: freeze({
      targetNewGlbBytes: 8_000_000,
      hardNewGlbBytes: budget.maxNewOptionalBinaryBytes,
      targetNewVectorBytes: 300_000,
      targetNewRasterBytes: 0,
      firstFrameNewBinaryBytes: budget.firstFrameNewBinaryBytes
    }),
    authority: freeze({
      ownsBabylonEngine: false,
      ownsScene: false,
      ownsRenderLoop: false,
      ownsProgression: false,
      ownsAssetFetcher: false,
      ownsNetwork: false
    })
  });
}

export function validateEonCityRt92GrandArtPlan(plan = buildEonCityRt92GrandArtPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_RT92_GRAND_ART_SCHEMA) errors.push('schema');
  if (plan?.layerCount !== 15 || plan?.layers?.length !== 15) errors.push('visual-layer-count');
  if (plan?.worldCount !== 4 || Object.keys(plan?.worlds || {}).length !== 4) errors.push('world-count');
  if (plan?.materialFamilyCount !== 12 || plan?.materialFamilies?.length !== 12) errors.push('material-family-count');
  if (Number(plan?.sharpness?.neutralStructureShareMin || 0) < 0.7 || Number(plan?.sharpness?.emissiveShareMax || 1) > 0.1) errors.push('sharpness-ratio');
  if (plan?.sharpness?.giantFloatingParagraphsAllowed !== false || plan?.sharpness?.textureHeavyArchitectureAllowed !== false) errors.push('sharpness-boundaries');
  if (Number(plan?.binaryBudget?.targetNewGlbBytes || 0) > 8_000_000 || Number(plan?.binaryBudget?.firstFrameNewBinaryBytes ?? 1) !== 0) errors.push('binary-budget');
  if (plan?.streaming?.hiddenWorldsSuspended !== true || plan?.streaming?.sameOriginOnly !== true) errors.push('streaming-policy');
  for (const worldId of ['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']) {
    const world = plan?.worlds?.[worldId];
    if (!world || world.requiredLayers?.length !== 15 || Number(world.emissionShareMax || 1) > 0.1) errors.push(`world:${worldId}`);
  }
  if (Object.values(plan?.authority || {}).some(Boolean)) errors.push('authority-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export default freeze({
  EON_CITY_RT92_GRAND_ART_SCHEMA,
  EON_CITY_RT92_VISUAL_LAYERS,
  EON_CITY_RT92_MATERIAL_FAMILIES,
  EON_CITY_RT92_WORLD_IDENTITIES,
  EON_CITY_RT92_QUALITY_BUDGETS,
  EON_CITY_RT92_SHARPNESS_RULES,
  buildEonCityRt92GrandArtPlan,
  validateEonCityRt92GrandArtPlan
});
