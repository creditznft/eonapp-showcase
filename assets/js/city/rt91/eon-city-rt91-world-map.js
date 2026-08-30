/** RT91 — unified read-only world map projection for the three flagship worlds. */
import { EON_EXPANSE_W766_ZONES, EON_EXPANSE_W766_TRANSIT_NODES } from '../w766/eon-expanse-w766-region-contract.js';
import { EON_EXPANSE_W792B_STORM_SECTOR_ZONES } from '../w792/eon-expanse-w792b-storm-sector-layout.js';
import { EON_EXPANSE_W768A_MY_FRONTIER_PLOTS } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';

export const EON_CITY_RT91_WORLD_MAP_SCHEMA = 'eon.city.world-map.rt91.v1';
const freeze = Object.freeze;

function marker({ id, label, worldId, x = 0, z = 0, kind = 'landmark', discovered = true, interactive = true, transit = false }) {
  return freeze({ id, label, worldId, x: Number(x), z: Number(z), kind, discovered, interactive, transit });
}

export function buildEonCityRt91WorldMap({ discoveredIds = [], activeObjective = null, districtLevels = {} } = {}) {
  const discovered = new Set((discoveredIds || []).map(String));
  const signal = EON_EXPANSE_W766_ZONES.map((zone) => marker({
    id: `signal:${zone.id}`,
    label: zone.label,
    worldId: 'signal-frontier',
    x: zone.x,
    z: zone.z,
    kind: 'zone',
    discovered: zone.id === 'gateway-overlook' || discovered.has(zone.id),
    transit: EON_EXPANSE_W766_TRANSIT_NODES.some((node) => node.id === zone.id)
  }));
  const storm = EON_EXPANSE_W792B_STORM_SECTOR_ZONES.map((entry) => marker({
    id: `storm:${entry.id}`,
    label: entry.label || entry.id,
    worldId: 'storm-sector',
    x: entry.center?.x,
    z: entry.center?.z,
    kind: 'zone',
    discovered: entry.id === 'charged-gateway' || discovered.has(entry.id),
    transit: entry.id === 'charged-gateway'
  }));
  const frontier = EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.map((plot) => marker({
    id: `my-frontier:${plot.id}`,
    label: plot.label,
    worldId: 'my-frontier',
    x: plot.position.x,
    z: plot.position.z,
    kind: 'district',
    discovered: true,
    transit: plot.district === 'transit'
  }));
  const objectiveMarker = activeObjective?.position && activeObjective?.worldId
    ? marker({ id: `objective:${activeObjective.id || activeObjective.action || 'active'}`, label: activeObjective.label || 'Active objective', worldId: activeObjective.worldId, x: activeObjective.position.x, z: activeObjective.position.z, kind: 'objective', discovered: true, interactive: false })
    : null;
  return freeze({
    schema: EON_CITY_RT91_WORLD_MAP_SCHEMA,
    worlds: freeze({
      'signal-frontier': freeze(signal),
      'storm-sector': freeze(storm),
      'my-frontier': freeze(frontier.map((entry) => freeze({ ...entry, districtLevel: Math.max(0, Math.min(4, Number(districtLevels?.[entry.id.split(':')[1]?.replace('plot-', '')] || 0))) })))
    }),
    activeObjectiveMarker: objectiveMarker,
    iconFloodingAvoided: true,
    undiscoveredMinorActivitiesHidden: true,
    readOnlyProjection: true,
    grantsProgression: false,
    createsNavigationPath: false
  });
}

export default freeze({ EON_CITY_RT91_WORLD_MAP_SCHEMA, buildEonCityRt91WorldMap });
