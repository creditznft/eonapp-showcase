import {
  EON_CITY_W747_CAMERA_POSES,
  EON_CITY_W747_OPERATIONS_CRESCENT,
  EON_CITY_W747_PRIMARY_PLACEMENTS,
  EON_CITY_W747_SPAWN,
  deriveEonCityW747CameraPosition,
  getEonCityW747Placement,
  validateEonCityW747SpatialFoundation
} from '../w747/eon-city-w747-spatial-foundation.js';

const freeze = (value) => Object.freeze(value);
const deepFreezeEntries = (entries) => freeze(entries.map((entry) => freeze({
  ...entry,
  position: freeze({ ...entry.position }),
  focus: freeze({ ...entry.focus }),
  npc: freeze({ ...entry.npc })
})));

export const EON_CITY_W731_COMMAND_HUB_SCHEMA = 'eon.city.command-hub.w731.v1';
export const EON_CITY_W731_RUNTIME_OWNER_SCHEMA = 'eon.city.runtime-owner.w731.v1';
export const EON_CITY_W731_RESUME_KEY = 'eon:city:command-hub:resume:w731:v1';

// W737 keeps the proven bounded runtime while turning its inner radius into a
// premium Command Centre and its outer radius into a discoverable exterior map.
export const EON_CITY_W731_WORLD_BOUNDS = freeze({
  playableRadius: 27,
  safetyRadius: 25.5,
  commandCentreRadius: 12.5,
  exteriorRingInnerRadius: 14,
  exteriorRingOuterRadius: 24.5,
  skylineInnerRadius: 34,
  skylineOuterRadius: 48,
  cameraRadiusMin: 6.5,
  cameraRadiusMax: 15.5,
  cameraBetaMin: 0.72,
  cameraBetaMax: 1.6
});

export const EON_CITY_W731_SPAWN = EON_CITY_W747_SPAWN;
export const EON_CITY_W731_EONBOT_DOCK = EON_CITY_W747_OPERATIONS_CRESCENT.eonbotDock.position;
export const EON_CITY_W743_ARRIVAL_CAMERA = freeze({
  ...EON_CITY_W747_CAMERA_POSES.arrival,
  minimumStationClearance: 0.2
});

