/** RT91 Signal — deterministic readable route/ground language without pathfinding ownership. */
import { EON_EXPANSE_W766_ROUTE_SEGMENTS, EON_EXPANSE_W766_ZONES } from '../../w766/eon-expanse-w766-region-contract.js';
import { getEonCityRt91SignalZoneIdentity } from './eon-city-rt91-signal-zone-identity.js';

export const EON_CITY_RT91_SIGNAL_ROUTE_LANGUAGE_SCHEMA = 'eon.city.signal.route-language.rt91.v1';
const freeze = Object.freeze;

const midpoint = (a, b) => freeze({ x: Number(((a.x + b.x) / 2).toFixed(2)), z: Number(((a.z + b.z) / 2).toFixed(2)) });

export function buildEonCityRt91SignalRouteLanguage({ restorationByZone = {} } = {}) {
  const zones = new Map(EON_EXPANSE_W766_ZONES.map((zone) => [zone.id, zone]));
  const segments = EON_EXPANSE_W766_ROUTE_SEGMENTS.map((segment, index) => {
    const from = zones.get(segment.fromZoneId);
    const to = zones.get(segment.toZoneId);
    const fromIdentity = getEonCityRt91SignalZoneIdentity(segment.fromZoneId);
    const toIdentity = getEonCityRt91SignalZoneIdentity(segment.toZoneId);
    const ratio = Math.max(0, Math.min(1, Number(restorationByZone?.[segment.toZoneId] ?? restorationByZone?.[segment.fromZoneId] ?? 0)));
    return freeze({
      id: segment.id,
      order: index,
      fromZoneId: segment.fromZoneId,
      toZoneId: segment.toZoneId,
      width: segment.width,
      midpoint: midpoint(from, to),
      visualState: ratio >= 0.999 ? 'restored' : ratio > 0 ? 'restoring' : 'damaged',
      treatment: freeze({
        groundTrace: ratio >= 0.999 ? 'continuous-emissive-route-strip' : ratio > 0 ? 'intermittent-repair-route-strip' : 'fractured-dark-route-strip',
        cableState: ratio >= 0.999 ? 'energized-relay-cables' : 'broken-relay-cables',
        lampState: ratio >= 0.999 ? 'sequenced' : ratio > 0 ? 'partial' : 'sparse-warning',
        debrisDensity: ratio >= 0.999 ? 'low' : ratio > 0 ? 'medium' : 'medium-high',
        fromLanguage: fromIdentity?.routeLanguage || '',
        toLanguage: toIdentity?.routeLanguage || ''
      }),
      navigationAuthority: false,
      collisionAuthority: false,
      missionCompletionAuthority: false,
      interactive: false
    });
  });
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_ROUTE_LANGUAGE_SCHEMA,
    segments: freeze(segments),
    segmentCount: segments.length,
    routeContinuityRequired: true,
    hardWorldEdgeShown: false,
    decorativeGroundSupportOnly: true,
    ownsNavigation: false,
    ownsRenderLoop: false
  });
}

export function validateEonCityRt91SignalRouteLanguage(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_SIGNAL_ROUTE_LANGUAGE_SCHEMA || plan.segmentCount !== EON_EXPANSE_W766_ROUTE_SEGMENTS.length) errors.push('segments');
  for (const segment of plan.segments || []) {
    if (!['damaged', 'restoring', 'restored'].includes(segment.visualState)) errors.push(`state:${segment.id}`);
    if (!segment.treatment?.groundTrace || !segment.treatment?.cableState || !segment.treatment?.lampState) errors.push(`treatment:${segment.id}`);
    if (segment.navigationAuthority || segment.collisionAuthority || segment.missionCompletionAuthority || segment.interactive) errors.push(`authority:${segment.id}`);
  }
  if (plan.hardWorldEdgeShown !== false || plan.ownsNavigation !== false || plan.ownsRenderLoop !== false) errors.push('runtime-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), segmentCount: plan.segments?.length || 0 });
}

export default freeze({ EON_CITY_RT91_SIGNAL_ROUTE_LANGUAGE_SCHEMA, buildEonCityRt91SignalRouteLanguage, validateEonCityRt91SignalRouteLanguage });
