/** W780A — authored future-region programme catalog. No region is unlocked or rendered here. */
const freeze = Object.freeze;

export const EON_EXPANSE_W780A_FUTURE_REGION_SCHEMA = 'eon.expanse.future-region-catalog.w780a.v1';

const region = ({ id, label, gatewayId, promise, architecture, environment, audio, missionFamilies, heroRequirements }) => freeze({
  id,
  label,
  gatewayId,
  promise,
  architecture: freeze([...architecture]),
  environment: freeze([...environment]),
  audio: freeze([...audio]),
  missionFamilies: freeze([...missionFamilies]),
  heroRequirements: freeze([...heroRequirements]),
  presentationState: 'locked-authored-programme',
  requiresSignalFrontierCertification: true,
  requiresAuthoredHeroAssets: true,
  requiresStreamingBudget: true,
  requiresMissionCertification: true,
  automaticUnlock: false,
  renderDevelopmentProxiesAsFinishedArt: false,
  rawPrimitiveHeroAllowed: false,
  publicReleaseReady: false
});

export const EON_EXPANSE_W780A_FUTURE_REGIONS = freeze([
  region({
    id: 'storm-sector', label: 'Storm Sector', gatewayId: 'future-gateway-storm-sector',
    promise: 'Navigate a charged industrial frontier where restored signal towers calm violent atmospheric systems.',
    architecture: ['storm-relay-kit', 'industrial-platform-kit', 'charged-transit-kit'],
    environment: ['electrical-storms', 'rain-sheets', 'charged-fog', 'signal-pylons'],
    audio: ['storm-distance', 'relay-hum', 'charged-wind'],
    missionFamilies: ['weather-restoration', 'relay-repair', 'storm-rescue'],
    heroRequirements: ['storm-command-spire', 'atmospheric-stabilizer', 'charged-transit-gate']
  }),
  region({
    id: 'glass-desert', label: 'Glass Desert', gatewayId: 'future-gateway-glass-desert',
    promise: 'Cross reflective dunes and recover buried creator signals from a fractured solar archive.',
    architecture: ['glass-ruin-kit', 'solar-canopy-kit', 'buried-archive-kit'],
    environment: ['glass-dunes', 'heat-haze', 'solar-reflections', 'crystal-winds'],
    audio: ['desert-wind', 'glass-chime', 'buried-signal'],
    missionFamilies: ['archive-excavation', 'solar-restoration', 'creator-expedition'],
    heroRequirements: ['solar-archive-crown', 'glass-observatory', 'dune-gateway']
  }),
  region({
    id: 'forge-wilds', label: 'Forge Wilds', gatewayId: 'future-gateway-forge-wilds',
    promise: 'Restore a living fabrication territory where engineered forests grow around ancient foundries.',
    architecture: ['forge-foundry-kit', 'living-metal-kit', 'wilds-bridge-kit'],
    environment: ['ember-forest', 'molten-canals', 'metallic-vines', 'forge-mist'],
    audio: ['forge-rhythm', 'wilds-canopy', 'molten-flow'],
    missionFamilies: ['fabrication-contract', 'wilds-rescue', 'foundry-restoration'],
    heroRequirements: ['living-foundry', 'forge-heart', 'wilds-transit-arch']
  }),
  region({
    id: 'silent-city', label: 'Silent City', gatewayId: 'future-gateway-silent-city',
    promise: 'Reawaken a monumental city whose residents and systems were frozen when its communication core failed.',
    architecture: ['silent-tower-kit', 'empty-boulevard-kit', 'civic-core-kit'],
    environment: ['still-fog', 'dark-windows', 'frozen-transit', 'echo-plazas'],
    audio: ['distant-echo', 'quiet-machinery', 'returning-city-tone'],
    missionFamilies: ['citizen-recovery', 'civic-reconnection', 'silent-archive'],
    heroRequirements: ['silent-civic-core', 'sleeping-transit-hub', 'city-awakening-beacon']
  }),
  region({
    id: 'oceanic-light', label: 'Oceanic Light', gatewayId: 'future-gateway-oceanic-light',
    promise: 'Build signal routes across luminous water platforms and restore a submerged knowledge network.',
    architecture: ['ocean-platform-kit', 'light-bridge-kit', 'submerged-archive-kit'],
    environment: ['luminous-water', 'sea-fog', 'floating-gardens', 'bioluminescent-routes'],
    audio: ['ocean-depth', 'light-chime', 'platform-wind'],
    missionFamilies: ['oceanic-routing', 'submerged-recovery', 'platform-construction'],
    heroRequirements: ['oceanic-command-platform', 'submerged-vault', 'lightway-gateway']
  }),
  region({
    id: 'time-meridian', label: 'Time Meridian', gatewayId: 'future-gateway-time-meridian',
    promise: 'Stabilize a fractured meridian where archived states of the frontier overlap without changing real history.',
    architecture: ['meridian-ring-kit', 'temporal-archive-kit', 'phase-bridge-kit'],
    environment: ['phase-fog', 'chronology-lines', 'echo-landscapes', 'clockwork-light'],
    audio: ['phase-pulse', 'clockwork-distance', 'meridian-resonance'],
    missionFamilies: ['timeline-recovery', 'archive-comparison', 'phase-stabilization'],
    heroRequirements: ['meridian-observatory', 'phase-anchor', 'chronology-gateway']
  }),
  region({
    id: 'archive-noir', label: 'Archive Noir', gatewayId: 'future-gateway-archive-noir',
    promise: 'Investigate a rain-soaked vertical archive where missing records hide behind layered signal shadows.',
    architecture: ['noir-tower-kit', 'vertical-archive-kit', 'rainwalk-kit'],
    environment: ['neon-rain', 'deep-shadow', 'holographic-records', 'vertical-fog'],
    audio: ['noir-rain', 'archive-static', 'low-city-hum'],
    missionFamilies: ['record-investigation', 'knowledge-recovery', 'signal-deduction'],
    heroRequirements: ['noir-archive-spire', 'memory-court', 'shadow-gateway']
  }),
  region({
    id: 'eonbot-temple', label: 'EONBOT Temple Territory', gatewayId: 'future-gateway-eonbot-temple',
    promise: 'Explore the origin territory of companion intelligence and deepen EONBOT guidance through reviewed discoveries.',
    architecture: ['companion-temple-kit', 'signal-garden-kit', 'memory-sanctum-kit'],
    environment: ['floating-sigils', 'companion-light', 'memory-gardens', 'quiet-clouds'],
    audio: ['companion-choir', 'memory-tone', 'temple-wind'],
    missionFamilies: ['companion-memory', 'guidance-trial', 'temple-restoration'],
    heroRequirements: ['eonbot-temple', 'companion-memory-core', 'signal-bond-gateway']
  })
]);

