const freeze = (value) => Object.freeze(value);
const deepFreeze = (entries) => freeze(entries.map((entry) => freeze({
  ...entry,
  terminalOffset: freeze({ ...entry.terminalOffset }),
  npcRoute: freeze({ ...entry.npcRoute }),
  interactions: freeze([...(entry.interactions || [])]),
  lighting: freeze({ ...entry.lighting })
})));

export const EON_CITY_W744_STATION_COMPLETION_SCHEMA = 'eon.city.station-completion.w744.v1';

// CEO authority: every launch destination is a purposeful micro-location, not
// a floating button. The structure establishes identity, the terminal exposes
// the real work surface, and the role NPC explains/uses the station. NPCs may
// take short local routes only; walk clips are never played while standing.
export const EON_CITY_W744_STATION_BLUEPRINTS = deepFreeze([
  {
    id: 'eonbot-nexus', structureAssetId: 'eoncity-genesis-core', terminalAssetId: 'eoncity-nav-info-kiosk', npcAlias: 'eonbot',
    terminalOffset: { x: -1.55, y: 0, z: 1.15 }, portalMode: 'none', floorCircuit: 'core', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: false, radius: 0, speed: 0, dwellMs: 0, terminalDwellMs: 0 }, lighting: { beacons: 4, warmth: 'balanced' }
  },
  {
    id: 'create-forge', structureAssetId: 'eoncity-forge-basilica', terminalAssetId: 'eoncity-forge-workbench', npcAlias: 'device-lab-specialist',
    terminalOffset: { x: -0.15, y: 0, z: 1.5 }, portalMode: 'threshold', floorCircuit: 'forge', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.25, speed: 0.62, dwellMs: 4200, terminalDwellMs: 5200 }, lighting: { beacons: 3, warmth: 'warm' }
  },
  {
    id: 'project-atlas', structureAssetId: 'eoncity-holo-map-beacon', terminalAssetId: 'eoncity-nav-info-kiosk', npcAlias: 'archive-guide',
    terminalOffset: { x: 0.1, y: 0, z: 1.42 }, portalMode: 'threshold', floorCircuit: 'atlas', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.15, speed: 0.58, dwellMs: 4800, terminalDwellMs: 4600 }, lighting: { beacons: 3, warmth: 'cool' }
  },
  {
    id: 'library-vault', structureAssetId: 'eoncity-navigator-arc', terminalAssetId: 'eoncity-district-info', npcAlias: 'vault-steward',
    terminalOffset: { x: 0.05, y: 0, z: 1.38 }, portalMode: 'vault-seal', floorCircuit: 'vault', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.05, speed: 0.52, dwellMs: 5200, terminalDwellMs: 5600 }, lighting: { beacons: 3, warmth: 'mint' }
  },
  {
    id: 'share-capture', structureAssetId: 'eoncity-district-hologram', terminalAssetId: 'eoncity-market-trade-terminal', npcAlias: 'citizen-variant',
    terminalOffset: { x: -0.05, y: 0, z: 1.5 }, portalMode: 'signal-frame', floorCircuit: 'share', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.2, speed: 0.6, dwellMs: 4600, terminalDwellMs: 5200 }, lighting: { beacons: 4, warmth: 'signal' }
  },
  {
    id: 'command-console', structureAssetId: 'eoncity-holo-interface-landmark', terminalAssetId: 'eoncity-nav-info-kiosk', npcAlias: 'security-sentinel',
    terminalOffset: { x: 0, y: 0, z: 1.45 }, portalMode: 'command-arch', floorCircuit: 'status', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.1, speed: 0.5, dwellMs: 5600, terminalDwellMs: 6000 }, lighting: { beacons: 4, warmth: 'neutral' }
  },
  {
    id: 'automation-theatre', structureAssetId: 'eoncity-holo-interface-landmark', terminalAssetId: 'eoncity-district-info', npcAlias: 'holo-operator',
    terminalOffset: { x: 0.15, y: 0, z: 1.38 }, portalMode: 'theatre-gate', floorCircuit: 'automation', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.35, speed: 0.64, dwellMs: 4000, terminalDwellMs: 4800 }, lighting: { beacons: 4, warmth: 'amber' }
  },
  {
    id: 'local-ai-lab', structureAssetId: 'eoncity-ai-tower-core', terminalAssetId: 'eoncity-market-trade-terminal', npcAlias: 'forge-worker',
    terminalOffset: { x: 0, y: 0, z: 1.5 }, portalMode: 'lab-airlock', floorCircuit: 'local-ai', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.25, speed: 0.58, dwellMs: 4400, terminalDwellMs: 6200 }, lighting: { beacons: 4, warmth: 'cool' }
  },
  {
    id: 'my-realm-portal', structureAssetId: 'eoncity-portal-gate', terminalAssetId: 'eoncity-district-info', npcAlias: 'creator-host',
    terminalOffset: { x: 1.35, y: 0, z: 0.35 }, portalMode: 'real-portal', floorCircuit: 'realm', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.1, speed: 0.5, dwellMs: 5200, terminalDwellMs: 5400 }, lighting: { beacons: 4, warmth: 'violet' }
  },
  {
    id: 'plans-access', structureAssetId: 'eoncity-trade-dome-entrance', terminalAssetId: 'eoncity-market-trade-terminal', npcAlias: 'trade-steward',
    terminalOffset: { x: 0, y: 0, z: 1.42 }, portalMode: 'access-threshold', floorCircuit: 'access', interactions: ['structure', 'terminal', 'npc'],
    npcRoute: { enabled: true, radius: 1.05, speed: 0.5, dwellMs: 5600, terminalDwellMs: 5600 }, lighting: { beacons: 3, warmth: 'warm' }
  }
]);

