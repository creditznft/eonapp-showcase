/** RT91 — unified read-only mission board projection across authored and repeatable content. */
import { buildEonExpanseW766EMissionBoard } from '../w766/eon-expanse-w766e-mission-runtime.js';
import { deriveEonExpanseW795AStormMissionView } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { deriveEonCityRt91SignalMasteryView } from './signal/eon-city-rt91-signal-mastery-runtime.js';
import { deriveEonCityRt91StormCampaignView } from './storm/eon-city-rt91-storm-campaign-runtime.js';
import { deriveEonCityRt91MyFrontierDistrictMissionView } from './my-frontier/eon-city-rt91-my-frontier-district-mission-runtime.js';

export const EON_CITY_RT91_MISSION_BOARD_SCHEMA = 'eon.city.unified-mission-board.rt91.v1';
const freeze = Object.freeze;

export function buildEonCityRt91MissionBoard({ signalState = null, signalMasteryState = null, stormState = null, stormCampaignState = null, myFrontierState = null, myFrontierDistrictMissionState = null, generatedContracts = [], productiveMissions = [] } = {}) {
  const signal = buildEonExpanseW766EMissionBoard(signalState || undefined);
  const signalMastery = deriveEonCityRt91SignalMasteryView({ state: signalMasteryState || undefined, signalState });
  const storm = deriveEonExpanseW795AStormMissionView(stormState);
  const stormCampaign = deriveEonCityRt91StormCampaignView({ state: stormCampaignState || undefined, foundationState: stormState });
  const myFrontierDistrictMissions = deriveEonCityRt91MyFrontierDistrictMissionView({ state: myFrontierDistrictMissionState || undefined, myFrontierState });
  const contractRows = (generatedContracts || []).filter((entry) => entry?.ok === true).map((entry) => freeze({
    id: entry.template.id,
    worldId: entry.worldId,
    familyId: entry.familyId,
    label: entry.template.label,
    objectiveCount: entry.template.objectives.length,
    kind: 'repeatable-contract',
    status: String(entry.status || 'available'),
    activeObjective: entry.activeObjective || null,
    grantsProgressionAutomatically: false
  }));
  const productiveRows = (productiveMissions || []).map((entry) => freeze({
    id: String(entry?.id || ''),
    label: String(entry?.label || entry?.id || ''),
    worldId: String(entry?.worldId || 'my-frontier'),
    kind: 'productive',
    receiptRequired: true,
    privateContentStored: false
  })).filter((entry) => entry.id);
  const signalRows = [
    ...(signal.activeMission ? [freeze({ id: signal.activeMission.id, label: signal.activeMission.label, worldId: 'signal-frontier', kind: 'authored-story', status: 'active', guidance: signal.activeMission.guidance })] : []),
    ...signal.availableMissions.map((entry) => freeze({ ...entry, worldId: 'signal-frontier', kind: 'authored-story', status: 'available' })),
    ...signalMastery.missions.filter((entry) => entry.active || entry.available).map((entry) => freeze({ id: entry.id, label: entry.label, worldId: 'signal-frontier', zoneId: entry.zoneId, kind: 'zone-mastery', status: entry.status, activeObjective: entry.activeObjective }))
  ];
  const stormFoundationRows = storm.missions.filter((entry) => !entry.completed).map((entry) => freeze({ id: entry.id, label: entry.label, worldId: 'storm-sector', kind: 'storm-foundation', status: entry.active ? 'active' : 'available', activeObjective: entry.activeObjective }));
  const stormCampaignRows = storm.regionCompleted
    ? stormCampaign.missions.filter((entry) => entry.active || entry.available).map((entry) => freeze({ id: entry.id, label: entry.label, worldId: 'storm-sector', zoneId: entry.zoneId, act: entry.act, kind: 'storm-living-campaign', status: entry.status, activeObjective: entry.activeObjective }))
    : [];
  const stormRows = [...stormFoundationRows, ...stormCampaignRows];
  const myDistrictRows = myFrontierDistrictMissions.missions.filter((entry) => entry.active || entry.available).map((entry) => freeze({ id: entry.id, label: entry.label, worldId: 'my-frontier', districtId: entry.districtId, kind: 'district-story', status: entry.status, activeObjective: entry.activeObjective }));
  const myRows = myFrontierState?.unlocked === true
    ? freeze([{ id: 'my-frontier-build', label: 'Develop My Frontier', worldId: 'my-frontier', kind: 'build', status: 'available' }])
    : freeze([]);
  return freeze({
    schema: EON_CITY_RT91_MISSION_BOARD_SCHEMA,
    sections: freeze({
      story: freeze([...signalRows, ...stormRows, ...myDistrictRows]),
      contracts: freeze(contractRows),
      productive: freeze(productiveRows),
      build: myRows
    }),
    counts: freeze({ story: signalRows.length + stormRows.length + myDistrictRows.length, contracts: contractRows.length, productive: productiveRows.length, build: myRows.length }),
    projectionOnly: true,
    awardsXp: false,
    writesProgression: false,
    networkRequestCreated: false
  });
}

export default freeze({ EON_CITY_RT91_MISSION_BOARD_SCHEMA, buildEonCityRt91MissionBoard });