const EON_CITY_W731_STATION_DEFINITIONS = [
  {
    id: 'eonbot-nexus', label: 'Living EONBOT Nexus', shortLabel: 'Nexus', surface: 'nexus', ring: 'inner', zone: 'command-centre', kind: 'nexus', visual: 'living-nexus', assetId: 'eoncity-genesis-core', targetHeight: 3.8, priority: 1,
    description: 'Ask EONBOT, continue active work and review the next useful step.', position: { x: 0, y: 0, z: -2.5 }, focus: { x: 0, z: 1.4 }, activationRadius: 4.6,
    npc: { id: 'eonbot', name: 'EONBOT', role: 'Living Nexus companion', greeting: 'The Command Centre is online. Choose a real project, mission or next action.', action: 'Open Nexus' }
  },
  {
    id: 'create-forge', label: 'Create Forge', shortLabel: 'Create', surface: 'create', ring: 'inner', zone: 'command-centre', kind: 'forge', visual: 'forge', assetId: 'eoncity-forge-basilica', targetHeight: 5.2, priority: 2,
    description: 'Choose the result and open the simplest honest creation path.', position: { x: -7.4, y: 0, z: -5.2 }, focus: { x: -4.8, z: -3.2 }, activationRadius: 4.2,
    npc: { id: 'forge-specialist', name: 'Asha Forge', role: 'Creation specialist', greeting: 'Tell me what you want to make. The Forge will keep the path clear.', action: 'Open Create' }
  },
  {
    id: 'project-atlas', label: 'Project Atlas', shortLabel: 'Projects', surface: 'projects', ring: 'inner', zone: 'command-centre', kind: 'atlas', visual: 'atlas', assetId: 'eoncity-holo-map-beacon', targetHeight: 3.0, priority: 3,
    description: 'Resume active work and review the next useful action.', position: { x: 7.4, y: 0, z: -5.2 }, focus: { x: 4.8, z: -3.2 }, activationRadius: 4.2,
    npc: { id: 'navigator', name: 'Kael Navigator', role: 'Project guide', greeting: 'Your active work is mapped. Choose a project and continue from the right point.', action: 'Open Projects' }
  },
  {
    id: 'library-vault', label: 'Library Vault', shortLabel: 'Library', surface: 'library', ring: 'inner', zone: 'command-centre', kind: 'vault', visual: 'vault', assetId: 'eoncity-navigator-arc', targetHeight: 3.8, priority: 4,
    description: 'Find saved local work and bring it into the next task.', position: { x: -8.2, y: 0, z: 4.6 }, focus: { x: -5.2, z: 3.2 }, activationRadius: 4.2,
    npc: { id: 'vault-steward', name: 'Mira Vault', role: 'Library steward', greeting: 'Your saved work stays under your control. I can help you find the right item.', action: 'Open Library' }
  },
  {
    id: 'share-capture', label: 'Share Command Center', shortLabel: 'Share', surface: 'share', ring: 'inner', zone: 'command-centre', kind: 'signal', visual: 'signal', assetId: 'eoncity-district-hologram', targetHeight: 3.1, priority: 5,
    description: 'Create a reviewed invite, QR or social handoff, with Creator Capture inside.', position: { x: 8.2, y: 0, z: 4.6 }, focus: { x: 5.2, z: 3.2 }, activationRadius: 4.2,
    npc: { id: 'relay-host', name: 'Nia Relay', role: 'Sharing host', greeting: 'Create the invite first, then record or share only when you are ready. Nothing posts automatically.', action: 'Open Share Center' }
  },
  {
    id: 'command-console', label: 'Command Status', shortLabel: 'Status', surface: 'command-status', ring: 'outer', zone: 'exterior', kind: 'console', visual: 'console', assetId: 'eoncity-holo-interface-landmark', targetHeight: 4.2, priority: 6,
    description: 'Review real projects, local items and genuine task status.', position: { x: -13.5, y: 0, z: -10 }, focus: { x: -10.5, z: -7.8 }, activationRadius: 3.9,
    npc: { id: 'status-sentinel', name: 'Orin Sentinel', role: 'Command status coordinator', greeting: 'This console reports real work only. No decorative activity is presented as execution.', action: 'Open status' }
  },
  {
    id: 'automation-theatre', label: 'Automation Theatre', shortLabel: 'Automations', surface: 'automations', ring: 'outer', zone: 'exterior', kind: 'theatre', visual: 'theatre', assetId: 'eoncity-holo-interface-landmark', targetHeight: 4.2, priority: 7,
    description: 'Review real queued, running, approval-required and completed tasks.', position: { x: 13.5, y: 0, z: -10 }, focus: { x: 10.5, z: -7.8 }, activationRadius: 3.9,
    npc: { id: 'operator', name: 'Ivo Operator', role: 'Automation operator', greeting: 'Only genuine task states appear here. Approval remains yours.', action: 'Open Automations' }
  },
  {
    id: 'local-ai-lab', label: 'Local AI Lab', shortLabel: 'Local AI', surface: 'local-ai', ring: 'outer', zone: 'exterior', kind: 'lab', visual: 'lab', assetId: 'eoncity-ai-tower-core', targetHeight: 4.5, priority: 8,
    description: 'Review device, local runtime and provider readiness.', position: { x: -15.2, y: 0, z: 8.5 }, focus: { x: -11.8, z: 6.6 }, activationRadius: 3.9,
    npc: { id: 'device-specialist', name: 'Tao Device', role: 'Local AI specialist', greeting: 'I can explain this device and local runtime status without installing anything automatically.', action: 'Open Local AI' }
  },
  {
    id: 'my-realm-portal', label: 'My Realm Portal', shortLabel: 'My Realm', surface: 'my-realm', ring: 'outer', zone: 'exterior', kind: 'portal', visual: 'portal', assetId: 'eoncity-portal-gate', targetHeight: 4.6, priority: 9,
    description: 'Open your private fixed-layout Realm and Realm Card.', position: { x: 0, y: 0, z: 16.5 }, focus: { x: 0, z: 13.2 }, activationRadius: 4.1,
    npc: { id: 'realm-steward', name: 'Sera Realm', role: 'Realm steward', greeting: 'Your Realm is a private personal space with clear templates—not an uncontrolled public world.', action: 'Open My Realm' }
  },
  {
    id: 'plans-access', label: 'Plans & Access', shortLabel: 'Plans', surface: 'plans', ring: 'outer', zone: 'exterior', kind: 'access', visual: 'access', assetId: 'eoncity-trade-dome-entrance', targetHeight: 4.4, priority: 10,
    description: 'Review server-confirmed access and compare subscription tiers.', position: { x: 15.2, y: 0, z: 8.5 }, focus: { x: 11.8, z: 6.6 }, activationRadius: 3.9,
    npc: { id: 'access-guide', name: 'Eli Access', role: 'Access guide', greeting: 'I can explain current access and plan differences. Checkout always requires your confirmation.', action: 'Open Plans & access' }
  }
];

