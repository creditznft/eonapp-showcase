/** RT91 Signal — authored semantic cells for deterministic repeatable contracts. */
import { EON_EXPANSE_W766_ZONES } from '../../w766/eon-expanse-w766-region-contract.js';
import { EON_CITY_RT91_ACTIVITY_CELL_SCHEMA, createEonCityRt91ActivityCell } from '../eon-city-rt91-world-cell-activity.js';

export const EON_CITY_RT91_SIGNAL_CONTRACT_CELLS_SCHEMA = 'eon.city.signal.contract-cells.rt91.v1';
const freeze = Object.freeze;
const ROLE_SET = new Set(['relay', 'beacon', 'maintenance', 'route', 'archive', 'ruin', 'memory', 'research', 'transit', 'junction', 'public', 'shelter']);
const offsets = freeze([
  freeze({ dx: 0.22, dz: -0.18 }), freeze({ dx: -0.31, dz: 0.12 }), freeze({ dx: 0.08, dz: 0.34 }), freeze({ dx: 0.36, dz: 0.22 })
]);
const rolesByZone = freeze({
  'gateway-overlook': freeze([['public', 'route'], ['relay', 'maintenance'], ['route', 'shelter'], ['public', 'maintenance']]),
  'beacon-fields': freeze([['beacon', 'relay'], ['maintenance', 'route'], ['beacon', 'public'], ['relay', 'maintenance']]),
  'archive-ruins': freeze([['archive', 'memory'], ['ruin', 'research'], ['archive', 'public'], ['memory', 'research']]),
  'transit-scar': freeze([['transit', 'junction'], ['maintenance', 'route'], ['transit', 'public'], ['route', 'shelter']]),
  'horizon-vault': freeze([['public', 'route'], ['research', 'memory'], ['relay', 'public'], ['route', 'shelter']])
});

export function buildEonCityRt91SignalContractCells() {
  const cells = [];
  for (const zone of EON_EXPANSE_W766_ZONES) {
    const rows = rolesByZone[zone.id] || [];
    rows.forEach((roles, index) => {
      const offset = offsets[index % offsets.length];
      const cell = createEonCityRt91ActivityCell({
        worldId: 'signal-frontier',
        cellId: `signal-${zone.id}-cell-${index + 1}`,
        zoneId: zone.id,
        regionId: zone.id,
        roles,
        position: { x: Number((zone.x + zone.radius * offset.dx).toFixed(2)), y: 0, z: Number((zone.z + zone.radius * offset.dz).toFixed(2)) },
        source: 'rt91-signal-authored-semantic-cell',
        interactive: true
      });
      cells.push(freeze({ ...cell, authoredAnchor: true, generatedRawCoordinate: false, interactionRequiresRegistry: true, supportsMissionPlacement: true }));
    });
  }
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_CONTRACT_CELLS_SCHEMA,
    cells: freeze(cells),
    cellCount: cells.length,
    worldId: 'signal-frontier',
    rawUserCoordinatesAccepted: false,
    deterministic: true,
    ownsGeometry: false,
    ownsNavigation: false
  });
}

export function validateEonCityRt91SignalContractCells(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_SIGNAL_CONTRACT_CELLS_SCHEMA || plan.worldId !== 'signal-frontier') errors.push('schema-world');
  if (plan.cellCount !== 20 || plan.cells?.length !== 20) errors.push('cell-count');
  const zoneCounts = new Map();
  const ids = new Set();
  for (const cell of plan.cells || []) {
    if (cell.schema !== EON_CITY_RT91_ACTIVITY_CELL_SCHEMA || !cell.cellId || ids.has(cell.cellId)) errors.push(`id:${cell?.cellId || 'missing'}`);
    ids.add(cell.cellId);
    zoneCounts.set(cell.zoneId, (zoneCounts.get(cell.zoneId) || 0) + 1);
    if (!cell.roles?.length || cell.roles.some((role) => !ROLE_SET.has(role))) errors.push(`roles:${cell.cellId}`);
    if (![cell.position?.x, cell.position?.z].every(Number.isFinite)) errors.push(`position:${cell.cellId}`);
    if (cell.generatedRawCoordinate !== false || cell.interactionRequiresRegistry !== true || cell.supportsMissionPlacement !== true) errors.push(`boundary:${cell.cellId}`);
  }
  for (const zone of EON_EXPANSE_W766_ZONES) if (zoneCounts.get(zone.id) !== 4) errors.push(`zone-count:${zone.id}`);
  if (plan.rawUserCoordinatesAccepted || plan.ownsGeometry || plan.ownsNavigation) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), cellCount: plan.cells?.length || 0, zoneCount: zoneCounts.size });
}

export default freeze({ EON_CITY_RT91_SIGNAL_CONTRACT_CELLS_SCHEMA, buildEonCityRt91SignalContractCells, validateEonCityRt91SignalContractCells });
