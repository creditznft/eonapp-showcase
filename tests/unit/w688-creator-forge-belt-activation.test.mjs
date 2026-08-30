import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { getEonCityW660iDistrictConfig } from '../../assets/js/city/w660i/eon-city-w660i-district-config.js';
import { getEonCityW660iTerminalsForDistrict } from '../../assets/js/city/w660i/eon-city-w660i-terminal-registry.js';
import { EON_CITY_W659F_DESTINATIONS } from '../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';
import {
  EON_CITY_W688_PRODUCT_DISTRICTS,
  getEonCityW688DistrictWorldPose,
  projectEonCityW688TransportDestination,
  resolveEonCityW688DistrictAtPosition,
  resolveEonCityW688TerminalPlacement,
  validateEonCityW688CreatorForgeBeltActivation,
  getEonCityW688CreatorForgeBeltTruth
} from '../../assets/js/city/w688/eon-city-w688-creator-forge-belt-activation.js';

const byId = new Map(EON_CITY_W688_PRODUCT_DISTRICTS.map((entry) => [entry.id, entry]));

test('W688 activates Creator Atrium and Forge Basilica as full belt districts', () => {
  const result = validateEonCityW688CreatorForgeBeltActivation();
  assert.equal(result.ok, true, result.errors.join(' | '));
  for (const id of ['orientation-hall', 'creator-atrium', 'forge-basilica']) {
    const projected = byId.get(id);
    const legacy = getEonCityW660iDistrictConfig(id);
    assert.equal(projected.spatialModel, 'sanctum-plus-belt');
    assert.ok(projected.radius >= 14);
    assert.notDeepEqual(projected.center, legacy.center);
  }
  assert.deepEqual(byId.get('trade-dome').center, getEonCityW660iDistrictConfig('trade-dome').center);
});

test('W688 transport, district detection and terminal placement share one projected authority', () => {
  const creatorPose = getEonCityW688DistrictWorldPose('creator-atrium');
  const forgePose = getEonCityW688DistrictWorldPose('forge-basilica');
  assert.equal(resolveEonCityW688DistrictAtPosition(creatorPose.arrival)?.id, 'creator-atrium');
  assert.equal(resolveEonCityW688DistrictAtPosition(forgePose.arrival)?.id, 'forge-basilica');

  const creatorDestination = projectEonCityW688TransportDestination(getEonCityW660iDistrictConfig('creator-atrium'));
  const forgeDestination = projectEonCityW688TransportDestination(getEonCityW660iDistrictConfig('forge-basilica'));
  assert.deepEqual(EON_CITY_W659F_DESTINATIONS.find((entry) => entry.id === 'creator-atrium'), creatorDestination);
  assert.deepEqual(EON_CITY_W659F_DESTINATIONS.find((entry) => entry.id === 'forge-basilica'), forgeDestination);

  for (const districtId of ['creator-atrium', 'forge-basilica']) {
    const terminals = getEonCityW660iTerminalsForDistrict(districtId);
    assert.equal(terminals.length, 3);
    const pose = getEonCityW688DistrictWorldPose(districtId);
    for (const terminal of terminals) {
      const placement = resolveEonCityW688TerminalPlacement({ districtId, terminalId: terminal.id, legacyLocalPosition: terminal.localPosition });
      assert.equal(placement.spatialModel, 'sanctum-plus-belt');
      assert.ok(Math.hypot(placement.position.x - pose.center.x, placement.position.z - pose.center.z) < pose.radius);
      assert.deepEqual(terminal.position, placement.position);
    }
  }
});

test('W688 creator and forge intent is preserved by the active compact Command Hub', () => {
  const entrypoint = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-core.js', import.meta.url), 'utf8');
  const contract = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-contract.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(entrypoint, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(contract, /id: 'create-forge'[\s\S]*surface: 'create'/);
  assert.match(runtime, /'creator-atrium': 'create-forge'/);
  assert.match(runtime, /'forge-basilica': 'create-forge'/);
  assert.doesNotMatch(entrypoint, /EON_CITY_W688_PRODUCT_DISTRICTS/);
});

test('W688 truth remains local, review-first and bounded', () => {
  const truth = getEonCityW688CreatorForgeBeltTruth();
  assert.equal(truth.orientationCreatorForgeBeltsActive, true);
  assert.equal(truth.reuseW687Builder, true);
  assert.equal(truth.reviewFirstTravel, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.networkRequestCreated, false);
});
