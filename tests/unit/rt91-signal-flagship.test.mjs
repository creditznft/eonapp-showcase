import test from 'node:test';
import assert from 'node:assert/strict';

import { EON_EXPANSE_W766E_CAMPAIGN } from '../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js';
import { EON_EXPANSE_W766F_SIDE_MISSIONS } from '../../assets/js/city/w766/eon-expanse-w766f-living-content.js';
import { validateEonCityRt91SignalZoneIdentities } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-zone-identity.js';
import { buildEonCityRt91SignalDensityPlan, validateEonCityRt91SignalDensityPlan } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-density-plan.js';
import { buildEonCityRt91SignalRouteLanguage, validateEonCityRt91SignalRouteLanguage } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-route-language.js';
import { EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS, validateEonCityRt91SignalZoneMastery } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-zone-mastery.js';
import { buildEonCityRt91SignalContractCells, validateEonCityRt91SignalContractCells } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-contract-cells.js';
import { generateEonCityRt91DeterministicContract } from '../../assets/js/city/rt91/eon-city-rt91-deterministic-contract-generator.js';
import { projectEonCityRt91SignalTransformation, validateEonCityRt91SignalTransformation } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-transformation.js';
import { deriveEonCityRt91SignalLife, validateEonCityRt91SignalLife } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-life-director.js';
import { buildEonCityRt91SignalCinematicCue, validateEonCityRt91SignalCinematicCue } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-cinematic-polish.js';
import { buildEonCityRt91SignalFlagshipProjection, validateEonCityRt91SignalFlagshipProjection } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-flagship.js';

test('RT91 Signal preserves the existing seven-mission campaign and repeatable base', () => {
  assert.equal(EON_EXPANSE_W766E_CAMPAIGN.length, 7);
  assert.equal(EON_EXPANSE_W766F_SIDE_MISSIONS.length, 5);
  assert.equal(EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.length, 10);
});

test('RT91 Signal gives all five zones distinct near/mid/horizon identities without boot-critical additions', () => {
  const result = validateEonCityRt91SignalZoneIdentities();
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.zoneCount, 5);
  assert.equal(result.bootCriticalAssetsAdded, 0);
});

test('RT91 Signal density stays optional and bounded across quality tiers', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityRt91SignalDensityPlan({ quality, worldSeed: 91 });
    const result = validateEonCityRt91SignalDensityPlan(plan);
    assert.equal(result.ok, true, `${quality}: ${result.errors.join(', ')}`);
    assert.equal(plan.bootCriticalAssetDelta, 0);
    assert.equal(plan.wholeMapEagerLoadAllowed, false);
    assert.ok(plan.optionalConcurrentLoads <= 3);
  }
});

test('RT91 Signal route language remains readable while owning no navigation/collision authority', () => {
  const plan = buildEonCityRt91SignalRouteLanguage({ restorationByZone: { 'gateway-overlook': 1, 'beacon-fields': 0.5, 'archive-ruins': 0 } });
  const result = validateEonCityRt91SignalRouteLanguage(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.segmentCount, 4);
  assert.deepEqual(plan.segments.map((row) => row.visualState).slice(0, 3), ['restoring', 'damaged', 'damaged']);
});

test('RT91 Signal Zone Mastery adds exactly two authored missions per zone and owns no XP/progression authority', () => {
  const result = validateEonCityRt91SignalZoneMastery();
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.missionCount, 10);
  assert.equal(result.zoneCount, 5);
  assert.equal(EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.every((mission) => !mission.grantsXp && !mission.rewardAuthority && !mission.writesCampaignLedger), true);
});

test('RT91 Signal contract cells expose authored semantic placement rather than arbitrary coordinates', () => {
  const plan = buildEonCityRt91SignalContractCells();
  const result = validateEonCityRt91SignalContractCells(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.cellCount, 20);
  assert.equal(plan.rawUserCoordinatesAccepted, false);
});

test('RT91 contract generator selects only families compatible with currently available Signal cells', () => {
  const plan = buildEonCityRt91SignalContractCells();
  const archiveCells = plan.cells.filter((cell) => cell.zoneId === 'archive-ruins');
  for (let index = 0; index < 20; index += 1) {
    const generated = generateEonCityRt91DeterministicContract({ worldId: 'signal-frontier', worldSeed: 'signal-archive-test', cycleKey: '2026-W33', contractIndex: index, candidateCells: archiveCells });
    assert.equal(generated.ok, true, generated.reason || 'generation failed');
    assert.equal(['archive-recovery-contract', 'frontier-rescue-contract'].includes(generated.familyId), true, generated.familyId);
    assert.equal(generated.placement.ok, true);
  }
});

test('RT91 Signal transformation remains a read-only visual projection', () => {
  const result = projectEonCityRt91SignalTransformation({ beaconOneStage: 3, beaconTwoRepaired: true, regionalTransitRestored: true, campaignComplete: false });
  const validation = validateEonCityRt91SignalTransformation(result);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(result.zones.length, 5);
  assert.equal(result.createsGeometry, false);
  assert.equal(result.writesProgression, false);
});

