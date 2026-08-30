/**
 * W696 — physical district boundaries, deterministic target arbitration and
 * simplified HUD/focus authority.
 *
 * District identity changes only after crossing a connected authored corridor
 * and holding on the destination side. Interaction selection has one explicit
 * winner. The HUD keeps four primary decisions and moves secondary utilities
 * into one More sheet. No function navigates, executes or requests permission.
 */

import { buildEonCityW690CompleteCoreIdentityPlan } from '../w690/eon-city-w690-complete-core-identity.js';

export const EON_CITY_W696_INTERACTION_BOUNDARY_HUD_SCHEMA = 'eon.city.interaction-boundary-hud.w696.v1';
export const EON_CITY_W696_WORLD_BOUND = 96;
const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const clean = (value = '') => String(value || '').trim().toLowerCase();
const point = (value = {}) => freeze({ x: Number(value?.x) || 0, y: Number(value?.y) || 0, z: Number(value?.z) || 0 });

function boundaryFromConnection(link = {}) {
  const from = point(link.from);
  const to = point(link.to);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.max(.001, Math.hypot(dx, dz));
  const nx = dx / length;
  const nz = dz / length;
  return freeze({
    id: `w696:boundary:${link.fromId}:${link.toId}`,
    connectionId: link.id,
    fromId: link.fromId,
    toId: link.toId,
    kind: link.kind,
    midpoint: point({ x:(from.x+to.x)/2, z:(from.z+to.z)/2 }),
    normal: freeze({ x:nx, z:nz }),
    tangent: freeze({ x:-nz, z:nx }),
    halfWidth: Number(Math.max(4.8, Number(link.width || .72) * 5.5).toFixed(2)),
    depth: 5.5,
    physicalCrossingRequired: true,
    automaticTransition: false
  });
}

export function buildEonCityW696PhysicalBoundaryPlan({ quality = 'balanced' } = {}) {
  const core = buildEonCityW690CompleteCoreIdentityPlan({ quality, mode:'explore' });
  const boundaries = freeze(core.streetConnections.map(boundaryFromConnection));
  return freeze({
    schema: EON_CITY_W696_INTERACTION_BOUNDARY_HUD_SCHEMA,
    worldBound: EON_CITY_W696_WORLD_BOUND,
    boundaries,
    districtIds: freeze(core.districts.map((entry)=>entry.id)),
    connectedBoundaryCount: boundaries.length,
    physicalCrossingRequired: true,
    dwellRequired: true,
    automaticTransition: false
  });
}

function boundaryForPair(boundaries, leftId, rightId) {
  const left = clean(leftId); const right = clean(rightId);
  return boundaries.find((entry) => (entry.fromId === left && entry.toId === right) || (entry.fromId === right && entry.toId === left)) || null;
}
function side(boundary, position, fromId) {
  const direction = boundary.fromId === fromId ? 1 : -1;
  const dx = Number(position?.x || 0) - boundary.midpoint.x;
  const dz = Number(position?.z || 0) - boundary.midpoint.z;
  return (dx * boundary.normal.x + dz * boundary.normal.z) * direction;
}
function lateral(boundary, position) {
  const dx = Number(position?.x || 0) - boundary.midpoint.x;
  const dz = Number(position?.z || 0) - boundary.midpoint.z;
  return Math.abs(dx * boundary.tangent.x + dz * boundary.tangent.z);
}

