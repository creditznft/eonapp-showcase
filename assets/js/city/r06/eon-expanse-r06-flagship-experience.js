import { EON_EXPANSE_W766_ROUTE_SEGMENTS, EON_EXPANSE_W766_ZONES } from '../w766/eon-expanse-w766-region-contract.js';

const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_R06_FLAGSHIP_SCHEMA = 'eon.city.expanse.flagship-experience.r06.v1';

export const EON_EXPANSE_R06_ZONE_IDENTITIES = freeze({
  'gateway-overlook': freeze({
    shortLabel: 'Gateway',
    symbol: 'GATE',
    role: 'safe-arrival',
    landmark: 'Return Gateway + Atlas',
    promise: 'Orient, learn the controls and see the frontier before committing to a route.',
    atmosphere: 'panoramic-safe-zone'
  }),
  'beacon-fields': freeze({
    shortLabel: 'Beacons',
    symbol: 'B1',
    role: 'first-restoration',
    landmark: 'Beacon One',
    promise: 'Follow broken circuit paths through a damaged signal field and restore the first beacon.',
    atmosphere: 'open-signal-field'
  }),
  'archive-ruins': freeze({
    shortLabel: 'Archive',
    symbol: 'ARC',
    role: 'ruin-puzzle',
    landmark: 'Navigator Arc',
    promise: 'Search layered technological ruins, recover records and repair the second signal.',
    atmosphere: 'dense-technological-ruins'
  }),
  'transit-scar': freeze({
    shortLabel: 'Transit',
    symbol: 'RAIL',
    role: 'mobility-restoration',
    landmark: 'Broken Transit Relay',
    promise: 'Cross the damaged rail corridor, restore the relay and bring fast travel online.',
    atmosphere: 'broken-rail-trench'
  }),
  'horizon-vault': freeze({
    shortLabel: 'Vault',
    symbol: 'VAULT',
    role: 'regional-finale',
    landmark: 'Horizon Vault',
    promise: 'Reconnect the regional core, open the Vault route and complete the first restoration arc.',
    atmosphere: 'monumental-vault-approach'
  })
});

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function atlasBounds(zones = EON_EXPANSE_W766_ZONES) {
  const xs = zones.map((zone) => finite(zone.x));
  const zs = zones.map((zone) => finite(zone.z));
  const padding = 20;
  return freeze({
    minX: Math.min(...xs) - padding,
    maxX: Math.max(...xs) + padding,
    minZ: Math.min(...zs) - padding,
    maxZ: Math.max(...zs) + padding
  });
}

function atlasPoint(position = {}, bounds = atlasBounds()) {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const depth = Math.max(1, bounds.maxZ - bounds.minZ);
  const x = ((finite(position.x) - bounds.minX) / width) * 100;
  // World -Z is visually "north" in Signal Frontier, so invert it for the atlas.
  const y = 100 - (((finite(position.z) - bounds.minZ) / depth) * 100);
  return freeze({ xPct: Math.max(4, Math.min(96, x)), yPct: Math.max(4, Math.min(96, y)) });
}

