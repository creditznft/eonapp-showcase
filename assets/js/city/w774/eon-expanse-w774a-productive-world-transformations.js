/** W774A — visible, non-interactive world transformations for verified productive missions. */
import { EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS } from '../w766/eon-expanse-w766f-living-content.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W774A_PRODUCTIVE_TRANSFORMATION_SCHEMA = 'eon.expanse.productive-world-transformations.w774a.v1';

export const EON_EXPANSE_W774A_TRANSFORMATIONS = freeze([
  freeze({ missionId: 'create-expedition', zoneId: 'gateway-overlook', label: 'Creator signal online', position: freeze({ x: -6.5, y: 0.16, z: 12 }), family: 'creator' }),
  freeze({ missionId: 'local-ai-survey', zoneId: 'beacon-fields', label: 'Private AI signal verified', position: freeze({ x: -32, y: 0.16, z: -24 }), family: 'ai' }),
  freeze({ missionId: 'automation-relay', zoneId: 'transit-scar', label: 'Automation relay operational', position: freeze({ x: -3, y: 0.16, z: -84 }), family: 'systems' }),
  freeze({ missionId: 'knowledge-recovery', zoneId: 'archive-ruins', label: 'Knowledge archive restored', position: freeze({ x: 47, y: 0.16, z: -40 }), family: 'knowledge' }),
  freeze({ missionId: 'status-review', zoneId: 'horizon-vault', label: 'Command diagnostics verified', position: freeze({ x: 9, y: 0.16, z: -126 }), family: 'status' })
]);

const missionIds = new Set(EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS.map((mission) => mission.id));

export function deriveEonExpanseW774AProductiveTransformations(livingContentState = {}) {
  const completed = new Set((livingContentState?.completedProductiveMissions || []).map(String));
  const rows = EON_EXPANSE_W774A_TRANSFORMATIONS.map((definition) => freeze({
    ...definition,
    active: completed.has(definition.missionId),
    status: completed.has(definition.missionId) ? 'verified-transformation-active' : 'verified-productive-result-required',
    interactive: false,
    grantsXp: false
  }));
  return freeze({
    schema: EON_EXPANSE_W774A_PRODUCTIVE_TRANSFORMATION_SCHEMA,
    rows: freeze(rows),
    activeCount: rows.filter((row) => row.active).length,
    total: rows.length,
    verifiedMissionIdsOnly: true,
    mutatesMissionState: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW774ATransformationContract() {
  const ids = EON_EXPANSE_W774A_TRANSFORMATIONS.map((entry) => entry.missionId);
  const errors = [];
  if (ids.length !== 5 || new Set(ids).size !== ids.length) errors.push('five-unique-transformations-required');
  for (const entry of EON_EXPANSE_W774A_TRANSFORMATIONS) {
    if (!missionIds.has(entry.missionId)) errors.push(`unknown-productive-mission:${entry.missionId}`);
    if (!Number.isFinite(entry.position.x) || !Number.isFinite(entry.position.y) || !Number.isFinite(entry.position.z)) errors.push(`position-invalid:${entry.missionId}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), transformationCount: ids.length, interactive: false, grantsXp: false });
}

export default freeze({ EON_EXPANSE_W774A_PRODUCTIVE_TRANSFORMATION_SCHEMA, EON_EXPANSE_W774A_TRANSFORMATIONS, deriveEonExpanseW774AProductiveTransformations, validateEonExpanseW774ATransformationContract });
