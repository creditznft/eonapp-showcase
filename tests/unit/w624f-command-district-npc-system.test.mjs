import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES,
  EON_CITY_COMMAND_DISTRICT_NPC_STATES,
  createEonCityCommandDistrictNpcController,
  getEonCityCommandDistrictNpcPlan,
  getEonCityCommandDistrictNpcReview,
  validateEonCityCommandDistrictNpcPlan
} from '../../assets/js/city/eon-city-command-district-npc-system.js';
import { validateW624fCommandDistrictNpcContract } from '../../config/w624f-command-district-npc-system-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W624F defines four distinct Productive Nocturne roles and nine bounded states', () => {
  assert.deepEqual(EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry) => entry.id), ['project-guide', 'creator-technician', 'automation-operator', 'archive-workspace-guide']);
  assert.deepEqual(EON_CITY_COMMAND_DISTRICT_NPC_STATES, ['idle', 'navigate', 'work', 'talk', 'listen', 'point', 'wait', 'recover', 'unavailable']);
  assert.equal(new Set(EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry) => entry.silhouette)).size, 4);
});

test('W624F uses only authored paths and keeps spawn, Unstuck and collision space clear', () => {
  for (const lod of ['disabled', 'lite', 'balanced', 'cinematic']) {
    const plan = getEonCityCommandDistrictNpcPlan({ lod });
    const validation = validateEonCityCommandDistrictNpcPlan(plan);
    assert.equal(validation.ok, true, validation.errors.join(', '));
    assert.ok(plan.entities.every((entry) => entry.pathId.endsWith('-branch')));
    assert.ok(plan.entities.every((entry) => entry.minSpawnDistance > 1.8));
    assert.ok(plan.entities.every((entry) => entry.minUnstuckDistance >= .55));
  }
});

test('W624F reviews map to real routes and never imply fake work or commerce', () => {
  const routes = new Set(['/projects', '/create', '/forge', '/automations', '/library', '/workspace']);
  for (const archetype of EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES) {
    const review = getEonCityCommandDistrictNpcReview(archetype.id);
    assert.equal(review.requiresVisibleReview, true);
    assert.equal(review.requiresSeparateRouteConfirmation, true);
    assert.equal(review.autoNavigation, false);
    assert.equal(review.automaticExecution, false);
    assert.equal(review.privateDataRead, false);
    assert.equal(review.jobProgressClaimed, false);
    assert.equal(review.paymentOrRewardClaimed, false);
    assert.ok(review.routes.every((entry) => routes.has(entry.route)));
  }
  assert.equal(getEonCityCommandDistrictNpcReview('automation-operator').state, 'unavailable');
});

test('W624F controller requires explicit review and keeps work states presentational', () => {
  const controller = createEonCityCommandDistrictNpcController({ lod: 'balanced' });
  assert.equal(controller.requestState('project-guide', 'talk').reason, 'explicit-review-required');
  const review = controller.requestReview('project-guide');
  assert.equal(review.ok, true);
  assert.equal(review.routeOpened, false);
  assert.equal(review.workExecuted, false);
  const work = controller.requestState('creator-technician', 'work', { explicitUserAction: true });
  assert.equal(work.ok, true);
  assert.equal(work.state.state, 'wait');
  assert.equal(work.workExecuted, false);
  assert.equal(work.routeOpened, false);
});

test('W624F weak-device fallback reduces or removes optional NPCs without changing routes', () => {
  const controller = createEonCityCommandDistrictNpcController({ lod: 'cinematic' });
  assert.equal(controller.getSnapshot().activeCount, 4);
  assert.equal(controller.setLod('lite').activeCount, 2);
  assert.equal(controller.setLod('disabled').activeCount, 0);
  assert.equal(controller.getSnapshot().autoNavigation, false);
  assert.equal(controller.getSnapshot().automaticExecution, false);
  assert.equal(controller.dispose().disposed, true);
});

test('W624F source gate preserves W624B-W624E and exposes review-first controls', () => {
  const gate = validateW624fCommandDistrictNpcContract();
  assert.equal(gate.ok, true, gate.checks.filter((entry) => !entry.pass).map((entry) => entry.id).join(', '));
  assert.equal(gate.total, 25);
  const station = read('assets/js/eon-city-play-station.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(station, /data-eon-play-npc-toggle/);
  assert.match(station, /data-eon-play-npc-review/);
  assert.match(station, /data-eon-play-npc-lod/);
  assert.match(renderer, /requestCommandDistrictNpcState/);
  assert.match(renderer, /setCommandDistrictNpcLod/);
  assert.doesNotMatch(read('assets/js/city/eon-city-command-district-npc-system.js'), /location\.assign|localStorage|sessionStorage|fetch\(/);
});
