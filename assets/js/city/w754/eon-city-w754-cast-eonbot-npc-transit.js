/**
 * W754 — one cast, safe NPC schedules, camera-safe EONBOT and one capsule.
 *
 * This authority composes maintained W649/W731/W744/W659F/W677 contracts. It
 * does not create a second cast store, mission engine, render loop or travel
 * ledger. All movement is local presentation; travel remains review-first and
 * explicit, and no route, work, provider or private data operation is started.
 */
import { EON_CITY_W649_CHARACTER_MANIFEST, getEonCityW649Character } from '../w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W731_STATIONS } from '../w731/eon-city-w731-command-hub-contract.js';
import { EON_CITY_W731_LAUNCH_ASSET_MANIFEST } from '../w731/eon-city-w731-launch-asset-manifest.js';
import { EON_CITY_W744_STATION_BLUEPRINTS } from '../w731/eon-city-w744-station-completion-contract.js';
import { createEonCityW659fTransportRuntime } from '../w659f/eon-city-w659f-transport-runtime.js';
import { createEonCityW677TransitCapsuleController } from '../w677/eon-city-w677-transit-capsule-journey.js';

export const EON_CITY_W754_SCHEMA = 'eon.city.cast-eonbot-npc-transit.w754.v1';
export const EON_CITY_W754_CAPSULE_ID = 'w754-transit-capsule-primary';
export const EON_CITY_W754_CAPSULE_FORWARD_AXIS = '+x';
export const EON_CITY_W754_TRAVEL_CHOICES = Object.freeze(['board', 'skip']);

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, finite(value)));
const round = (value, places = 4) => Number(finite(value).toFixed(places));
const point = (source = {}) => freeze({ x: round(source.x), y: round(source.y), z: round(source.z) });
const lerp = (a, b, t) => finite(a) + (finite(b) - finite(a)) * clamp(t, 0, 1);
const smooth = (t) => { const value = clamp(t, 0, 1); return value * value * (3 - 2 * value); };
const distance2d = (a = {}, b = {}) => Math.hypot(finite(a.x) - finite(b.x), finite(a.z) - finite(b.z));

function characterRow({ slotId, alias, stationId = '', role = '', tier = 'role-lazy', requiredInHighDetail = true } = {}) {
  const character = getEonCityW649Character(alias);
  if (!character) return null;
  return freeze({
    slotId,
    alias,
    assetId: character.id,
    stationId,
    role: role || character.role,
    tier,
    lifecycle: character.lifecycle,
    primaryPath: character.variants.primary.path,
    fallbackPath: character.variants.fallback.path,
    animationCount: character.animations,
    animationNames: freeze([...(character.animationNames || [])]),
    requiredInHighDetail: Boolean(requiredInHighDetail),
    sameOriginOnly: true,
    browserVisualProofRequired: true
  });
}

export function buildEonCityW754CastPlan({ quality = 'balanced' } = {}) {
  const normalizedQuality = ['lite', 'balanced', 'cinematic', 'high'].includes(String(quality || '').toLowerCase())
    ? String(quality).toLowerCase()
    : 'balanced';
  const highDetail = normalizedQuality === 'cinematic' || normalizedQuality === 'high';
  const slots = [
    characterRow({ slotId: 'player', alias: 'player-primary', role: 'Pathfinder Vanguard', tier: 'core-lazy' }),
    characterRow({ slotId: 'eonbot', alias: 'eonbot', role: 'EONBOT Companion', tier: 'core-lazy' }),
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.map((entry) => characterRow({
      slotId: `station:${entry.stationId}`,
      alias: entry.alias,
      stationId: entry.stationId,
      role: entry.role,
      tier: entry.tier
    })),
    characterRow({ slotId: 'ambient:maintenance-worker', alias: 'forge-worker', role: 'X1 Maintenance Worker', tier: 'ambient-lazy' })
  ].filter(Boolean);
  const activeManifestIds = new Set(EON_CITY_W649_CHARACTER_MANIFEST.entries.filter((entry) => entry.lifecycle === 'active').map((entry) => entry.id));
  const assignedAssetIds = new Set(slots.map((entry) => entry.assetId));
  const highDetailSlots = highDetail ? slots : slots.filter((entry) => ['player', 'eonbot'].includes(entry.slotId) || entry.stationId);
  const stationSlots = slots.filter((entry) => entry.stationId);
  const duplicateStationIds = stationSlots.map((entry) => entry.stationId).filter((id, index, all) => all.indexOf(id) !== index);
  const missingStationIds = EON_CITY_W731_STATIONS.filter((station) => station.id !== 'eonbot-nexus' && !stationSlots.some((slot) => slot.stationId === station.id)).map((station) => station.id);
  return freeze({
    schema: EON_CITY_W754_SCHEMA,
    quality: normalizedQuality,
    highDetail,
    slots: freeze(slots),
    requiredSlots: freeze(highDetailSlots.map((entry) => entry.slotId)),
    stationRoleCount: stationSlots.length,
    coreRoleCount: slots.filter((entry) => entry.tier === 'core-lazy').length,
    ambientRoleCount: slots.filter((entry) => entry.tier === 'ambient-lazy').length,
    uniqueAssetCount: assignedAssetIds.size,
    allStationRolesAssigned: missingStationIds.length === 0 && duplicateStationIds.length === 0,
    missingStationIds: freeze(missingStationIds),
    duplicateStationIds: freeze([...new Set(duplicateStationIds)]),
    inactiveAssignments: freeze(slots.filter((entry) => !activeManifestIds.has(entry.assetId)).map((entry) => entry.assetId)),
    oneCastAuthority: 'w731-launch-asset-manifest',
    browserVisualProofRequired: true,
    sourcePresenceIsNotVisualCertification: true
  });
}

