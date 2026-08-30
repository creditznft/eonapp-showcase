import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_EXPANSE_W768A_BUILDING_CATALOG,
  EON_EXPANSE_W768A_MY_FRONTIER_PLOTS,
  EON_EXPANSE_W768A_RESIDENT_SLOTS,
  createEonExpanseW768AMyFrontierLayoutContract,
  validateEonExpanseW768AMyFrontierLayoutContract
} from '../../assets/js/city/w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { buildEonCityRt91MyFrontierDistrictArchitecture, validateEonCityRt91MyFrontierDistrictArchitecture } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-architecture.js';
import { buildEonCityRt91MyFrontierCivicSites, validateEonCityRt91MyFrontierCivicSites } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-civic-sites.js';
import { buildEonCityRt91MyFrontierContinuity, validateEonCityRt91MyFrontierContinuity } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-roads-plazas-transit.js';
import { buildEonCityRt91MyFrontierBespokeArtContracts, validateEonCityRt91MyFrontierBespokeArtContracts } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-bespoke-art-contracts.js';
import { projectEonCityRt91MyFrontierDistrictEvolution, validateEonCityRt91MyFrontierDistrictEvolution } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-evolution.js';
import { EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS, validateEonCityRt91MyFrontierDistrictMissions } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-missions.js';
import { buildEonCityRt91MyFrontierContractCells, validateEonCityRt91MyFrontierContractCells } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-contract-cells.js';
import { buildEonCityRt91MyFrontierDistrictMissionTargets, validateEonCityRt91MyFrontierDistrictMissionTargets } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-mission-targets.js';
import { createEonCityRt91MyFrontierDistrictMissionRuntime, deriveEonCityRt91MyFrontierDistrictMissionView } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-mission-runtime.js';
import { projectEonCityRt91MyFrontierProductiveReceipt, validateEonCityRt91MyFrontierProductiveProjection } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-productive-rpg.js';
import { deriveEonCityRt91MyFrontierResidentLife, validateEonCityRt91MyFrontierResidentLife } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-resident-life.js';
import { buildEonCityRt91MyFrontierAmbientPopulation, validateEonCityRt91MyFrontierAmbientPopulation } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-ambient-population.js';
import { deriveEonCityRt91MyFrontierCeremony, validateEonCityRt91MyFrontierCeremony } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-ceremony-director.js';
import { buildEonCityRt91MyFrontierContractOffers, validateEonCityRt91MyFrontierContractOffers } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-contract-director.js';
import { buildEonCityRt91MyFrontierSkyline, validateEonCityRt91MyFrontierSkyline } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-skyline-density.js';
import { buildEonCityRt91MyFrontierFlagshipProjection, validateEonCityRt91MyFrontierFlagshipProjection } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-flagship.js';
import { buildEonCityRt91MissionBoard } from '../../assets/js/city/rt91/eon-city-rt91-mission-board.js';
import { projectEonCityRt91Progression, validateEonCityRt91ProgressionProjection } from '../../assets/js/city/rt91/eon-city-rt91-progression-projection.js';

const DISTRICTS = ['central','creator','knowledge','systems','signal','transit','personal'];
const BESPOKE = ['design-pavilion','research-observatory','expedition-hangar','reflection-garden','vault-reveal-gallery'];
const allBuilt = Object.fromEntries(EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.map((plot) => [plot.id, plot.requiredBuildingId || plot.allowedBuildingIds[0]]));
const unlockedBuilt = { unlocked: true, buildingChoices: allBuilt, residents: {} };
const verifyReceipt = ({ receipt }) => receipt?.verified === true && receipt?.id ? { ok: true, receipt } : { ok: false, reason: 'unverified' };

function receipt(id, kind = 'objective-reviewed') { return { id, kind, verified: true }; }

