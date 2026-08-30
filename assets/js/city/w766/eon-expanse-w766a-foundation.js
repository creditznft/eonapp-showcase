import { EON_EXPANSE_W766_ZONES } from './eon-expanse-w766-region-contract.js';
import { EON_EXPANSE_W766E_CAMPAIGN, EON_EXPANSE_W766E_MISSION_SCHEMA, migrateEonExpanseW767ACompanionMissionLedger } from './eon-expanse-w766e-mission-runtime.js';
import { EON_EXPANSE_W766F_CONTENT_SCHEMA, EON_EXPANSE_W766F_DISCOVERIES, EON_EXPANSE_W766F_EVENT_FAMILIES, EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS, EON_EXPANSE_W766F_SIDE_MISSIONS } from './eon-expanse-w766f-living-content.js';
import { createEonExpanseW768AMyFrontierLayoutContract } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA } from '../w768/eon-expanse-w768b-my-frontier-state.js';
import { EON_EXPANSE_W768D_CONSTRUCTION_LEDGER_SCHEMA } from '../w768/eon-expanse-w768d-my-frontier-construction-ledger.js';
import { EON_EXPANSE_W769B_DEFAULT_THEME_ID, isEonExpanseW769BThemeId } from '../w769/eon-expanse-w769b-my-frontier-theme.js';
import { EON_EXPANSE_W769E_UPGRADE_LEDGER_SCHEMA } from '../w769/eon-expanse-w769e-my-frontier-upgrade-ledger.js';
import { sanitizeEonExpanseW783AProgrammeReview } from '../w783/eon-expanse-w783a-future-region-programme-review.js';
import { sanitizeEonExpanseW788AReleaseReview } from '../w788/eon-expanse-w788a-future-region-release-review.js';
import { sanitizeEonExpanseW789ARegionPackageCertification } from '../w789/eon-expanse-w789a-region-package-certification-state.js';
import { sanitizeEonExpanseW790APerformanceEvidence } from '../w790/eon-expanse-w790a-performance-certification-evidence.js';
import { sanitizeEonExpanseW793AActivation } from '../w793/eon-expanse-w793a-future-region-activation.js';
import { sanitizeEonExpanseW795AStormMissionState } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
const freeze = (value) => Object.freeze(value);
const text = (value, fallback = '') => String(value ?? fallback).slice(0, 160);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const EON_EXPANSE_W766A_FOUNDATION_SCHEMA = 'eon.city.expanse.foundation.w766a.v1';
export const EON_EXPANSE_W766A_STORAGE_KEY = 'eon:city:expanse:w766a:state:v1';

/**
 * Preserve W766I's borderless streamed world while rejecting invalid numeric
 * movement. Unlike the Command Hub clamp, this never forces Expanse movement
 * back into the 25.5 metre Hub ring.
 */
export function sanitizeEonExpanseW766APlayerPosition(position = {}, fallback = {}) {
  const fallbackX = finite(fallback?.x, 0);
  const fallbackY = finite(fallback?.y, 0.15);
  const fallbackZ = finite(fallback?.z, 16);
  const x = finite(position?.x, fallbackX);
  const y = finite(position?.y, fallbackY);
  const z = finite(position?.z, fallbackZ);
  return freeze({
    x, y, z,
    finiteFallbackUsed: !Number.isFinite(Number(position?.x)) || !Number.isFinite(Number(position?.y)) || !Number.isFinite(Number(position?.z)),
    hardWorldClampApplied: false
  });
}

export const EON_EXPANSE_W766A_REGION_KITS = freeze([
  freeze({ id: 'signal-frontier', family: 'neon-frontier', authored: true, safeSpawn: freeze({ x: 0, y: 0.15, z: 16 }), returnAnchor: freeze({ x: 0, y: 0.15, z: 20 }), zones: freeze(['gateway-overlook', 'beacon-fields', 'archive-ruins', 'transit-scar', 'horizon-vault']), budget: freeze({ maxNpc: 12, maxLights: 18, maxParticles: 180, maxActiveSectors: 9 }) }),
  freeze({ id: 'certified-fallback', family: 'signal-frontier-fallback', authored: true, safeSpawn: freeze({ x: 0, y: 0.15, z: 8 }), returnAnchor: freeze({ x: 0, y: 0.15, z: 12 }), zones: freeze(['gateway-overlook']), budget: freeze({ maxNpc: 2, maxLights: 6, maxParticles: 24, maxActiveSectors: 1 }) })
]);

