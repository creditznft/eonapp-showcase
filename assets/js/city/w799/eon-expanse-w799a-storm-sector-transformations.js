/** W799A — mission-ledger-derived Storm Sector world transformations. */
import { EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS } from '../w792/eon-expanse-w792b-storm-sector-layout.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS, sanitizeEonExpanseW795AStormMissionState } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W799A_STORM_TRANSFORMATION_SCHEMA = 'eon.expanse.storm-sector.transformations.w799a.v1';
const LABELS = freeze({
  'weather-restoration': freeze(['Charged weather array offline', 'Weather array under review', 'Atmospheric channels calibrating', 'Weather profile stabilized']),
  'relay-repair': freeze(['Storm relay offline', 'Relay console under review', 'Relay node aligning', 'Storm relay reconnected']),
  'storm-rescue': freeze(['Rescue signal lost', 'Rescue transmission detected', 'Signal bearings triangulating', 'Storm worker recovered'])
});
const COLORS = freeze({
  'weather-restoration': freeze({ damaged: '#9B55FF', active: '#45D7FF', restored: '#B8FFD8' }),
  'relay-repair': freeze({ damaged: '#FF774A', active: '#FFD46A', restored: '#55F4FF' }),
  'storm-rescue': freeze({ damaged: '#A66BFF', active: '#FFCB68', restored: '#D7FF9A' })
});
const anchorByFamily = new Map(EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS.map((entry) => [entry.familyId, entry]));

export function deriveEonExpanseW799AStormTransformations(missionState = null) {
  const state = sanitizeEonExpanseW795AStormMissionState(missionState);
  const rows = EON_EXPANSE_W795A_STORM_MISSIONS.map((mission) => {
    const completedObjectives = mission.objectives.filter((objective) => state.completedObjectiveActions.includes(objective.action)).length;
    const stage = completedObjectives === mission.objectives.length ? 'restored' : completedObjectives > 0 ? 'active' : 'damaged';
    const anchor = anchorByFamily.get(mission.id);
    return freeze({
      familyId: mission.id,
      label: mission.label,
      zoneId: mission.zoneId,
      anchorId: anchor?.id || '',
      position: anchor?.position || freeze({ x: 0, y: 0, z: 0 }),
      completedObjectives,
      totalObjectives: mission.objectives.length,
      stage,
      stageLabel: LABELS[mission.id]?.[completedObjectives] || mission.label,
      color: COLORS[mission.id]?.[stage] || '#45D7FF',
      intensity: stage === 'restored' ? 1 : stage === 'active' ? 0.62 : 0.22,
      visible: true,
      interactive: false,
      grantsXp: false,
      automaticProgression: false
    });
  });
  return freeze({
    schema: EON_EXPANSE_W799A_STORM_TRANSFORMATION_SCHEMA,
    regionId: 'storm-sector',
    rows: freeze(rows),
    damagedCount: rows.filter((entry) => entry.stage === 'damaged').length,
    activeCount: rows.filter((entry) => entry.stage === 'active').length,
    restoredCount: rows.filter((entry) => entry.stage === 'restored').length,
    totalCount: rows.length,
    regionRestored: rows.every((entry) => entry.stage === 'restored'),
    grantsXp: false,
    mutatesMissionState: false,
    automaticProgression: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W799A_STORM_TRANSFORMATION_SCHEMA, deriveEonExpanseW799AStormTransformations });