function completeMission(runtime, missionId, { productiveKindOverride = null } = {}) {
  const start = runtime.startMission(missionId, { explicitUserAction: true });
  assert.equal(start.ok, true, start.reason);
  const mission = EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS.find((row) => row.id === missionId);
  let final = null;
  for (const [index, objective] of mission.objectives.entries()) {
    const kind = productiveKindOverride && objective.requiredProductiveReceiptKind ? productiveKindOverride : objective.requiredProductiveReceiptKind || 'objective-reviewed';
    final = runtime.completeObjective(mission.id, objective.id, { explicitUserAction: true, receipt: receipt(`${mission.id}:receipt:${index + 1}`, kind) });
    assert.equal(final.ok, true, final.reason);
  }
  return final;
}

test('RT91 My Frontier preserves the certified W768 seven-plot / 19-building / six-resident foundation', () => {
  const legacy = createEonExpanseW768AMyFrontierLayoutContract();
  const validation = validateEonExpanseW768AMyFrontierLayoutContract(legacy);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(legacy.plots.length, 7);
  assert.equal(Object.keys(EON_EXPANSE_W768A_BUILDING_CATALOG).length, 19);
  assert.equal(EON_EXPANSE_W768A_RESIDENT_SLOTS.length, 6);
  assert.equal(legacy.rawCoordinatePlacementAllowed, false);
  assert.equal(legacy.oneCanonicalScene, true);
});

test('RT91 district architecture adds exactly three bounded rings without replacing construction authority', () => {
  const plan = buildEonCityRt91MyFrontierDistrictArchitecture();
  const result = validateEonCityRt91MyFrontierDistrictArchitecture(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.districtCount, 7);
  assert.equal(plan.ringCount, 3);
  assert.deepEqual(plan.districts[0].rings.map((ring) => ring.id), ['user-core','district-support','public-city']);
  assert.equal(plan.replacesConstructionAuthority, false);
  assert.equal(plan.rawCoordinatePlacementAllowed, false);
  assert.equal(plan.tradableLandCreated, false);
});

test('RT91 civic support sites are deterministic, 3 per district, non-tradable and non-boot-critical', () => {
  const a = buildEonCityRt91MyFrontierCivicSites();
  const b = buildEonCityRt91MyFrontierCivicSites();
  const result = validateEonCityRt91MyFrontierCivicSites(a);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.deepEqual(a, b);
  assert.equal(a.siteCount, 21);
  for (const district of DISTRICTS) assert.equal(a.sites.filter((site) => site.districtId === district).length, 3);
  assert.equal(a.sites.some((site) => site.bootCritical || site.tradableLand || site.acceptsRawUserCoordinates), false);
});

test('RT91 roads/plazas/transit connect all seven districts without becoming navigation/collision/travel authority', () => {
  const plan = buildEonCityRt91MyFrontierContinuity();
  const result = validateEonCityRt91MyFrontierContinuity(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.radialRoutes.length, 6);
  assert.equal(plan.ringRoutes.length, 6);
  assert.equal(plan.plazas.length, 7);
  assert.equal(plan.transitStops.length, 7);
  assert.equal(plan.firstFrameAssetDelta, 0);
  assert.equal(plan.ownsNavigation || plan.ownsCollision || plan.ownsTravelAuthority, false);
});

