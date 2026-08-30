/**
 * W679 — visible EONBOT curiosity, scan and explicit docking authority.
 *
 * This controller drives local presentation only. Curiosity may select public
 * scene targets for a bounded scan, but docking still requires an explicit
 * user action. It cannot navigate Pathfinder, open a route, read private data,
 * start AI work, capture voice, write storage or make a network request.
 */
import { buildEonCityW674OrientationDistrictBeltPlan } from '../w674/eon-city-w674-orientation-district-belt.js';
import { getEonCityW659fFunctionalAsset } from '../w659f/eon-city-w659f-functional-asset-manifest.js';

export const EON_CITY_W679_EONBOT_CURIOSITY_SCHEMA = 'eon.city.eonbot-curiosity.w679.v1';
export const EON_CITY_W679_EONBOT_STATES = Object.freeze([
  'follow', 'curious-hover', 'scan', 'circle', 'return', 'dock-approach', 'docked', 'reduced-idle'
]);

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clean = (value = '') => String(value || '').trim().toLowerCase();
const distance2d = (a = {}, b = {}) => Math.hypot(finite(a.x) - finite(b.x), finite(a.z) - finite(b.z));
const point = (source = {}) => freeze({ x: finite(source.x), y: finite(source.y), z: finite(source.z), heading: finite(source.heading) });

function buildTargets() {
  const orientation = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'balanced', mode: 'explore' });
  const creator = getEonCityW659fFunctionalAsset('eonbot-companion-dock');
  const publicTargets = [
    freeze({ id: orientation.eonbotDock.id, label: 'Orientation EONBOT Dock', kind: 'dock', districtId: orientation.districtId, position: point({ ...orientation.eonbotDock.position, y: 0.9 }), explicitDockActionRequired: true }),
    freeze({ id: creator?.id || 'eonbot-companion-dock', label: creator?.label || 'Creator Atrium Companion Dock', kind: 'dock', districtId: creator?.districtId || 'creator-atrium', position: point(creator?.dockPoint || { x: -10.38, y: 0.82, z: -5.22, heading: Math.PI / 2 }), explicitDockActionRequired: true }),
    ...orientation.terminals.map((entry) => freeze({ id: entry.id, label: entry.label, kind: 'terminal', districtId: orientation.districtId, position: point({ ...entry.position, y: 1.25 }), explicitDockActionRequired: false })),
    freeze({ id: orientation.expanseGate.id, label: orientation.expanseGate.label, kind: 'gateway', districtId: orientation.districtId, position: point({ ...orientation.expanseGate.position, y: 2.2 }), explicitDockActionRequired: false }),
    freeze({ id: orientation.station.id, label: orientation.station.label || 'Orientation Transit Station', kind: 'station', districtId: orientation.districtId, position: point({ ...orientation.station.position, y: 1.15 }), explicitDockActionRequired: false })
  ];
  return freeze(publicTargets);
}

export const EON_CITY_W679_EONBOT_TARGETS = buildTargets();
const byId = new Map(EON_CITY_W679_EONBOT_TARGETS.map((entry) => [entry.id, entry]));

export function getEonCityW679EonbotTarget(id = '') {
  return byId.get(String(id || '').trim()) || null;
}

export function resolveNearestEonCityW679EonbotDock(position = {}, districtId = '') {
  const district = clean(districtId);
  const ranked = EON_CITY_W679_EONBOT_TARGETS
    .filter((entry) => entry.kind === 'dock' && (!district || entry.districtId === district))
    .map((entry) => freeze({ entry, distance: distance2d(position, entry.position) }))
    .sort((a, b) => a.distance - b.distance);
  return ranked[0] || null;
}

function selectPublicScanTarget({ nearby = null, districtId = '', playerPosition = {}, lastTargetId = '' } = {}) {
  if (nearby?.position && nearby?.id) return freeze({ id: String(nearby.id), label: String(nearby.label || nearby.id), kind: clean(nearby.type || nearby.kind || 'landmark'), districtId: clean(districtId), position: point(nearby.position), explicitDockActionRequired: false });
  const district = clean(districtId);
  const candidates = EON_CITY_W679_EONBOT_TARGETS
    .filter((entry) => entry.kind !== 'dock' && (!district || entry.districtId === district) && entry.id !== lastTargetId)
    .map((entry) => freeze({ entry, distance: distance2d(playerPosition, entry.position) }))
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.entry || null;
}

