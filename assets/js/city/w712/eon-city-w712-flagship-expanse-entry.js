/**
 * W712 — flagship Expanse entry and open-world continuity authority.
 *
 * Keeps the physical Core-to-Expanse transition review-first while removing
 * the hidden second distance threshold. One explicit inspection prepares the
 * gateway; one separate explicit Enter action crosses it. The same contract
 * also proves that the first streamed Expanse neighbourhood, macro-regions,
 * population, discoveries and safe Core return are ready before the UI calls
 * the open world complete. This module performs no movement, rendering,
 * storage, networking, AI work or background execution.
 */
import {
  EON_CITY_LIVING_NEXUS_ENTRY_POSES,
  buildEonCityLivingNexusExpanse
} from '../eon-city-living-nexus-hybrid.js';
import {
  buildEonCityW681ExpanseMacroRegionPlan,
  validateEonCityW681ExpanseMacroRegionPlan
} from '../w681/eon-city-w681-expanse-macro-regions.js';
import {
  buildEonCityW682ExpansePopulationPlan,
  validateEonCityW682ExpansePopulationPlan
} from '../w682/eon-city-w682-expanse-population.js';
import {
  buildEonCityW698ExpansePresentation,
  validateEonCityW698ExpansePresentation
} from '../w698/eon-city-w698-expanse-open-world-presentation.js';

export const EON_CITY_W712_FLAGSHIP_EXPANSE_ENTRY_SCHEMA = 'eon.city.flagship-expanse-entry.w712.v1';
export const EON_CITY_W712_GATEWAY_REVIEW_SCHEMA = 'eon.city.flagship-expanse-gateway-review.w712.v1';
export const EON_CITY_W712_GATEWAY_INTERACTION_RADIUS = 8.5;
export const EON_CITY_W712_GATEWAY_DISCOVERY_RADIUS = 24;
export const EON_CITY_W712_GATEWAY_REVIEW_TTL_MS = 2 * 60 * 1000;

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const STATES = freeze(['distant', 'approach', 'ready-to-review', 'ready-to-enter', 'expanse-active']);
const QUALITY = freeze(['lite', 'balanced', 'cinematic']);

function cleanId(value = '', fallback = '') {
  const id = String(value || '').trim();
  return /^[a-z0-9][a-z0-9:_-]{0,159}$/i.test(id) ? id : fallback;
}

function point(value = {}, fallback = {}) {
  return freeze({
    x: finite(value?.x, finite(fallback?.x)),
    y: finite(value?.y, finite(fallback?.y)),
    z: finite(value?.z, finite(fallback?.z))
  });
}

