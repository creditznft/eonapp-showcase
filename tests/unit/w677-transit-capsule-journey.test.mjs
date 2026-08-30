import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA,
  buildEonCityW677TransitCapsuleJourney,
  createEonCityW677TransitCapsuleController,
  getEonCityW677TransitCapsuleTruth
} from '../../assets/js/city/w677/eon-city-w677-transit-capsule-journey.js';

test('W677 builds a real reviewed Capsule ride and accessible skip mode', () => {
  const ride = buildEonCityW677TransitCapsuleJourney('forge-basilica', { mode: 'ride' });
  const skip = buildEonCityW677TransitCapsuleJourney('forge-basilica', { mode: 'skip' });
  assert.equal(ride.schema, EON_CITY_W677_TRANSIT_CAPSULE_SCHEMA);
  assert.equal(ride.mode, 'ride');
  assert.ok(ride.durationMs >= 1850);
  assert.equal(ride.phases.at(-1).id, 'arrived');
  assert.equal(skip.mode, 'skip');
  assert.equal(skip.durationMs, 0);
  assert.equal(ride.automaticTravel, false);
});

test('W677 controller cannot start without the explicit confirmed user action', () => {
  let clock = 1000;
  const controller = createEonCityW677TransitCapsuleController({ now: () => clock });
  const journey = buildEonCityW677TransitCapsuleJourney('trade-dome');
  assert.equal(controller.begin(journey).ok, false);
  assert.equal(controller.begin(journey, { explicitUserAction: true, receiptId: 'receipt-1' }).ok, true);
  clock += journey.durationMs / 2;
  assert.equal(controller.update().active, true);
  clock += journey.durationMs;
  const complete = controller.update();
  assert.equal(complete.active, false);
  assert.equal(complete.phase, 'arrived');
});

test('W677 is wired into transport review, the product layer and the canonical Core renderer', () => {
  const transport = fs.readFileSync('assets/js/city/w659f/eon-city-w659f-transport-runtime.js', 'utf8');
  const product = fs.readFileSync('assets/js/city/w659n/eon-city-w659n-product-layer.js', 'utf8');
  const core = fs.readFileSync('assets/js/city/eon-city-connected-core-babylon.js', 'utf8');
  assert.match(transport, /buildEonCityW677TransitCapsuleJourney/);
  assert.match(product, /data-eon-w659n-travel-mode="ride"/);
  assert.match(product, /beginConnectedCoreTransitJourney/);
  assert.match(core, /beginReviewedTransitJourney/);
});

test('W677 retains review-first truth boundaries', () => {
  const truth = getEonCityW677TransitCapsuleTruth();
  assert.equal(truth.usesExistingTravelReviewAndReceipt, true);
  assert.equal(truth.automaticTravel, false);
  assert.equal(truth.workExecuted, false);
  assert.equal(truth.networkRequestCreated, false);
});