function hashString(value = '') {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createEonExpanseW766AWorldSeed({ profileId = 'local-profile', productSeed = 'EONAPP-SIGNAL-FRONTIER', generationVersion = 1 } = {}) {
  const safeProfile = text(profileId, 'local-profile').replace(/[^a-z0-9:_-]/gi, '-').toLowerCase();
  const material = `${text(productSeed)}:${safeProfile}:${Math.max(1, Math.floor(finite(generationVersion, 1)))}`;
  return freeze({ schema: `${EON_EXPANSE_W766A_FOUNDATION_SCHEMA}.seed.v1`, value: hashString(material), profileHash: hashString(safeProfile).toString(16).padStart(8, '0'), generationVersion: Math.max(1, Math.floor(finite(generationVersion, 1))), privateProjectContentIncluded: false });
}

export function createEonExpanseW766AInitialState({ seed = createEonExpanseW766AWorldSeed(), now = Date.now() } = {}) {
  return freeze({
    schema: EON_EXPANSE_W766A_FOUNDATION_SCHEMA,
    version: 1,
    seed,
    regionId: 'signal-frontier',
    currentZone: 'gateway-overlook',
    safePosition: freeze({ x: 0, y: 0.15, z: 16 }),
    lastTransitNode: 'gateway-overlook',
    activeMissionId: '',
    currentObjective: '',
    discovered: freeze(['gateway-overlook']),
    unlockedTransitNodes: freeze(['gateway-overlook']),
    worldMilestones: freeze([]),
    processedReceipts: freeze([]),
    myFrontier: null,
    myFrontierConstruction: null,
    myFrontierUpgrades: null,
    futureRegionProgrammeReview: null,
    futureRegionReleaseReview: null,
    futureRegionPackageCertification: null,
    futureRegionPerformanceEvidence: null,
    futureRegionActivation: null,
    stormSectorMissions: null,
    updatedAt: Math.max(0, finite(now, Date.now())),
    privateProjectContentStored: false
  });
}

export function validateEonExpanseW766AState(state = {}) {
  const errors = [];
  if (state?.schema !== EON_EXPANSE_W766A_FOUNDATION_SCHEMA) errors.push('schema-invalid');
  if (state?.privateProjectContentStored) errors.push('private-content-forbidden');
  if (!EON_EXPANSE_W766A_REGION_KITS.some((region) => region.id === state?.regionId)) errors.push('region-invalid');
  if (!Number.isFinite(state?.safePosition?.x) || !Number.isFinite(state?.safePosition?.z)) errors.push('safe-position-invalid');
  if (!Array.isArray(state?.discovered) || !state.discovered.includes('gateway-overlook')) errors.push('gateway-discovery-required');
  if (!Array.isArray(state?.processedReceipts) || new Set(state.processedReceipts).size !== state.processedReceipts.length) errors.push('receipt-ledger-invalid');
  if (state?.myFrontier && (state.myFrontier.privateContentStored || state.myFrontier.rawCoordinatesStored || state.myFrontier.publicLandCreated || state.myFrontier.tradablePropertyCreated)) errors.push('my-frontier-boundary-invalid');
  if (state?.myFrontierConstruction && (state.myFrontierConstruction.privateContentStored || state.myFrontierConstruction.rawCoordinatesStored || state.myFrontierConstruction.awardsXp || state.myFrontierConstruction.automaticConstruction)) errors.push('my-frontier-construction-boundary-invalid');
  if (state?.myFrontierUpgrades && (state.myFrontierUpgrades.privateContentStored || state.myFrontierUpgrades.rawCoordinatesStored || state.myFrontierUpgrades.awardsXp || state.myFrontierUpgrades.automaticUpgrade || state.myFrontierUpgrades.paidShortcutAccepted)) errors.push('my-frontier-upgrade-boundary-invalid');
  if (state?.futureRegionProgrammeReview && (state.futureRegionProgrammeReview.privateContentStored || state.futureRegionProgrammeReview.gatewayActivated || state.futureRegionProgrammeReview.regionRendered || state.futureRegionProgrammeReview.publicReleaseReady)) errors.push('future-region-programme-boundary-invalid');
  if (state?.futureRegionReleaseReview && (state.futureRegionReleaseReview.privateContentStored || state.futureRegionReleaseReview.gatewayActivated || state.futureRegionReleaseReview.regionRendered || state.futureRegionReleaseReview.publicReleaseReady || state.futureRegionReleaseReview.automaticRelease)) errors.push('future-region-release-review-boundary-invalid');
  if (state?.futureRegionPackageCertification && (state.futureRegionPackageCertification.privateContentStored || state.futureRegionPackageCertification.gatewayActivated || state.futureRegionPackageCertification.regionRendered || state.futureRegionPackageCertification.automaticRelease)) errors.push('future-region-package-certification-boundary-invalid');
  if (state?.futureRegionPerformanceEvidence && (state.futureRegionPerformanceEvidence.privateContentStored || state.futureRegionPerformanceEvidence.backgroundThrottleReportAccepted || state.futureRegionPerformanceEvidence.ownsEngine || state.futureRegionPerformanceEvidence.ownsScene || state.futureRegionPerformanceEvidence.ownsRenderLoop || state.futureRegionPerformanceEvidence.automaticCertification)) errors.push('future-region-performance-evidence-boundary-invalid');
  if (state?.futureRegionActivation && (state.futureRegionActivation.privateContentStored || state.futureRegionActivation.regionRendered || state.futureRegionActivation.automaticActivation || state.futureRegionActivation.gatewayActivated !== true || state.futureRegionActivation.explicitOwnerAction !== true)) errors.push('future-region-activation-boundary-invalid');
  if (state?.stormSectorMissions && (state.stormSectorMissions.privateContentStored || state.stormSectorMissions.automaticProgression || state.stormSectorMissions.awardsXp)) errors.push('storm-sector-mission-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

const ZONE_IDS = freeze(EON_EXPANSE_W766_ZONES.map((zone) => zone.id));
const REGION_IDS = freeze(EON_EXPANSE_W766A_REGION_KITS.map((region) => region.id));
const MISSION_IDS = freeze(EON_EXPANSE_W766E_CAMPAIGN.map((mission) => mission.id));
const OBJECTIVE_IDS = freeze(EON_EXPANSE_W766E_CAMPAIGN.flatMap((mission) => mission.objectives));
const SIDE_MISSION_IDS = freeze(EON_EXPANSE_W766F_SIDE_MISSIONS.map((mission) => mission.id));
const PRODUCTIVE_MISSION_IDS = freeze(EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS.map((mission) => mission.id));
const DISCOVERY_IDS = freeze(EON_EXPANSE_W766F_DISCOVERIES.map((discovery) => discovery.id));
const ACTIVITY_ITEM_IDS = freeze([
  'signal-fragment-a', 'signal-fragment-b', 'signal-fragment-c',
  'archive-sweep-a', 'archive-sweep-b',
  'eonbot-signal-a', 'eonbot-signal-b', 'eonbot-signal-c',
  'lost-worker', 'lost-worker-route-terminal'
]);

const MY_FRONTIER_LAYOUT = createEonExpanseW768AMyFrontierLayoutContract();
const MY_FRONTIER_PLOTS = new Map(MY_FRONTIER_LAYOUT.plots.map((entry) => [entry.id, entry]));
const MY_FRONTIER_RESIDENTS = new Map(MY_FRONTIER_LAYOUT.residentSlots.map((entry) => [entry.id, entry]));

function safeIdentifier(value = '') {
  const item = text(value);
  return /^[a-z0-9][a-z0-9:_.-]{0,159}$/i.test(item) ? item : '';
}

function safeUnique(values = [], { allow = null, limit = 512 } = {}) {
  const accepted = [];
  for (const value of Array.isArray(values) ? values : []) {
    const item = safeIdentifier(value);
    if (!item || (allow && !allow.includes(item)) || accepted.includes(item)) continue;
    accepted.push(item);
    if (accepted.length >= limit) break;
  }
  return freeze(accepted);
}

function sanitizeSeed(seed = createEonExpanseW766AWorldSeed()) {
  return freeze({
    schema: `${EON_EXPANSE_W766A_FOUNDATION_SCHEMA}.seed.v1`,
    value: Math.max(0, Math.floor(finite(seed?.value, 0))) >>> 0,
    profileHash: /^[a-f0-9]{8}$/i.test(String(seed?.profileHash || '')) ? String(seed.profileHash).toLowerCase() : '00000000',
    generationVersion: Math.max(1, Math.floor(finite(seed?.generationVersion, 1))),
    privateProjectContentIncluded: false
  });
}

function sanitizeMissionLedger(input = null) {
  if (!input || typeof input !== 'object') return null;
  input = migrateEonExpanseW767ACompanionMissionLedger(input);
  const definitions = new Map(EON_EXPANSE_W766E_CAMPAIGN.map((definition) => [definition.id, definition]));
  const missions = {};
  for (const missionId of MISSION_IDS) {
    const definition = definitions.get(missionId);
    const source = input?.missions?.[missionId] || {};
    const status = ['locked', 'available', 'active', 'completed'].includes(source.status) ? source.status : 'locked';
    const completedObjectives = safeUnique(source.completedObjectives, { allow: definition.objectives, limit: definition.objectives.length });
    const currentObjective = definition.objectives.includes(source.currentObjective) ? source.currentObjective : '';
    missions[missionId] = freeze({
      id: missionId,
      label: definition.label,
      status,
      currentObjective,
      completedObjectives,
      completedAt: Math.max(0, finite(source.completedAt, 0)),
      xpAwarded: source.xpAwarded === true
    });
  }
  const campaignReceipt = input.campaignReceipt && typeof input.campaignReceipt === 'object' ? freeze({
    id: safeIdentifier(input.campaignReceipt.id),
    campaignId: input.campaignReceipt.campaignId === 'signal-restoration' ? 'signal-restoration' : '',
    completedAt: Math.max(0, finite(input.campaignReceipt.completedAt, 0)),
    totalXp: Math.max(0, finite(input.campaignReceipt.totalXp, 0)),
    cosmeticId: safeIdentifier(input.campaignReceipt.cosmeticId)
  }) : null;
  return freeze({
    schema: EON_EXPANSE_W766E_MISSION_SCHEMA,
    totalXp: Math.max(0, finite(input.totalXp, 0)),
    currentLevel: Math.max(1, Math.min(8, Math.floor(finite(input.currentLevel, 1)))),
    activeMissionId: MISSION_IDS.includes(input.activeMissionId) ? input.activeMissionId : '',
    completedMissions: safeUnique(input.completedMissions, { allow: MISSION_IDS, limit: MISSION_IDS.length }),
    missions: freeze(missions),
    processedReceipts: safeUnique(input.processedReceipts),
    worldMilestones: safeUnique(input.worldMilestones),
    vaultReveals: safeUnique(input.vaultReveals, { limit: 64 }),
    ownedCosmetics: safeUnique(input.ownedCosmetics, { limit: 64 }),
    selectedCosmetic: safeIdentifier(input.selectedCosmetic),
    campaignReceipt
  });
}

function sanitizeLivingContent(input = null) {
  if (!input || typeof input !== 'object') return null;
  const sideCompletionCounts = {};
  for (const missionId of SIDE_MISSION_IDS) sideCompletionCounts[missionId] = Math.max(0, Math.floor(finite(input?.sideCompletionCounts?.[missionId], 0)));
  const activeEventSource = input.activeEvent || null;
  const eventDefinition = EON_EXPANSE_W766F_EVENT_FAMILIES.find((event) => event.id === activeEventSource?.id) || null;
  const activeEvent = eventDefinition ? freeze({
    id: eventDefinition.id,
    label: eventDefinition.label,
    zoneId: eventDefinition.zoneId,
    durationMinutes: eventDefinition.durationMinutes,
    windowId: safeIdentifier(activeEventSource.windowId),
    startsAt: Math.max(0, finite(activeEventSource.startsAt, 0)),
    endsAt: Math.max(0, finite(activeEventSource.endsAt, 0)),
    irreversibleFailure: false,
    blocksHubReturn: false,
    financialUrgency: false
  }) : null;
  const progress = input.activityProgress || {};
  const activeFrontierSource = input.activeFrontierContract && typeof input.activeFrontierContract === 'object' ? input.activeFrontierContract : null;
  const activeFrontierSteps = freeze((Array.isArray(activeFrontierSource?.steps) ? activeFrontierSource.steps : []).slice(0, 3).flatMap((step) => {
    const id = safeIdentifier(step?.id);
    if (!/^[a-z0-9-]+$/i.test(id)) return [];
    return [freeze({ id, label: text(step?.label), action: safeIdentifier(step?.action) })];
  }));
  const activeFrontierStepIds = new Set(activeFrontierSteps.map((step) => step.id));
  const activeFrontierContract = activeFrontierSource && /^frontier:sector:-?\d+:-?\d+:[a-z0-9-]+$/i.test(String(activeFrontierSource.id || '')) ? freeze({
    id: safeIdentifier(activeFrontierSource.id),
    sectorId: /^sector:-?\d+:-?\d+$/.test(String(activeFrontierSource.sectorId || '')) ? String(activeFrontierSource.sectorId) : '',
    label: text(activeFrontierSource.label),
    objective: text(activeFrontierSource.objective),
    purpose: text(activeFrontierSource.purpose),
    family: safeIdentifier(activeFrontierSource.family) || 'survey',
    steps: activeFrontierSteps,
    completedStepIds: freeze(safeUnique(activeFrontierSource.completedStepIds, { limit: 3 }).filter((id) => activeFrontierStepIds.has(id))),
    rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(String(activeFrontierSource.rarity)) ? String(activeFrontierSource.rarity) : 'common',
    xp: Math.max(20, Math.min(150, Math.floor(finite(activeFrontierSource.xp, 35)))),
    landmarkId: safeIdentifier(activeFrontierSource.landmarkId),
    cycleKey: /^\d{4}-\d{2}-\d{2}$/.test(String(activeFrontierSource.cycleKey || '')) ? String(activeFrontierSource.cycleKey) : 'persistent'
  }) : null;
  return freeze({
    schema: EON_EXPANSE_W766F_CONTENT_SCHEMA,
    xp: Math.max(0, finite(input.xp, 0)),
    completedSideMissions: safeUnique(input.completedSideMissions, { allow: SIDE_MISSION_IDS, limit: SIDE_MISSION_IDS.length }),
    sideCompletionCounts: freeze(sideCompletionCounts),
    completedProductiveMissions: safeUnique(input.completedProductiveMissions, { allow: PRODUCTIVE_MISSION_IDS, limit: PRODUCTIVE_MISSION_IDS.length }),
    discoveries: safeUnique(input.discoveries, { allow: DISCOVERY_IDS, limit: DISCOVERY_IDS.length }),
    proceduralDiscoveries: freeze(safeUnique(input.proceduralDiscoveries, { limit: 1024 }).filter((id) => /^w682-discovery-[a-z0-9-]+$/i.test(id))),
    completedFrontierContracts: freeze(safeUnique(input.completedFrontierContracts, { limit: 1024 }).filter((id) => /^frontier:sector:-?\d+:-?\d+:[a-z0-9-]+$/i.test(id))),
    activeFrontierContract,
    processedReceipts: safeUnique(input.processedReceipts),
    dailyCompletions: safeUnique(input.dailyCompletions, { limit: 366 }),
    activityProgress: freeze({
      cycleKey: /^\d{4}-\d{2}-\d{2}$/.test(String(progress.cycleKey || '')) ? String(progress.cycleKey) : '',
      signalFragments: safeUnique(progress.signalFragments, { allow: ACTIVITY_ITEM_IDS, limit: 3 }),
      archiveSweepRecords: safeUnique(progress.archiveSweepRecords, { allow: ACTIVITY_ITEM_IDS, limit: 2 }),
      eonbotSignals: safeUnique(progress.eonbotSignals, { allow: ACTIVITY_ITEM_IDS, limit: 3 }),
      lostWorkerLocated: progress.lostWorkerLocated === true,
      routeTerminalActivated: progress.routeTerminalActivated === true,
      transitJourneyReceipts: safeUnique(progress.transitJourneyReceipts, { limit: 64 })
    }),
    activeEvent,
    lastEventWindow: safeIdentifier(input.lastEventWindow)
  });
}

function sanitizeMyFrontierState(input = null) {
  if (!input || typeof input !== 'object') return null;
  const receipt = input.unlockReceipt && typeof input.unlockReceipt === 'object' ? freeze({
    id: safeIdentifier(input.unlockReceipt.id),
    campaignId: input.unlockReceipt.campaignId === 'signal-restoration' ? 'signal-restoration' : '',
    completedAt: Math.max(0, finite(input.unlockReceipt.completedAt, 0)),
    totalXp: Math.max(0, finite(input.unlockReceipt.totalXp, 0)),
    cosmeticId: safeIdentifier(input.unlockReceipt.cosmeticId),
    privateContentStored: false
  }) : null;
  const validReceipt = receipt?.id && receipt.campaignId && receipt.completedAt > 0 ? receipt : null;
  const buildingChoices = {};
  if (validReceipt) {
    buildingChoices['plot-central-command'] = 'command-core';
    for (const [plotId, buildingId] of Object.entries(input.buildingChoices || {})) {
      const plot = MY_FRONTIER_PLOTS.get(plotId);
      if (plot && plot.allowedBuildingIds.includes(String(buildingId))) buildingChoices[plotId] = String(buildingId);
    }
  }
  const residents = {};
  const residentReceipts = {};
  if (validReceipt) {for (const [slotId, residentId] of Object.entries(input.residents || {})) {
    const slot = MY_FRONTIER_RESIDENTS.get(slotId);
    const sourceReceipt = input.residentReceipts?.[slotId];
    const residentReceipt = sourceReceipt && typeof sourceReceipt === 'object' ? freeze({
      id: safeIdentifier(sourceReceipt.id),
      residentId: safeIdentifier(sourceReceipt.residentId),
      completedAt: Math.max(0, finite(sourceReceipt.completedAt, 0)),
      privateContentStored: false
    }) : null;
    if (slot?.residentId !== String(residentId)
      || !residentReceipt?.id
      || residentReceipt.residentId !== slot.residentId
      || residentReceipt.completedAt <= 0) continue;
    residents[slotId] = slot.residentId;
    residentReceipts[slotId] = residentReceipt;
  }}
  return freeze({
    schema: EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA,
    layoutSchema: MY_FRONTIER_LAYOUT.schema,
    unlocked: Boolean(validReceipt),
    unlockReceipt: validReceipt,
    buildingChoices: freeze(buildingChoices),
    themeId: validReceipt && isEonExpanseW769BThemeId(input.themeId) ? String(input.themeId) : validReceipt ? EON_EXPANSE_W769B_DEFAULT_THEME_ID : '',
    residents: freeze(residents),
    residentReceipts: freeze(residentReceipts),
    processedReceipts: safeUnique(input.processedReceipts, { limit: 128 }),
    updatedAt: Math.max(0, finite(input.updatedAt, 0)),
    privateContentStored: false,
    rawCoordinatesStored: false,
    publicLandCreated: false,
    tradablePropertyCreated: false
  });
}

function sanitizeMyFrontierConstruction(input = null) {
  if (!input || typeof input !== 'object') return null;
  const records = [];
  const seenPlots = new Set();
  const seenPermits = new Set();
  for (const source of Array.isArray(input.records) ? input.records : []) {
    const plotId = safeIdentifier(source?.plotId);
    const buildingId = safeIdentifier(source?.buildingId);
    const permitId = safeIdentifier(source?.permitId);
    const sourceReceiptId = safeIdentifier(source?.sourceReceiptId);
    const authority = ['campaign', 'productive'].includes(String(source?.authority)) ? String(source.authority) : '';
    const constructedAt = Math.max(0, finite(source?.constructedAt, 0));
    const plot = MY_FRONTIER_PLOTS.get(plotId);
    if (!plot || !plot.allowedBuildingIds.includes(buildingId) || !permitId || !sourceReceiptId || !authority || !constructedAt || seenPlots.has(plotId) || seenPermits.has(permitId)) continue;
    seenPlots.add(plotId); seenPermits.add(permitId);
    records.push(freeze({ plotId, buildingId, permitId, sourceReceiptId, authority, constructedAt, privateContentStored: false, rawCoordinatesStored: false }));
  }
  return freeze({
    schema: EON_EXPANSE_W768D_CONSTRUCTION_LEDGER_SCHEMA,
    records: freeze(records),
    updatedAt: Math.max(0, finite(input.updatedAt, 0)),
    privateContentStored: false,
    rawCoordinatesStored: false,
    awardsXp: false,
    automaticConstruction: false,
    publicLandCreated: false,
    tradablePropertyCreated: false
  });
}

function sanitizeMyFrontierUpgrades(input = null) {
  if (!input || typeof input !== 'object') return null;
  const records = [];
  const seenPlots = new Set();
  const seenPermits = new Set();
  for (const source of Array.isArray(input.records) ? input.records : []) {
    const plotId = safeIdentifier(source?.plotId);
    const buildingId = safeIdentifier(source?.buildingId);
    const permitId = safeIdentifier(source?.permitId);
    const sourceReceiptId = safeIdentifier(source?.sourceReceiptId);
    const level = Math.floor(finite(source?.level, 0));
    const upgradedAt = Math.max(0, finite(source?.upgradedAt, 0));
    const plot = MY_FRONTIER_PLOTS.get(plotId);
    if (!plot || !plot.allowedBuildingIds.includes(buildingId) || !permitId || !sourceReceiptId || level !== 2 || !upgradedAt || seenPlots.has(plotId) || seenPermits.has(permitId)) continue;
    seenPlots.add(plotId); seenPermits.add(permitId);
    records.push(freeze({ plotId, buildingId, level: 2, permitId, sourceReceiptId, upgradedAt, privateContentStored: false }));
  }
  return freeze({
    schema: EON_EXPANSE_W769E_UPGRADE_LEDGER_SCHEMA,
    records: freeze(records),
    updatedAt: Math.max(0, finite(input.updatedAt, 0)),
    automaticUpgrade: false,
    awardsXp: false,
    privateContentStored: false,
    rawCoordinatesStored: false,
    paidShortcutAccepted: false,
    levelThreeAuthorityPending: true
  });
}

export function createEonExpanseW766APersistence({ storage = globalThis.localStorage, now = Date.now } = {}) {
  const normalize = (state) => {
    const base = createEonExpanseW766AInitialState({ seed: sanitizeSeed(state?.seed), now: now() });
    const regionId = REGION_IDS.includes(state?.regionId) ? state.regionId : base.regionId;
    const currentZone = ZONE_IDS.includes(state?.currentZone) ? state.currentZone : base.currentZone;
    const safePosition = freeze({
      x: finite(state?.safePosition?.x, base.safePosition.x),
      y: finite(state?.safePosition?.y, base.safePosition.y),
      z: finite(state?.safePosition?.z, base.safePosition.z)
    });
    return freeze({
      schema: EON_EXPANSE_W766A_FOUNDATION_SCHEMA,
      version: 1,
      seed: sanitizeSeed(state?.seed || base.seed),
      regionId,
      currentZone,
      safePosition,
      lastTransitNode: ZONE_IDS.includes(state?.lastTransitNode) ? state.lastTransitNode : 'gateway-overlook',
      activeMissionId: MISSION_IDS.includes(state?.activeMissionId) ? state.activeMissionId : '',
      currentObjective: OBJECTIVE_IDS.includes(state?.currentObjective) ? state.currentObjective : '',
      discovered: safeUnique(['gateway-overlook', ...(state?.discovered || [])], { allow: ZONE_IDS, limit: ZONE_IDS.length }),
      unlockedTransitNodes: safeUnique(['gateway-overlook', ...(state?.unlockedTransitNodes || [])], { allow: ZONE_IDS, limit: ZONE_IDS.length }),
      worldMilestones: safeUnique(state?.worldMilestones),
      processedReceipts: safeUnique(state?.processedReceipts),
      missionLedger: sanitizeMissionLedger(state?.missionLedger),
      livingContent: sanitizeLivingContent(state?.livingContent),
      myFrontier: sanitizeMyFrontierState(state?.myFrontier),
      myFrontierConstruction: sanitizeMyFrontierConstruction(state?.myFrontierConstruction),
      myFrontierUpgrades: sanitizeMyFrontierUpgrades(state?.myFrontierUpgrades),
      futureRegionProgrammeReview: sanitizeEonExpanseW783AProgrammeReview(state?.futureRegionProgrammeReview),
      futureRegionReleaseReview: sanitizeEonExpanseW788AReleaseReview(state?.futureRegionReleaseReview),
      futureRegionPackageCertification: sanitizeEonExpanseW789ARegionPackageCertification(state?.futureRegionPackageCertification),
      futureRegionPerformanceEvidence: sanitizeEonExpanseW790APerformanceEvidence(state?.futureRegionPerformanceEvidence),
      futureRegionActivation: sanitizeEonExpanseW793AActivation(state?.futureRegionActivation),
      stormSectorMissions: sanitizeEonExpanseW795AStormMissionState(state?.stormSectorMissions),
      updatedAt: Math.max(0, finite(now(), Date.now())),
      privateProjectContentStored: false
    });
  };
  return freeze({
    read(fallback = createEonExpanseW766AInitialState({ now: now() })) {
      try {
        const parsed = JSON.parse(storage?.getItem?.(EON_EXPANSE_W766A_STORAGE_KEY) || 'null');
        const normalized = normalize(parsed || fallback);
        return validateEonExpanseW766AState(normalized).ok ? normalized : fallback;
      } catch { return fallback; }
    },
    write(next) {
      const normalized = normalize(next);
      const validation = validateEonExpanseW766AState(normalized);
      if (!validation.ok) return freeze({ ok: false, reason: validation.errors.join(',') });
      try { storage?.setItem?.(EON_EXPANSE_W766A_STORAGE_KEY, JSON.stringify(normalized)); }
      catch (error) { return freeze({ ok: false, reason: `storage-write-failed:${text(error?.message, 'unknown')}` }); }
      return freeze({ ok: true, state: normalized });
    },
    clear({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      try { storage?.removeItem?.(EON_EXPANSE_W766A_STORAGE_KEY); } catch {}
      return freeze({ ok: true });
    }
  });
}

export function createEonExpanseW766AMapView(state = createEonExpanseW766AInitialState()) {
  return freeze({
    schema: `${EON_EXPANSE_W766A_FOUNDATION_SCHEMA}.map.v1`,
    regionId: state.regionId,
    currentZone: state.currentZone,
    completionPercent: Math.round((state.discovered.length / EON_EXPANSE_W766_ZONES.length) * 100),
    zones: freeze(EON_EXPANSE_W766_ZONES.map((zone) => freeze({
      id: zone.id,
      label: zone.label,
      position: freeze({ x: zone.x, z: zone.z }),
      discovered: state.discovered.includes(zone.id),
      transitUnlocked: state.unlockedTransitNodes.includes(zone.id),
      current: state.currentZone === zone.id,
      truthfulStatus: zone.status
    }))),
    hardWorldEdgeShown: false,
    returnRouteVisible: true
  });
}
