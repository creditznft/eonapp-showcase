import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityRt91CommandHubInteractionAudit, validateEonCityRt91CommandHubInteractionAudit } from '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-interaction-audit.js';
import { buildEonCityRt91CommandHubCameraAudit, validateEonCityRt91CommandHubCameraAudit } from '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-camera-layout-audit.js';
import { buildEonCityRt91CommandHubCastAudit, validateEonCityRt91CommandHubCastAudit } from '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-cast-audit.js';
import { buildEonCityRt91CommandHubTransportAudit, validateEonCityRt91CommandHubTransportAudit } from '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-transport-audit.js';
import { buildEonCityRt91EonbotContinuity, validateEonCityRt91EonbotContinuity } from '../../assets/js/city/rt91/eon-city-rt91-eonbot-continuity.js';
import { buildEonCityRt91HudMapProjection, validateEonCityRt91HudMapProjection } from '../../assets/js/city/rt91/eon-city-rt91-hud-map-consolidation.js';

test('RT91 Hub interaction audit covers every maintained station structure/terminal/NPC and discovery', () => {
  const plan = buildEonCityRt91CommandHubInteractionAudit();
  const result = validateEonCityRt91CommandHubInteractionAudit(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.stationCoverage.length, 10);
  assert.equal(plan.discoveryCoverage.length, 3);
  assert.equal(plan.stationCoverage.every((row) => row.structure && row.terminal && row.npc), true);
  assert.equal(plan.discoveryCoverage.every((row) => row.registered), true);
  assert.equal(plan.ambiguousSignificantObjects, 0);
  assert.ok(plan.registry.objectCount >= 42);
});

test('RT91 Hub camera/layout audit preserves the open arrival corridor and requires occlusion/HUD visual proof', () => {
  const plan = buildEonCityRt91CommandHubCameraAudit();
  const result = validateEonCityRt91CommandHubCameraAudit(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.primaryPlacementCount, 10);
  assert.equal(plan.arrivalCorridorBlockers.length, 0);
  assert.equal(plan.arrival.outsideStructuralBounds, true);
  assert.equal(plan.cameraOcclusionControllerRequired, true);
  assert.equal(plan.objectiveMustNotCoverPlayer, true);
  assert.equal(plan.babylonVisualProofRequired, true);
  assert.equal(plan.automaticPlayerMove || plan.automaticNavigation, false);
});

test('W731 runtime still mounts the maintained occlusion controller and L95 HUD safe-zone authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /createEonCityCameraOcclusionController\s*\(/);
  assert.match(source, /applyEonCityL95HudSafeZone\s*\(/);
  assert.match(source, /clearEonCityL95HudSafeZone\s*\(/);
});

test('RT91 Hub cast audit keeps player/EONBOT plus all nine station roles on one W754 cast authority', () => {
  const plan = buildEonCityRt91CommandHubCastAudit({ quality: 'balanced' });
  const result = validateEonCityRt91CommandHubCastAudit(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.ok(plan.castSlotCount >= 12);
  assert.equal(plan.stationRoleCount, 9);
  assert.equal(plan.scheduleCount, 9);
  assert.equal(plan.oneCastAuthority, true);
  assert.equal(plan.oneRenderLoop, true);
  assert.equal(plan.noWalkingInPlace, true);
  assert.equal(plan.roles.every((row) => row.hasPrimary && row.hasFallback), true);
});

test('RT91 Hub transport audit preserves one calibrated capsule and explicit review/boarding', () => {
  const plan = buildEonCityRt91CommandHubTransportAudit();
  const result = validateEonCityRt91CommandHubTransportAudit(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.uniqueCapsuleCount, 1);
  assert.equal(plan.forwardAxis, '+x');
  assert.deepEqual(plan.choices, ['board','skip']);
  assert.equal(plan.reviewAndConfirmationSeparate, true);
  assert.equal(plan.explicitBoardingRequired, true);
  assert.equal(plan.automaticTravel || plan.networkRequestCreated || plan.privateDataTransferred, false);
  assert.equal(plan.visualAlignmentProofRequired, true);
});

test('RT91 EONBOT continuity uses one companion identity across Hub, Signal, Storm and My Frontier', () => {
  for (const worldId of ['command-hub','signal-frontier','storm-sector','my-frontier']) {
    const plan = buildEonCityRt91EonbotContinuity({ worldId, objective: { position: { x: 1, z: 2 } }, dockingAvailable: true });
    const result = validateEonCityRt91EonbotContinuity(plan);
    assert.equal(result.ok, true, `${worldId}:${result.errors.join(',')}`);
    assert.equal(plan.eonbotIdentity, 'eonbot');
    assert.equal(plan.oneCompanionIdentity, true);
    assert.equal(plan.duplicateCompanionAllowed, false);
    assert.equal(plan.autoNavigatesPlayer || plan.autoCompletesObjective || plan.localAiRequired, false);
  }
});

test('RT91 EONBOT hazard behavior warns without taking player/progression authority', () => {
  const plan = buildEonCityRt91EonbotContinuity({ worldId: 'storm-sector', hazardSeverity: 4 });
  assert.equal(validateEonCityRt91EonbotContinuity(plan).ok, true);
  assert.equal(plan.behavior.state, 'warn');
  assert.equal(plan.behavior.grantsProgression, false);
  assert.equal(plan.behavior.positioning.blocksPlayerCollision, false);
  assert.equal(plan.behavior.positioning.avoidCameraCenterCone, true);
});

test('RT91 consolidated HUD always exposes one next action and keeps map/mission state projection-only', () => {
  const plan = buildEonCityRt91HudMapProjection({ currentWorldId: 'command-hub' });
  const result = validateEonCityRt91HudMapProjection(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.ok(plan.nextAction.id);
  assert.equal(plan.maxPersistentWorldLabels, 3);
  assert.equal(plan.oneMissionSummary && plan.oneObjectiveMarker && plan.oneNextAction, true);
  assert.equal(plan.mapIconFloodingAvoided, true);
  assert.equal(plan.projectionOnly, true);
  assert.equal(plan.startsWorkAutomatically || plan.awardsXp || plan.writesProgression || plan.ownsRenderLoop, false);
});

test('RT91 Phase-F source-safe audit modules own no second engine/scene/render loop or network action', () => {
  const names = [
    '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-interaction-audit.js',
    '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-camera-layout-audit.js',
    '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-cast-audit.js',
    '../../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-transport-audit.js',
    '../../assets/js/city/rt91/eon-city-rt91-eonbot-continuity.js',
    '../../assets/js/city/rt91/eon-city-rt91-hud-map-consolidation.js'
  ];
  for (const name of names) {
    const source = fs.readFileSync(new URL(name, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(/, name);
    assert.doesNotMatch(source, /runRenderLoop\s*\(/, name);
    assert.doesNotMatch(source, /\bfetch\s*\(/, name);
  }
});
