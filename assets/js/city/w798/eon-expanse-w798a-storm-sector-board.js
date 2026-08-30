/** W798A — privacy-safe Storm Sector Mission Board projection. */
import { deriveEonExpanseW795AStormMissionView } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { deriveEonExpanseW797AStormTransitView } from '../w797/eon-expanse-w797a-storm-sector-transit.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W798A_STORM_BOARD_SCHEMA = 'eon.expanse.storm-sector.board.w798a.v1';

export function deriveEonExpanseW798AStormBoard({
  activeRegionId = 'signal-frontier',
  missionState = null,
  playerPosition = null,
  transitState = null,
  npcSummary = null,
  presentationSummary = null,
  journeyState = null
} = {}) {
  const active = activeRegionId === 'storm-sector';
  const missions = deriveEonExpanseW795AStormMissionView(missionState);
  const transit = deriveEonExpanseW797AStormTransitView({ missionState, currentPosition: playerPosition, journeyState: transitState });
  const missionRows = missions.missions.map((mission) => freeze({
    id: mission.id,
    label: mission.label,
    zoneId: mission.zoneId,
    progress: `${mission.completedObjectives}/${mission.totalObjectives}`,
    completed: mission.completed,
    active: mission.active,
    nextLabel: mission.activeObjective?.label || (mission.completed ? 'Complete' : 'Locked by mission order')
  }));
  const transitRows = transit.nodes.map((node) => freeze({
    id: node.id,
    label: node.label,
    unlocked: node.unlocked,
    nearby: node.nearby,
    status: node.unlocked ? (node.nearby ? 'Current area' : 'Available') : 'Locked',
    detail: node.unlocked ? 'Use the physical Transit symbol in Storm Sector.' : node.lockReason
  }));
  const nextObjective = missions.nextObjective;
  return freeze({
    schema: EON_EXPANSE_W798A_STORM_BOARD_SCHEMA,
    visible: active,
    active,
    title: 'STORM SECTOR MISSIONS',
    subtitle: `${missions.completedMissionCount}/${missions.totalMissionCount} mission families · ${missions.completedObjectiveCount}/${missions.totalObjectiveCount} objectives`,
    activeObjective: nextObjective ? freeze({
      missionId: nextObjective.missionId,
      missionLabel: nextObjective.missionLabel,
      objectiveId: nextObjective.id,
      label: nextObjective.label,
      detail: nextObjective.objective,
      zoneId: nextObjective.zoneId,
      action: nextObjective.action,
      completionAuthority: 'explicit-field-interaction'
    }) : null,
    complete: missions.regionCompleted,
    completionLabel: missions.regionCompleted ? 'Storm Sector mission chain complete' : '',
    missionRows: freeze(missionRows),
    transitRows: freeze(transitRows),
    unlockedTransitCount: transit.unlockedNodeCount,
    totalTransitCount: transit.totalNodeCount,
    presentedNpcCount: Math.max(0, Number(npcSummary?.presentedNpcCount || 0)),
    requestedNpcCount: Math.max(0, Number(npcSummary?.requestedNpcCount || 3)),
    authoredHeroCount: Math.max(0, Number(presentationSummary?.presentedHeroCount || 0)),
    returnAvailable: journeyState?.status !== 'departing' && journeyState?.status !== 'returning',
    regionJourneyStatus: String(journeyState?.status || 'idle'),
    grantsXp: false,
    mutatesMissionState: false,
    automaticTravel: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W798A_STORM_BOARD_SCHEMA, deriveEonExpanseW798AStormBoard });
