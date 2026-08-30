/**
 * W660Y — physically connected nine-district EONCITY Core plan.
 *
 * This is a public-safe deterministic presentation contract. It connects the
 * existing W660I district authority with roads, pedestrian links, one visible
 * transit loop, bounded ambient schedules and EONBOT docks. It does not move
 * product data, execute work, open routes, create rewards or read identity.
 */
// Predecessor authority retained in the W675 contract: EON_CITY_W675_PRODUCT_DISTRICTS.
// Predecessor authority retained in the W688 contract: EON_CITY_W688_PRODUCT_DISTRICTS.
import { EON_CITY_W689_PRODUCT_DISTRICTS } from './w689/eon-city-w689-all-district-belts.js';
import { buildEonCityW690CompleteCoreIdentityPlan, validateEonCityW690CompleteCoreIdentityPlan } from './w690/eon-city-w690-complete-core-identity.js';
import { buildEonCityW674OrientationDistrictBeltPlan } from './w674/eon-city-w674-orientation-district-belt.js';
import { buildEonCityW673HybridMetropolisPlan, validateEonCityW673HybridMetropolisPlan } from './w673/eon-city-w673-hybrid-metropolis-plan.js';
import { buildEonCityW710ContinuousCoreFabric, validateEonCityW710ContinuousCoreFabric } from './w710/eon-city-w710-continuous-core-fabric.js';
import { buildEonCityW711DistrictStreetIdentity, validateEonCityW711DistrictStreetIdentity } from './w711/eon-city-w711-district-street-identity.js';
import { projectEonCityW712GatewayContract } from './w712/eon-city-w712-flagship-expanse-entry.js';

export const EON_CITY_CONNECTED_CORE_SCHEMA = 'eon.city.connected-core.w660y.v1';
const orientationBeltAuthority = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'balanced', mode: 'explore' });
const orientationGateDx = Number(orientationBeltAuthority.expanseGate.position.x) - Number(orientationBeltAuthority.center.x);
const orientationGateDz = Number(orientationBeltAuthority.expanseGate.position.z) - Number(orientationBeltAuthority.center.z);
const orientationGateLength = Math.max(0.001, Math.hypot(orientationGateDx, orientationGateDz));
const orientationGateApproachDistance = 3.4;
export const EON_CITY_CONNECTED_CORE_GATEWAY = projectEonCityW712GatewayContract({
  id: 'living-nexus-core-gateway',
  sourceGatewayId: orientationBeltAuthority.expanseGate.id,
  label: orientationBeltAuthority.expanseGate.label,
  districtId: 'orientation-hall',
  x: orientationBeltAuthority.expanseGate.position.x,
  y: 2.6,
  z: orientationBeltAuthority.expanseGate.position.z,
  heading: 0,
  inspectRadius: orientationBeltAuthority.expanseGate.inspectRadius,
  enterRadius: orientationBeltAuthority.expanseGate.enterRadius,
  entryReadyRadius: orientationBeltAuthority.expanseGate.entryReadyRadius,
  discoveryRadius: orientationBeltAuthority.expanseGate.discoveryRadius,
  approachX: Number(orientationBeltAuthority.expanseGate.position.x) - (orientationGateDx / orientationGateLength) * orientationGateApproachDistance,
  approachZ: Number(orientationBeltAuthority.expanseGate.position.z) - (orientationGateDz / orientationGateLength) * orientationGateApproachDistance,
  destination: 'expanse',
  silhouette: 'purposeful violet-gold district threshold with a grounded review lane',
  eonbotIntroduction: 'This is the Orientation District Expanse Gate. Beyond it, discoveries, Atlas return points and Realm signals become physical world actions.'
});
const freeze = (value) => Object.freeze(value);
const QUALITY = freeze({
  lite: freeze({ capsuleCount: 1, ambientNpcCount: 5, lampSpacing: 4.8, motionEnabled: false }),
  balanced: freeze({ capsuleCount: 2, ambientNpcCount: 9, lampSpacing: 3.5, motionEnabled: true }),
  cinematic: freeze({ capsuleCount: 3, ambientNpcCount: 14, lampSpacing: 2.7, motionEnabled: true })
});

export const EON_CITY_CONNECTED_CORE_TRANSIT_ORDER = freeze([
  'transit-network', 'orientation-hall', 'archive-canopy', 'vault-station', 'agent-theatre',
  'forge-basilica', 'command-centre', 'creator-atrium', 'trade-dome'
]);