function scheduleRow(blueprint, station) {
  const route = blueprint.npcRoute;
  const laneSign = station.priority % 2 === 0 ? 1 : -1;
  const home = freeze({ x: station.ring === 'inner' ? 1.75 : 1.55, y: 0, z: station.ring === 'inner' ? 0.42 : 0.25 });
  const terminal = freeze({ x: finite(blueprint.terminalOffset.x), y: 0, z: finite(blueprint.terminalOffset.z) });
  const dx = terminal.x - home.x;
  const dz = terminal.z - home.z;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const maxLength = Math.max(0.25, finite(route.radius));
  const scale = Math.min(1, maxLength / length);
  const resolvedTerminal = freeze({ x: round(home.x + dx * scale), y: 0, z: round(home.z + dz * scale) });
  const normal = freeze({ x: round((-dz / length) * laneSign), z: round((dx / length) * laneSign) });
  const laneOffset = Math.min(0.18, Math.max(0.08, maxLength * 0.12));
  const waypoint = freeze({
    x: round((home.x + resolvedTerminal.x) / 2 + normal.x * laneOffset),
    y: 0,
    z: round((home.z + resolvedTerminal.z) / 2 + normal.z * laneOffset)
  });
  const stationaryOperator = new Set(['command-console', 'automation-theatre', 'local-ai-lab', 'plans-access']).has(station.id);
  return freeze({
    stationId: station.id,
    npcAlias: blueprint.npcAlias,
    role: stationaryOperator ? 'stationary-operator' : 'local-walker',
    enabled: route.enabled === true && !stationaryOperator,
    speed: round(route.speed),
    home,
    waypoint,
    terminal: resolvedTerminal,
    routeLength: round(distance2d(home, waypoint) + distance2d(waypoint, resolvedTerminal)),
    routeRadius: round(maxLength),
    corridorWidth: 0.56,
    minimumStructureClearance: 0.42,
    scheduleOffsetMs: station.priority * 970,
    homeDwellMs: Math.max(2400, finite(route.dwellMs, 4200)),
    terminalDwellMs: Math.max(2600, finite(route.terminalDwellMs, 4800)),
    walkingInPlaceAllowed: false,
    oneNpcPerStationLane: true,
    fallbackWhenBlocked: 'idle',
    crossesCentralSpawn: false,
    collisionLayer: `station:${station.id}`
  });
}

export function buildEonCityW754NpcSchedulePlan() {
  const stations = new Map(EON_CITY_W731_STATIONS.map((entry) => [entry.id, entry]));
  const schedules = EON_CITY_W744_STATION_BLUEPRINTS
    .filter((entry) => entry.id !== 'eonbot-nexus')
    .map((entry) => scheduleRow(entry, stations.get(entry.id)))
    .filter(Boolean);
  const offsets = schedules.map((entry) => entry.scheduleOffsetMs);
  const collisionLayers = schedules.map((entry) => entry.collisionLayer);
  return freeze({
    schema: EON_CITY_W754_SCHEMA,
    schedules: freeze(schedules),
    scheduleCount: schedules.length,
    uniqueOffsets: new Set(offsets).size === offsets.length,
    uniqueCollisionLayers: new Set(collisionLayers).size === collisionLayers.length,
    boundedRoutes: schedules.every((entry) => entry.routeLength <= entry.routeRadius * 2.35),
    walkingInPlaceAllowed: false,
    deterministic: true,
    localOnly: true
  });
}

