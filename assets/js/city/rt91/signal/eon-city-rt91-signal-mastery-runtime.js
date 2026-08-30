/** RT91 Signal — explicit, receipt-verified runtime for authored Zone Mastery missions. */
import { EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS } from './eon-city-rt91-signal-zone-mastery.js';

export const EON_CITY_RT91_SIGNAL_MASTERY_RUNTIME_SCHEMA = 'eon.city.signal.mastery-runtime.rt91.v1';
const freeze = Object.freeze;
const missionById = new Map(EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.map((mission) => [mission.id, mission]));
const masteryIds = new Set(missionById.keys());

function unique(values = []) { return freeze([...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))]); }

export function createEonCityRt91SignalMasteryInitialState(input = {}) {
  const completedMissionIds = unique(input.completedMissionIds).filter((id) => masteryIds.has(id));
  const activeMissionId = masteryIds.has(String(input.activeMissionId || '')) && !completedMissionIds.includes(String(input.activeMissionId || '')) ? String(input.activeMissionId) : '';
  const completedObjectives = {};
  for (const mission of EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS) {
    const valid = new Set(mission.objectives.map((objective) => objective.id));
    completedObjectives[mission.id] = unique(input.completedObjectives?.[mission.id]).filter((id) => valid.has(id));
  }
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_MASTERY_RUNTIME_SCHEMA,
    activeMissionId,
    completedMissionIds,
    completedObjectives: freeze(Object.fromEntries(Object.entries(completedObjectives).map(([key, value]) => [key, freeze(value)]))),
    processedReceiptIds: unique(input.processedReceiptIds),
    writesCampaignLedger: false,
    awardsXp: false
  });
}

function prerequisiteSatisfied(mission, state, signalState) {
  const prerequisite = mission.prerequisiteMissionId;
  if (masteryIds.has(prerequisite)) return state.completedMissionIds.includes(prerequisite);
  return Array.isArray(signalState?.completedMissions) && signalState.completedMissions.includes(prerequisite);
}

export function deriveEonCityRt91SignalMasteryView({ state = null, signalState = null } = {}) {
  const safe = createEonCityRt91SignalMasteryInitialState(state || {});
  const rows = EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.map((mission) => {
    const completed = safe.completedMissionIds.includes(mission.id);
    const active = safe.activeMissionId === mission.id && !completed;
    const available = !completed && !active && !safe.activeMissionId && prerequisiteSatisfied(mission, safe, signalState);
    const completedSet = new Set(safe.completedObjectives[mission.id] || []);
    const activeObjective = mission.objectives.find((objective) => !completedSet.has(objective.id)) || null;
    return freeze({
      id: mission.id,
      label: mission.label,
      zoneId: mission.zoneId,
      status: completed ? 'completed' : active ? 'active' : available ? 'available' : 'locked',
      active,
      available,
      completed,
      completedObjectiveCount: completedSet.size,
      objectiveCount: mission.objectives.length,
      activeObjective,
      transformationHint: mission.transformationHint
    });
  });
  return freeze({
    schema: `${EON_CITY_RT91_SIGNAL_MASTERY_RUNTIME_SCHEMA}.view.v1`,
    missions: freeze(rows),
    activeMission: rows.find((row) => row.active) || null,
    availableMissions: freeze(rows.filter((row) => row.available)),
    completedMissionCount: rows.filter((row) => row.completed).length,
    totalMissionCount: rows.length,
    allMasteryComplete: rows.every((row) => row.completed),
    projectionOnly: true
  });
}

export function createEonCityRt91SignalMasteryRuntime({ initial = {}, getSignalState = () => null, verifyObjectiveReceipt = null, onChange = null, onMissionComplete = null } = {}) {
  let state = createEonCityRt91SignalMasteryInitialState(initial);
  const commit = (next) => { state = createEonCityRt91SignalMasteryInitialState(next); onChange?.(state); return state; };

  const startMission = (missionId, { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const mission = missionById.get(String(missionId || ''));
    if (!mission) return freeze({ ok: false, reason: 'mission-not-found' });
    const view = deriveEonCityRt91SignalMasteryView({ state, signalState: getSignalState?.() });
    const row = view.missions.find((entry) => entry.id === mission.id);
    if (!row?.available) return freeze({ ok: false, reason: row?.completed ? 'mission-already-completed' : state.activeMissionId ? 'another-mastery-mission-active' : 'mission-prerequisite-not-satisfied' });
    commit({ ...state, activeMissionId: mission.id });
    return freeze({ ok: true, mission, status: 'active', activeObjective: mission.objectives[0] });
  };

  const completeObjective = (missionId, objectiveId, { explicitUserAction = false, receipt = null } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const mission = missionById.get(String(missionId || ''));
    if (!mission || state.activeMissionId !== mission.id) return freeze({ ok: false, reason: 'mission-not-active' });
    const completed = new Set(state.completedObjectives[mission.id] || []);
    const activeObjective = mission.objectives.find((objective) => !completed.has(objective.id));
    if (!activeObjective || activeObjective.id !== String(objectiveId || '')) return freeze({ ok: false, reason: 'objective-not-active' });
    if (typeof verifyObjectiveReceipt !== 'function') return freeze({ ok: false, reason: 'objective-receipt-authority-unavailable' });
    const verified = verifyObjectiveReceipt({ mission, objective: activeObjective, receipt });
    const receiptId = String(verified?.receipt?.id || '');
    if (!verified?.ok || !receiptId) return freeze({ ok: false, reason: verified?.reason || 'valid-objective-receipt-required' });
    if (state.processedReceiptIds.includes(receiptId)) return freeze({ ok: false, reason: 'objective-receipt-already-consumed' });
    completed.add(activeObjective.id);
    const missionComplete = completed.size === mission.objectives.length;
    const completedMissionIds = missionComplete ? unique([...state.completedMissionIds, mission.id]) : state.completedMissionIds;
    commit({
      ...state,
      activeMissionId: missionComplete ? '' : mission.id,
      completedMissionIds,
      completedObjectives: { ...state.completedObjectives, [mission.id]: [...completed] },
      processedReceiptIds: [...state.processedReceiptIds, receiptId]
    });
    const nextObjective = missionComplete ? null : mission.objectives.find((objective) => !completed.has(objective.id)) || null;
    if (missionComplete) onMissionComplete?.(freeze({ missionId: mission.id, zoneId: mission.zoneId, transformationHint: mission.transformationHint, receiptId, awardsXp: false }));
    return freeze({ ok: true, missionId: mission.id, objectiveId: activeObjective.id, receiptId, missionComplete, nextObjective, awardsXp: false, writesCampaignLedger: false });
  };

  return freeze({
    getState: () => state,
    getView: () => deriveEonCityRt91SignalMasteryView({ state, signalState: getSignalState?.() }),
    startMission,
    completeObjective,
    awardsXp: false,
    writesCampaignLedger: false
  });
}

export default freeze({ EON_CITY_RT91_SIGNAL_MASTERY_RUNTIME_SCHEMA, createEonCityRt91SignalMasteryInitialState, deriveEonCityRt91SignalMasteryView, createEonCityRt91SignalMasteryRuntime });