const SCHEDULES = freeze([
  freeze({ id: 'guide-shift', label: 'Guide shift', districtId: 'orientation-hall', activity: 'welcome, inspect map, return to guide station' }),
  freeze({ id: 'capsule-dispatch', label: 'Capsule dispatch', districtId: 'transit-network', activity: 'inspect platform, signal capsule, verify route board' }),
  freeze({ id: 'review-cycle', label: 'Review cycle', districtId: 'agent-theatre', activity: 'wait at receipt dais, inspect proposal signal, return to theatre' }),
  freeze({ id: 'creator-round', label: 'Creator round', districtId: 'creator-atrium', activity: 'visit capture console, inspect gallery, dock at command seat' }),
  freeze({ id: 'forge-round', label: 'Forge round', districtId: 'forge-basilica', activity: 'inspect workbench, cross build lane, return to reactor' }),
  freeze({ id: 'command-watch', label: 'Command watch', districtId: 'command-centre', activity: 'inspect city table, scan horizon, return to command post' }),
  freeze({ id: 'archive-index', label: 'Archive index', districtId: 'archive-canopy', activity: 'walk canopy, inspect index, return to library terminal' }),
  freeze({ id: 'vault-patrol', label: 'Vault patrol', districtId: 'vault-station', activity: 'inspect custody gate, cross recovery arch, return to station' }),
  freeze({ id: 'trade-circuit', label: 'Trade circuit', districtId: 'trade-dome', activity: 'inspect plan board, cross dome, return to public terminal' })
]);

const PRODUCT_DISTRICTS = EON_CITY_W689_PRODUCT_DISTRICTS;
function normalizedQuality(value = 'balanced') { return QUALITY[String(value)] ? String(value) : 'balanced'; }
function transformationIds(entries = []) { return new Set((Array.isArray(entries) ? entries : []).map((entry) => String(entry?.id || '')).filter(Boolean)); }

export function buildEonCityConnectedCorePlan({ quality = 'balanced', reducedEffects = false, mode = 'explore', transformations = [] } = {}) {
  const resolvedQuality = normalizedQuality(quality);
  const profile = QUALITY[resolvedQuality];
  const hybridMetropolis = buildEonCityW673HybridMetropolisPlan({ quality: resolvedQuality, mode });
  const completeCoreIdentity = buildEonCityW690CompleteCoreIdentityPlan({ quality: resolvedQuality, mode, reducedEffects });
  const transformed = transformationIds(transformations);
  const districts = freeze(completeCoreIdentity.districts.map((entry, index) => freeze({
    id: entry.id, label: entry.label, purpose: entry.purpose, center: freeze({ ...entry.center }), radius: entry.radius,
    palette: freeze({ ...entry.palette }), signature: entry.signature, signatureLandmarkId: entry.signatureLandmarkId,
    terminalCount: entry.terminals.length, skylineCount: PRODUCT_DISTRICTS.find((district) => district.id === entry.id)?.skyline?.length || 0,
    stationId: entry.station.id, eonbotDockId: entry.eonbotDock.id,
    identity: entry.identity, functionalIdentity: entry.functionalIdentity,
    transformationActive: [...transformed].some((id) => id.includes(entry.id) || id.includes(entry.signature)),
    ambientSchedule: SCHEDULES.find((schedule) => schedule.districtId === entry.id) || SCHEDULES[index % SCHEDULES.length],
    privateContentStored: false
  })));
  const allEdges = freeze([...completeCoreIdentity.streetConnections]);
  const stations = freeze([...completeCoreIdentity.transitLoop.stations]);
  const transitPath = freeze([...completeCoreIdentity.transitLoop.path]);
  const eonbotDocks = freeze(completeCoreIdentity.districts.map((entry) => freeze({ id: entry.eonbotDock.id, districtId: entry.id, x: entry.eonbotDock.position.x, y: entry.eonbotDock.position.y, z: entry.eonbotDock.position.z, localOnly: true, automaticDocking: false, explicitCallRequired: true })));
  const continuousFabric = buildEonCityW710ContinuousCoreFabric({ districts, streetConnections: allEdges, physicalGateway: EON_CITY_CONNECTED_CORE_GATEWAY, quality: resolvedQuality });
  const districtStreetIdentity = buildEonCityW711DistrictStreetIdentity({ districts: completeCoreIdentity.districts });
  return freeze({
    schema: EON_CITY_CONNECTED_CORE_SCHEMA,
    quality: resolvedQuality,
    mode: mode === 'focus' ? 'focus' : 'explore',
    reducedEffects: Boolean(reducedEffects),
    motionEnabled: !reducedEffects && profile.motionEnabled && mode !== 'focus',
    districts, hybridMetropolis, completeCoreIdentity, continuousFabric, districtStreetIdentity, streetConnections: allEdges, transitLoop: freeze({ id: 'eoncity-core-loop', label: 'EONCITY Core Loop', closed: true, path: transitPath, stations, capsuleCount: completeCoreIdentity.transitLoop.capsuleCount, motionEnabled: !reducedEffects && profile.motionEnabled && mode !== 'focus', visible: true, automaticTravel: false, explicitReviewRequired: true }),
    livingStreets: freeze({ schedules: freeze(SCHEDULES.slice(0, profile.ambientNpcCount)), ambientNpcCount: Math.min(profile.ambientNpcCount, SCHEDULES.length), lampSpacing: profile.lampSpacing, publicSafeOnly: true }),
    eonbotDocks,
    physicalGateway: EON_CITY_CONNECTED_CORE_GATEWAY,
    focusModeFastTravelRetained: true,
    districtFastTravelRetained: true,
    physicalWalkingSupported: true,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    deterministic: true,
    localOnly: true
  });
}