const byId = new Map(EON_CITY_W744_STATION_BLUEPRINTS.map((entry) => [entry.id, entry]));

export function getEonCityW744StationBlueprint(id = '') {
  return byId.get(String(id || '').trim()) || null;
}

export function validateEonCityW744StationCompletion({ stations = [], launchManifest = null } = {}) {
  const errors = [];
  const stationIds = new Set((stations || []).map((station) => station.id));
  if (EON_CITY_W744_STATION_BLUEPRINTS.length !== 10) errors.push('blueprint-count');
  for (const blueprint of EON_CITY_W744_STATION_BLUEPRINTS) {
    if (!stationIds.has(blueprint.id)) errors.push(`station-missing:${blueprint.id}`);
    if (!blueprint.structureAssetId || !blueprint.terminalAssetId) errors.push(`asset-assignment:${blueprint.id}`);
    if (!blueprint.npcAlias) errors.push(`npc-assignment:${blueprint.id}`);
    if (!['structure', 'terminal', 'npc'].every((part) => blueprint.interactions.includes(part))) errors.push(`interaction-triad:${blueprint.id}`);
    if (blueprint.npcRoute.enabled && (!(blueprint.npcRoute.radius > 0) || !(blueprint.npcRoute.speed > 0))) errors.push(`npc-route:${blueprint.id}`);
    if (!Number.isInteger(blueprint.lighting.beacons) || blueprint.lighting.beacons < 2) errors.push(`lighting:${blueprint.id}`);
  }
  const manifestRoles = new Map((launchManifest?.roleCharacters || []).map((entry) => [entry.stationId, entry.alias]));
  const manifestStructures = new Map((launchManifest?.stationWorld || []).map((entry) => [entry.stationId, entry.sourceId]));
  const manifestTerminals = new Map((launchManifest?.stationProps || []).map((entry) => [entry.stationId, entry.sourceId]));
  const nexusCore = (launchManifest?.coreWorld || []).find((entry) => entry.alias === 'living-nexus-core');
  const nexusCharacter = (launchManifest?.coreLazy || []).find((entry) => entry.alias === 'eonbot');
  if (nexusCore) manifestStructures.set('eonbot-nexus', nexusCore.sourceId);
  if (nexusCharacter) manifestRoles.set('eonbot-nexus', nexusCharacter.alias);
  if (launchManifest) {
    for (const blueprint of EON_CITY_W744_STATION_BLUEPRINTS) {
      if (manifestStructures.get(blueprint.id) !== blueprint.structureAssetId) errors.push(`manifest-structure:${blueprint.id}`);
      if (manifestTerminals.get(blueprint.id) !== blueprint.terminalAssetId) errors.push(`manifest-terminal:${blueprint.id}`);
      if (manifestRoles.get(blueprint.id) !== blueprint.npcAlias) errors.push(`manifest-role:${blueprint.id}`);
    }
  }
  if (manifestRoles.get('command-console') === 'architect') errors.push('rejected-command-status-architect');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), stationCount: stationIds.size, blueprintCount: EON_CITY_W744_STATION_BLUEPRINTS.length });
}
