/**
 * W660M — one living-world presentation director for EONCITY + EONNEXUS.
 *
 * This module coordinates local visual state only. It never opens routes,
 * starts AI work, captures media, reads private data, or owns a render loop.
 */
import { createEonCityCompanionDirector } from '../eon-city-companion-director.js';
import { getEonCityW659fFunctionalAsset } from '../w659f/eon-city-w659f-functional-asset-manifest.js';

export const EON_CITY_W660M_EXPERIENCE_DIRECTOR_SCHEMA = 'eon.city.w660m.experience-director.v1';
export const EON_CITY_W660M_PLAYER_IDLE_STATES = Object.freeze(['idle', 'idle-alt', 'interact', 'wave']);

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clean = (value = '') => String(value || '').trim().toLowerCase();
const round = (value, places = 3) => Number(finite(value).toFixed(places));

const CREATOR_DOCK_AUTHORITY = getEonCityW659fFunctionalAsset('eonbot-companion-dock');
const CREATOR_DOCK = freeze({
  id: CREATOR_DOCK_AUTHORITY?.id || 'eonbot-companion-dock',
  districtId: CREATOR_DOCK_AUTHORITY?.districtId || 'creator-atrium',
  x: finite(CREATOR_DOCK_AUTHORITY?.dockPoint?.x, -10.38),
  y: finite(CREATOR_DOCK_AUTHORITY?.dockPoint?.y, 0.82),
  z: finite(CREATOR_DOCK_AUTHORITY?.dockPoint?.z, -5.22),
  heading: finite(CREATOR_DOCK_AUTHORITY?.dockPoint?.heading, Math.PI / 2),
  kind: 'dock'
});

const NPC_PROFILES = freeze({
  'eoncity-eon-architect-12clips': freeze({ activity: 'guiding arrivals', path: freeze([[0, 0], [0.65, -0.28], [0.15, -0.55]]), active: 'talk', greet: 'wave' }),
  'eoncity-civilian-creator-13clips': freeze({ activity: 'reviewing the creator console', path: freeze([[0, 0], [0.72, -0.2], [0.38, -0.72]]), active: 'interact', greet: 'wave' }),
  'eon-x1-worker-9clips': freeze({ activity: 'servicing the Forge workbench', path: freeze([[0, 0], [0.76, 0.24], [0.34, 0.62]]), active: 'interact', greet: 'wave' }),
  'eoncity-holo-interface-operator-6clips': freeze({ activity: 'operating a holographic console', path: freeze([[0, 0], [-0.58, 0.12], [-0.2, -0.5]]), active: 'talk', greet: 'wave' }),
  'forge-device-lab-specialist-6clips': freeze({ activity: 'checking device telemetry', path: freeze([[0, 0], [-0.5, 0.28], [-0.85, -0.18]]), active: 'interact', greet: 'wave' }),
  'eoncity-navigator-archive-vault-6clips': freeze({ activity: 'indexing the Archive Canopy', path: freeze([[0, 0], [0.54, -0.36], [0.84, 0.1]]), active: 'talk', greet: 'wave' }),
  'eoncity-vault-steward-6clips': freeze({ activity: 'reviewing vault boundaries', path: freeze([[0, 0], [0.55, 0.2], [0.18, -0.52]]), active: 'interact', greet: 'talk' }),
  'eoncity-vault-steward-male-6clips': freeze({ activity: 'reviewing vault boundaries', path: freeze([[0, 0], [0.55, 0.2], [0.18, -0.52]]), active: 'talk', greet: 'talk' }),
  'security-sentinel-6clips': freeze({ activity: 'patrolling the vault perimeter', path: freeze([[0, 0], [0.72, 0.12], [0.16, -0.7], [-0.5, -0.18]]), active: 'interact', greet: 'wave' }),
  'eoncity-creator-trade-6clips': freeze({ activity: 'reviewing membership options', path: freeze([[0, 0], [0.52, -0.2], [0.24, -0.64]]), active: 'talk', greet: 'wave' }),
  'citizen-variant-6clips': freeze({ activity: 'exploring the Trade Dome', path: freeze([[0, 0], [-0.62, 0.2], [-0.28, 0.72]]), active: 'interact', greet: 'wave' })
});

