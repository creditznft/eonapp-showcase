/** W795A — ordered authored Storm Sector mission authority. */
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';

const freeze = Object.freeze;
const row = (id, label, action, objective) => freeze({ id, label, action, objective });
export const EON_EXPANSE_W795A_STORM_MISSION_SCHEMA = 'eon.expanse.storm-sector.missions.w795a.v1';
export const EON_EXPANSE_W795A_STORM_MISSIONS = freeze([
  freeze({
    id: 'weather-restoration', label: 'Calm the Charged Sky', zoneId: 'relay-basin',
    objectives: freeze([
      row('review-weather-array', 'Review the weather array', 'storm-weather-array-reviewed', 'Inspect the authored weather array and confirm its failure pattern.'),
      row('calibrate-weather-array', 'Calibrate the weather array', 'storm-weather-array-calibrated', 'Align the three bounded atmospheric channels.'),
      row('stabilize-weather-profile', 'Stabilize the weather profile', 'storm-weather-profile-stabilized', 'Commit the reviewed local stabilization profile.')
    ])
  }),
  freeze({
    id: 'relay-repair', label: 'Reconnect the Storm Relay', zoneId: 'stabilizer-ridge',
    objectives: freeze([
      row('review-relay-console', 'Review the relay console', 'storm-relay-console-reviewed', 'Inspect the relay fault without bypassing its safety lock.'),
      row('align-relay-node', 'Align the relay node', 'storm-relay-node-aligned', 'Align the authored relay node with the Stabilizer Ridge route.'),
      row('verify-relay-link', 'Verify the relay link', 'storm-relay-link-verified', 'Confirm the restored link through an explicit field interaction.')
    ])
  }),
  freeze({
    id: 'storm-rescue', label: 'Recover the Lost Signal', zoneId: 'storm-eye',
    objectives: freeze([
      row('review-rescue-signal', 'Review the rescue signal', 'storm-rescue-signal-reviewed', 'Inspect the bounded rescue transmission.'),
      row('triangulate-rescue-signal', 'Triangulate the signal', 'storm-rescue-signal-triangulated', 'Confirm all three safe signal bearings.'),
      row('recover-storm-worker', 'Recover the storm worker', 'storm-worker-recovered', 'Complete the explicit rescue interaction at the Storm Eye.')
    ])
  })
]);

const objectiveRows = freeze(EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((mission) => mission.objectives.map((objective, index) => freeze({ ...objective, missionId: mission.id, missionLabel: mission.label, zoneId: mission.zoneId, index }))));
const actionMap = new Map(objectiveRows.map((entry) => [entry.action, entry]));

function safeReceiptId(value = '') {
  const id = String(value || '').trim();
  return /^[a-z0-9][a-z0-9:_.-]{2,159}$/i.test(id) ? id : '';
}

export function createEonExpanseW795AInitialStormMissionState() {
  return freeze({
    schema: EON_EXPANSE_W795A_STORM_MISSION_SCHEMA,
    regionId: 'storm-sector',
    packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
    completedObjectiveActions: freeze([]),
    completedMissionIds: freeze([]),
    processedReceiptIds: freeze([]),
    regionCompleted: false,
    awardsXp: false,
    automaticProgression: false,
    privateContentStored: false,
    updatedAt: 0
  });
}

export function sanitizeEonExpanseW795AStormMissionState(candidate = null) {
  const base = createEonExpanseW795AInitialStormMissionState();
  if (!candidate || candidate.schema !== EON_EXPANSE_W795A_STORM_MISSION_SCHEMA || candidate.regionId !== 'storm-sector' || candidate.packageDigest !== EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST) return base;
  const actionSet = new Set();
  for (const objective of objectiveRows) {
    if (!Array.isArray(candidate.completedObjectiveActions) || !candidate.completedObjectiveActions.includes(objective.action)) break;
    actionSet.add(objective.action);
  }
  const completedMissionIds = EON_EXPANSE_W795A_STORM_MISSIONS.filter((mission) => mission.objectives.every((objective) => actionSet.has(objective.action))).map((mission) => mission.id);
  const receipts = Array.isArray(candidate.processedReceiptIds) ? [...new Set(candidate.processedReceiptIds.map(safeReceiptId).filter(Boolean))].slice(0, 64) : [];
  return freeze({
    ...base,
    completedObjectiveActions: freeze([...actionSet]),
    completedMissionIds: freeze(completedMissionIds),
    processedReceiptIds: freeze(receipts),
    regionCompleted: completedMissionIds.length === EON_EXPANSE_W795A_STORM_MISSIONS.length,
    updatedAt: Math.max(0, Number(candidate.updatedAt) || 0)
  });
}

