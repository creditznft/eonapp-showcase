import test from 'node:test';
import assert from 'node:assert/strict';

import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE } from '../../assets/js/city/w792/eon-expanse-w792a-storm-sector-authored-package.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS, createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { buildEonCityRt91StormIndustrialKit, validateEonCityRt91StormIndustrialKit } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-industrial-kit.js';
import { buildEonCityRt91StormContinuityPlan, validateEonCityRt91StormContinuityPlan } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-continuity-plan.js';
import { buildEonCityRt91StormCampaignTargets, validateEonCityRt91StormCampaignTargets } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-campaign-targets.js';
import { deriveEonCityRt91StormWeather, validateEonCityRt91StormWeather } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-weather-director.js';
import { deriveEonCityRt91StormHazardRoutes, validateEonCityRt91StormHazardRoutes } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-hazard-routes.js';
import { EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS, validateEonCityRt91StormCampaign } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-campaign.js';
import { createEonCityRt91StormCampaignRuntime } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-campaign-runtime.js';
import { buildEonCityRt91StormContractCells, validateEonCityRt91StormContractCells } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-contract-cells.js';
import { generateEonCityRt91DeterministicContract } from '../../assets/js/city/rt91/eon-city-rt91-deterministic-contract-generator.js';
import { projectEonCityRt91StormTransformation, validateEonCityRt91StormTransformation } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-transformation.js';
import { deriveEonCityRt91StormLife, validateEonCityRt91StormLife } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-life-director.js';
import { buildEonCityRt91StormAtmosphere, validateEonCityRt91StormAtmosphere } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-atmosphere.js';
import { buildEonCityRt91StormFlagshipProjection, validateEonCityRt91StormFlagshipProjection } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-flagship.js';
import { buildEonCityRt91MissionBoard } from '../../assets/js/city/rt91/eon-city-rt91-mission-board.js';
import { projectEonCityRt91Progression } from '../../assets/js/city/rt91/eon-city-rt91-progression-projection.js';

function completeFoundationState() {
  const base = createEonExpanseW795AInitialStormMissionState();
  return {
    ...base,
    completedObjectiveActions: EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((mission) => mission.objectives.map((objective) => objective.action)),
    completedMissionIds: EON_EXPANSE_W795A_STORM_MISSIONS.map((mission) => mission.id),
    regionCompleted: true
  };
}

test('RT91 Storm preserves W792 hero landmarks and W795 three-mission foundation', () => {
  assert.equal(EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.heroAssets.length, 3);
  assert.equal(EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.heroAssets.every((hero) => hero.lods.length === 3), true);
  assert.equal(EON_EXPANSE_W795A_STORM_MISSIONS.length, 3);
});

test('RT91 Storm industrial continuity is optional, bounded, and non-fake-interactive', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityRt91StormIndustrialKit({ quality, worldSeed: 91 });
    const result = validateEonCityRt91StormIndustrialKit(plan);
    assert.equal(result.ok, true, `${quality}: ${result.errors.join(', ')}`);
    assert.equal(plan.bootCriticalAssetDelta, 0);
    assert.equal(plan.wholeMapEagerLoadAllowed, false);
    assert.equal(plan.zones.flatMap((zone) => zone.props).every((prop) => prop.interactive === false), true);
  }
});


test('RT91 Storm continuity fills traversal corridors without replacing the three orientation heroes', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityRt91StormContinuityPlan({ quality });
    const result = validateEonCityRt91StormContinuityPlan(plan);
    assert.equal(result.ok, true, `${quality}: ${result.errors.join(', ')}`);
    assert.equal(plan.orientationHeroesAlwaysRetained, true);
    assert.equal(plan.bootCriticalAssetDelta, 0);
    assert.equal(plan.corridors.length, 3);
  }
});

test('RT91 Storm gives every one of the 36 authored campaign objectives a physical target contract', () => {
  const plan = buildEonCityRt91StormCampaignTargets();
  const result = validateEonCityRt91StormCampaignTargets(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.targetCount, 36);
  assert.equal(plan.targets.every((target) => target.interactive && target.requiresInteractionRegistry && target.requiresVerifiedReceipt), true);
});

