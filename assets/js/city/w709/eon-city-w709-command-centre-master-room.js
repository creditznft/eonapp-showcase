export const EON_CITY_W709_MASTER_ROOM_SCHEMA = 'eon.city.command-centre-master-room.w709.v1';
const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').replace(/[^a-zA-Z0-9:_/?=&.-]/g, '').slice(0, 180);

const ROUTES = freeze(['/?nexus=atlas', '/projects', '/workspace', '/local-ai', '/vault']);
const LOCAL_ACTIONS = freeze(['living-nexus-panel', 'eonbot-panel', 'district-map']);
const station = (id, label, purpose, options = {}) => freeze({
  id, label, purpose,
  zone: options.zone || 'operations',
  accent: options.accent || 'cyan',
  localPosition: freeze(options.localPosition || { x: 0, y: 0, z: 0 }),
  targetKind: options.route ? 'route' : 'local-action',
  route: options.route || '',
  action: options.action || '',
  statusSource: options.statusSource || 'review-only',
  reviewFirst: true,
  confirmationRequired: true,
  readsPrivateWork: false,
  autoExecute: false,
  autoNavigate: false
});

export const EON_CITY_W709_MASTER_ROOM_STATIONS = freeze([
  station('living-nexus', 'Live 3D NEXUS', 'Open the in-City NEXUS status and spatial work-object entry without starting AI work.', { action: 'living-nexus-panel', zone: 'centre', accent: 'cyan', localPosition: { x: 0, y: 0.15, z: -1.5 }, statusSource: 'nexus-projection' }),
  station('projects', 'Project Operations', 'Review and continue the active local project from the native Projects workspace.', { route: '/projects', zone: 'work', accent: 'teal', localPosition: { x: -2.6, y: 0, z: -0.8 }, statusSource: 'projects' }),
  station('approvals', 'Approvals & Results', 'Review waiting decisions, task evidence and verified outputs in Workspace.', { route: '/workspace', zone: 'review', accent: 'amber', localPosition: { x: 2.6, y: 0, z: -0.8 }, statusSource: 'jobs' }),
  station('atlas', 'Project Atlas Wall', 'Open the spatial Atlas. With no project selected, Atlas presents truthful first-step choices.', { route: '/?nexus=atlas', zone: 'navigation', accent: 'violet', localPosition: { x: -2.7, y: 0.2, z: 1.1 }, statusSource: 'atlas' }),
  station('providers', 'Provider & Device Status', 'Review local and BYOK provider readiness. No probe, install or request starts here.', { route: '/local-ai', zone: 'systems', accent: 'mint', localPosition: { x: 2.7, y: 0.2, z: 1.1 }, statusSource: 'ai-runtime' }),
  station('eonbot-dock', 'EONBOT Dock', 'Call the one EONBOT guide into the Command Centre after an explicit user action.', { action: 'eonbot-panel', zone: 'companion', accent: 'cyan', localPosition: { x: -1.45, y: 0, z: 2.35 }, statusSource: 'eonbot' }),
  station('city-monitor', 'City & Transit Monitor', 'Review all nine districts, travel choices and the Expanse gateway on the City map.', { action: 'district-map', zone: 'world', accent: 'blue', localPosition: { x: 1.45, y: 0, z: 2.35 }, statusSource: 'city' }),
  station('vault', 'Vault & Recovery', 'Review custody, encrypted backup and recovery without exposing secrets in City.', { route: '/vault', zone: 'safety', accent: 'slate', localPosition: { x: 0, y: 0, z: 3.25 }, statusSource: 'backup' })
]);