export function getEonExpanseW780AFutureRegion(id = '') {
  const key = String(id || '').trim().toLowerCase();
  return EON_EXPANSE_W780A_FUTURE_REGIONS.find((entry) => entry.id === key) || null;
}

export function validateEonExpanseW780AFutureRegionCatalog(regions = EON_EXPANSE_W780A_FUTURE_REGIONS) {
  const errors = [];
  if (!Array.isArray(regions) || regions.length !== 8) errors.push('region-count');
  const ids = new Set();
  const gateways = new Set();
  for (const entry of regions || []) {
    if (!entry?.id || ids.has(entry.id)) errors.push(`region-id:${entry?.id || 'missing'}`);
    if (!entry?.gatewayId || gateways.has(entry.gatewayId)) errors.push(`gateway-id:${entry?.gatewayId || 'missing'}`);
    if (!entry?.label || !entry?.promise) errors.push(`region-copy:${entry?.id || 'missing'}`);
    if ((entry?.architecture?.length || 0) < 3 || (entry?.heroRequirements?.length || 0) < 3) errors.push(`authored-kit:${entry?.id || 'missing'}`);
    if ((entry?.missionFamilies?.length || 0) < 3 || (entry?.audio?.length || 0) < 3 || (entry?.environment?.length || 0) < 3) errors.push(`identity:${entry?.id || 'missing'}`);
    if (entry?.automaticUnlock !== false || entry?.publicReleaseReady !== false) errors.push(`release-lock:${entry?.id || 'missing'}`);
    if (entry?.requiresAuthoredHeroAssets !== true || entry?.rawPrimitiveHeroAllowed !== false || entry?.renderDevelopmentProxiesAsFinishedArt !== false) errors.push(`art-policy:${entry?.id || 'missing'}`);
    ids.add(entry?.id);
    gateways.add(entry?.gatewayId);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), regionCount: regions?.length || 0 });
}

export default freeze({
  EON_EXPANSE_W780A_FUTURE_REGION_SCHEMA,
  EON_EXPANSE_W780A_FUTURE_REGIONS,
  getEonExpanseW780AFutureRegion,
  validateEonExpanseW780AFutureRegionCatalog
});
