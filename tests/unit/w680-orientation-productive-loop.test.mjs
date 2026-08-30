import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS,
  createEonCityW680OrientationProductiveLoopController,
  getEonCityW680OrientationProductiveLoopForResident,
  getEonCityW680OrientationProductiveLoopForTerminal,
  getEonCityW680OrientationProductiveLoopTruth,
  validateEonCityW680OrientationProductiveLoops
} from '../../assets/js/city/w680/eon-city-w680-orientation-productive-loop.js';

test('W680 gives every Orientation resident one productive destination loop', () => {
  const validation = validateEonCityW680OrientationProductiveLoops();
  assert.equal(validation.ok, true);
  assert.equal(validation.loopCount, 6);
  assert.equal(validation.residentCount, 6);
  assert.equal(new Set(EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS.map((entry) => entry.residentAssetId)).size, 6);
  assert.ok(EON_CITY_W680_ORIENTATION_PRODUCTIVE_LOOPS.every((entry) => entry.terminalId || entry.buildingId));
});

test('W680 resolves the same loop from resident assets and terminal identities', () => {
  const resident = getEonCityW680OrientationProductiveLoopForResident('eoncity-eon-architect-12clips');
  const terminal = getEonCityW680OrientationProductiveLoopForTerminal('start-here-terminal');
  assert.equal(resident.id, 'orientation-start-here-loop');
  assert.equal(terminal.id, resident.id);
  assert.equal(resident.route, '/help');
  assert.equal(resident.handoff.length, 4);
});

test('W680 separates loop review from destination confirmation', () => {
  let clock = 100;
  const controller = createEonCityW680OrientationProductiveLoopController({ now: () => clock });
  assert.equal(controller.beginReview('orientation-device-loop').ok, false);
  const reviewed = controller.beginReview('orientation-device-loop', { explicitUserAction: true });
  assert.equal(reviewed.ok, true);
  assert.equal(reviewed.state.status, 'reviewed');
  assert.equal(reviewed.state.receipt.workExecuted, false);
  clock = 200;
  assert.equal(controller.confirmAction('open-local-ai').ok, false);
  const confirmed = controller.confirmAction('open-local-ai', { explicitUserAction: true });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.route, '/local-ai');
  assert.equal(confirmed.routeOpened, false);
});

test('W680 product layer consumes visible resident, terminal and building metadata', () => {
  const product = fs.readFileSync('assets/js/city/w659n/eon-city-w659n-product-layer.js', 'utf8');
  const orientation = fs.readFileSync('assets/js/city/w674/eon-city-w674-orientation-district-belt-babylon.js', 'utf8');
  assert.match(product, /createEonCityW680OrientationProductiveLoopController/);
  assert.match(product, /data-eon-w680-review-loop/);
  assert.match(product, /w680-confirm:/);
  assert.match(orientation, /interactionId: resident\.id/);
  assert.match(orientation, /assetId: building\.id/);
  const truth = getEonCityW680OrientationProductiveLoopTruth();
  assert.equal(truth.reviewAndRouteConfirmationSeparated, true);
  assert.equal(truth.automaticWork, false);
});