export const EON_CITY_W731_STATIONS = deepFreezeEntries(EON_CITY_W731_STATION_DEFINITIONS.map((station) => {
  const placement = getEonCityW747Placement(station.id);
  if (!placement) throw new Error(`w747-station-placement-missing:${station.id}`);
  return {
    ...station,
    wing: placement.wing,
    footprintRadius: placement.footprintRadius,
    position: placement.position,
    focus: { x: placement.focus.x, z: placement.focus.z }
  };
}));

export const EON_CITY_W737_DISCOVERIES = deepFreezeEntries([
  {
    id: 'transit-overlook', label: 'Transit Capsule Overlook', shortLabel: 'Transit', kind: 'discovery', visual: 'transit', assetId: 'eoncity-transit-core', targetHeight: 4.2,
    position: { x: -22, y: 0, z: -1.5 }, focus: { x: -19, z: -1 }, activationRadius: 4.2,
    npc: { id: 'transit-guide', name: 'Transit Guide', role: 'Journey steward', greeting: 'The capsule route is bounded and review-first.', action: 'Inspect Transit' }
  },
  {
    id: 'expanse-gate', label: 'Expanse Gate', shortLabel: 'Expanse', kind: 'gateway', visual: 'expanse', assetId: 'eoncity-ascension-portal', targetHeight: 5.4,
    position: { x: 22, y: 0, z: -1.5 }, focus: { x: 19, z: -1 }, activationRadius: 4.5,
    npc: { id: 'expanse-guide', name: 'Gateway Sentinel', role: 'Expanse entry steward', greeting: 'Review what will load, then explicitly enter the Expanse or cancel and remain in the Command Hub.', action: 'Review Expanse entry' }
  },
  {
    id: 'maintenance-relay', label: 'Maintenance Relay', shortLabel: 'Relay', kind: 'discovery', visual: 'maintenance', assetId: 'eoncity-district-info', targetHeight: 3.0,
    position: { x: -17.5, y: 0, z: 18.5 }, focus: { x: -15.51, z: 17.35 }, activationRadius: 4.0,
    npc: { id: 'maintenance-guide', name: 'X1 Relay', role: 'City systems landmark', greeting: 'This relay reports local City readiness without pretending a job is running.', action: 'Inspect Relay' }
  },
]);

function distanceToSegment2d(point, from, to) {
  const dx = Number(to.x || 0) - Number(from.x || 0);
  const dz = Number(to.z || 0) - Number(from.z || 0);
  const denominator = dx * dx + dz * dz;
  const projection = denominator > 0
    ? Math.max(0, Math.min(1, (((Number(point.x || 0) - Number(from.x || 0)) * dx) + ((Number(point.z || 0) - Number(from.z || 0)) * dz)) / denominator))
    : 0;
  const nearestX = Number(from.x || 0) + dx * projection;
  const nearestZ = Number(from.z || 0) + dz * projection;
  return Math.hypot(Number(point.x || 0) - nearestX, Number(point.z || 0) - nearestZ);
}