export function createEonCityW754NpcScheduleController({ now = () => Date.now(), plan = buildEonCityW754NpcSchedulePlan() } = {}) {
  const byStation = new Map(plan.schedules.map((entry) => [entry.stationId, entry]));
  const startedAt = finite(now());
  const snapshots = new Map();
  const resolveSegment = (entry, elapsed) => {
    if (!entry.enabled) return freeze({ phase: 'stationary', position: entry.home, animation: 'idle', moving: false, progress: 0 });
    const walkOutMs = Math.max(900, Math.round((entry.routeLength / Math.max(0.2, entry.speed)) * 1000));
    const walkHomeMs = walkOutMs;
    const cycleMs = entry.homeDwellMs + walkOutMs + entry.terminalDwellMs + walkHomeMs;
    const local = ((elapsed - entry.scheduleOffsetMs) % cycleMs + cycleMs) % cycleMs;
    if (local < entry.homeDwellMs) return freeze({ phase: 'dwell-home', position: entry.home, animation: 'idle', moving: false, progress: 0 });
    if (local < entry.homeDwellMs + walkOutMs) {
      const t = smooth((local - entry.homeDwellMs) / walkOutMs);
      const first = t < 0.5;
      const segmentT = first ? t * 2 : (t - 0.5) * 2;
      const from = first ? entry.home : entry.waypoint;
      const to = first ? entry.waypoint : entry.terminal;
      return freeze({ phase: 'walk-terminal', position: point({ x: lerp(from.x, to.x, segmentT), y: 0, z: lerp(from.z, to.z, segmentT) }), animation: 'walk', moving: true, progress: round(t) });
    }
    if (local < entry.homeDwellMs + walkOutMs + entry.terminalDwellMs) return freeze({ phase: 'use-terminal', position: entry.terminal, animation: 'interact', moving: false, progress: 1 });
    const t = smooth((local - entry.homeDwellMs - walkOutMs - entry.terminalDwellMs) / walkHomeMs);
    const first = t < 0.5;
    const segmentT = first ? t * 2 : (t - 0.5) * 2;
    const from = first ? entry.terminal : entry.waypoint;
    const to = first ? entry.waypoint : entry.home;
    return freeze({ phase: 'walk-home', position: point({ x: lerp(from.x, to.x, segmentT), y: 0, z: lerp(from.z, to.z, segmentT) }), animation: 'walk', moving: true, progress: round(1 - t) });
  };
  return freeze({
    update(stationId = '', at = now(), { suspended = false } = {}) {
      const entry = byStation.get(String(stationId || ''));
      if (!entry) return freeze({ ok: false, reason: 'npc-schedule-not-found', stationId: String(stationId || '') });
      const previous = snapshots.get(entry.stationId) || null;
      const resolved = suspended
        ? freeze({ phase: 'suspended', position: previous?.position || entry.home, animation: 'idle', moving: false, progress: previous?.progress || 0 })
        : resolveSegment(entry, Math.max(0, finite(at) - startedAt));
      const movedDistance = previous ? distance2d(previous.position, resolved.position) : 0;
      const moving = resolved.moving && movedDistance > 0.0001;
      const snapshot = freeze({
        schema: EON_CITY_W754_SCHEMA,
        ok: true,
        stationId: entry.stationId,
        phase: resolved.phase,
        position: resolved.position,
        animation: moving ? 'walk' : resolved.animation === 'walk' ? 'idle' : resolved.animation,
        moving,
        movedDistance: round(movedDistance),
        heading: moving && previous ? round(Math.atan2(resolved.position.x - previous.position.x, resolved.position.z - previous.position.z)) : previous?.heading || 0,
        progress: resolved.progress,
        walkingInPlace: false,
        collisionLayer: entry.collisionLayer,
        minimumStructureClearance: entry.minimumStructureClearance,
        localOnly: true
      });
      snapshots.set(entry.stationId, snapshot);
      return snapshot;
    },
    getSnapshot(stationId = '') { return snapshots.get(String(stationId || '')) || null; },
    getPlan() { return plan; }
  });
}

