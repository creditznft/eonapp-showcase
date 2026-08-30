/** W778A — persistent, non-interactive zone signals for canonically completed side missions. */
import { EON_EXPANSE_W766F_SIDE_MISSIONS } from '../w766/eon-expanse-w766f-living-content.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W778A_SIDE_TRANSFORMATION_SCHEMA = 'eon.expanse.side-mission-transformations.w778a.v1';

export const EON_EXPANSE_W778A_TRANSFORMATIONS = freeze([
  freeze({ missionId: 'signal-salvage', zoneId: 'beacon-fields', label: 'Salvage signal stabilized', family: 'signal', position: freeze({ x: -42, y: 0.18, z: -35 }) }),
  freeze({ missionId: 'lost-worker', zoneId: 'transit-scar', label: 'Worker route restored', family: 'rescue', position: freeze({ x: -13, y: 0.18, z: -94 }) }),
  freeze({ missionId: 'archive-sweep', zoneId: 'archive-ruins', label: 'Archive sweep indexed', family: 'archive', position: freeze({ x: 42, y: 0.18, z: -57 }) }),
  freeze({ missionId: 'transit-calibration', zoneId: 'transit-scar', label: 'Transit calibration verified', family: 'transit', position: freeze({ x: -5, y: 0.18, z: -102 }) }),
  freeze({ missionId: 'eonbot-curiosity-trail', zoneId: 'gateway-overlook', label: 'EONBOT curiosity trail mapped', family: 'companion', position: freeze({ x: 2, y: 0.18, z: -2 }) })
]);

const missionById = new Map(EON_EXPANSE_W766F_SIDE_MISSIONS.map((mission) => [mission.id, mission]));

export function deriveEonExpanseW778ASideMissionTransformations(livingContentState = {}) {
  const completed = new Set((livingContentState?.completedSideMissions || []).map(String));
  const counts = livingContentState?.sideCompletionCounts && typeof livingContentState.sideCompletionCounts === 'object'
    ? livingContentState.sideCompletionCounts
    : {};
  const rows = EON_EXPANSE_W778A_TRANSFORMATIONS.map((definition) => {
    const mission = missionById.get(definition.missionId);
    const completionCount = Math.max(completed.has(definition.missionId) ? 1 : 0, Math.max(0, Number(counts[definition.missionId] || 0)));
    return freeze({
      ...definition,
      active: completionCount > 0,
      completionCount,
      repeatable: mission?.repeatable === true,
      status: completionCount > 0 ? (mission?.repeatable ? 'verified-frontier-memory-active' : 'verified-restoration-active') : 'physical-side-mission-required',
      interactive: false,
      grantsXp: false
    });
  });
  return freeze({
    schema: EON_EXPANSE_W778A_SIDE_TRANSFORMATION_SCHEMA,
    rows: freeze(rows),
    activeCount: rows.filter((row) => row.active).length,
    total: rows.length,
    completionTotal: rows.reduce((sum, row) => sum + row.completionCount, 0),
    verifiedSideMissionStateOnly: true,
    mutatesMissionState: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW778ATransformationContract() {
  const errors = [];
  const ids = EON_EXPANSE_W778A_TRANSFORMATIONS.map((row) => row.missionId);
  if (ids.length !== 5 || new Set(ids).size !== 5) errors.push('five-unique-side-transformations-required');
  for (const row of EON_EXPANSE_W778A_TRANSFORMATIONS) {
    if (!missionById.has(row.missionId)) errors.push(`unknown-side-mission:${row.missionId}`);
    if (![row.position.x, row.position.y, row.position.z].every(Number.isFinite)) errors.push(`position-invalid:${row.missionId}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), total: ids.length, interactive: false, grantsXp: false });
}

export default freeze({ EON_EXPANSE_W778A_SIDE_TRANSFORMATION_SCHEMA, EON_EXPANSE_W778A_TRANSFORMATIONS, deriveEonExpanseW778ASideMissionTransformations, validateEonExpanseW778ATransformationContract });