export function buildEonExpanseR06WorldAtlas(map = {}) {
  const sourceZones = Array.isArray(map?.zones) && map.zones.length ? map.zones : EON_EXPANSE_W766_ZONES.map((zone) => ({
    id: zone.id,
    label: zone.label,
    position: { x: zone.x, z: zone.z },
    discovered: zone.id === 'gateway-overlook',
    transitUnlocked: zone.id === 'gateway-overlook',
    current: zone.id === 'gateway-overlook',
    truthfulStatus: zone.status
  }));
  const bounds = atlasBounds(EON_EXPANSE_W766_ZONES);
  const nodes = freeze(sourceZones.map((zone) => {
    const identity = EON_EXPANSE_R06_ZONE_IDENTITIES[zone.id] || freeze({ shortLabel: zone.label || zone.id, symbol: 'SIG', role: 'frontier-zone', landmark: zone.label || zone.id, promise: '', atmosphere: 'frontier' });
    return freeze({
      id: zone.id,
      label: zone.label || zone.id,
      truthfulLabel: zone.discovered === false ? 'Undiscovered Signal' : zone.label || zone.id,
      ...identity,
      ...atlasPoint(zone.position || zone, bounds),
      discovered: zone.discovered !== false,
      transitUnlocked: zone.transitUnlocked === true,
      current: zone.current === true,
      marker: zone.current ? 'PLAYER' : zone.transitUnlocked ? 'TRANSIT' : zone.discovered ? 'DISCOVERED' : 'UNKNOWN'
    });
  }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const routes = freeze(EON_EXPANSE_W766_ROUTE_SEGMENTS.map((route, index) => {
    const from = nodeById.get(route.fromZoneId);
    const to = nodeById.get(route.toZoneId);
    return freeze({
      id: route.id,
      order: index + 1,
      fromZoneId: route.fromZoneId,
      toZoneId: route.toZoneId,
      from: freeze({ xPct: from?.xPct ?? 0, yPct: from?.yPct ?? 0 }),
      to: freeze({ xPct: to?.xPct ?? 0, yPct: to?.yPct ?? 0 }),
      discovered: Boolean(from?.discovered && to?.discovered),
      transitReady: Boolean(from?.transitUnlocked && to?.transitUnlocked)
    });
  }));
  return freeze({
    schema: EON_EXPANSE_R06_FLAGSHIP_SCHEMA,
    title: 'Signal Frontier Atlas',
    subtitle: 'Five authored zones · one restoration route · Transit unlocks as the network returns',
    bounds,
    nodes,
    routes,
    currentZoneId: String(map?.currentZone || nodes.find((node) => node.current)?.id || 'gateway-overlook'),
    returnAnchor: freeze({ label: 'Command Hub', zoneId: 'gateway-overlook' }),
    futurePointers: freeze([
      freeze({ id: 'storm-sector', label: 'Storm Sector', status: 'certification-gated', direction: 'north-east' }),
      freeze({ id: 'my-frontier', label: 'My Frontier', status: 'early-progression-unlock', direction: 'west' })
    ]),
    spatialMap: true,
    listOnlyMap: false
  });
}

export function deriveEonExpanseR06FirstMinuteGuide({
  companion = {},
  guidance = {},
  mapOpened = false
} = {}) {
  const target = String(companion?.nextAction || guidance?.objective || guidance?.label || '').trim();
  if (mapOpened) {
    return freeze({
      schema: EON_EXPANSE_R06_FLAGSHIP_SCHEMA,
      stepId: 'follow-first-objective',
      title: 'Follow the illuminated route',
      detail: 'The Atlas is ready. Follow the gold circuit path to the active signal and interact when it begins to glow.',
      shortcut: 'WASD / arrows move · Shift sprint · E / click / tap interact · M Atlas'
    });
  }
  if (companion?.bonded) {
    return freeze({
      schema: EON_EXPANSE_R06_FLAGSHIP_SCHEMA,
      stepId: 'open-atlas',
      title: 'Restore the first Signal',
      detail: 'EONBOT is online. Open the Atlas once, then follow the highlighted route toward Beacon Fields.',
      shortcut: 'WASD / arrows move · E / click / tap interact · M Atlas'
    });
  }
  return freeze({
    schema: EON_EXPANSE_R06_FLAGSHIP_SCHEMA,
    stepId: target ? 'restore-first-signal' : 'orient',
    title: 'Restore the first Signal',
    detail: 'You are at Gateway Overlook. Follow the gold circuit toward the pulsing relay; interactive objects glow when you are close.',
    shortcut: 'WASD / arrows move · E / click / tap interact · M Atlas'
  });
}

export default freeze({
  EON_EXPANSE_R06_FLAGSHIP_SCHEMA,
  EON_EXPANSE_R06_ZONE_IDENTITIES,
  buildEonExpanseR06WorldAtlas,
  deriveEonExpanseR06FirstMinuteGuide
});