export function resolveEonCityW754EonbotSafeTarget({
  playerPosition = {}, requestedTarget = {}, cameraPosition = null,
  minDistance = 1.15, maxDistance = 7.8, minHeight = 0.72, maxHeight = 2.35
} = {}) {
  const player = point(playerPosition);
  const requested = point(requestedTarget);
  let dx = requested.x - player.x;
  let dz = requested.z - player.z;
  let distance = Math.hypot(dx, dz);
  if (distance < 0.0001) { dx = 1; dz = 0; distance = 1; }
  const boundedDistance = clamp(distance, minDistance, maxDistance);
  let x = player.x + (dx / distance) * boundedDistance;
  let z = player.z + (dz / distance) * boundedDistance;
  let cameraCorridorAvoided = false;
  if (cameraPosition) {
    const camera = point(cameraPosition);
    const cameraDx = player.x - camera.x;
    const cameraDz = player.z - camera.z;
    const cameraLength = Math.max(0.001, Math.hypot(cameraDx, cameraDz));
    const viewX = cameraDx / cameraLength;
    const viewZ = cameraDz / cameraLength;
    const targetDx = x - player.x;
    const targetDz = z - player.z;
    const along = targetDx * viewX + targetDz * viewZ;
    const lateral = Math.abs(targetDx * -viewZ + targetDz * viewX);
    if (along > 0.35 && lateral < 0.72) {
      const side = targetDx * -viewZ + targetDz * viewX >= 0 ? 1 : -1;
      x += -viewZ * side * (0.88 - lateral);
      z += viewX * side * (0.88 - lateral);
      cameraCorridorAvoided = true;
    }
  }
  const finalDistance = distance2d(player, { x, z });
  if (finalDistance > maxDistance) {
    const scale = maxDistance / Math.max(0.001, finalDistance);
    x = player.x + (x - player.x) * scale;
    z = player.z + (z - player.z) * scale;
  }
  return freeze({
    schema: EON_CITY_W754_SCHEMA,
    target: point({ x, y: clamp(requested.y, minHeight, maxHeight), z }),
    distanceFromPlayer: round(distance2d(player, { x, z })),
    cameraCorridorAvoided,
    minimumPlayerClearance: minDistance,
    maximumScoutDistance: maxDistance,
    blocksPlayer: false,
    blocksCamera: false,
    automaticStationActivation: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    localOnly: true
  });
}

export function resolveEonCityW754CapsulePose(journey = {}, progress = 0) {
  const from = point(journey?.from || {});
  const to = point(journey?.to || {});
  const t = smooth(progress);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const arcHeight = journey?.mode === 'skip' ? 0 : Math.min(2.8, 0.72 + length * 0.035);
  const y = lerp(from.y + 1.15, to.y + 1.15, t) + Math.sin(Math.PI * t) * arcHeight;
  // The authored/fallback capsule's long axis is local +X. Rotating the anchor
  // by atan2(-dz, dx) aligns +X with the world-space route tangent.
  const rotationY = Math.atan2(-dz, dx);
  return freeze({
    schema: EON_CITY_W754_SCHEMA,
    capsuleId: EON_CITY_W754_CAPSULE_ID,
    position: point({ x: lerp(from.x, to.x, t), y, z: lerp(from.z, to.z, t) }),
    rotationY: round(rotationY),
    forwardAxis: EON_CITY_W754_CAPSULE_FORWARD_AXIS,
    tangent: freeze({ x: round(dx / length), z: round(dz / length) }),
    progress: round(t),
    routeDirectionCorrect: true
  });
}