export function inspectEonCityW743ArrivalCamera({
  camera = EON_CITY_W743_ARRIVAL_CAMERA,
  spawn = EON_CITY_W731_SPAWN,
  stations = EON_CITY_W731_STATIONS
} = {}) {
  const target = camera.target || freeze({ x: Number(spawn.x || 0), y: Number(camera.targetHeight || 0), z: Number(spawn.z || 0) });
  const cameraPosition = deriveEonCityW747CameraPosition({ ...camera, target });
  const clearances = (stations || []).map((station) => {
    const lineDistance = distanceToSegment2d(station.position, cameraPosition, target);
    const visualRadius = Math.max(1.2, Number(station.footprintRadius || station.activationRadius || 0));
    return freeze({ id: station.id, lineDistance, visualRadius, clearance: lineDistance - visualRadius });
  });
  const minimumClearance = clearances.reduce((minimum, item) => Math.min(minimum, item.clearance), Number.POSITIVE_INFINITY);
  const blockedStationIds = clearances.filter((item) => item.clearance < Number(camera.minimumStationClearance || 0)).map((item) => item.id);
  return freeze({
    ok: blockedStationIds.length === 0,
    cameraPosition,
    target: freeze({ x: Number(target.x || 0), y: Math.max(0, Number(target.y || camera.targetHeight || 0)), z: Number(target.z || 0) }),
    minimumClearance,
    blockedStationIds: freeze(blockedStationIds),
    clearances: freeze(clearances)
  });
}

export const EON_CITY_W731_FUTURE_GATEWAYS = freeze([
  freeze({ id: 'south-gateway', label: 'Future southern district connection', angle: Math.PI, available: false, visiblePromise: false }),
  freeze({ id: 'east-gateway', label: 'Future district connection', angle: Math.PI / 2, available: false }),
  freeze({ id: 'west-gateway', label: 'Future district connection', angle: -Math.PI / 2, available: false })
]);

export const EON_CITY_W731_RUNTIME_MODULES = freeze({
  owner: '/assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  contract: '/assets/js/city/w731/eon-city-w731-command-hub-contract.js',
  localAssets: '/assets/js/city/w731/eon-city-w731-local-assets.js',
  missions: '/assets/js/city/w737/eon-city-w737-missions.js',
  sharedWorkSurfaceRegistry: '/assets/js/work-surface/eon-work-surface-registry.js'
});

export const EON_CITY_W731_RETIRED_LAUNCH_LAYERS = freeze([
  'living-nexus-realm-babylon',
  'living-nexus-babylon-runtime',
  'w712-flagship-expanse-entry-as-second-runtime',
  'w689-all-district-belts-as-second-runtime',
  'w690-district-belts-babylon-as-second-runtime',
  'w709-command-centre-master-room-as-second-runtime',
  'w659n-product-layer-as-second-menu-owner',
  'frontend-to-city-nexus-field'
]);

export function getEonCityW731Station(id = '') {
  const key = String(id || '').trim().toLowerCase();
  return EON_CITY_W731_STATIONS.find((station) => station.id === key || station.surface === key) || null;
}

export function getEonCityW737Discovery(id = '') {
  const key = String(id || '').trim().toLowerCase();
  return EON_CITY_W737_DISCOVERIES.find((entry) => entry.id === key) || null;
}

function nearest(entries, position = {}, maxDistance = Number.POSITIVE_INFINITY) {
  const x = Number(position.x || 0);
  const z = Number(position.z || 0);
  const limit = Number.isFinite(Number(maxDistance)) ? Math.max(0, Number(maxDistance)) : Number.POSITIVE_INFINITY;
  return entries
    .map((entry) => freeze({ entry, distance: Math.hypot(x - entry.position.x, z - entry.position.z) }))
    .filter((record) => record.distance <= Math.min(limit, record.entry.activationRadius))
    .sort((left, right) => left.distance - right.distance)[0] || null;
}