test('RT91 bespoke-art backlog is exactly the five truthful pending buildings and keeps W770 fallbacks', () => {
  const plan = buildEonCityRt91MyFrontierBespokeArtContracts();
  const result = validateEonCityRt91MyFrontierBespokeArtContracts(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.deepEqual(plan.entries.map((entry) => entry.buildingId), BESPOKE);
  assert.equal(plan.claimsBespokeArtExists, false);
  assert.equal(plan.currentInterimGameplayCanRemainFunctional, true);
  for (const entry of plan.entries) {
    assert.equal(entry.currentAssetStatus, 'dedicated-authored-building-pending');
    assert.equal(entry.truthfulInterimCompositionReady, true);
    assert.deepEqual(entry.requiredLods, [0,1,2]);
    assert.equal(entry.fallbackMustRemainUntilValidated, true);
  }
});

test('RT91 district evolution is a read-only 0–4 visual projection over existing construction/upgrades/missions', () => {
  const plan = projectEonCityRt91MyFrontierDistrictEvolution({
    buildingChoices: allBuilt,
    existingUpgradeLevels: Object.fromEntries(DISTRICTS.map((id) => [id, 2])),
    completedDistrictMissionIds: EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS.map((m) => m.id),
    productiveReceiptCounts: Object.fromEntries(DISTRICTS.map((id) => [id, 2]))
  });
  const result = validateEonCityRt91MyFrontierDistrictEvolution(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.districts.every((row) => row.level === 4 && row.label === 'signature'), true);
  assert.equal(plan.projectionOnly, true);
  assert.equal(plan.writesProgression || plan.createsUnlock, false);
});

test('RT91 district campaign is exactly 21 authored missions / 63 explicit objectives / 3 per district', () => {
  const result = validateEonCityRt91MyFrontierDistrictMissions();
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.missionCount, 21);
  assert.equal(result.objectiveCount, 63);
  assert.equal(result.districtCount, 7);
  assert.ok(result.productiveObjectiveCount >= 13);
  for (const district of DISTRICTS) {
    const rows = EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS.filter((m) => m.districtId === district);
    assert.equal(rows.length, 3);
    assert.deepEqual(rows.map((m) => m.sequence), [1,2,3]);
  }
  assert.equal(EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS.some((m) => m.grantsXp || m.writesMyFrontierState || m.runtimeAiRequired), false);
});

test('RT91 My Frontier provides 42 canonical contract cells and 63 physically addressable mission targets', () => {
  const cells = buildEonCityRt91MyFrontierContractCells();
  const targets = buildEonCityRt91MyFrontierDistrictMissionTargets();
  assert.equal(validateEonCityRt91MyFrontierContractCells(cells).ok, true);
  assert.equal(validateEonCityRt91MyFrontierDistrictMissionTargets(targets).ok, true);
  assert.equal(cells.cellCount, 42);
  assert.equal(targets.targetCount, 63);
  for (const district of DISTRICTS) assert.equal(cells.cells.filter((cell) => cell.zoneId === district).length, 6);
  for (const target of targets.targets) {
    const cell = cells.cells.find((row) => row.cellId === target.cellId);
    assert.ok(cell, target.cellId);
    assert.equal(cell.zoneId, target.districtId);
    assert.equal(target.requiresExplicitUserAction, true);
    assert.equal(target.requiresVerifiedReceipt, true);
    assert.equal(target.rawUserCoordinatesAccepted, false);
  }
});

