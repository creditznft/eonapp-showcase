/**
 * W697 — district-specific visual construction adapters.
 *
 * This pure authority prevents the reusable District Belt renderer from
 * collapsing into nine recoloured copies. Stable product district IDs remain
 * unchanged; each receives a bounded, recognisable architecture, station,
 * gateway, discovery and street-marking grammar.
 */

export const EON_CITY_W697_DISTRICT_VISUAL_IDENTITY_SCHEMA = 'eon.city.district-visual-identity.w697.v1';
const freeze = (value) => Object.freeze(value);
const profile = (value) => freeze({ schema: EON_CITY_W697_DISTRICT_VISUAL_IDENTITY_SCHEMA, ...value, localOnly: true, automaticNavigation: false, automaticExecution: false });

export const EON_CITY_W697_VISUAL_IDENTITIES = freeze({
  'orientation-hall': profile({ fingerprint: 'gateway-guide-spires-learning-courts', buildingGrammar: 'authored-orientation', roofGrammar: 'guide-spire', stationGrammar: 'arrival-platform', gatewayGrammar: 'expanse-threshold', discoveryGrammar: 'atlas-and-guide', streetMarking: 'learning-axis', verticalBias: 0.9, transparencyBias: 0.35 }),
  'transit-network': profile({ fingerprint: 'layered-concourse-signal-bridges-platforms', buildingGrammar: 'concourse', roofGrammar: 'signal-bridge', stationGrammar: 'multi-platform', gatewayGrammar: 'route-gantry', discoveryGrammar: 'signal-totem', streetMarking: 'route-stripes', verticalBias: 0.65, transparencyBias: 0.2 }),
  'agent-theatre': profile({ fingerprint: 'amphitheatre-review-chambers-receipt-halo', buildingGrammar: 'amphitheatre', roofGrammar: 'review-halo', stationGrammar: 'review-dais', gatewayGrammar: 'receipt-arch', discoveryGrammar: 'receipt-prism', streetMarking: 'review-chevron', verticalBias: 0.75, transparencyBias: 0.28 }),
  'creator-atrium': profile({ fingerprint: 'stepped-glass-terraces-capture-sails-ribbons', buildingGrammar: 'terrace', roofGrammar: 'capture-sail', stationGrammar: 'creator-ribbon', gatewayGrammar: 'media-frame', discoveryGrammar: 'holographic-gallery', streetMarking: 'creative-ribbon', verticalBias: 0.82, transparencyBias: 0.55 }),
  'forge-basilica': profile({ fingerprint: 'industrial-cathedral-buttresses-cranes-heat-bays', buildingGrammar: 'cathedral', roofGrammar: 'crane-and-vent', stationGrammar: 'foundry-platform', gatewayGrammar: 'heat-arch', discoveryGrammar: 'forge-anvil', streetMarking: 'hazard-lane', verticalBias: 1.15, transparencyBias: 0.12 }),
  'command-centre': profile({ fingerprint: 'stepped-citadel-command-table-horizon-arrays', buildingGrammar: 'citadel', roofGrammar: 'array-crown', stationGrammar: 'command-deck', gatewayGrammar: 'citadel-portal', discoveryGrammar: 'operations-table', streetMarking: 'command-grid', verticalBias: 1.05, transparencyBias: 0.18 }),
  'archive-canopy': profile({ fingerprint: 'canopy-towers-index-bridges-research-gardens', buildingGrammar: 'canopy', roofGrammar: 'branch-canopy', stationGrammar: 'library-bridge', gatewayGrammar: 'index-arch', discoveryGrammar: 'knowledge-tree', streetMarking: 'index-path', verticalBias: 0.92, transparencyBias: 0.42 }),
  'vault-station': profile({ fingerprint: 'guarded-vault-blocks-recovery-arches-key-sentinels', buildingGrammar: 'vault', roofGrammar: 'guarded-crown', stationGrammar: 'custody-platform', gatewayGrammar: 'recovery-vault', discoveryGrammar: 'key-monolith', streetMarking: 'custody-line', verticalBias: 0.88, transparencyBias: 0.1 }),
  'trade-dome': profile({ fingerprint: 'civic-domes-membership-commons-key-light-arcades', buildingGrammar: 'civic-dome', roofGrammar: 'dome-and-arcade', stationGrammar: 'commons-ring', gatewayGrammar: 'membership-arcade', discoveryGrammar: 'eonkey-gallery', streetMarking: 'civic-radial', verticalBias: 0.72, transparencyBias: 0.3 })
});

