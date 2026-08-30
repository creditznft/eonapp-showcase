/** W659F — explicit review/confirm district travel with local receipts. */
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';
import { EON_CITY_W660I_DISTRICTS } from '../w660i/eon-city-w660i-district-config.js';
import { projectEonCityW675TransportDestination } from '../w675/eon-city-w675-orientation-belt-activation.js';
import { projectEonCityW688TransportDestination } from '../w688/eon-city-w688-creator-forge-belt-activation.js';
import { projectEonCityW689TransportDestination } from '../w689/eon-city-w689-all-district-belts.js';
import { buildEonCityW677TransitCapsuleJourney } from '../w677/eon-city-w677-transit-capsule-journey.js';
export const EON_CITY_W659F_TRANSPORT_SCHEMA = 'eon.city.w659f.transport.v1';
const freeze = (value) => Object.freeze(value);
export const EON_CITY_W659F_DESTINATIONS = freeze(EON_CITY_W660I_DISTRICTS.map((entry) => projectEonCityW689TransportDestination(entry) || projectEonCityW688TransportDestination(entry) || projectEonCityW675TransportDestination(entry)));
const DESTINATIONS = EON_CITY_W659F_DESTINATIONS;
const byId = new Map(DESTINATIONS.map((entry) => [entry.id, entry]));

export function createEonCityW659fTransportRuntime({ now = () => Date.now() } = {}) {
  let pending = null;
  const receipts = [];
  return freeze({
    listDestinations() { return DESTINATIONS; },
    request(destinationId = '', { explicitUserAction = false, fromDistrictId = '' } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const destination = byId.get(normalizeEonCityDistrictId(destinationId));
      if (!destination) return freeze({ ok: false, reason: 'unknown-destination' });
      const token = `travel-${now()}-${Math.random().toString(36).slice(2, 8)}`;
      pending = freeze({ token, destination, fromDistrictId: normalizeEonCityDistrictId(fromDistrictId), requestedAt: now(), expiresAt: now() + 30_000 });
      return freeze({ ok: true, reviewRequired: true, token, destination, autoTravel: false, localOnly: true });
    },
    confirm(token = '', { explicitUserAction = false, travelMode = 'ride' } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!pending || pending.token !== token) return freeze({ ok: false, reason: 'travel-review-missing' });
      if (now() > pending.expiresAt) { pending = null; return freeze({ ok: false, reason: 'travel-review-expired' }); }
      const journey = buildEonCityW677TransitCapsuleJourney(pending.destination.id, { mode: travelMode, fromDistrictId: pending.fromDistrictId });
      if (!journey) { pending = null; return freeze({ ok: false, reason: 'transit-journey-unavailable' }); }
      const receipt = freeze({ schema: EON_CITY_W659F_TRANSPORT_SCHEMA, id: `receipt-${now()}`, destinationId: pending.destination.id, destinationLabel: pending.destination.label, confirmedAt: now(), travelMode: journey.mode, journeySchema: journey.schema, visualRidePlanned: journey.mode === 'ride', skipRide: journey.mode === 'skip', localOnly: true, routeOpened: false, workExecuted: false, privateDataTransferred: false });
      const destination = pending.destination;
      pending = null;
      receipts.unshift(receipt);
      if (receipts.length > 12) receipts.length = 12;
      return freeze({ ok: true, destination, receipt, journey });
    },
    cancel() { pending = null; return true; },
    getSnapshot() { return freeze({ schema: EON_CITY_W659F_TRANSPORT_SCHEMA, pending, receipts: freeze([...receipts]), destinationCount: DESTINATIONS.length, autoTravel: false, localOnly: true }); }
  });
}