export function createEonCityW696PhysicalDistrictTransitionController({
  initialDistrictId = '', initialPosition = {}, holdMs = 520, quality = 'balanced'
} = {}) {
  const plan = buildEonCityW696PhysicalBoundaryPlan({ quality });
  let currentId = clean(initialDistrictId);
  let previous = point(initialPosition);
  let pendingId = '';
  let pendingBoundaryId = '';
  let pendingMs = 0;
  let crossingLatched = false;
  let last = freeze({ districtId:currentId, changed:false, pendingDistrictId:'', pendingBoundaryId:'', pendingMs:0, reason:'initial', physicalCrossing:false });
  const resetPending = () => { pendingId=''; pendingBoundaryId=''; pendingMs=0; crossingLatched=false; };
  return freeze({
    reset(nextDistrictId = currentId, position = previous) {
      currentId = clean(nextDistrictId);
      previous = point(position);
      resetPending();
      last = freeze({ districtId:currentId, changed:false, pendingDistrictId:'', pendingBoundaryId:'', pendingMs:0, reason:'reset', physicalCrossing:false });
      return last;
    },
    update({ position = previous, candidateDistrictId = currentId, deltaSeconds = .016, force = false, explicitTravel = false } = {}) {
      const nextPosition = point(position);
      const candidateId = clean(candidateDistrictId) || currentId;
      if (!currentId) {
        currentId = candidateId;
        previous = nextPosition;
        last = freeze({ districtId:currentId, changed:true, pendingDistrictId:'', pendingBoundaryId:'', pendingMs:0, reason:'initial-district', physicalCrossing:false });
        return last;
      }
      if (force && explicitTravel) {
        const changed = candidateId !== currentId;
        currentId = candidateId;
        previous = nextPosition;
        resetPending();
        last = freeze({ districtId:currentId, changed, pendingDistrictId:'', pendingBoundaryId:'', pendingMs:0, reason:'explicit-reviewed-travel', physicalCrossing:false });
        return last;
      }
      if (!candidateId || candidateId === currentId) {
        previous = nextPosition;
        resetPending();
        last = freeze({ districtId:currentId, changed:false, pendingDistrictId:'', pendingBoundaryId:'', pendingMs:0, reason:'inside-current-district', physicalCrossing:false });
        return last;
      }
      const boundary = boundaryForPair(plan.boundaries, currentId, candidateId);
      if (!boundary) {
        previous = nextPosition;
        resetPending();
        last = freeze({ districtId:currentId, changed:false, pendingDistrictId:candidateId, pendingBoundaryId:'', pendingMs:0, reason:'no-connected-physical-boundary', physicalCrossing:false });
        return last;
      }
      const priorSide = side(boundary, previous, currentId);
      const nextSide = side(boundary, nextPosition, currentId);
      const withinCorridor = lateral(boundary, nextPosition) <= boundary.halfWidth;
      const crossedNow = withinCorridor && priorSide <= 0 && nextSide > 0;
      if (pendingId !== candidateId || pendingBoundaryId !== boundary.id) {
        pendingId = candidateId;
        pendingBoundaryId = boundary.id;
        pendingMs = 0;
        crossingLatched = crossedNow;
      } else if (crossedNow) crossingLatched = true;
      if (!withinCorridor || nextSide <= -boundary.depth) {
        previous = nextPosition;
        resetPending();
        last = freeze({ districtId:currentId, changed:false, pendingDistrictId:candidateId, pendingBoundaryId:boundary.id, pendingMs:0, reason:'outside-authored-boundary-corridor', physicalCrossing:false });
        return last;
      }
      if (!crossingLatched) {
        previous = nextPosition;
        last = freeze({ districtId:currentId, changed:false, pendingDistrictId:candidateId, pendingBoundaryId:boundary.id, pendingMs:0, reason:'approaching-physical-boundary', physicalCrossing:false, lateralDistance:Number(lateral(boundary,nextPosition).toFixed(2)) });
        return last;
      }
      if (nextSide <= 0) {
        previous = nextPosition;
        resetPending();
        last = freeze({ districtId:currentId, changed:false, pendingDistrictId:'', pendingBoundaryId:boundary.id, pendingMs:0, reason:'returned-before-dwell', physicalCrossing:true });
        return last;
      }
      pendingMs += clamp(deltaSeconds, 0, .25) * 1000;
      if (pendingMs < holdMs) {
        previous = nextPosition;
        last = freeze({ districtId:currentId, changed:false, pendingDistrictId:candidateId, pendingBoundaryId:boundary.id, pendingMs:Math.round(pendingMs), requiredHoldMs:holdMs, reason:'crossed-awaiting-dwell', physicalCrossing:true });
        return last;
      }
      currentId = candidateId;
      previous = nextPosition;
      const crossedBoundaryId = boundary.id;
      resetPending();
      last = freeze({ districtId:currentId, changed:true, pendingDistrictId:'', pendingBoundaryId:crossedBoundaryId, pendingMs:0, requiredHoldMs:holdMs, reason:'physical-boundary-and-dwell-confirmed', physicalCrossing:true });
      return last;
    },
    getSnapshot() { return last; },
    getPlan() { return plan; }
  });
}

