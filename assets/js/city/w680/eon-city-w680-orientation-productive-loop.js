/**
 * W680 — complete Orientation Hall resident + terminal productivity loop.
 *
 * Every loop connects one visible resident to a real local terminal or
 * functional building, then to an existing native EONAPP surface. Review and
 * final route confirmation remain separate user actions. No work is invented,
 * executed or stored by this module.
 */
import { buildEonCityW674OrientationDistrictBeltPlan } from '../w674/eon-city-w674-orientation-district-belt.js';

export const EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOP_SCHEMA = 'eon.city.orientation-productive-loop.w680.v1';
const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').trim();

const plan = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'cinematic', mode: 'explore' });
const residentById = new Map(plan.residents.map((entry) => [entry.id, entry]));
const terminalById = new Map(plan.terminals.map((entry) => [entry.id, entry]));
const buildingByLabel = new Map(plan.buildings.map((entry) => [entry.label, entry]));

function loop(source = {}) {
  const resident = residentById.get(source.residentId);
  const terminal = source.terminalId ? terminalById.get(source.terminalId) : null;
  const building = source.buildingLabel ? buildingByLabel.get(source.buildingLabel) : null;
  if (!resident || (!terminal && !building)) throw new Error(`w680-loop-authority-missing:${source.id}`);
  const destination = terminal || building;
  return freeze({
    schema: EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOP_SCHEMA,
    id: source.id,
    label: source.label,
    residentId: resident.id,
    residentLabel: resident.label,
    residentAssetId: resident.preferredAssetId,
    residentRole: resident.role,
    residentPosition: freeze({ ...resident.anchor }),
    interactionRadius: 3.4,
    terminalId: terminal?.id || null,
    buildingId: building?.id || null,
    destinationLabel: destination.label,
    destinationPosition: freeze({ ...destination.position }),
    route: source.route || destination.route || '',
    panel: source.panel || '',
    purpose: source.purpose,
    handoff: freeze([
      freeze({ id: 'greet', label: `Talk to ${resident.label}`, state: 'talk', explicitUserAction: true }),
      freeze({ id: 'inspect', label: `Inspect ${destination.label}`, state: 'inspect', explicitUserAction: true }),
      freeze({ id: 'review', label: source.reviewLabel, state: 'review', explicitUserAction: true }),
      freeze({ id: 'confirm', label: source.confirmLabel, state: 'confirm', explicitUserAction: true })
    ]),
    reviewRequired: true,
    separateRouteConfirmationRequired: Boolean(source.route || destination.route),
    automaticWork: false,
    automaticNavigation: false,
    privateDataRead: false,
    localOnly: true
  });
}

export const EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS = freeze([
  loop({ id: 'orientation-start-here-loop', label: 'Arrival orientation', residentId: 'orientation-architect', terminalId: 'start-here-terminal', route: '/help', purpose: 'Understand the City controls, Atlas and safe action boundaries.', reviewLabel: 'Review the guided start checklist', confirmLabel: 'Open Help after route review' }),
  loop({ id: 'orientation-device-loop', label: 'Device readiness', residentId: 'device-guide', terminalId: 'device-guidance-terminal', route: '/local-ai', purpose: 'Review device capability and local AI setup without changing settings automatically.', reviewLabel: 'Review device guidance', confirmLabel: 'Open Local AI after route review' }),
  loop({ id: 'orientation-mission-loop', label: 'Verified mission continuation', residentId: 'mission-operator', terminalId: 'missions-rewards-terminal', route: '/projects', purpose: 'Review verified mission progress and continue a real project.', reviewLabel: 'Review current mission status', confirmLabel: 'Open Projects after route review' }),
  loop({ id: 'orientation-arrival-gallery-loop', label: 'EONAPP discovery', residentId: 'arrival-citizen', buildingLabel: 'Arrival Gallery', route: '/about', purpose: 'Explore what EONAPP contains and return to the Atlas without fake activity.', reviewLabel: 'Review EONAPP discovery points', confirmLabel: 'Open About after route review' }),
  loop({ id: 'orientation-device-clinic-loop', label: 'Device clinic inspection', residentId: 'maintenance-worker', buildingLabel: 'Device Clinic', route: '/local-ai', purpose: 'Inspect public device-readiness cues and continue only after review.', reviewLabel: 'Review clinic findings', confirmLabel: 'Open Local AI after route review' }),
  loop({ id: 'orientation-project-liaison-loop', label: 'Project handoff', residentId: 'project-liaison', buildingLabel: 'Mission Commons', route: '/projects', purpose: 'Connect the physical City interaction to an existing project without copying private content into the scene.', reviewLabel: 'Review the project handoff', confirmLabel: 'Open Projects after route review' })
]);

const byId = new Map(EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS.map((entry) => [entry.id, entry]));
const byResidentId = new Map(EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS.map((entry) => [entry.residentId, entry]));
const byAssetId = new Map(EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS.map((entry) => [entry.residentAssetId, entry]));
const byTerminalId = new Map(EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS.filter((entry) => entry.terminalId).map((entry) => [entry.terminalId, entry]));
const byBuildingId = new Map(EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS.filter((entry) => entry.buildingId).map((entry) => [entry.buildingId, entry]));