test('RT91 district missions fail closed while My Frontier is locked and non-central districts require W768 construction', () => {
  const locked = deriveEonCityRt91MyFrontierDistrictMissionView({ state: {}, myFrontierState: { unlocked: false, buildingChoices: {} } });
  assert.equal(locked.availableMissions.length, 0);
  const unlockedEmpty = deriveEonCityRt91MyFrontierDistrictMissionView({ state: {}, myFrontierState: { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core' } } });
  assert.equal(unlockedEmpty.availableMissions.some((m) => m.id === 'my-frontier-central-mission-1'), true);
  assert.equal(unlockedEmpty.availableMissions.some((m) => m.id === 'my-frontier-creator-mission-1'), false);
  const creatorBuilt = deriveEonCityRt91MyFrontierDistrictMissionView({ state: {}, myFrontierState: { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop' } } });
  assert.equal(creatorBuilt.availableMissions.some((m) => m.id === 'my-frontier-creator-mission-1'), true);
});

test('RT91 district runtime requires explicit user action and verified receipts, never XP or W768 writes', () => {
  const completions = [];
  const runtime = createEonCityRt91MyFrontierDistrictMissionRuntime({ getMyFrontierState: () => unlockedBuilt, verifyObjectiveReceipt: verifyReceipt, onMissionComplete: (event) => completions.push(event) });
  assert.equal(runtime.startMission('my-frontier-central-mission-1').reason, 'explicit-user-action-required');
  assert.equal(runtime.startMission('my-frontier-central-mission-1', { explicitUserAction: true }).ok, true);
  assert.equal(runtime.completeObjective('my-frontier-central-mission-1', 'reach-command-core', { explicitUserAction: true, receipt: { id: 'x', verified: false } }).ok, false);
  const mission = EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS.find((m) => m.id === 'my-frontier-central-mission-1');
  for (const [index, objective] of mission.objectives.entries()) {
    const out = runtime.completeObjective(mission.id, objective.id, { explicitUserAction: true, receipt: receipt(`central-m1:${index + 1}`) });
    assert.equal(out.ok, true, out.reason);
    assert.equal(out.awardsXp, false);
    assert.equal(out.writesMyFrontierState, false);
  }
  assert.equal(runtime.getState().completedMissionIds.includes(mission.id), true);
  assert.equal(completions.length, 1);
  assert.equal(completions[0].awardsXp, false);
  assert.equal(completions[0].writesMyFrontierState, false);
});

test('RT91 productive district objectives reject the wrong verified receipt kind', () => {
  const runtime = createEonCityRt91MyFrontierDistrictMissionRuntime({ getMyFrontierState: () => unlockedBuilt, verifyObjectiveReceipt: verifyReceipt });
  assert.equal(runtime.startMission('my-frontier-systems-mission-1', { explicitUserAction: true }).ok, true);
  assert.equal(runtime.completeObjective('my-frontier-systems-mission-1', 'reach-systems-plot', { explicitUserAction: true, receipt: receipt('systems:1') }).ok, true);
  const wrong = runtime.completeObjective('my-frontier-systems-mission-1', 'verify-local-ai-ready', { explicitUserAction: true, receipt: receipt('systems:2', 'creator-output-reviewed') });
  assert.equal(wrong.ok, false);
  assert.equal(wrong.reason, 'productive-receipt-kind-mismatch');
  const right = runtime.completeObjective('my-frontier-systems-mission-1', 'verify-local-ai-ready', { explicitUserAction: true, receipt: receipt('systems:3', 'local-ai-ready-verified') });
  assert.equal(right.ok, true);
});

test('RT91 productive-RPG projection stores only bounded receipt metadata and cannot grant progression', () => {
  const projection = projectEonCityRt91MyFrontierProductiveReceipt({ id: 'review:creator:001', kind: 'creator-output-reviewed', verified: true, prompt: 'private prompt', content: 'secret file' });
  const validation = validateEonCityRt91MyFrontierProductiveProjection(projection);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(projection.ok, true);
  assert.equal(projection.districtId, 'creator');
  assert.equal(projection.receiptMetadataOnly, true);
  assert.equal(projection.storesRawPrompt || projection.storesRawFileContent || projection.storesCredential || projection.storesGeneratedContent, false);
  assert.equal(projection.awardsXp || projection.writesMyFrontierState || projection.createsUnlock || projection.runtimeAiRequired, false);
  assert.doesNotMatch(JSON.stringify(projection), /private prompt|secret file/);
});

test('RT91 resident life uses bounded proximity LOD and fully suspends hidden-world animation', () => {
  const residentState = { residents: Object.fromEntries(EON_EXPANSE_W768A_RESIDENT_SLOTS.map((slot) => [slot.id, slot.residentId])) };
  for (const [quality, max] of [['lite',1],['balanced',2],['cinematic',3]]) {
    const plan = deriveEonCityRt91MyFrontierResidentLife({ residentState, focusDistrict: 'central', quality, at: 123456 });
    const result = validateEonCityRt91MyFrontierResidentLife(plan);
    assert.equal(result.ok, true, result.errors.join(', '));
    assert.ok(plan.fullAnimatedCount <= max);
    assert.equal(plan.decisionRunsAtFrameRate, false);
  }
  const hidden = deriveEonCityRt91MyFrontierResidentLife({ residentState, focusDistrict: 'central', quality: 'cinematic', hiddenWorld: true });
  assert.equal(hidden.fullAnimatedCount, 0);
  assert.equal(hidden.hiddenWorldSuspended, true);
});

test('RT91 ambient population is focused-district only, budgeted, optional and hidden-world suspended', () => {
  const plan = buildEonCityRt91MyFrontierAmbientPopulation({ quality: 'cinematic', focusDistrict: 'creator', districtLevels: { creator: 4 } });
  assert.equal(validateEonCityRt91MyFrontierAmbientPopulation(plan).ok, true);
  assert.ok(plan.nearActorCount <= 3);
  assert.ok(plan.midSilhouetteCount <= 6);
  assert.equal(plan.firstFrameAssetDelta, 0);
  assert.equal(plan.fullWorldPopulationActive, false);
  const hidden = buildEonCityRt91MyFrontierAmbientPopulation({ quality: 'cinematic', focusDistrict: 'creator', districtLevels: { creator: 4 }, hiddenWorld: true });
  assert.equal(hidden.nearActorCount, 0);
  assert.equal(hidden.midSilhouetteCount, 0);
  assert.equal(hidden.hiddenWorldSuspended, true);
});

test('RT91 ceremony director allows at most one bounded ceremony and honors hidden/reduced-motion modes', () => {
  const active = deriveEonCityRt91MyFrontierCeremony({ event: { kind: 'signature', districtId: 'creator' } });
  assert.equal(validateEonCityRt91MyFrontierCeremony(active).ok, true);
  assert.equal(active.active, true);
  assert.equal(active.maxConcurrentCeremonies, 1);
  assert.equal(active.durationMs, 1800);
  assert.equal(active.ownsTimer || active.ownsRenderLoop || active.writesConstructionState || active.grantsProgression, false);
  const reduced = deriveEonCityRt91MyFrontierCeremony({ event: { kind: 'signature', districtId: 'creator' }, reducedMotion: true });
  assert.equal(reduced.durationMs, 0);
  assert.equal(reduced.animationUpdatesAtFrameRate, false);
  const hidden = deriveEonCityRt91MyFrontierCeremony({ event: { kind: 'construction', districtId: 'creator' }, hiddenWorld: true });
  assert.equal(hidden.active, false);
});

test('RT91 My Frontier long-term contract board is deterministic, max-three and has no streak/FOMO authority', () => {
  const a = buildEonCityRt91MyFrontierContractOffers({ worldSeed: 'rt91-test', cycleKey: 'day-1', focusDistrict: 'creator' });
  const b = buildEonCityRt91MyFrontierContractOffers({ worldSeed: 'rt91-test', cycleKey: 'day-1', focusDistrict: 'creator' });
  const result = validateEonCityRt91MyFrontierContractOffers(a);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.deepEqual(a, b);
  assert.ok(a.offerCount >= 1 && a.offerCount <= 3);
  assert.equal(a.maximumOffers, 3);
  assert.equal(a.missingCycleLosesProgress || a.streakRequired || a.penaltyForSkipping || a.awardsXp || a.writesProgression || a.runtimeAiRequired, false);
});

test('RT91 skyline density never requires whole-map LOD0, animation or first-frame scenery', () => {
  const levels = Object.fromEntries(DISTRICTS.map((id) => [id, 4]));
  for (const quality of ['lite','balanced','cinematic']) {
    const plan = buildEonCityRt91MyFrontierSkyline({ quality, districtLevels: levels, focusDistrict: 'creator' });
    const result = validateEonCityRt91MyFrontierSkyline(plan);
    assert.equal(result.ok, true, result.errors.join(', '));
    assert.equal(plan.firstFrameAssetDelta, 0);
    assert.equal(plan.wholeMapLod0Allowed, false);
    assert.equal(plan.districts.some((row) => row.uniqueLod0Required || row.bootCritical || row.animated), false);
  }
  const hidden = buildEonCityRt91MyFrontierSkyline({ quality: 'cinematic', districtLevels: levels, focusDistrict: 'creator', hiddenWorld: true });
  assert.equal(hidden.districts.every((row) => row.midStaticStructureCount === 0 && row.horizonSilhouetteCount === 0), true);
});

test('RT91 unified Mission Board surfaces available district story only after W768 construction', () => {
  const state = { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop' }, residents: {} };
  const board = buildEonCityRt91MissionBoard({ myFrontierState: state, myFrontierDistrictMissionState: {} });
  const ids = board.sections.story.filter((row) => row.kind === 'district-story').map((row) => row.id);
  assert.ok(ids.includes('my-frontier-central-mission-1'));
  assert.ok(ids.includes('my-frontier-creator-mission-1'));
  assert.equal(ids.includes('my-frontier-knowledge-mission-1'), false);
  assert.equal(board.projectionOnly, true);
  assert.equal(board.awardsXp || board.writesProgression || board.networkRequestCreated, false);
});

test('RT91 progression reports district campaign separately from W768 construction/resident state', () => {
  const completedMissionIds = EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS.slice(0, 4).map((m) => m.id);
  const projection = projectEonCityRt91Progression({ myFrontierState: unlockedBuilt, myFrontierDistrictMissionState: { completedMissionIds } });
  const result = validateEonCityRt91ProgressionProjection(projection);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(projection.worlds['my-frontier'].constructedPlotCount, 7);
  assert.equal(projection.worlds['my-frontier'].districtCampaignCompleted, 4);
  assert.equal(projection.worlds['my-frontier'].districtCampaignTotal, 21);
  assert.equal(projection.projectionOnly, true);
  assert.equal(projection.awardsXp || projection.writesProgression || projection.createsUnlock || projection.privateContentStored, false);
});

test('RT91 composed My Frontier flagship validates and preserves W768/W769/W770 authority with zero first-frame delta', () => {
  const projection = buildEonCityRt91MyFrontierFlagshipProjection({
    quality: 'balanced',
    worldSeed: 'rt91-test',
    cycleKey: 'cycle-a',
    myFrontierState: unlockedBuilt,
    districtMissionState: {},
    existingUpgradeLevels: { central: 2, creator: 1 },
    productiveReceiptCounts: { central: 1, creator: 1 },
    focusDistrict: 'creator'
  });
  const result = validateEonCityRt91MyFrontierFlagshipProjection(projection);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.districtMissionCount, 21);
  assert.equal(result.missionTargetCount, 63);
  assert.equal(result.contractCellCount, 42);
  assert.equal(projection.existingW768ConstructionPreserved, true);
  assert.equal(projection.existingW769UpgradeAuthorityPreserved, true);
  assert.equal(projection.existingW770CompositionsPreserved, true);
  assert.equal(projection.firstFrameAssetDelta, 0);
  assert.equal(projection.wholeMapEagerLoadAllowed || projection.rawUserCoordinatesAccepted || projection.tradableLandCreated || projection.ownsEngine || projection.ownsScene || projection.ownsRenderLoop || projection.writesProgression, false);
});

test('RT91 My Frontier additions own no second Babylon/network/persistence authority', () => {
  const dir = new URL('../../assets/js/city/rt91/my-frontier/', import.meta.url);
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.js')) continue;
    const source = fs.readFileSync(new URL(name, dir), 'utf8');
    assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(/, name);
    assert.doesNotMatch(source, /runRenderLoop\s*\(/, name);
    assert.doesNotMatch(source, /\bfetch\s*\(/, name);
    assert.doesNotMatch(source, /localStorage|sessionStorage/, name);
  }
});