export function createEonCityW754TransitController({ now = () => Date.now() } = {}) {
  const review = createEonCityW659fTransportRuntime({ now });
  const visual = createEonCityW677TransitCapsuleController({ now });
  let snapshot = freeze({
    schema: EON_CITY_W754_SCHEMA,
    capsuleId: EON_CITY_W754_CAPSULE_ID,
    uniqueCapsuleCount: 1,
    status: 'idle',
    choice: '',
    pose: null,
    destination: null,
    reviewToken: '',
    receipt: null,
    automaticTravel: false
  });
  const updateSnapshot = () => {
    const state = visual.getSnapshot();
    const pose = state.journey ? resolveEonCityW754CapsulePose(state.journey, state.progress) : snapshot.pose;
    snapshot = freeze({
      ...snapshot,
      status: state.status,
      active: state.active,
      phase: state.phase,
      progress: state.progress,
      pose,
      journey: state.journey,
      uniqueCapsuleCount: 1,
      automaticTravel: false,
      routeOpened: false,
      workExecuted: false,
      privateDataTransferred: false,
      localOnly: true
    });
    return snapshot;
  };
  return freeze({
    listDestinations() { return review.listDestinations(); },
    request(destinationId = '', { explicitUserAction = false, fromDistrictId = '' } = {}) {
      const result = review.request(destinationId, { explicitUserAction, fromDistrictId });
      if (!result.ok) return result;
      snapshot = freeze({ ...snapshot, status: 'review-required', destination: result.destination, reviewToken: result.token, choice: '', pose: null });
      return freeze({ ...result, choices: EON_CITY_W754_TRAVEL_CHOICES, capsuleId: EON_CITY_W754_CAPSULE_ID, uniqueCapsuleCount: 1 });
    },
    confirm(token = '', { explicitUserAction = false, choice = 'board' } = {}) {
      const normalizedChoice = EON_CITY_W754_TRAVEL_CHOICES.includes(String(choice)) ? String(choice) : '';
      if (!normalizedChoice) return freeze({ ok: false, reason: 'travel-choice-invalid', choices: EON_CITY_W754_TRAVEL_CHOICES });
      const result = review.confirm(token, { explicitUserAction, travelMode: normalizedChoice === 'skip' ? 'skip' : 'ride' });
      if (!result.ok) return result;
      const begin = visual.begin(result.journey, { explicitUserAction: true, receiptId: result.receipt.id });
      snapshot = freeze({
        ...snapshot,
        status: result.journey.mode === 'skip' ? 'complete' : 'active',
        choice: normalizedChoice,
        destination: result.destination,
        reviewToken: '',
        receipt: result.receipt,
        journey: result.journey,
        phase: begin.state.phase,
        progress: begin.state.progress,
        pose: resolveEonCityW754CapsulePose(result.journey, begin.state.progress)
      });
      return freeze({ ok: true, destination: result.destination, receipt: result.receipt, journey: result.journey, state: snapshot, capsuleId: EON_CITY_W754_CAPSULE_ID });
    },
    update(at = now()) { visual.update(at); return updateSnapshot(); },
    cancel({ explicitUserAction = false } = {}) {
      const result = visual.cancel({ explicitUserAction });
      if (!result.ok) return result;
      review.cancel();
      snapshot = freeze({ ...snapshot, status: 'cancelled', active: false, phase: 'cancelled', progress: 0, reviewToken: '', choice: '', journey: null });
      return freeze({ ok: true, state: snapshot });
    },
    getSnapshot() { return updateSnapshot(); },
    getReviewSnapshot() { return review.getSnapshot(); }
  });
}

export function validateEonCityW754Contract() {
  const cast = buildEonCityW754CastPlan({ quality: 'high' });
  const schedules = buildEonCityW754NpcSchedulePlan();
  const errors = [];
  if (!cast.allStationRolesAssigned || cast.stationRoleCount !== 9) errors.push('cast-station-roles');
  if (cast.inactiveAssignments.length) errors.push('cast-inactive-assignment');
  if (cast.coreRoleCount !== 2 || cast.ambientRoleCount !== 1) errors.push('cast-core-ambient');
  if (schedules.scheduleCount !== 9 || !schedules.uniqueOffsets || !schedules.uniqueCollisionLayers || !schedules.boundedRoutes) errors.push('npc-schedules');
  if (EON_CITY_W754_CAPSULE_FORWARD_AXIS !== '+x' || EON_CITY_W754_TRAVEL_CHOICES.length !== 2) errors.push('transit-calibration');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    schema: EON_CITY_W754_SCHEMA,
    castSlots: cast.slots.length,
    stationRoleCount: cast.stationRoleCount,
    scheduleCount: schedules.scheduleCount,
    capsuleCount: 1,
    oneRenderLoop: true,
    oneCastAuthority: true,
    oneTravelReceiptAuthority: true,
    humanVisualProofRequired: true
  });
}

export default freeze({
  EON_CITY_W754_SCHEMA,
  EON_CITY_W754_CAPSULE_ID,
  EON_CITY_W754_CAPSULE_FORWARD_AXIS,
  EON_CITY_W754_TRAVEL_CHOICES,
  buildEonCityW754CastPlan,
  buildEonCityW754NpcSchedulePlan,
  createEonCityW754NpcScheduleController,
  resolveEonCityW754EonbotSafeTarget,
  resolveEonCityW754CapsulePose,
  createEonCityW754TransitController,
  validateEonCityW754Contract
});