export function createEonCityW679EonbotCuriosityController({ now = () => Date.now() } = {}) {
  let idleMs = 0;
  let cycleStartedAt = finite(now());
  let manualDockId = '';
  let lastTargetId = '';
  let revision = 0;
  let snapshot = freeze({
    schema: EON_CITY_W679_EONBOT_CURIOSITY_SCHEMA,
    state: 'follow',
    directorMode: 'follow',
    target: null,
    dockTarget: null,
    nonStaticIdle: true,
    revision: 0,
    localOnly: true,
    autonomousAgent: false
  });

  const requestDock = (targetId = 'nearest', { explicitUserAction = false, playerPosition = {}, districtId = '' } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot });
    const target = targetId === 'nearest'
      ? resolveNearestEonCityW679EonbotDock(playerPosition, districtId)?.entry
      : getEonCityW679EonbotTarget(targetId);
    if (!target || target.kind !== 'dock') return freeze({ ok: false, reason: 'dock-target-unavailable', snapshot });
    manualDockId = target.id;
    cycleStartedAt = finite(now());
    revision += 1;
    return freeze({ ok: true, target, revision, localOnly: true, automaticNavigation: false, explicitUserAction: true });
  };

  const releaseDock = ({ explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot });
    manualDockId = '';
    cycleStartedAt = finite(now());
    revision += 1;
    return freeze({ ok: true, revision, localOnly: true });
  };

  const update = ({
    deltaMs = 16,
    playerPosition = {},
    companionPosition = {},
    districtId = '',
    moving = false,
    nearby = null,
    reducedMotion = false
  } = {}) => {
    const safeDelta = clamp(finite(deltaMs, 16), 1, 100);
    const timestamp = finite(now());
    idleMs = moving ? 0 : idleMs + safeDelta;
    let state = moving ? 'follow' : 'curious-hover';
    let directorMode = moving ? 'follow' : 'orbit';
    let target = null;
    let dockTarget = null;
    let caption = moving ? 'Following Pathfinder.' : 'Curious idle movement active.';

    if (manualDockId) {
      dockTarget = getEonCityW679EonbotTarget(manualDockId);
      if (!dockTarget) manualDockId = '';
      else {
        const distance = distance2d(companionPosition, dockTarget.position);
        state = distance <= 0.42 ? 'docked' : 'dock-approach';
        directorMode = 'dock';
        target = dockTarget;
        caption = state === 'docked' ? `Docked at ${dockTarget.label}.` : `Approaching ${dockTarget.label}.`;
      }
    }

    if (!manualDockId) {
      const cycleMs = reducedMotion ? 18_000 : 12_000;
      const phase = ((timestamp - cycleStartedAt) % cycleMs + cycleMs) % cycleMs;
      target = selectPublicScanTarget({ nearby, districtId, playerPosition, lastTargetId });
      if (reducedMotion) {
        state = 'reduced-idle';
        directorMode = 'idle';
        caption = 'Reduced-motion idle keeps EONBOT visibly present.';
      } else if (!moving && target && phase >= 2_800 && phase < 6_200) {
        state = 'scan';
        directorMode = 'scan';
        caption = `Scanning ${target.label} as a public visual cue.`;
        lastTargetId = target.id;
      } else if (!moving && phase >= 6_200 && phase < 9_600) {
        state = 'circle';
        directorMode = 'orbit';
        caption = 'Circling Pathfinder without blocking the camera.';
      } else if (!moving && phase >= 9_600) {
        state = 'return';
        directorMode = 'return';
        caption = 'Returning to companion formation.';
      }
    }

    snapshot = freeze({
      schema: EON_CITY_W679_EONBOT_CURIOSITY_SCHEMA,
      state,
      directorMode,
      target: target ? freeze({ ...target, position: freeze({ ...target.position }) }) : null,
      dockTarget: dockTarget ? freeze({ ...dockTarget, position: freeze({ ...dockTarget.position }) }) : null,
      dockRequested: Boolean(manualDockId),
      docked: state === 'docked',
      idleMs: Math.round(idleMs),
      caption,
      nonStaticIdle: true,
      publicSceneScanOnly: true,
      reducedMotion: Boolean(reducedMotion),
      revision,
      localOnly: true,
      autonomousAgent: false,
      automaticNavigation: false,
      automaticDocking: false,
      startsAiWork: false,
      startsVoiceCapture: false,
      privateDataRead: false,
      networkRequestCreated: false
    });
    return snapshot;
  };

  return freeze({ requestDock, releaseDock, update, getSnapshot: () => snapshot });
}

export function getEonCityW679EonbotCuriosityTruth() {
  return freeze({
    schema: EON_CITY_W679_EONBOT_CURIOSITY_SCHEMA,
    nonStaticIdle: true,
    curiousPublicSceneScanning: true,
    cameraSafeFormationDelegatedToExistingDirector: true,
    explicitDockActionRequired: true,
    automaticDocking: false,
    autonomousAgent: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    privateDataRead: false,
    networkRequestCreated: false,
    ownsRenderLoop: false
  });
}

export default freeze({
  EON_CITY_W679_EONBOT_CURIOSITY_SCHEMA,
  EON_CITY_W679_EONBOT_STATES,
  EON_CITY_W679_EONBOT_TARGETS,
  getEonCityW679EonbotTarget,
  resolveNearestEonCityW679EonbotDock,
  createEonCityW679EonbotCuriosityController,
  getEonCityW679EonbotCuriosityTruth
});