const TYPE_PRIORITY = freeze({
  'nexus-work-object': 96,
  terminal: 94,
  operator: 86,
  npc: 86,
  nexus: 82,
  station: 76,
  'asset-function': 70,
  discovery: 62,
  landmark: 58,
  'eonbot-dock': 54
});
function candidateId(candidate = {}) {
  return String(candidate.id || candidate.value?.id || candidate.value?.assetId || candidate.value?.entry?.id || candidate.value?.station?.id || candidate.type || 'candidate');
}

export function resolveEonCityW696InteractionTarget(candidates = [], {
  explicitPickId = '', currentDistrictId = '', maxAlternatives = 3
} = {}) {
  const explicit = String(explicitPickId || '');
  const district = clean(currentDistrictId);
  const scored = (Array.isArray(candidates) ? candidates : []).map((candidate) => {
    const id = candidateId(candidate);
    const type = String(candidate.type || candidate.interactionKind || 'landmark');
    const distance = Math.max(0, Number(candidate.distance) || 0);
    const candidateDistrict = clean(candidate.districtId || candidate.value?.districtId || candidate.value?.entry?.districtId || district);
    const explicitBonus = explicit && (id === explicit || candidate.value?.assetId === explicit) ? 1000 : 0;
    const districtBonus = !candidateDistrict || candidateDistrict === district ? 18 : -80;
    const reviewBonus = candidate.reviewFirst === false || candidate.value?.reviewFirst === false ? -25 : 4;
    const score = explicitBonus + (TYPE_PRIORITY[type] || 50) + districtBonus + reviewBonus - distance * 8;
    return freeze({ ...candidate, arbitrationId:id, arbitrationType:type, arbitrationScore:Number(score.toFixed(3)), distance });
  }).sort((left,right) => right.arbitrationScore-left.arbitrationScore || left.distance-right.distance || left.arbitrationId.localeCompare(right.arbitrationId));
  return freeze({
    schema: EON_CITY_W696_INTERACTION_BOUNDARY_HUD_SCHEMA,
    selected: scored[0] || null,
    ordered: freeze(scored),
    alternatives: freeze(scored.slice(1, 1+Math.max(0,Number(maxAlternatives)||0))),
    reason: explicit && scored[0]?.arbitrationScore >= 900 ? 'explicit-world-pick' : scored.length ? 'deterministic-proximity-and-function' : 'no-target',
    oneTargetOnly: true,
    automaticAction: false
  });
}

export function structureEonCityW696Status(message = '') {
  const cleanMessage = String(message || '').replace(/\s+/g,' ').trim();
  if (!cleanMessage) return freeze({ headline:'City ready', detail:'No automatic action is running.' });
  const split = cleanMessage.match(/^(.{1,72}?[.!?])(?:\s+(.+))?$/);
  if (split) return freeze({ headline:split[1], detail:split[2] || 'No automatic action is running.' });
  const colon = cleanMessage.indexOf(':');
  if (colon > 0 && colon < 64) return freeze({ headline:cleanMessage.slice(0,colon+1), detail:cleanMessage.slice(colon+1).trim() || 'No automatic action is running.' });
  return freeze({ headline:cleanMessage.slice(0,72), detail:cleanMessage.length > 72 ? cleanMessage.slice(72).trim() : 'No automatic action is running.' });
}