export function getEonCityW680OrientationProductiveLoop(id = '') { return byId.get(clean(id)) || null; }
export function getEonCityW680OrientationProductiveLoopForResident(id = '') { return byResidentId.get(clean(id)) || byAssetId.get(clean(id)) || null; }
export function getEonCityW680OrientationProductiveLoopForTerminal(id = '') { return byTerminalId.get(clean(id)) || null; }
export function getEonCityW680OrientationProductiveLoopForBuilding(id = '') { return byBuildingId.get(clean(id)) || null; }

export function createEonCityW680OrientationProductiveLoopController({ now = () => Date.now() } = {}) {
  let state = freeze({
    schema: `${EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOP_SCHEMA}.controller.v1`,
    status: 'idle',
    loopId: null,
    stage: null,
    reviewedAt: 0,
    confirmedActionId: null,
    receipt: null,
    localOnly: true
  });

  const preview = (loopId = '') => {
    const selected = getEonCityW680OrientationProductiveLoop(loopId);
    return selected ? freeze({ ok: true, loop: selected, reviewRequired: true, automaticWork: false }) : freeze({ ok: false, reason: 'productive-loop-unavailable', state });
  };

  const beginReview = (loopId = '', { explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
    const selected = getEonCityW680OrientationProductiveLoop(loopId);
    if (!selected) return freeze({ ok: false, reason: 'productive-loop-unavailable', state });
    const reviewedAt = Number(now()) || Date.now();
    state = freeze({
      schema: `${EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOP_SCHEMA}.controller.v1`,
      status: 'reviewed',
      loopId: selected.id,
      stage: 'review',
      reviewedAt,
      confirmedActionId: null,
      receipt: freeze({ id: `w680:${selected.id}:${reviewedAt}`, loopId: selected.id, reviewedAt, containsPrivateData: false, workExecuted: false }),
      localOnly: true
    });
    return freeze({ ok: true, loop: selected, state, separateRouteConfirmationRequired: selected.separateRouteConfirmationRequired });
  };

  const confirmAction = (actionId = '', { explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
    const selected = getEonCityW680OrientationProductiveLoop(state.loopId || '');
    if (!selected || state.status !== 'reviewed') return freeze({ ok: false, reason: 'productive-loop-review-required', state });
    const confirmedAt = Number(now()) || Date.now();
    state = freeze({
      ...state,
      status: 'action-reviewed',
      stage: 'confirm',
      confirmedActionId: clean(actionId) || 'reviewed-destination',
      receipt: freeze({ ...state.receipt, confirmedAt, actionId: clean(actionId) || 'reviewed-destination', routeOpened: false, workExecuted: false })
    });
    return freeze({ ok: true, loop: selected, state, route: selected.route, panel: selected.panel, routeOpened: false, workExecuted: false });
  };

  const reset = () => {
    state = freeze({ schema: `${EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOP_SCHEMA}.controller.v1`, status: 'idle', loopId: null, stage: null, reviewedAt: 0, confirmedActionId: null, receipt: null, localOnly: true });
    return state;
  };

  return freeze({ preview, beginReview, confirmAction, reset, getSnapshot: () => state });
}

export function validateEonCityW680OrientationProductiveLoops(entries = EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS) {
  const errors = [];
  const ids = new Set();
  const residents = new Set();
  for (const entry of entries || []) {
    if (!entry.id || ids.has(entry.id)) errors.push(`id:${entry.id || 'missing'}`);
    ids.add(entry.id);
    if (!entry.residentId || residents.has(entry.residentId)) errors.push(`resident:${entry.residentId || 'missing'}`);
    residents.add(entry.residentId);
    if (!entry.destinationLabel || !entry.purpose || entry.handoff?.length !== 4) errors.push(`handoff:${entry.id}`);
    if (!entry.reviewRequired || entry.automaticWork || entry.automaticNavigation || entry.privateDataRead) errors.push(`truth:${entry.id}`);
  }
  return freeze({ ok: errors.length === 0 && entries.length === plan.residents.length, errors: freeze(errors), loopCount: entries.length, residentCount: residents.size });
}

export function getEonCityW680OrientationProductiveLoopTruth() {
  return freeze({
    schema: EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOP_SCHEMA,
    everyOrientationResidentHasProductiveLoop: true,
    residentsPairedToTerminalOrFunctionalBuilding: true,
    existingNativeDestinationsOnly: true,
    reviewAndRouteConfirmationSeparated: true,
    automaticWork: false,
    automaticNavigation: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOP_SCHEMA,
  EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS,
  getEonCityW680OrientationProductiveLoop,
  getEonCityW680OrientationProductiveLoopForResident,
  getEonCityW680OrientationProductiveLoopForTerminal,
  getEonCityW680OrientationProductiveLoopForBuilding,
  createEonCityW680OrientationProductiveLoopController,
  validateEonCityW680OrientationProductiveLoops,
  getEonCityW680OrientationProductiveLoopTruth
});
