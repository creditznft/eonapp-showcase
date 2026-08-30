import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildEonCityW712FlagshipExpansePlan,
  createEonCityW712GatewayReview,
  getEonCityW712FlagshipExpanseEntryTruth,
  resolveEonCityW712FlagshipExpanseEntryState,
  resolveEonCityW712GatewayApproachTarget,
  validateEonCityW712FlagshipExpansePlan,
  validateEonCityW712GatewayReview
} from '../../assets/js/city/w712/eon-city-w712-flagship-expanse-entry.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const gateway = (distance, extra = {}) => ({
  id: 'living-nexus-core-gateway', x: 0, z: 12, distance,
  inspectRadius: 5.5, enterRadius: 2.4, entryReadyRadius: 5.5, discoveryRadius: 18,
  inInspectRange: distance <= 5.5, inEnterRange: distance <= 2.4, inEntryReadyRange: distance <= 5.5,
  ...extra
});

test('W712 presents a clear distant, approach, review, enter and active flow', () => {
  assert.equal(resolveEonCityW712FlagshipExpanseEntryState().id, 'distant');
  assert.equal(resolveEonCityW712FlagshipExpanseEntryState({ gateway: gateway(12) }).id, 'approach');
  assert.equal(resolveEonCityW712FlagshipExpanseEntryState({ gateway: gateway(5.2) }).id, 'ready-to-review');
  assert.equal(resolveEonCityW712FlagshipExpanseEntryState({ gateway: gateway(5.2), prepared: true }).id, 'ready-to-enter');
  assert.equal(resolveEonCityW712FlagshipExpanseEntryState({ destination: 'expanse' }).id, 'expanse-active');
});

test('W712 removes the hidden second movement threshold after review', () => {
  const state = resolveEonCityW712FlagshipExpanseEntryState({ gateway: gateway(5.2, { inEnterRange: false }), prepared: true });
  assert.equal(state.primaryAction, 'enter');
  assert.equal(state.entryReady, true);
  assert.match(state.detail, /No extra movement step/i);
});

test('W712 guidance targets the authored review lane rather than the gateway centre', () => {
  const target = resolveEonCityW712GatewayApproachTarget({ gateway: { x: 4, z: 8, approachX: 3, approachZ: 5 }, fromPosition: { x: 0, z: 0 } });
  assert.deepEqual(target, { x: 3, z: 5, usesAuthoredApproach: true });
  assert.notDeepEqual(target, { x: 4, z: 8, usesAuthoredApproach: true });
});

test('W712 Connected Core exposes a visible approach, review lane and entry-ready radius', () => {
  const core = buildEonCityConnectedCorePlan();
  const validation = validateEonCityConnectedCorePlan(core);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(core.physicalGateway.entryReadyRadius, core.physicalGateway.inspectRadius);
  assert.ok(core.physicalGateway.discoveryRadius > core.physicalGateway.inspectRadius);
  assert.ok(Number.isFinite(core.physicalGateway.approachX));
  assert.ok(Number.isFinite(core.physicalGateway.approachZ));
  assert.equal(core.continuousFabric.borderCorridors.some((entry) => entry.flagshipGateway && entry.visibleContinuation), true);
});

test('W712 runtime keeps inspection and entry as separate explicit actions without a smaller second radius', () => {
  const source = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  assert.match(source, /inspectPhysicalGateway/);
  assert.match(source, /enterPhysicalGateway/);
  assert.match(source, /entryReadyRadius \|\| gatewayAuthority\?\.inspectRadius/);
  assert.match(source, /physical-gateway-inspection-required/);
  assert.match(source, /noExtraMovementRequired: true/);
  assert.doesNotMatch(source, /maxDistance: connectedCoreRenderer\.getGateway\(\)\?\.enterRadius/);
});

test('W712 play runtime guides to the review lane, captures Core pose and guarantees safe return', () => {
  const source = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(source, /resolveEonCityW712GatewayApproachTarget/);
  assert.match(source, /approachLane: true/);
  assert.match(source, /livingNexusCorePose = captureEonCityExplorationPose/);
  assert.match(source, /coreReturnPoseCaptured: Boolean\(livingNexusCorePose\)/);
  assert.match(source, /normalizeEonCityExplorationPose\(livingNexusCorePose\)/);
  assert.match(source, /safeCoreReturnAvailable: true/);
});

test('W712 City HUD exposes one large state-driven primary action', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(station, /data-eon-w712-state/);
  assert.match(station, /data-eon-play-gateway-guide/);
  assert.match(station, /getLivingNexusGatewayFlowState/);
  assert.match(station, /flowState\.primaryAction === 'enter'/);
  assert.match(station, /no extra movement step is required/i);
  assert.match(css, /W712 — flagship Expanse gateway/);
  assert.match(css, /min-height:3rem/);
});


test('W712 proves the first Expanse stream, regional map and population before claiming ready', () => {
  const plan = buildEonCityW712FlagshipExpansePlan({ quality: 'balanced', seed: 'eonapp-expanse' });
  const validation = validateEonCityW712FlagshipExpansePlan(plan);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(plan.world.ready, true);
  assert.equal(plan.world.visibleCellCount, 25);
  assert.equal(plan.world.interactiveCellCount, 9);
  assert.equal(plan.world.macroRegionCount, 9);
  assert.equal(plan.map.regionCount, 9);
  assert.ok(plan.world.populationCount >= 14);
  assert.ok(plan.world.discoveryCount >= 6);
  assert.equal(plan.safeReturn.restoresCapturedCorePose, true);
});

test('W712 gateway review is bounded, explicit and expires safely', () => {
  const authority = buildEonCityConnectedCorePlan().physicalGateway;
  const review = createEonCityW712GatewayReview(authority, { now: 1000 });
  assert.equal(validateEonCityW712GatewayReview(review, authority, { now: 2000 }).ok, true);
  const expired = validateEonCityW712GatewayReview(review, authority, { now: review.expiresAt + 1 });
  assert.equal(expired.ok, false);
  assert.ok(expired.errors.includes('review-expired'));
  assert.equal(review.entryConfirmed, false);
  assert.equal(review.privateContentStored, false);
});

test('W712 keeps the flagship truthful and side-effect free', () => {
  const truth = getEonCityW712FlagshipExpanseEntryTruth();
  assert.equal(truth.oneReviewThenOneConfirmation, true);
  assert.equal(truth.hiddenSecondDistanceThresholdRemoved, true);
  assert.equal(truth.safeCoreReturnRetained, true);
  assert.equal(truth.oneCanonicalScene, true);
  assert.equal(truth.automaticEntry, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.privateDataRead, false);
});