export function buildEonCityW709MasterRoomPlan({ statusCards = [], districtCount = 9 } = {}) {
  const states = new Map((Array.isArray(statusCards) ? statusCards : []).map((entry) => [String(entry?.id || ''), String(entry?.state || 'unknown')]));
  const stations = EON_CITY_W709_MASTER_ROOM_STATIONS.map((entry) => freeze({
    ...entry,
    observedState: states.get(entry.statusSource) || (entry.statusSource === 'review-only' ? 'review-only' : 'not-observed')
  }));
  return freeze({
    schema: EON_CITY_W709_MASTER_ROOM_SCHEMA,
    title: 'Command Centre Master Room',
    commandTable: freeze({ id: 'master-command-table', label: 'City Operations Table', position: freeze({ x: 0, y: 0.72, z: 0.7 }), radius: 1.45, interactive: false }),
    stations: freeze(stations),
    districtMonitor: freeze({ expectedDistrictCount: 9, observedDistrictCount: Math.max(0, Number(districtCount) || 0), atlasAndTravelUnified: true, expanseGatewayVisible: true }),
    oneEonbotIdentity: true,
    oneNexusState: true,
    projectDataProjectedOnly: true,
    reviewFirst: true,
    readsPrivateWork: false,
    startsAiWork: false,
    startsProvider: false,
    startsAutomation: false,
    autoNavigate: false
  });
}

export function getEonCityW709MasterStation(id = '') {
  return EON_CITY_W709_MASTER_ROOM_STATIONS.find((entry) => entry.id === String(id || '').trim()) || null;
}

export function getEonCityW709MasterStationReview(id = '') {
  const entry = getEonCityW709MasterStation(id);
  if (!entry) return freeze({ ok: false, reason: 'unknown-master-room-station', review: null });
  if (entry.targetKind === 'route') {
    const route = clean(entry.route);
    if (!ROUTES.includes(route)) return freeze({ ok: false, reason: 'unsafe-master-room-route', review: null });
    return freeze({ ok: true, local: false, review: freeze({ id: entry.id, title: entry.label, detail: entry.purpose, route, actionLabel: `Open ${entry.label}`, confirmationRequired: true, transfersCityContent: false }) });
  }
  const action = clean(entry.action);
  if (!LOCAL_ACTIONS.includes(action)) return freeze({ ok: false, reason: 'unsafe-master-room-action', review: null });
  return freeze({ ok: true, local: true, review: freeze({ id: entry.id, title: entry.label, detail: entry.purpose, action, actionLabel: 'Open inside City', confirmationRequired: true }) });
}

export function validateEonCityW709MasterRoomPlan(plan = buildEonCityW709MasterRoomPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_W709_MASTER_ROOM_SCHEMA) errors.push('schema-invalid');
  const stations = Array.isArray(plan?.stations) ? plan.stations : [];
  if (stations.length !== 8 || new Set(stations.map((entry) => entry.id)).size !== 8) errors.push('eight-unique-stations-required');
  for (const entry of stations) {
    if (!entry.label || !entry.purpose || !Number.isFinite(entry.localPosition?.x) || !Number.isFinite(entry.localPosition?.z)) errors.push(`station-invalid:${entry.id}`);
    if (!getEonCityW709MasterStationReview(entry.id).ok) errors.push(`station-target-invalid:${entry.id}`);
    if (!entry.reviewFirst || !entry.confirmationRequired || entry.readsPrivateWork || entry.autoExecute || entry.autoNavigate) errors.push(`station-boundary-invalid:${entry.id}`);
  }
  if (plan?.districtMonitor?.expectedDistrictCount !== 9 || plan?.oneEonbotIdentity !== true || plan?.oneNexusState !== true) errors.push('master-room-authority-invalid');
  if (plan?.readsPrivateWork || plan?.startsAiWork || plan?.startsProvider || plan?.startsAutomation || plan?.autoNavigate) errors.push('global-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), stationCount: stations.length });
}

export function getEonCityW709MasterRoomTruth() {
  return freeze({ schema: EON_CITY_W709_MASTER_ROOM_SCHEMA, allInOneCommandCentre: true, eightReviewedStations: true, atlasWall: true, liveNexusEntry: true, eonbotDock: true, cityTransitMonitor: true, oneEonbotIdentity: true, oneNexusState: true, readsPrivateWork: false, startsAiWork: false, autoNavigate: false });
}
