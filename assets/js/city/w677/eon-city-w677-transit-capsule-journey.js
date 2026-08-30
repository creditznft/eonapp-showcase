/**
 * W677 — reviewed Transit Capsule journey authority.
 *
 * Converts an already reviewed district destination into one bounded visual
 * journey. It does not move the player, open a route, persist data, start AI,
 * or confirm travel by itself. The existing W659F review/confirm contract
 * remains the sole authority for district travel.
 */
import { buildEonCityW674OrientationDistrictBeltPlan } from '../w674/eon-city-w674-orientation-district-belt.js';
import { EON_CITY_W675_PRODUCT_DISTRICTS, projectEonCityW675TransportDestination } from '../w675/eon-city-w675-orientation-belt-activation.js';

export const EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA = 'eon.city.transit-capsule-journey.w677.v1';
export const EON_CITY_W677_TRANSIT_MODES = Object.freeze(['ride', 'skip']);

const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const point = (value = {}) => freeze({ x: Number(value?.x) || 0, y: Number(value?.y) || 0, z: Number(value?.z) || 0 });

function destinationById(id = '') {
  const district = EON_CITY_W675_PRODUCT_DISTRICTS.find((entry) => entry.id === String(id || '').trim().toLowerCase());
  return district ? projectEonCityW675TransportDestination(district) : null;
}

export function buildEonCityW677TransitCapsuleJourney(destinationId = '', { mode = 'ride', fromDistrictId = 'orientation-hall' } = {}) {
  const destination = destinationById(destinationId);
  if (!destination) return null;
  const resolvedMode = EON_CITY_W677_TRANSIT_MODES.includes(String(mode)) ? String(mode) : 'ride';
  const station = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'balanced', mode: 'explore' }).station;
  const origin = destinationById(fromDistrictId) || destinationById('orientation-hall');
  const from = origin?.id === 'orientation-hall' ? point(station.position) : point({ x: origin?.x, y: 0, z: origin?.z });
  const to = point({ x: destination.x, y: 0, z: destination.z });
  const distance = Number(Math.hypot(to.x - from.x, to.z - from.z).toFixed(2));
  const durationMs = resolvedMode === 'skip' ? 0 : Math.round(clamp(1_850 + distance * 55, 1_850, 4_200));
  const phases = resolvedMode === 'skip'
    ? freeze([freeze({ id: 'reviewed', at: 0 }), freeze({ id: 'arrived', at: 1 })])
    : freeze([
        freeze({ id: 'reviewed', at: 0 }),
        freeze({ id: 'boarding', at: 0.12 }),
        freeze({ id: 'departing', at: 0.28 }),
        freeze({ id: 'in-transit', at: 0.72 }),
        freeze({ id: 'arriving', at: 0.92 }),
        freeze({ id: 'arrived', at: 1 })
      ]);
  return freeze({
    schema: EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA,
    mode: resolvedMode,
    fromDistrictId: origin?.id || 'orientation-hall',
    destinationId: destination.id,
    destinationLabel: destination.label,
    from,
    to,
    heading: Number(destination.heading) || 0,
    distance,
    durationMs,
    phases,
    stationId: station.id,
    capsuleAssetPreference: station.capsuleAssetPreference,
    skipRideAvailable: true,
    boardingRequiresReview: true,
    separateTravelConfirmationRequired: true,
    automaticTravel: false,
    routeOpened: false,
    workExecuted: false,
    privateDataTransferred: false,
    networkRequestCreated: false
  });
}

export function resolveEonCityW677TransitPhase(journey = {}, progress = 0) {
  const phases = Array.isArray(journey?.phases) ? journey.phases : [];
  const value = clamp(progress, 0, 1);
  return phases.filter((entry) => Number(entry.at) <= value).at(-1)?.id || 'reviewed';
}

export function createEonCityW677TransitCapsuleController({ now = () => Date.now() } = {}) {
  let state = freeze({ schema: EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA, status: 'idle', active: false, progress: 0, phase: 'idle', journey: null, receiptId: '' });
  return freeze({
    begin(journey = null, { explicitUserAction = false, receiptId = '' } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
      if (!journey || journey.schema !== EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA) return freeze({ ok: false, reason: 'transit-journey-invalid', state });
      const startedAt = Number(now()) || 0;
      state = freeze({ schema: EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA, status: journey.mode === 'skip' ? 'complete' : 'active', active: journey.mode !== 'skip', progress: journey.mode === 'skip' ? 1 : 0, phase: journey.mode === 'skip' ? 'arrived' : 'boarding', journey, receiptId: String(receiptId || ''), startedAt, completedAt: journey.mode === 'skip' ? startedAt : 0 });
      return freeze({ ok: true, state });
    },
    update(at = now()) {
      if (!state.active || !state.journey) return state;
      const elapsedMs = Math.max(0, Number(at) - Number(state.startedAt));
      const progress = clamp(elapsedMs / Math.max(1, Number(state.journey.durationMs) || 1), 0, 1);
      const complete = progress >= 1;
      state = freeze({ ...state, status: complete ? 'complete' : 'active', active: !complete, progress: Number(progress.toFixed(4)), phase: resolveEonCityW677TransitPhase(state.journey, progress), completedAt: complete ? Number(at) : 0 });
      return state;
    },
    cancel({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
      state = freeze({ schema: EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA, status: 'cancelled', active: false, progress: 0, phase: 'cancelled', journey: null, receiptId: '' });
      return freeze({ ok: true, state });
    },
    getSnapshot() { return state; }
  });
}

export function getEonCityW677TransitCapsuleTruth() {
  return freeze({
    schema: EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA,
    usesExistingTravelReviewAndReceipt: true,
    rideAndSkipModes: true,
    physicalCapsuleAnimationBounded: true,
    explicitBoardingRequired: true,
    automaticTravel: false,
    routeOpened: false,
    workExecuted: false,
    privateDataTransferred: false,
    networkRequestCreated: false
  });
}