export function validateEonCityConnectedCorePlan(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_CONNECTED_CORE_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(plan?.districts) || plan.districts.length !== 9 || new Set(plan.districts.map((entry) => entry.id)).size !== 9) errors.push('nine-districts-required');
  const hybridValidation = validateEonCityW673HybridMetropolisPlan(plan?.hybridMetropolis || {});
  if (!hybridValidation.ok) errors.push(...hybridValidation.errors.map((error) => `hybrid-metropolis:${error}`));
  const completeCoreValidation = validateEonCityW690CompleteCoreIdentityPlan(plan?.completeCoreIdentity || {});
  if (!completeCoreValidation.ok) errors.push(...completeCoreValidation.errors.map((error) => `complete-core:${error}`));
  const continuousFabricValidation = validateEonCityW710ContinuousCoreFabric(plan?.continuousFabric || {});
  if (!continuousFabricValidation.ok) errors.push(...continuousFabricValidation.errors.map((error) => `continuous-fabric:${error}`));
  const districtStreetIdentityValidation = validateEonCityW711DistrictStreetIdentity(plan?.districtStreetIdentity || {});
  if (!districtStreetIdentityValidation.ok) errors.push(...districtStreetIdentityValidation.errors.map((error) => `district-street-identity:${error}`));
  if (!plan?.transitLoop?.closed || plan.transitLoop?.stations?.length !== 9 || plan.transitLoop?.path?.length !== 10) errors.push('closed-nine-station-loop-required');
  if (!Array.isArray(plan?.streetConnections) || plan.streetConnections.length < 17) errors.push('street-graph-incomplete');
  if (!Array.isArray(plan?.eonbotDocks) || plan.eonbotDocks.length !== 9) errors.push('district-docks-required');
  if (plan?.physicalGateway?.id !== EON_CITY_CONNECTED_CORE_GATEWAY.id || plan.physicalGateway?.districtId !== 'orientation-hall' || plan.physicalGateway?.automaticEntry !== false || plan.physicalGateway?.reviewFirst !== true || plan.physicalGateway?.entryReadyRadius < plan.physicalGateway?.inspectRadius || plan.physicalGateway?.discoveryRadius <= plan.physicalGateway?.inspectRadius) errors.push('physical-living-nexus-gateway-required');
  if (!plan?.focusModeFastTravelRetained || !plan?.districtFastTravelRetained || !plan?.physicalWalkingSupported) errors.push('focus-explore-parity-invalid');
  const ids = new Set(plan?.districts?.map((entry) => entry.id) || []);
  const adjacency = new Map([...ids].map((id) => [id, new Set()]));
  for (const link of plan?.streetConnections || []) { if (ids.has(link.fromId) && ids.has(link.toId)) { adjacency.get(link.fromId).add(link.toId); adjacency.get(link.toId).add(link.fromId); } }
  const first = [...ids][0]; const seen = new Set(first ? [first] : []); const queue = first ? [first] : [];
  while (queue.length) for (const next of adjacency.get(queue.shift()) || []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  if (seen.size !== 9) errors.push('street-graph-not-connected');
  if (plan?.secondCanvasCreated || plan?.secondRenderLoopCreated || plan?.automaticNavigation || plan?.automaticExecution || plan?.privateDataRead || plan?.privateContentStored || plan?.networkRequestCreated || plan?.rewardIssued || plan?.paymentClaimed) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), districtCount: plan?.districts?.length || 0, connectionCount: plan?.streetConnections?.length || 0, stationCount: plan?.transitLoop?.stations?.length || 0, infillBlockCount: plan?.continuousFabric?.counts?.infillBlockCount || 0, occupiedCellRatio: plan?.continuousFabric?.coverage?.occupiedCellRatio || 0, districtStreetIdentityCount: plan?.districtStreetIdentity?.districtCount || 0 });
}

export function resolveNearestEonCityConnectedCoreStation(position = {}, plan = null, { maxDistance = 2.8 } = {}) {
  if (!plan?.transitLoop?.stations) return null;
  const x = Number(position?.x || 0); const z = Number(position?.z || 0);
  const nearest = plan.transitLoop.stations.map((entry) => ({ ...entry, distance: Math.round(Math.hypot(x - entry.x, z - entry.z) * 10) / 10 })).sort((a,b) => a.distance - b.distance)[0] || null;
  return nearest && nearest.distance <= Math.max(0.5, Number(maxDistance || 2.8)) ? freeze(nearest) : null;
}
