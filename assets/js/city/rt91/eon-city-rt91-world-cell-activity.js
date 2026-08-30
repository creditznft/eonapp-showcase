/** RT91 — semantic activity-cell adapter and deterministic objective placement. */
import { buildEonCityW667WorldCell, validateEonCityW667WorldCell } from '../w667/eon-city-w667-expanse-world-grammar.js';

export const EON_CITY_RT91_ACTIVITY_CELL_SCHEMA = 'eon.city.activity-cell.rt91.v1';
const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();
const frozen = (values = []) => freeze([...new Set(values.map(clean).filter(Boolean))]);

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'rt91')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createEonCityRt91ActivityCell({ worldId = '', cellId = '', zoneId = '', regionId = '', roles = [], position = {}, source = 'authored', interactive = true } = {}) {
  return freeze({
    schema: EON_CITY_RT91_ACTIVITY_CELL_SCHEMA,
    worldId: clean(worldId),
    cellId: clean(cellId),
    zoneId: clean(zoneId),
    regionId: clean(regionId),
    roles: frozen(roles),
    position: freeze({ x: Number(position?.x || 0), y: Number(position?.y || 0), z: Number(position?.z || 0) }),
    source: clean(source),
    interactive: interactive === true,
    rawCoordinateAuthority: false,
    grantsProgression: false
  });
}

function rolesFromW667Cell(cell = {}, worldId = 'my-frontier') {
  const text = `${cell.gameplayPurpose || ''} ${cell.activityLayer || ''} ${cell.publicSpaceProfile?.id || ''} ${cell.region?.archetype?.id || ''} ${cell.landmark?.role || ''}`.toLowerCase();
  const roles = ['public-space'];
  if (/transit|return-route|arrival|junction/.test(text)) roles.push('transit', 'route');
  if (/resident|rendezvous/.test(text)) roles.push('resident');
  if (/productive|creator|project/.test(text)) roles.push('productive-station', 'civic-support');
  if (/device|system|maintenance|forge/.test(text)) roles.push('maintenance', 'utility');
  if (/research|archive|memory/.test(text)) roles.push('research', 'archive');
  if (/signal|beacon/.test(text)) roles.push('beacon', 'relay');
  if (/exploration|checkpoint|orientation|landmark/.test(text)) roles.push('district-core', 'civic-support');

  if (worldId === 'storm-sector') {
    roles.push('industrial');
    const selector = hash32(`${cell.cellId}:storm-role`) % 5;
    roles.push(['safe-zone', 'grounding', 'relay', 'weather-array', 'rescue'][selector]);
    if (selector === 3) roles.push('stabilizer');
  }
  if (worldId === 'signal-frontier') {
    const selector = hash32(`${cell.cellId}:signal-role`) % 5;
    roles.push(['relay', 'beacon', 'maintenance', 'archive', 'route'][selector]);
    if (selector === 3) roles.push('ruin', 'memory');
    if (selector === 4) roles.push('junction');
  }
  if (worldId === 'my-frontier') roles.push('civic-support');
  return frozen(roles);
}

export function deriveEonCityRt91ActivityCellFromWorldGrammar({ worldId = 'my-frontier', x = 0, z = 0, seed = 'rt91-world' } = {}) {
  const cell = buildEonCityW667WorldCell({ x, z, seed });
  const validation = validateEonCityW667WorldCell(cell);
  if (!validation.ok) return null;
  return createEonCityRt91ActivityCell({
    worldId,
    cellId: cell.cellId,
    zoneId: cell.region?.archetype?.id || '',
    regionId: cell.region?.id || '',
    roles: rolesFromW667Cell(cell, clean(worldId)),
    position: { x: cell.x * 10, y: 0, z: cell.z * 10 },
    source: 'w667-deterministic-world-grammar',
    interactive: true
  });
}

export function placeEonCityRt91MissionObjectives({ missionId = '', objectives = [], candidateCells = [], seed = 'rt91-mission' } = {}) {
  const availableCells = (candidateCells || []).filter((cell) => cell?.schema === EON_CITY_RT91_ACTIVITY_CELL_SCHEMA && cell.interactive === true);
  const objectiveRows = (objectives || []).map((objective, index) => ({ objective, index, role: clean(objective?.cellRole) }));
  let solved = null;

  const search = (objectiveIndex, used, placements) => {
    if (objectiveIndex >= objectiveRows.length) {
      solved = placements;
      return true;
    }
    const row = objectiveRows[objectiveIndex];
    const eligible = availableCells
      .filter((cell) => cell.roles.includes(row.role) && !used.has(cell.cellId))
      .sort((a, b) => {
        const scoreA = hash32(`${seed}:${missionId}:${row.objective.action}:${a.cellId}:${row.index}`);
        const scoreB = hash32(`${seed}:${missionId}:${row.objective.action}:${b.cellId}:${row.index}`);
        return scoreA - scoreB || a.cellId.localeCompare(b.cellId);
      });
    for (const selected of eligible) {
      const nextUsed = new Set(used);
      nextUsed.add(selected.cellId);
      const placement = freeze({ objectiveId: clean(row.objective.id || row.objective.action), action: clean(row.objective.action), cellRole: row.role, cellId: selected.cellId, zoneId: selected.zoneId, regionId: selected.regionId, position: selected.position });
      if (search(objectiveIndex + 1, nextUsed, [...placements, placement])) return true;
    }
    return false;
  };

  if (!search(0, new Set(), [])) {
    const firstUnplaceable = objectiveRows.find((row) => !availableCells.some((cell) => cell.roles.includes(row.role)))?.role || objectiveRows[0]?.role || 'unknown';
    return freeze({ ok: false, reason: `no-valid-cell:${firstUnplaceable}`, placements: freeze([]) });
  }
  const placements = solved || [];
  return freeze({
    ok: true,
    schema: `${EON_CITY_RT91_ACTIVITY_CELL_SCHEMA}.placement.v1`,
    missionId: clean(missionId),
    placements: freeze(placements),
    allObjectivesPlaced: placements.length === objectiveRows.length,
    deterministic: true,
    usesUniqueCellsPerObjective: true,
    placementSearch: 'bounded-deterministic-backtracking',
    acceptsRawUserCoordinates: false
  });
}

export default freeze({ EON_CITY_RT91_ACTIVITY_CELL_SCHEMA, createEonCityRt91ActivityCell, deriveEonCityRt91ActivityCellFromWorldGrammar, placeEonCityRt91MissionObjectives });