export function getEonCityW697DistrictVisualIdentity(districtId = '') {
  return EON_CITY_W697_VISUAL_IDENTITIES[String(districtId || '').trim().toLowerCase()] || null;
}

export function buildEonCityW697BuildingVariant(districtId = '', index = 0) {
  const identity = getEonCityW697DistrictVisualIdentity(districtId);
  if (!identity) return null;
  const i = Math.max(0, Number(index) || 0);
  return freeze({
    districtId: String(districtId),
    grammar: identity.buildingGrammar,
    roofGrammar: identity.roofGrammar,
    heightScale: Number((identity.verticalBias * (0.88 + (i % 4) * 0.12)).toFixed(3)),
    widthScale: Number((0.9 + (i % 3) * 0.12).toFixed(3)),
    depthScale: Number((0.92 + ((i + 1) % 3) * 0.1).toFixed(3)),
    rotationStep: Number((((i % 4) - 1.5) * 0.09).toFixed(3)),
    transparencyBias: identity.transparencyBias,
    fingerprint: identity.fingerprint
  });
}

export function validateEonCityW697DistrictVisualIdentities(entries = EON_CITY_W697_VISUAL_IDENTITIES) {
  const errors = [];
  const required = ['orientation-hall','transit-network','agent-theatre','creator-atrium','forge-basilica','command-centre','archive-canopy','vault-station','trade-dome'];
  for (const id of required) {
    const entry = entries?.[id];
    if (!entry) { errors.push(`missing:${id}`); continue; }
    for (const key of ['fingerprint','buildingGrammar','roofGrammar','stationGrammar','gatewayGrammar','discoveryGrammar','streetMarking']) if (!entry[key]) errors.push(`${id}:${key}`);
    if (entry.automaticNavigation || entry.automaticExecution) errors.push(`unsafe:${id}`);
  }
  const fingerprints = required.map((id) => entries?.[id]?.fingerprint).filter(Boolean);
  const buildingGrammars = required.map((id) => entries?.[id]?.buildingGrammar).filter(Boolean);
  if (new Set(fingerprints).size !== 9) errors.push('fingerprints-not-unique');
  if (new Set(buildingGrammars).size < 8) errors.push('building-grammars-too-repetitive');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), identityCount: fingerprints.length, uniqueFingerprints: new Set(fingerprints).size, uniqueBuildingGrammars: new Set(buildingGrammars).size });
}

export function getEonCityW697DistrictVisualIdentityTruth() {
  return freeze({ schema: EON_CITY_W697_DISTRICT_VISUAL_IDENTITY_SCHEMA, nineUniqueFingerprints: true, reusableRendererWithDistrictAdapters: true, functionalArchitectureDominatesDecoration: true, genericRingsSubordinate: true, stableDistrictIds: true, oneCanonicalScene: true, automaticNavigation: false, automaticExecution: false });
}

export default freeze({ EON_CITY_W697_DISTRICT_VISUAL_IDENTITY_SCHEMA, EON_CITY_W697_VISUAL_IDENTITIES, getEonCityW697DistrictVisualIdentity, buildEonCityW697BuildingVariant, validateEonCityW697DistrictVisualIdentities, getEonCityW697DistrictVisualIdentityTruth });
