import { EON_CITY_W731_STATIONS, EON_CITY_W737_DISCOVERIES } from '../w731/eon-city-w731-command-hub-contract.js';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_W765R7_INTERACTION_MATRIX_SCHEMA = 'eon.city.interaction-matrix.w765r7.v1';

const stationActions = EON_CITY_W731_STATIONS.map((station) => freeze({
  id: `station:${station.id}`,
  label: station.label,
  kind: 'workspace',
  targetId: station.id,
  expectedOutcome: 'maintained-workspace',
  inputModes: freeze(['3d-pick', 'spatial-label', 'city-menu', 'keyboard-use', 'wall-display']),
  restoresControls: true
}));

const discoveryActions = EON_CITY_W737_DISCOVERIES.map((discovery) => freeze({
  id: `discovery:${discovery.id}`,
  label: discovery.label,
  kind: discovery.id === 'transit-overlook' ? 'transit-review' : 'inspection',
  targetId: discovery.id,
  expectedOutcome: discovery.id === 'transit-overlook' ? 'review-dialog' : 'visible-inspection',
  inputModes: freeze(['3d-pick', 'spatial-label', 'keyboard-use']),
  restoresControls: true
}));

export const EON_CITY_W765R7_INTERACTION_MATRIX = freeze([
  ...stationActions,
  ...discoveryActions,
  freeze({ id: 'transit:board', label: 'Board Capsule', kind: 'reviewed-travel', targetId: 'transit', expectedOutcome: 'bounded-visible-journey', inputModes: freeze(['pointer', 'touch', 'keyboard']), restoresControls: true }),
  freeze({ id: 'transit:skip', label: 'Skip ride', kind: 'reviewed-travel', targetId: 'transit', expectedOutcome: 'explicit-instant-arrival', inputModes: freeze(['pointer', 'touch', 'keyboard']), restoresControls: true }),
  freeze({ id: 'transit:cancel', label: 'Cancel Transit', kind: 'dialog-control', targetId: 'transit', expectedOutcome: 'dialog-closed', inputModes: freeze(['pointer', 'touch', 'keyboard', 'escape']), restoresControls: true }),
  freeze({ id: 'menu:close', label: 'Close City Menu', kind: 'dialog-control', targetId: 'city-menu', expectedOutcome: 'dialog-closed', inputModes: freeze(['pointer', 'touch', 'keyboard', 'escape']), restoresControls: true }),
  freeze({ id: 'workspace:return', label: 'Return to City', kind: 'workspace-control', targetId: 'city', expectedOutcome: 'city-running', inputModes: freeze(['pointer', 'touch', 'keyboard']), restoresControls: true })
]);

export function getEonCityW765R7InteractionAction(id = '') {
  const key = String(id || '').trim().toLowerCase();
  return EON_CITY_W765R7_INTERACTION_MATRIX.find((entry) => entry.id === key || entry.targetId === key) || null;
}

export function validateEonCityW765R7InteractionMatrix({ stations = EON_CITY_W731_STATIONS, discoveries = EON_CITY_W737_DISCOVERIES } = {}) {
  const errors = [];
  const ids = new Set();
  for (const action of EON_CITY_W765R7_INTERACTION_MATRIX) {
    if (!action.id || ids.has(action.id)) errors.push(`duplicate-or-empty:${action.id || 'unknown'}`);
    ids.add(action.id);
    if (!action.label) errors.push(`label:${action.id}`);
    if (!action.expectedOutcome) errors.push(`outcome:${action.id}`);
    if (!Array.isArray(action.inputModes) || action.inputModes.length === 0) errors.push(`input-modes:${action.id}`);
    if (action.restoresControls !== true) errors.push(`control-restoration:${action.id}`);
  }
  for (const station of stations) if (!ids.has(`station:${station.id}`)) errors.push(`station-missing:${station.id}`);
  for (const discovery of discoveries) if (!ids.has(`discovery:${discovery.id}`)) errors.push(`discovery-missing:${discovery.id}`);
  return freeze({ ok: errors.length === 0, schema: EON_CITY_W765R7_INTERACTION_MATRIX_SCHEMA, actionCount: EON_CITY_W765R7_INTERACTION_MATRIX.length, errors: freeze(errors) });
}

export default freeze({ EON_CITY_W765R7_INTERACTION_MATRIX_SCHEMA, EON_CITY_W765R7_INTERACTION_MATRIX, getEonCityW765R7InteractionAction, validateEonCityW765R7InteractionMatrix });