test('RT91 Storm weather director is cadence-bound, reduced-sensory safe and hidden-world suspended', () => {
  const weather = deriveEonCityRt91StormWeather({ quality: 'balanced', worldSeed: 91, at: 100000, baseSeverity: 4, reducedSensory: true });
  assert.equal(validateEonCityRt91StormWeather(weather).ok, true);
  assert.equal(weather.decisionRunsAtFrameRate, false);
  assert.equal(weather.hubReturnBlocked, false);
  assert.ok(weather.maxParticles <= EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.qualityProfiles.balanced.maxParticles);
  const hidden = deriveEonCityRt91StormWeather({ hiddenWorld: true });
  assert.equal(validateEonCityRt91StormWeather(hidden).ok, true);
  assert.equal(hidden.active, false);
  assert.equal(hidden.maxParticles, 0);
});

test('RT91 Storm hazard routes never make the world or Hub exit inescapable', () => {
  for (let severity = 0; severity <= 4; severity += 1) {
    const plan = deriveEonCityRt91StormHazardRoutes({ weather: { severity }, restoredFamilies: [] });
    const result = validateEonCityRt91StormHazardRoutes(plan);
    assert.equal(result.ok, true, result.errors.join(', '));
    assert.equal(plan.hubReturn.available, true);
    assert.equal(plan.routes.every((route) => route.blocked === false), true);
    assert.equal(plan.allRoutesBlocked, false);
  }
});

test('RT91 Storm adds a 12-mission / 36-objective three-act campaign without XP authority', () => {
  const result = validateEonCityRt91StormCampaign();
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.missionCount, 12);
  assert.equal(result.objectiveCount, 36);
  assert.equal(result.actCount, 3);
  assert.equal(EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.every((mission) => !mission.grantsXp && !mission.rewardAuthority && !mission.writesFoundationLedger), true);
});

test('RT91 Storm living campaign cannot start before W795 foundation completes', () => {
  const runtime = createEonCityRt91StormCampaignRuntime({ getFoundationState: () => createEonExpanseW795AInitialStormMissionState() });
  const result = runtime.startMission('storm-enter-the-storm', { explicitUserAction: true });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'storm-foundation-incomplete');
});

test('RT91 Storm living campaign requires verified objective receipts and does not write foundation/XP', () => {
  const foundation = completeFoundationState();
  const runtime = createEonCityRt91StormCampaignRuntime({
    getFoundationState: () => foundation,
    verifyObjectiveReceipt: ({ objective, receipt }) => receipt?.targetKey === objective.targetKey ? { ok: true, receipt: { id: String(receipt.id) } } : { ok: false, reason: 'target-proof-mismatch' }
  });
  assert.equal(runtime.startMission('storm-enter-the-storm', { explicitUserAction: false }).ok, false);
  assert.equal(runtime.startMission('storm-enter-the-storm', { explicitUserAction: true }).ok, true);
  const mission = EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS[0];
  for (const [index, objective] of mission.objectives.entries()) {
    const result = runtime.completeObjective(mission.id, objective.id, { explicitUserAction: true, receipt: { id: `storm-proof-${index}`, targetKey: objective.targetKey } });
    assert.equal(result.ok, true, result.reason);
    assert.equal(result.awardsXp, false);
    assert.equal(result.writesFoundationLedger, false);
  }
  assert.equal(runtime.getView().completedMissionCount, 1);
  assert.equal(runtime.getView().availableMissions[0]?.id, 'storm-grounding-protocol');
});

test('RT91 Storm contract cells provide 24 semantic authored sites with no raw coordinate authority', () => {
  const plan = buildEonCityRt91StormContractCells();
  const result = validateEonCityRt91StormContractCells(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.cellCount, 24);
  assert.equal(plan.rawUserCoordinatesAccepted, false);
});

