/**
 * W678 — readable Expanse threshold and Atlas projection.
 *
 * Gives the Orientation Hall gateway a visible continuation corridor and a
 * truthful Atlas node. This module creates only deterministic public geometry
 * descriptors; it performs no entry, travel, storage, AI work or networking.
 */
import { buildEonCityW674OrientationDistrictBeltPlan } from '../w674/eon-city-w674-orientation-district-belt.js';

export const EON_CITY_W678_EXPANSE_THRESHOLD_SCHEMA = 'eon.city.expanse-threshold.w678.v1';
const freeze = (value) => Object.freeze(value);
const QUALITY = freeze({ lite: 5, balanced: 9, cinematic: 14 });
const point = (value = {}) => freeze({ x: Number(value?.x) || 0, y: Number(value?.y) || 0, z: Number(value?.z) || 0 });

export function buildEonCityW678ExpanseThresholdPlan({ quality = 'balanced', mode = 'explore' } = {}) {
  const resolvedQuality = Object.hasOwn(QUALITY, String(quality)) ? String(quality) : 'balanced';
  const belt = buildEonCityW674OrientationDistrictBeltPlan({ quality: resolvedQuality, mode });
  const gate = belt.expanseGate;
  const dx = Number(gate.position.x) - Number(belt.center.x);
  const dz = Number(gate.position.z) - Number(belt.center.z);
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const direction = freeze({ x: dx / length, z: dz / length });
  const perpendicular = freeze({ x: -direction.z, z: direction.x });
  const corridor = freeze([0, 1, 2, 3].map((index) => {
    const startDistance = 2.2 + index * 5.5;
    const endDistance = startDistance + 5.7;
    return freeze({
      id: `expanse-approach-${index + 1}`,
      from: point({ x: gate.position.x + direction.x * startDistance, z: gate.position.z + direction.z * startDistance }),
      to: point({ x: gate.position.x + direction.x * endDistance, z: gate.position.z + direction.z * endDistance }),
      width: index === 0 ? 4.6 : 4.1,
      interactive: false
    });
  }));
  const skylineCount = QUALITY[resolvedQuality];
  const skyline = freeze(Array.from({ length: skylineCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const forward = 8.5 + row * 4.3;
    const lateral = side * (4.4 + (row % 3) * 1.35);
    return freeze({
      id: `expanse-horizon-${index + 1}`,
      position: point({ x: gate.position.x + direction.x * forward + perpendicular.x * lateral, z: gate.position.z + direction.z * forward + perpendicular.z * lateral }),
      width: 2.4 + (index % 3) * 0.7,
      depth: 2.1 + ((index + 1) % 3) * 0.55,
      height: 3.8 + (index % 5) * 1.45,
      silhouetteOnly: true,
      containsPrivateData: false
    });
  }));
  return freeze({
    schema: EON_CITY_W678_EXPANSE_THRESHOLD_SCHEMA,
    quality: resolvedQuality,
    mode: mode === 'focus' ? 'focus' : 'explore',
    gatewayId: gate.id,
    label: 'The Expanse',
    position: point(gate.position),
    direction,
    corridor,
    skyline,
    horizonBeacon: point({ x: gate.position.x + direction.x * 30, y: 3.4, z: gate.position.z + direction.z * 30 }),
    atlasNode: freeze({ id: 'expanse-gateway', label: 'The Expanse', purpose: 'Flagship seeded open world: nine visible regions, populated streets, discoveries and Realms.', x: 50, y: 3, accent: '#ad78ff', warm: '#ffc45c', gatewayId: gate.id, guideOnly: true, permanent: true, flagship: true }),
    previewOnlyUntilConfirmedEntry: true,
    explicitInspectionRequired: true,
    oneReviewThenOneConfirmation: true,
    hiddenSecondDistanceThreshold: false,
    separateEntryConfirmationRequired: true,
    automaticEntry: false,
    runtimeAiGeometry: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export function projectEonCityW678AtlasModel(atlas = {}, options = {}) {
  const threshold = buildEonCityW678ExpanseThresholdPlan(options);
  const nodes = Array.isArray(atlas?.nodes) ? atlas.nodes : [];
  const links = Array.isArray(atlas?.links) ? atlas.links : [];
  return freeze({
    ...atlas,
    schema: `${EON_CITY_W678_EXPANSE_THRESHOLD_SCHEMA}.atlas.v1`,
    nodes: freeze([...nodes, threshold.atlasNode]),
    links: freeze([...links, freeze({ id: 'orientation-hall:expanse-gateway', from: 'orientation-hall', to: 'expanse-gateway', gateway: true })]),
    expanseGatewayId: threshold.gatewayId,
    expanseGuideOnly: true,
    expansePermanentNode: true,
    expanseFlagship: true,
    automaticEntry: false
  });
}

export function getEonCityW678ExpanseThresholdTruth() {
  return freeze({
    schema: EON_CITY_W678_EXPANSE_THRESHOLD_SCHEMA,
    visibleWorldContinuationBeyondGate: true,
    readableAtlasNode: true,
    guideBeforeEntry: true,
    explicitInspectionRequired: true,
    oneReviewThenOneConfirmation: true,
    hiddenSecondDistanceThreshold: false,
    separateEntryConfirmationRequired: true,
    automaticEntry: false,
    runtimeAiGeometry: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}