function hashText(value = '') {
  let hash = 2166136261;
  for (const character of String(value || '')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function distance2D(a = {}, b = {}) {
  return Math.hypot(finite(a.x) - finite(b.x), finite(a.z) - finite(b.z));
}

function resolvePlayerIdleState({ idleMs = 0, nearbyKind = '', panelOpen = false, reducedMotion = false } = {}) {
  if (panelOpen) return 'idle-alt';
  const elapsed = Math.max(0, finite(idleMs));
  const phase = elapsed % (reducedMotion ? 18_000 : 14_000);
  const kind = clean(nearbyKind);
  if (phase < 3_800) return 'idle';
  if (phase < 6_600) return 'idle-alt';
  if (kind === 'terminal' || kind === 'station') return phase < 10_400 ? 'interact' : 'idle-alt';
  if (kind === 'nexus' || kind === 'operator') return phase < 9_800 ? 'wave' : 'interact';
  if (phase < 10_200) return 'interact';
  return reducedMotion ? 'idle-alt' : 'wave';
}

export function resolveEonCityW660mPlayerAnimation({ moving = false, speed = 0, idleMs = 0, nearbyKind = '', panelOpen = false, reducedMotion = false } = {}) {
  if (moving) return finite(speed) > 5.3 ? 'run' : 'walk';
  return resolvePlayerIdleState({ idleMs, nearbyKind, panelOpen, reducedMotion });
}

export function resolveEonCityW660mNpcDirective({ assetId = '', elapsedMs = 0, reducedMotion = false, playerDistance = Number.POSITIVE_INFINITY, playerBearing = 0 } = {}) {
  const profile = NPC_PROFILES[clean(assetId)] || freeze({ activity: 'maintaining the district', path: freeze([[0, 0], [0.35, 0.2]]), active: 'interact', greet: 'wave' });
  const seed = hashText(assetId);
  const cycleMs = 18_000 + (seed % 7_000);
  const phase = (Math.max(0, finite(elapsedMs)) + (seed % cycleMs)) % cycleMs;
  const close = finite(playerDistance, 999) <= 2.7;
  if (close) {
    return freeze({
      state: profile.greet,
      offsetX: 0,
      offsetZ: 0,
      headingOffset: finite(playerBearing),
      activity: 'acknowledging Pathfinder',
      reactive: true
    });
  }
  if (reducedMotion) {
    return freeze({
      state: phase > cycleMs * 0.58 && phase < cycleMs * 0.76 ? profile.active : 'idle',
      offsetX: 0,
      offsetZ: 0,
      headingOffset: 0,
      activity: profile.activity,
      reactive: false
    });
  }
  const path = profile.path;
  const segmentCount = Math.max(1, path.length - 1);
  const normalized = phase / cycleMs;
  const activeStart = 0.48;
  const activeEnd = 0.69;
  if (normalized >= activeStart && normalized <= activeEnd) {
    const target = path[path.length - 1] || [0, 0];
    return freeze({ state: profile.active, offsetX: target[0], offsetZ: target[1], headingOffset: 0, activity: profile.activity, reactive: false });
  }
  const travelProgress = normalized < activeStart
    ? normalized / activeStart
    : 1 - ((normalized - activeEnd) / Math.max(0.001, 1 - activeEnd));
  const scaled = clamp(travelProgress, 0, 1) * segmentCount;
  const index = Math.min(segmentCount - 1, Math.floor(scaled));
  const local = scaled - index;
  const from = path[index] || path[0] || [0, 0];
  const to = path[index + 1] || from;
  const offsetX = from[0] + (to[0] - from[0]) * local;
  const offsetZ = from[1] + (to[1] - from[1]) * local;
  const headingOffset = Math.atan2(to[0] - from[0], to[1] - from[1]);
  return freeze({
    state: Math.hypot(to[0] - from[0], to[1] - from[1]) > 0.08 ? 'walk' : 'idle',
    offsetX: round(offsetX),
    offsetZ: round(offsetZ),
    headingOffset: round(headingOffset),
    activity: profile.activity,
    reactive: false
  });
}

export function createEonCityW660mExperienceDirector({ quality = 'balanced', reducedMotion = false } = {}) {
  const companion = createEonCityCompanionDirector({ response: quality === 'cinematic' ? 8.8 : 7.2, hoverAmplitude: reducedMotion ? 0 : 0.1 });
  let elapsedMs = 0;
  let idleMs = 0;
  let manualCompanionIntent = '';
  let snapshot = freeze({
    schema: EON_CITY_W660M_EXPERIENCE_DIRECTOR_SCHEMA,
    playerAnimationState: 'idle',
    companionMode: 'follow',
    activeDistrictId: 'orientation-hall',
    localOnly: true
  });

  return freeze({
    setCompanionIntent(mode = '') {
      manualCompanionIntent = clean(mode);
      return manualCompanionIntent;
    },
    update({
      deltaSeconds = 0.016,
      moving = false,
      speed = 0,
      playerPosition = {},
      playerHeading = 0,
      cameraPosition = null,
      currentDistrictId = 'orientation-hall',
      nearby = null,
      panelOpen = false,
      nexusState = 'ready',
      nexusApprovalPending = false,
      nexusProjectSelected = false
    } = {}) {
      const deltaMs = clamp(finite(deltaSeconds, 0.016) * 1000, 1, 80);
      elapsedMs += deltaMs;
      idleMs = moving ? 0 : idleMs + deltaMs;
      const districtId = clean(currentDistrictId) || 'orientation-hall';
      const nearbyKind = clean(nearby?.type || nearby?.kind || '');
      const sharedNexusState = clean(nexusState) || 'ready';
      const nearbyPoint = nearby?.position && Number.isFinite(Number(nearby.position.x))
        ? freeze({ id: nearby.id || nearby.label || nearbyKind, x: finite(nearby.position.x), y: finite(nearby.position.y), z: finite(nearby.position.z) })
        : null;
      const dockAvailable = districtId === CREATOR_DOCK.districtId && distance2D(playerPosition, CREATOR_DOCK) <= 7.2;
      let companionIntent = manualCompanionIntent;
      let landmark = nearbyPoint;
      let dockPosition = null;
      if (!companionIntent) {
        if (moving) companionIntent = 'follow';
        else if (nearbyKind === 'nexus' && nexusApprovalPending === true) companionIntent = 'observe';
        else if (nearbyKind === 'nexus') companionIntent = 'scan';
        else if (nearbyPoint) companionIntent = idleMs > 2_600 ? 'observe' : 'guide';
        else if (dockAvailable && idleMs > 10_000 && (elapsedMs % 28_000) > 17_000) {
          companionIntent = 'dock';
          dockPosition = CREATOR_DOCK;
          landmark = CREATOR_DOCK;
        } else if (idleMs > 6_500) companionIntent = 'orbit';
        else companionIntent = 'idle';
      }
      if (companionIntent === 'dock') dockPosition = CREATOR_DOCK;
      const companionState = companion.update({
        operatorPosition: playerPosition,
        operatorHeading: playerHeading,
        cameraPosition,
        landmark,
        nearbyLandmark: nearbyPoint,
        dockPosition,
        moving,
        intent: companionIntent,
        deltaMs,
        reducedMotion
      });
      const playerAnimationState = resolveEonCityW660mPlayerAnimation({ moving, speed, idleMs, nearbyKind, panelOpen, reducedMotion });
      snapshot = freeze({
        schema: EON_CITY_W660M_EXPERIENCE_DIRECTOR_SCHEMA,
        elapsedMs: Math.round(elapsedMs),
        idleMs: Math.round(idleMs),
        quality,
        reducedMotion: Boolean(reducedMotion),
        playerAnimationState,
        companionMode: companionState.mode,
        companion: companionState,
        activeDistrictId: districtId,
        nearbyKind: nearbyKind || null,
        nearbyId: nearby?.id || null,
        nexusState: sharedNexusState,
        nexusApprovalPending: nexusApprovalPending === true,
        nexusProjectSelected: nexusProjectSelected === true,
        dockAvailable,
        manualCompanionIntent: manualCompanionIntent || null,
        localOnly: true,
        ownsRenderLoop: false,
        startsAiWork: false,
        startsVoiceCapture: false,
        opensRoutes: false,
        readsPrivateData: false
      });
      return snapshot;
    },
    getSnapshot() { return snapshot; }
  });
}

export function getEonCityW660mExperienceTruth() {
  return freeze({
    schema: EON_CITY_W660M_EXPERIENCE_DIRECTOR_SCHEMA,
    playerIdleChoreography: true,
    reactiveNpcRoutines: true,
    curiousCompanion: true,
    creatorDockSupported: true,
    cityNexusInterestSupported: true,
    sharedNexusStateAware: true,
    oneBabylonOwner: true,
    ownsRenderLoop: false,
    autonomousAgent: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    opensRoutes: false,
    readsPrivateData: false
  });
}