test('RT91 Storm deterministic contracts use only compatible unique cells in each real zone', () => {
  const plan = buildEonCityRt91StormContractCells();
  for (const zoneId of ['charged-gateway', 'relay-basin', 'stabilizer-ridge', 'storm-eye']) {
    const cells = plan.cells.filter((cell) => cell.zoneId === zoneId);
    let successes = 0;
    for (let index = 0; index < 30; index += 1) {
      const generated = generateEonCityRt91DeterministicContract({ worldId: 'storm-sector', worldSeed: `storm-${zoneId}`, cycleKey: '2026-W33', contractIndex: index, candidateCells: cells });
      if (!generated.ok) continue;
      successes += 1;
      assert.equal(generated.placement.ok, true);
      assert.equal(new Set(generated.placement.placements.map((row) => row.cellId)).size, generated.placement.placements.length);
      assert.equal(generated.placement.placements.every((row) => cells.some((cell) => cell.cellId === row.cellId && cell.roles.includes(row.cellRole))), true);
    }
    assert.ok(successes >= 20, `${zoneId} only generated ${successes}/30 compatible contracts`);
  }
});

test('RT91 Storm transformation remains presentation-only across foundation and living campaign', () => {
  const result = projectEonCityRt91StormTransformation({ foundationState: completeFoundationState(), campaignState: { completedMissionIds: ['storm-enter-the-storm', 'storm-grounding-protocol'] } });
  const validation = validateEonCityRt91StormTransformation(result);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(result.zones.length, 4);
  assert.equal(result.createsGeometry, false);
  assert.equal(result.writesProgression, false);
});

test('RT91 Storm life uses the existing three authored NPCs and warns EONBOT during critical weather', () => {
  const result = deriveEonCityRt91StormLife({ quality: 'balanced', at: 100000, weather: { severity: 4 }, objective: { verb: 'rescue', position: { x: 1120, z: -180 } } });
  const validation = validateEonCityRt91StormLife(result);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(result.npcDecisions.length, 3);
  assert.equal(result.eonbot.state, 'warn');
  const hidden = deriveEonCityRt91StormLife({ hiddenWorld: true, weather: { severity: 4 }, at: 100000 });
  assert.equal(hidden.npcDecisions.every((npc) => npc.active === false), true);
});

test('RT91 Storm atmosphere prefers bounded authored audio/light/fog spectacle over more persistent mesh animation', () => {
  const result = buildEonCityRt91StormAtmosphere({ zoneId: 'storm-eye', weather: { severity: 4 }, reducedSensory: false });
  const validation = validateEonCityRt91StormAtmosphere(result);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(result.audioLightingFogPreferred, true);
  assert.equal(result.meshSpectaclePreferred, false);
  assert.equal(result.ownsTimer, false);
  assert.equal(result.ownsRenderLoop, false);
});

test('RT91 Mission Board exposes W795 foundation first then the living campaign', () => {
  const before = buildEonCityRt91MissionBoard({ stormState: createEonExpanseW795AInitialStormMissionState() });
  assert.equal(before.sections.story.some((row) => row.kind === 'storm-foundation'), true);
  assert.equal(before.sections.story.some((row) => row.kind === 'storm-living-campaign'), false);
  const after = buildEonCityRt91MissionBoard({ stormState: completeFoundationState() });
  const living = after.sections.story.find((row) => row.kind === 'storm-living-campaign');
  assert.equal(living?.id, 'storm-enter-the-storm');
  assert.equal(living?.status, 'available');
});

test('RT91 progression reports living Storm campaign separately from W795 foundation', () => {
  const projection = projectEonCityRt91Progression({ stormState: completeFoundationState(), stormCampaignState: { completedMissionIds: ['storm-enter-the-storm'] } });
  const storm = projection.worlds['storm-sector'];
  assert.equal(storm.campaignComplete, true);
  assert.equal(storm.livingCampaignCompleted, 1);
  assert.equal(storm.livingCampaignTotal, 12);
  assert.equal(storm.livingCampaignAvailable, true);
  assert.equal(projection.awardsXp, false);
});

test('RT91 Storm composed flagship projection preserves foundation/heroes and adds no first-frame asset load', () => {
  const projection = buildEonCityRt91StormFlagshipProjection({ quality: 'balanced', worldSeed: 91, at: 100000 });
  const validation = validateEonCityRt91StormFlagshipProjection(projection);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(validation.campaignMissionCount, 12);
  assert.equal(validation.contractCellCount, 24);
  assert.equal(projection.existingFoundationPreserved, true);
  assert.equal(projection.existingThreeHeroLandmarksPreserved, true);
  assert.equal(projection.firstFrameAssetDelta, 0);
});