function state(id, detail = {}) {
  if (!STATES.includes(id)) throw new Error(`unknown-w712-expanse-state:${id}`);
  return freeze({
    schema: EON_CITY_W712_FLAGSHIP_EXPANSE_ENTRY_SCHEMA,
    id,
    destination: detail.destination || 'core',
    headline: detail.headline || 'The Expanse',
    detail: detail.detail || '',
    primaryAction: detail.primaryAction || 'guide',
    buttonLabel: detail.buttonLabel || 'Guide me to the Expanse',
    nextRequiredAction: detail.nextRequiredAction || detail.primaryAction || 'guide',
    showLargePrimaryAction: detail.showLargePrimaryAction !== false,
    reviewed: detail.reviewed === true,
    entryReady: detail.entryReady === true,
    safeCoreReturnAvailable: detail.safeCoreReturnAvailable === true,
    explicitInspectionRequired: true,
    separateEntryConfirmationRequired: true,
    automaticEntry: false,
    automaticNavigation: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export function projectEonCityW712GatewayContract(gateway = {}) {
  const interactionRadius = Math.max(
    EON_CITY_W712_GATEWAY_INTERACTION_RADIUS,
    finite(gateway?.inspectRadius),
    finite(gateway?.entryReadyRadius)
  );
  const physicalThresholdRadius = Math.max(0.5, Math.min(interactionRadius - 0.1, finite(gateway?.enterRadius, 2.4)));
  return freeze({
    ...gateway,
    id: cleanId(gateway?.id, 'living-nexus-core-gateway'),
    label: String(gateway?.label || 'The Expanse Gateway').trim().slice(0, 120),
    destination: 'expanse',
    inspectRadius: interactionRadius,
    enterRadius: physicalThresholdRadius,
    entryReadyRadius: interactionRadius,
    discoveryRadius: Math.max(EON_CITY_W712_GATEWAY_DISCOVERY_RADIUS, finite(gateway?.discoveryRadius)),
    reviewTtlMs: Math.max(30_000, finite(gateway?.reviewTtlMs, EON_CITY_W712_GATEWAY_REVIEW_TTL_MS)),
    flagshipObjective: true,
    primaryWorldEntry: true,
    oneReviewThenOneConfirmation: true,
    noExtraMovementAfterInspection: true,
    interactionLabel: 'Inspect the Expanse Gateway once, then choose Enter the Expanse. No extra movement step is required.',
    reviewFirst: true,
    separateConfirmationRequired: true,
    automaticEntry: false,
    automaticNavigation: false,
    privateContentStored: false,
    localOnly: true
  });
}

export function createEonCityW712GatewayReview(gateway = {}, { now = Date.now() } = {}) {
  const projected = projectEonCityW712GatewayContract(gateway);
  const reviewedAt = Math.max(0, finite(now, Date.now()));
  return freeze({
    schema: EON_CITY_W712_GATEWAY_REVIEW_SCHEMA,
    gatewayId: projected.id,
    destination: 'expanse',
    reviewedAt,
    expiresAt: reviewedAt + projected.reviewTtlMs,
    entryReadyRadius: projected.entryReadyRadius,
    explicitInspection: true,
    entryConfirmed: false,
    privateContentStored: false
  });
}

export function validateEonCityW712GatewayReview(review = {}, gateway = {}, { now = Date.now() } = {}) {
  const projected = projectEonCityW712GatewayContract(gateway);
  const currentTime = Math.max(0, finite(now, Date.now()));
  const errors = [];
  if (review?.schema !== EON_CITY_W712_GATEWAY_REVIEW_SCHEMA) errors.push('review-schema-invalid');
  if (!projected.id || review?.gatewayId !== projected.id) errors.push('gateway-review-mismatch');
  if (review?.destination !== 'expanse' || review?.explicitInspection !== true || review?.entryConfirmed !== false) errors.push('review-contract-invalid');
  if (!Number.isFinite(Number(review?.reviewedAt)) || !Number.isFinite(Number(review?.expiresAt)) || Number(review.expiresAt) <= Number(review.reviewedAt)) errors.push('review-time-invalid');
  if (Number(review?.expiresAt) < currentTime) errors.push('review-expired');
  if (finite(review?.entryReadyRadius) < projected.entryReadyRadius) errors.push('entry-ready-radius-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), gatewayId: projected.id, expiresAt: finite(review?.expiresAt) });
}

export function resolveEonCityW712FlagshipExpanseEntryState({
  gateway = null,
  destination = 'core',
  prepared = false
} = {}) {
  if (String(destination) === 'expanse') {
    return state('expanse-active', {
      destination: 'expanse',
      headline: 'The Expanse is active',
      detail: 'Explore the streamed regions, record discoveries, or return safely to your exact Core approach position.',
      primaryAction: 'return-core',
      buttonLabel: 'Return to EONCITY Core',
      nextRequiredAction: 'return-core',
      reviewed: true,
      entryReady: false,
      safeCoreReturnAvailable: true
    });
  }

  if (!gateway) {
    return state('distant', {
      headline: 'The Expanse',
      detail: 'The flagship open world begins beyond the Orientation Hall gateway. Guidance moves only the local marker; it never enters automatically.',
      primaryAction: 'guide',
      buttonLabel: 'Guide me to the Expanse',
      nextRequiredAction: 'guide'
    });
  }

  const projected = projectEonCityW712GatewayContract(gateway);
  const distance = Math.max(0, finite(gateway.distance));
  const inInspectRange = gateway.inInspectRange === true || distance <= projected.inspectRadius;
  const inEntryReadyRange = gateway.inEntryReadyRange === true || distance <= projected.entryReadyRadius;
  const reviewed = prepared === true || gateway.prepared === true;

  if (reviewed && inEntryReadyRange) {
    return state('ready-to-enter', {
      headline: 'The Expanse is ready',
      detail: 'Gateway review complete. Choose Enter the Expanse to cross the physical threshold. No extra movement step is required.',
      primaryAction: 'enter',
      buttonLabel: 'Enter the Expanse',
      nextRequiredAction: 'enter',
      reviewed: true,
      entryReady: true,
      safeCoreReturnAvailable: true
    });
  }

  if (inInspectRange) {
    return state('ready-to-review', {
      headline: 'Review the Expanse gateway',
      detail: 'Inspect once to review the open-world transition. Entry remains a separate visible confirmation.',
      primaryAction: 'inspect',
      buttonLabel: 'Inspect gateway',
      nextRequiredAction: 'inspect',
      reviewed
    });
  }

  return state('approach', {
    headline: 'Approach the Expanse gateway',
    detail: `${distance.toFixed(1)} m away. Follow the visible road to the review lane; guidance never enters the world automatically.`,
    primaryAction: 'guide',
    buttonLabel: 'Guide to review lane',
    nextRequiredAction: 'guide',
    reviewed
  });
}

export function resolveEonCityW712GatewayApproachTarget({ gateway = {}, fromPosition = {}, standOff = 3.4 } = {}) {
  const gx = finite(gateway.x);
  const gz = finite(gateway.z);
  const explicitX = Number(gateway.approachX);
  const explicitZ = Number(gateway.approachZ);
  if (Number.isFinite(explicitX) && Number.isFinite(explicitZ)) return freeze({ x: explicitX, z: explicitZ, usesAuthoredApproach: true });

  const fx = finite(fromPosition.x, gx);
  const fz = finite(fromPosition.z, gz + 1);
  const dx = fx - gx;
  const dz = fz - gz;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const distance = Math.max(1.8, Math.min(5, finite(standOff, 3.4)));
  return freeze({ x: gx + (dx / length) * distance, z: gz + (dz / length) * distance, usesAuthoredApproach: false });
}

export function buildEonCityW712FlagshipExpansePlan({
  gateway = {},
  position = EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse,
  seed = 'eonapp-expanse',
  quality = 'balanced',
  reducedMotion = false
} = {}) {
  const resolvedQuality = QUALITY.includes(String(quality)) ? String(quality) : 'balanced';
  const entryPose = point(position, EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse);
  const projectedGateway = projectEonCityW712GatewayContract(gateway);
  const expanse = buildEonCityLivingNexusExpanse({ position: entryPose, seed });
  const macroRegions = buildEonCityW681ExpanseMacroRegionPlan({ position: entryPose, seed, quality: resolvedQuality });
  const population = buildEonCityW682ExpansePopulationPlan({ cells: expanse.cells, seed, quality: resolvedQuality, reducedMotion });
  const presentation = buildEonCityW698ExpansePresentation({ macroPlan: macroRegions, quality: resolvedQuality, seed });
  const macroValidation = validateEonCityW681ExpanseMacroRegionPlan(macroRegions);
  const populationValidation = validateEonCityW682ExpansePopulationPlan(population);
  const presentationValidation = validateEonCityW698ExpansePresentation(presentation);
  const mapRegions = freeze(macroRegions.regions.map((region) => freeze({
    id: region.id,
    label: region.archetype?.label || region.id,
    role: region.role,
    purpose: region.archetype?.purpose || 'open-world exploration',
    accent: region.archetype?.accent || '#55eaff',
    roadConnected: true,
    current: region.id === macroRegions.currentRegionId,
    automaticNavigation: false
  })));
  const worldReady = macroValidation.ok && populationValidation.ok && presentationValidation.ok
    && expanse.cellCount === 25 && expanse.interactiveCellCount === 9;

  return freeze({
    schema: EON_CITY_W712_FLAGSHIP_EXPANSE_ENTRY_SCHEMA,
    quality: resolvedQuality,
    reducedMotion: Boolean(reducedMotion),
    seedRef: String(seed || 'eonapp-expanse').slice(0, 80),
    gateway: projectedGateway,
    entry: freeze({
      pose: entryPose,
      explicitInspectionRequired: true,
      separateEntryConfirmationRequired: true,
      noExtraMovementAfterInspection: true,
      forceInitialStream: true,
      technicalPanelRequired: false,
      automaticEntry: false,
      automaticNavigation: false
    }),
    world: freeze({
      ready: worldReady,
      visibleCellCount: expanse.cellCount,
      interactiveCellCount: expanse.interactiveCellCount,
      horizonCellCount: expanse.horizonCellCount,
      macroRegionCount: macroRegions.macroRegionCount,
      arterialCount: macroRegions.arterials.length,
      approachCount: macroRegions.approaches.length,
      architectureFamilyCount: presentation.uniqueArchitectureFamilies,
      skylineNodeCount: presentation.skylineNodeCount,
      populationCount: population.populationCount,
      discoveryCount: population.discoveryCount,
      streetActivityCount: population.streetActivityCount,
      nearMidFarComposition: presentation.nearMidFarComposition === true,
      coherentUrbanContinuity: macroRegions.coherentUrbanContinuity === true,
      visibleHardBorder: false,
      streamed: true,
      deterministic: true
    }),
    map: freeze({
      title: 'The Expanse regional map',
      currentRegionId: macroRegions.currentRegionId,
      regions: mapRegions,
      regionCount: mapRegions.length,
      arterialCount: macroRegions.arterials.length,
      discoveryCount: population.discoveryCount,
      safeReturnLabel: 'Return to EONCITY Core',
      usefulWithoutHiddenPanel: true,
      automaticNavigation: false
    }),
    safeReturn: freeze({
      available: true,
      destination: 'core',
      restoresCapturedCorePose: true,
      explicitUserActionRequired: true,
      automaticNavigation: false,
      privateContentStored: false
    }),
    oneCanonicalScene: true,
    secondEngineCreated: false,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    startsAiWork: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    localOnly: true
  });
}

export function validateEonCityW712FlagshipExpansePlan(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_W712_FLAGSHIP_EXPANSE_ENTRY_SCHEMA) errors.push('schema-invalid');
  if (!(plan?.gateway?.inspectRadius > plan?.gateway?.enterRadius) || plan?.gateway?.entryReadyRadius !== plan?.gateway?.inspectRadius) errors.push('gateway-radius-contract-invalid');
  if (plan?.gateway?.inspectRadius < EON_CITY_W712_GATEWAY_INTERACTION_RADIUS || plan?.gateway?.discoveryRadius < EON_CITY_W712_GATEWAY_DISCOVERY_RADIUS) errors.push('gateway-discoverability-invalid');
  if (!plan?.entry?.explicitInspectionRequired || !plan?.entry?.separateEntryConfirmationRequired || !plan?.entry?.noExtraMovementAfterInspection || !plan?.entry?.forceInitialStream) errors.push('entry-contract-invalid');
  if (!plan?.world?.ready || plan.world.visibleCellCount !== 25 || plan.world.interactiveCellCount !== 9 || plan.world.macroRegionCount !== 9 || plan.world.arterialCount !== 12) errors.push('open-world-readiness-invalid');
  if (plan?.world?.architectureFamilyCount < 7 || plan?.world?.populationCount < 14 || plan?.world?.discoveryCount < 6 || plan?.world?.streetActivityCount < 8) errors.push('open-world-variety-invalid');
  if (!plan?.world?.nearMidFarComposition || !plan?.world?.coherentUrbanContinuity || plan?.world?.visibleHardBorder) errors.push('open-world-continuity-invalid');
  if (plan?.map?.regionCount !== 9 || plan?.map?.arterialCount !== 12 || !plan?.map?.usefulWithoutHiddenPanel) errors.push('regional-map-invalid');
  if (!plan?.safeReturn?.available || !plan?.safeReturn?.restoresCapturedCorePose || !plan?.safeReturn?.explicitUserActionRequired) errors.push('safe-return-invalid');
  if (!plan?.oneCanonicalScene || plan?.secondEngineCreated || plan?.secondCanvasCreated || plan?.secondRenderLoopCreated) errors.push('renderer-ownership-invalid');
  if (plan?.automaticNavigation || plan?.automaticExecution || plan?.startsAiWork || plan?.privateDataRead || plan?.privateContentStored || plan?.networkRequestCreated || plan?.rewardIssued || plan?.paymentClaimed) errors.push('truth-boundary-invalid');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    regionCount: plan?.world?.macroRegionCount || 0,
    populationCount: plan?.world?.populationCount || 0,
    discoveryCount: plan?.world?.discoveryCount || 0,
    architectureFamilyCount: plan?.world?.architectureFamilyCount || 0
  });
}

export function getEonCityW712FlagshipExpanseEntryTruth() {
  return freeze({
    schema: EON_CITY_W712_FLAGSHIP_EXPANSE_ENTRY_SCHEMA,
    oneReviewThenOneConfirmation: true,
    hiddenSecondDistanceThresholdRemoved: true,
    physicalGatewayRemainsPrimaryEntry: true,
    firstStreamForcedBeforeReadyClaim: true,
    nineRegionalMapVisible: true,
    populatedDeterministicOpenWorld: true,
    safeCoreReturnRetained: true,
    oneCanonicalScene: true,
    automaticEntry: false,
    automaticNavigation: false,
    automaticExecution: false,
    startsAiWork: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W712_FLAGSHIP_EXPANSE_ENTRY_SCHEMA,
  EON_CITY_W712_GATEWAY_REVIEW_SCHEMA,
  EON_CITY_W712_GATEWAY_INTERACTION_RADIUS,
  EON_CITY_W712_GATEWAY_DISCOVERY_RADIUS,
  EON_CITY_W712_GATEWAY_REVIEW_TTL_MS,
  projectEonCityW712GatewayContract,
  createEonCityW712GatewayReview,
  validateEonCityW712GatewayReview,
  resolveEonCityW712FlagshipExpanseEntryState,
  resolveEonCityW712GatewayApproachTarget,
  buildEonCityW712FlagshipExpansePlan,
  validateEonCityW712FlagshipExpansePlan,
  getEonCityW712FlagshipExpanseEntryTruth
});