test('RT91 Signal life is cadence-bounded and hidden-world safe', () => {
  const visible = deriveEonCityRt91SignalLife({ zoneId: 'transit-scar', quality: 'balanced', at: 100000, objective: { verb: 'repair', position: { x: 0, z: 0 } } });
  assert.equal(validateEonCityRt91SignalLife(visible).ok, true);
  assert.equal(visible.npcDecisions.length, 2);
  const hidden = deriveEonCityRt91SignalLife({ zoneId: 'transit-scar', hiddenWorld: true, at: 100000 });
  assert.equal(validateEonCityRt91SignalLife(hidden).ok, true);
  assert.equal(hidden.npcDecisions.every((npc) => npc.active === false && npc.cadenceMs === 0), true);
});

test('RT91 Signal cinematic cues are skippable presentation only', () => {
  const cue = buildEonCityRt91SignalCinematicCue({ missionId: 'gateway-frontier-bearings', zoneId: 'gateway-overlook', beat: 'arrival', objective: { id: 'reach-panorama-frame', label: 'Reach the panorama frame' } });
  const result = validateEonCityRt91SignalCinematicCue(cue);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(cue.skippable, true);
  assert.equal(cue.ownsCamera, false);
  assert.equal(cue.completesObjective, false);
});

test('RT91 Signal composed flagship projection validates with zero first-frame asset delta', () => {
  const projection = buildEonCityRt91SignalFlagshipProjection({ quality: 'balanced', worldSeed: 91, progress: { beaconOneStage: 2, archiveRecordCount: 2 } });
  const result = validateEonCityRt91SignalFlagshipProjection(projection);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.zoneMasteryMissionCount, 10);
  assert.equal(result.contractCellCount, 20);
  assert.equal(projection.firstFrameAssetDelta, 0);
  assert.equal(projection.existingSevenMissionCampaignPreserved, true);
});

import { createEonCityRt91SignalMasteryRuntime } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-mastery-runtime.js';
import { buildEonCityRt91MissionBoard } from '../../assets/js/city/rt91/eon-city-rt91-mission-board.js';
import { resolveEonCityRt91NextAction } from '../../assets/js/city/rt91/eon-city-rt91-next-action.js';
import { projectEonCityRt91Progression } from '../../assets/js/city/rt91/eon-city-rt91-progression-projection.js';

test('RT91 Signal Zone Mastery runtime requires explicit verified objective receipts and never awards XP', () => {
  const signalState = { completedMissions: ['companion-in-the-static', 'beyond-the-gate'] };
  const runtime = createEonCityRt91SignalMasteryRuntime({
    getSignalState: () => signalState,
    verifyObjectiveReceipt: ({ objective, receipt }) => receipt?.targetKey === objective.targetKey
      ? { ok: true, receipt: { id: String(receipt.id) } }
      : { ok: false, reason: 'target-proof-mismatch' }
  });
  assert.equal(runtime.startMission('gateway-frontier-bearings', { explicitUserAction: false }).ok, false);
  assert.equal(runtime.startMission('gateway-frontier-bearings', { explicitUserAction: true }).ok, true);
  const mission = EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.find((entry) => entry.id === 'gateway-frontier-bearings');
  for (const [index, objective] of mission.objectives.entries()) {
    const result = runtime.completeObjective(mission.id, objective.id, { explicitUserAction: true, receipt: { id: `mastery-proof-${index}`, targetKey: objective.targetKey } });
    assert.equal(result.ok, true, result.reason);
    assert.equal(result.awardsXp, false);
  }
  assert.equal(runtime.getView().completedMissionCount, 1);
  assert.equal(runtime.getView().availableMissions.some((entry) => entry.id === 'gateway-relay-watch'), true);
});

test('RT91 Mission Board and next-action resolver surface Zone Mastery after campaign prerequisites', () => {
  const signalState = { completedMissions: ['companion-in-the-static', 'beyond-the-gate'] };
  const board = buildEonCityRt91MissionBoard({ signalState });
  const mastery = board.sections.story.find((row) => row.id === 'gateway-frontier-bearings');
  assert.equal(mastery?.kind, 'zone-mastery');
  assert.equal(mastery?.status, 'available');
  const next = resolveEonCityRt91NextAction({ board, currentWorldId: 'signal-frontier' });
  assert.equal(next.blankState, false);
  assert.ok(next.action?.id);
});

test('RT91 progression projection reports Zone Mastery separately from the original Signal XP/campaign ledger', () => {
  const signalState = { completedMissions: ['companion-in-the-static', 'beyond-the-gate'] };
  const projection = projectEonCityRt91Progression({ signalState, signalMasteryState: { completedMissionIds: ['gateway-frontier-bearings'] } });
  assert.equal(projection.worlds['signal-frontier'].zoneMasteryCompleted, 1);
  assert.equal(projection.worlds['signal-frontier'].zoneMasteryTotal, 10);
  assert.equal(projection.awardsXp, false);
  assert.equal(projection.writesProgression, false);
});