export function getEonCityW696HudContract() {
  return freeze({
    schema:EON_CITY_W696_INTERACTION_BOUNDARY_HUD_SCHEMA,
    primaryControls:freeze([
      freeze({ id:'interact', label:'Interact', purpose:'Review the one selected nearby target.' }),
      freeze({ id:'districts', label:'Districts', purpose:'Open reviewed Capsule travel and Atlas.' }),
      freeze({ id:'eonbot', label:'EONBOT', purpose:'Open companion guidance without starting voice or work.' }),
      freeze({ id:'more', label:'More', purpose:'Open secondary controls, accessibility, capture and account tools.' })
    ]),
    maximumPersistentPrimaryControls:4,
    secondarySurface:'single-more-bottom-sheet',
    topLeftOwnsTruthfulStatus:true,
    topCentreOwnsTemporaryPlaceIdentity:true,
    bottomCentreOwnsContextAction:true,
    touchTargetPx:48,
    membershipAndCaptureRemainReachableInMore:true,
    hiddenEssentialControls:false
  });
}

export function bindEonCityW696FocusReturn(root, { documentRef = globalThis.document } = {}) {
  if (!root?.addEventListener) return () => {};
  let lastTrigger = null;
  const openerSelector = '[data-eon-play-open-controls],[data-eon-play-open-settings],[data-eon-play-open-eonbot],[data-eon-play-open-travel-map],[data-eon-play-open-membership],[data-eon-play-open-capture],[data-eon-w659n-open]';
  const closeSelector = '[data-eon-play-close-controls],[data-eon-play-close-settings],[data-eon-play-close-eonbot],[data-eon-w659n-close],[data-eon-play-close-membership],[data-eon-play-close-capture]';
  const onClick = (event) => {
    const opener = event.target?.closest?.(openerSelector);
    if (opener) lastTrigger = opener;
    const closer = event.target?.closest?.(closeSelector);
    if (closer && lastTrigger) queueMicrotask(() => { try { if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll:true }); } catch {} });
  };
  const onKeydown = (event) => {
    if (event.key !== 'Escape') return;
    const visibleDialog = [...(root.querySelectorAll?.('[role="dialog"]') || [])].reverse().find((entry)=>entry.hidden === false && entry.getAttribute('aria-hidden') !== 'true');
    const close = visibleDialog?.querySelector?.(closeSelector);
    if (close) { event.preventDefault(); close.click(); }
  };
  root.addEventListener('click', onClick, true);
  documentRef?.addEventListener?.('keydown', onKeydown);
  return () => { root.removeEventListener('click', onClick, true); documentRef?.removeEventListener?.('keydown', onKeydown); };
}

export function getEonCityW696Truth() {
  return freeze({
    schema:EON_CITY_W696_INTERACTION_BOUNDARY_HUD_SCHEMA,
    physicalBoundaryCrossingRequired:true,
    districtDwellRequired:true,
    worldBoundSupportsCompleteCore:true,
    deterministicOneTargetArbitration:true,
    fourPrimaryControls:true,
    secondaryControlsInOneMoreSheet:true,
    minimumTouchTargetPx:48,
    focusReturnRequired:true,
    automaticNavigation:false,
    automaticExecution:false
  });
}

export default freeze({
  EON_CITY_W696_INTERACTION_BOUNDARY_HUD_SCHEMA,
  EON_CITY_W696_WORLD_BOUND,
  buildEonCityW696PhysicalBoundaryPlan,
  createEonCityW696PhysicalDistrictTransitionController,
  resolveEonCityW696InteractionTarget,
  structureEonCityW696Status,
  getEonCityW696HudContract,
  bindEonCityW696FocusReturn,
  getEonCityW696Truth
});
