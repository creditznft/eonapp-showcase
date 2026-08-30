/**
 * W737 — truthful, local Command Centre missions.
 *
 * Missions are an exploration and review layer over real maintained EONAPP
 * work surfaces. They never start AI work, make a payment, grant an
 * entitlement, publish content or claim a native workflow completed.
 */
export const EON_CITY_W737_MISSION_SCHEMA = 'eon.city.missions.w737.v2';
export const EON_CITY_W737_MISSION_STORAGE_KEY = 'eon:city:missions:w737:v2';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_W737_MISSIONS = freeze([
  freeze({
    id: 'wake-the-nexus', category: 'Orientation', title: 'Wake the Living Nexus',
    summary: 'Meet EONBOT at the central Nexus and open the shared EONBOT workspace.',
    stationId: 'eonbot-nexus', discoveryId: '', actionLabel: 'Open Living Nexus',
    surface: 'chat', completionAuthority: 'verified-native-outcome-required'
  }),
  freeze({
    id: 'continue-project', category: 'Projects', title: 'Continue one real project',
    summary: 'Review active work in Project Atlas and continue from the next verified step.',
    stationId: 'project-atlas', discoveryId: '', actionLabel: 'Open Project Atlas',
    surface: 'projects', completionAuthority: 'verified-native-outcome-required'
  }),
  freeze({
    id: 'creator-signal', category: 'Create', title: 'Shape a creator signal',
    summary: 'Inspect the Transit Overlook, then prepare a real request in Create Forge.',
    stationId: 'create-forge', discoveryId: 'transit-overlook', actionLabel: 'Open Create Forge',
    surface: 'create', completionAuthority: 'verified-native-outcome-required'
  }),
  freeze({
    id: 'automation-review', category: 'Automations', title: 'Review an automation safely',
    summary: 'Inspect the Maintenance Relay, then review a genuine automation state.',
    stationId: 'automation-theatre', discoveryId: 'maintenance-relay', actionLabel: 'Open Automation Theatre',
    surface: 'automations', completionAuthority: 'verified-native-outcome-required'
  }),
  freeze({
    id: 'vault-recovery', category: 'Library', title: 'Recover a useful item',
    summary: 'Open Library Vault and recover a useful local item without exposing private content in 3D.',
    stationId: 'library-vault', discoveryId: '', actionLabel: 'Open Library Vault',
    surface: 'library', completionAuthority: 'verified-native-outcome-required'
  }),
  freeze({
    id: 'expanse-readiness', category: 'Exploration', title: 'Survey the Expanse boundary',
    summary: 'Reach the Expanse Gate, review what will load, then explicitly enter or cancel.',
    stationId: 'my-realm-portal', discoveryId: 'expanse-gate', actionLabel: 'Review Expanse Gate',
    surface: 'my-realm', completionAuthority: 'verified-native-outcome-required'
  })
]);

const byId = new Map(EON_CITY_W737_MISSIONS.map((mission) => [mission.id, mission]));
const byStation = new Map(EON_CITY_W737_MISSIONS.map((mission) => [mission.stationId, mission]));
const byDiscovery = new Map();
for (const mission of EON_CITY_W737_MISSIONS) {
  if (mission.discoveryId && !byDiscovery.has(mission.discoveryId)) byDiscovery.set(mission.discoveryId, mission);
}

export function getEonCityW737Mission(id = '') {
  return byId.get(String(id || '').trim()) || null;
}

export function getEonCityW737MissionForStation(stationId = '') {
  return byStation.get(String(stationId || '').trim()) || null;
}

export function getEonCityW737MissionForDiscovery(discoveryId = '') {
  return byDiscovery.get(String(discoveryId || '').trim()) || null;
}

function normalizeState(raw = {}) {
  const states = {};
  for (const [id, value] of Object.entries(raw?.states || {})) {
    if (!byId.has(id)) continue;
    const state = ['available', 'reviewed', 'opened', 'returned'].includes(String(value?.state)) ? String(value.state) : 'available';
    states[id] = freeze({
      state,
      updatedAt: String(value?.updatedAt || ''),
      completionClaimed: false
    });
  }
  return freeze({ schema: EON_CITY_W737_MISSION_SCHEMA, states: freeze(states) });
}

export function readEonCityW737MissionState(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_CITY_W737_MISSION_STORAGE_KEY) || 'null');
    if (!parsed || parsed.schema !== EON_CITY_W737_MISSION_SCHEMA) return normalizeState();
    return normalizeState(parsed);
  } catch {
    return normalizeState();
  }
}

export function writeEonCityW737MissionState(missionId = '', state = 'reviewed', storage = globalThis.localStorage) {
  const mission = getEonCityW737Mission(missionId);
  const nextState = String(state || '');
  if (!mission || !['reviewed', 'opened', 'returned'].includes(nextState)) {
    return freeze({ ok: false, reason: 'mission-state-invalid' });
  }
  try {
    const current = readEonCityW737MissionState(storage);
    const next = {
      schema: EON_CITY_W737_MISSION_SCHEMA,
      states: {
        ...current.states,
        [mission.id]: freeze({ state: nextState, updatedAt: new Date().toISOString(), completionClaimed: false })
      }
    };
    storage?.setItem?.(EON_CITY_W737_MISSION_STORAGE_KEY, JSON.stringify(next));
    return freeze({ ok: true, missionId: mission.id, state: nextState, completionClaimed: false });
  } catch {
    return freeze({ ok: false, reason: 'mission-state-write-failed' });
  }
}

export function buildEonCityW737MissionView(storage = globalThis.localStorage) {
  const state = readEonCityW737MissionState(storage);
  return freeze(EON_CITY_W737_MISSIONS.map((mission) => freeze({
    ...mission,
    localState: String(state.states[mission.id]?.state || 'available'),
    updatedAt: String(state.states[mission.id]?.updatedAt || ''),
    completionClaimed: false
  })));
}

export function validateEonCityW737MissionContract() {
  const errors = [];
  const ids = new Set();
  for (const mission of EON_CITY_W737_MISSIONS) {
    if (!mission.id || ids.has(mission.id)) errors.push(`mission-id:${mission.id || 'missing'}`);
    if (!mission.stationId || !mission.surface || !mission.title || !mission.actionLabel) errors.push(`mission-contract:${mission.id}`);
    if (mission.completionAuthority !== 'verified-native-outcome-required') errors.push(`mission-authority:${mission.id}`);
    ids.add(mission.id);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), missionCount: EON_CITY_W737_MISSIONS.length });
}

export function getEonCityW737MissionTruth() {
  return freeze({
    schema: EON_CITY_W737_MISSION_SCHEMA,
    localOnly: true,
    reviewFirst: true,
    explicitActionsOnly: true,
    startsWork: false,
    startsPayment: false,
    grantsEntitlement: false,
    automaticPublishing: false,
    completionClaimed: false
  });
}