export function deriveEonExpanseW795AStormMissionView(candidate = null) {
  const state = sanitizeEonExpanseW795AStormMissionState(candidate);
  const nextObjective = objectiveRows.find((objective) => !state.completedObjectiveActions.includes(objective.action)) || null;
  const missions = EON_EXPANSE_W795A_STORM_MISSIONS.map((mission) => {
    const completed = mission.objectives.filter((objective) => state.completedObjectiveActions.includes(objective.action)).length;
    const activeObjective = mission.objectives.find((objective) => !state.completedObjectiveActions.includes(objective.action)) || null;
    return freeze({ id: mission.id, label: mission.label, zoneId: mission.zoneId, completedObjectives: completed, totalObjectives: mission.objectives.length, completed: completed === mission.objectives.length, active: nextObjective?.missionId === mission.id, activeObjective });
  });
  return freeze({
    schema: EON_EXPANSE_W795A_STORM_MISSION_SCHEMA,
    regionId: 'storm-sector',
    packageDigest: state.packageDigest,
    missions: freeze(missions),
    completedMissionCount: state.completedMissionIds.length,
    totalMissionCount: EON_EXPANSE_W795A_STORM_MISSIONS.length,
    completedObjectiveCount: state.completedObjectiveActions.length,
    totalObjectiveCount: objectiveRows.length,
    nextObjective,
    regionCompleted: state.regionCompleted,
    exactPackageRequired: true,
    awardsXp: false,
    automaticProgression: false,
    privateContentStored: false
  });
}

export function createEonExpanseW795AStormMissionRuntime({ initialState = null, now = Date.now } = {}) {
  let state = sanitizeEonExpanseW795AStormMissionState(initialState);
  const recordAction = (action = '', { explicitUserAction = false, receiptId = '' } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state, view: deriveEonExpanseW795AStormMissionView(state) });
    const objective = actionMap.get(String(action || '')) || null;
    if (!objective) return freeze({ ok: false, reason: 'storm-mission-action-unknown', state, view: deriveEonExpanseW795AStormMissionView(state) });
    const safeReceipt = safeReceiptId(receiptId);
    if (!safeReceipt) return freeze({ ok: false, reason: 'storm-mission-receipt-required', state, view: deriveEonExpanseW795AStormMissionView(state) });
    if (state.processedReceiptIds.includes(safeReceipt)) return freeze({ ok: false, reason: 'storm-mission-receipt-already-processed', state, view: deriveEonExpanseW795AStormMissionView(state) });
    const view = deriveEonExpanseW795AStormMissionView(state);
    if (!view.nextObjective || view.nextObjective.action !== objective.action) return freeze({ ok: false, reason: state.completedObjectiveActions.includes(objective.action) ? 'storm-objective-already-completed' : 'storm-objective-out-of-order', state, view });
    const completedObjectiveActions = freeze([...state.completedObjectiveActions, objective.action]);
    const completedMissionIds = EON_EXPANSE_W795A_STORM_MISSIONS.filter((mission) => mission.objectives.every((entry) => completedObjectiveActions.includes(entry.action))).map((mission) => mission.id);
    state = freeze({ ...state, completedObjectiveActions, completedMissionIds: freeze(completedMissionIds), processedReceiptIds: freeze([...state.processedReceiptIds, safeReceipt]), regionCompleted: completedMissionIds.length === EON_EXPANSE_W795A_STORM_MISSIONS.length, updatedAt: Math.max(1, Number(now()) || Date.now()), awardsXp: false, automaticProgression: false, privateContentStored: false });
    const nextView = deriveEonExpanseW795AStormMissionView(state);
    return freeze({ ok: true, action: objective.action, objectiveId: objective.id, missionId: objective.missionId, missionCompleted: state.completedMissionIds.includes(objective.missionId), regionCompleted: state.regionCompleted, receiptId: safeReceipt, state, view: nextView, awardsXp: false, automaticProgression: false });
  };
  return freeze({
    schema: EON_EXPANSE_W795A_STORM_MISSION_SCHEMA,
    recordAction,
    getState() { return state; },
    getView() { return deriveEonExpanseW795AStormMissionView(state); },
    restore(candidate = null) { state = sanitizeEonExpanseW795AStormMissionState(candidate); return freeze({ ok: true, state, view: deriveEonExpanseW795AStormMissionView(state) }); }
  });
}

export default freeze({ EON_EXPANSE_W795A_STORM_MISSION_SCHEMA, EON_EXPANSE_W795A_STORM_MISSIONS, createEonExpanseW795AInitialStormMissionState, sanitizeEonExpanseW795AStormMissionState, deriveEonExpanseW795AStormMissionView, createEonExpanseW795AStormMissionRuntime });