export function resolveEonCityW731NearestStation(position = {}, maxDistance = Number.POSITIVE_INFINITY) {
  const result = nearest(EON_CITY_W731_STATIONS, position, maxDistance);
  return result ? freeze({ station: result.entry, distance: result.distance }) : null;
}

export function resolveEonCityW737NearestDiscovery(position = {}, maxDistance = Number.POSITIVE_INFINITY) {
  const result = nearest(EON_CITY_W737_DISCOVERIES, position, maxDistance);
  return result ? freeze({ discovery: result.entry, distance: result.distance }) : null;
}

export function clampEonCityW731Position(position = {}) {
  const x = Number(position.x || 0);
  const y = Number(position.y || 0);
  const z = Number(position.z || 0);
  const distance = Math.hypot(x, z);
  const limit = EON_CITY_W731_WORLD_BOUNDS.safetyRadius;
  if (distance <= limit || distance <= 0.0001) return freeze({ x, y, z, clamped: false });
  const scale = limit / distance;
  return freeze({ x: x * scale, y, z: z * scale, clamped: true });
}

export function validateEonCityW731CommandHubContract() {
  const errors = [];
  const ids = new Set();
  const surfaces = new Set();
  if (EON_CITY_W731_STATIONS.length !== 10) errors.push('station-count');
  for (const station of EON_CITY_W731_STATIONS) {
    if (!station.id || ids.has(station.id)) errors.push(`station-id:${station.id || 'missing'}`);
    if (!station.surface || surfaces.has(station.surface)) errors.push(`station-surface:${station.surface || 'missing'}`);
    if (!['inner', 'outer'].includes(station.ring)) errors.push(`station-ring:${station.id}`);
    if (!station.kind || !station.visual || !station.assetId) errors.push(`station-visual:${station.id}`);
    if (!station.npc?.name || !station.npc?.role || !station.npc?.greeting || !station.npc?.action) errors.push(`npc-contract:${station.id}`);
    ids.add(station.id);
    surfaces.add(station.surface);
  }
  if (EON_CITY_W737_DISCOVERIES.length !== 3) errors.push('discovery-count');
  if (new Set(EON_CITY_W737_DISCOVERIES.map((entry) => entry.id)).size !== EON_CITY_W737_DISCOVERIES.length) errors.push('discovery-id');
  if (!surfaces.has('share') || !surfaces.has('plans') || !surfaces.has('my-realm')) errors.push('required-surfaces');
  if (EON_CITY_W731_WORLD_BOUNDS.safetyRadius >= EON_CITY_W731_WORLD_BOUNDS.playableRadius) errors.push('world-safety-boundary');
  if (EON_CITY_W731_WORLD_BOUNDS.exteriorRingOuterRadius >= EON_CITY_W731_WORLD_BOUNDS.safetyRadius) errors.push('exterior-ring-boundary');
  if (EON_CITY_W731_RETIRED_LAUNCH_LAYERS.length < 6) errors.push('retired-layer-list');
  const spatialFoundation = validateEonCityW747SpatialFoundation();
  if (!spatialFoundation.ok) errors.push(`w747-spatial:${spatialFoundation.errors.join(',')}`);
  if (EON_CITY_W747_PRIMARY_PLACEMENTS.length !== EON_CITY_W731_STATIONS.length) errors.push('w747-placement-coverage');
  const arrivalCamera = inspectEonCityW743ArrivalCamera();
  if (!arrivalCamera.ok) errors.push(`arrival-camera:${arrivalCamera.blockedStationIds.join(',')}`);
  return freeze({ ok: errors.length === 0, errors: freeze(errors), stationCount: EON_CITY_W731_STATIONS.length, discoveryCount: EON_CITY_W737_DISCOVERIES.length, arrivalCamera });
}
