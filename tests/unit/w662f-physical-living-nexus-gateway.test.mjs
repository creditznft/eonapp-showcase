import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_CITY_CONNECTED_CORE_GATEWAY,
  buildEonCityConnectedCorePlan,
  validateEonCityConnectedCorePlan
} from '../../assets/js/city/eon-city-connected-core.js';

test('W662F places one unmistakable review-first Living Nexus gateway on the natural arrival route', () => {
  const plan = buildEonCityConnectedCorePlan({ quality: 'balanced' });
  assert.equal(validateEonCityConnectedCorePlan(plan).ok, true);
  assert.deepEqual(plan.physicalGateway, EON_CITY_CONNECTED_CORE_GATEWAY);
  assert.equal(plan.physicalGateway.districtId, 'orientation-hall');
  assert.equal(plan.physicalGateway.destination, 'expanse');
  assert.equal(plan.physicalGateway.reviewFirst, true);
  assert.equal(plan.physicalGateway.automaticEntry, false);
  assert.ok(plan.physicalGateway.inspectRadius > plan.physicalGateway.enterRadius);
  const orientation = plan.districts.find((entry) => entry.id === 'orientation-hall');
  assert.equal(plan.physicalGateway.sourceGatewayId, 'orientation-hall:expanse-gate');
  assert.equal(plan.physicalGateway.separateConfirmationRequired, true);
  assert.ok(plan.physicalGateway.z > orientation.center.z);
  assert.ok(Math.hypot(plan.physicalGateway.x - orientation.center.x, plan.physicalGateway.z - orientation.center.z) <= orientation.radius + 3);
});

test('W662F active runtimes expose inspect then enter without a technical panel requirement', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/eon-city-connected-core-babylon.js', import.meta.url), 'utf8');
  const living = fs.readFileSync(new URL('../../assets/js/city/eon-city-living-nexus-babylon-runtime.js', import.meta.url), 'utf8');
  const full = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url), 'utf8');
  const core = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-core.js', import.meta.url), 'utf8');
  const station = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  assert.match(renderer, /living-nexus-physical-gateway/);
  assert.match(renderer, /getNearestGateway/);
  assert.match(living, /inspectPhysicalGateway/);
  assert.match(living, /physical-gateway-inspection-required/);
  assert.match(living, /enterPhysicalGateway/);
  assert.match(full, /enterLivingNexusPhysicalGateway/);
  assert.match(core, /enterLivingNexusPhysicalGateway/);
  assert.match(station, /data-eon-play-living-nexus-gateway/);
  assert.match(station, /Nexus details/);
  assert.match(living, /technicalPanelRequired: false/);
});

test('W662F uses optional compact map and world-first EONBOT introduction', () => {
  const station = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  assert.match(station, /Compact map/);
  assert.match(station, /The gateway is the primary Expanse entrance/);
  assert.match(station, /Welcome to the Expanse/);
  assert.match(station, /Atlas return points/);
  assert.doesNotMatch(EON_CITY_CONNECTED_CORE_GATEWAY.eonbotIntroduction, /3×3|renderer|residency|mesh/i);
});
