import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_PRODUCTIVE_RPG_MISSIONS,
  EON_CITY_PRODUCTIVE_RPG_STATES,
  createEonCityProductiveRpgController,
  getEonCityProductiveRpgPlan,
  recordEonCityProductiveRpgOutcome,
  validateEonCityProductiveRpgPlan
} from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { validateW624gProductiveRpgContract } from '../../config/w624g-productive-rpg-loop-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const memoryStorage = () => { const data = new Map(); return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) }; };

test('W624G defines six required mission families and nine honest states', () => {
  assert.deepEqual(EON_CITY_PRODUCTIVE_RPG_MISSIONS.map((entry) => entry.id), ['orientation', 'project', 'local-ai-byok', 'creator', 'automation', 'vault-recovery']);
  assert.deepEqual(EON_CITY_PRODUCTIVE_RPG_STATES, ['empty', 'review', 'ready', 'active', 'unavailable', 'cancelled', 'failed', 'resumed', 'completed']);
  const plan = getEonCityProductiveRpgPlan({ storage: memoryStorage() });
  assert.equal(validateEonCityProductiveRpgPlan(plan).ok, true);
  assert.equal(plan.completedCount, 0);
});

test('W624G requires visible review before mission start and supports cancellation, failure and resume', () => {
  const controller = createEonCityProductiveRpgController({ storage: memoryStorage(), now: () => 1000 });
  assert.equal(controller.start('project', { explicitUserAction: true }).reason, 'visible-review-required');
  assert.equal(controller.review('project', { explicitUserAction: true }).mission.state, 'review');
  assert.equal(controller.start('project', { explicitUserAction: true }).mission.state, 'active');
  assert.equal(controller.cancel('project', { explicitUserAction: true }).mission.state, 'cancelled');
  assert.equal(controller.resume('project', { explicitUserAction: true }).mission.state, 'resumed');
  assert.equal(controller.fail('creator', 'outcome-not-proven', { explicitUserAction: true }).mission.state, 'failed');
});

test('W624G completes only from bounded verified outcomes', () => {
  const storage = memoryStorage();
  const bad = recordEonCityProductiveRpgOutcome({ kind: 'project-shell', route: '/projects', source: 'wrong', receiptId: 'bad', verified: true }, { storage });
  assert.equal(bad.ok, false);
  assert.equal(getEonCityProductiveRpgPlan({ storage }).completedCount, 0);
  const good = recordEonCityProductiveRpgOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project-shell:1', verified: true }, { storage });
  assert.equal(good.ok, true);
  const project = getEonCityProductiveRpgPlan({ storage }).missions.find((entry) => entry.id === 'project');
  assert.equal(project.state, 'completed');
  assert.equal(project.outcome.verified, true);
  assert.equal(project.outcome.privateContentStored, false);
});

test('W624G orientation creates only a local receipt after explicit review', () => {
  const storage = memoryStorage();
  const controller = createEonCityProductiveRpgController({ storage, now: () => 2000 });
  assert.equal(controller.completeOrientation({ explicitUserAction: true, controlsReviewed: true }).reason, 'review-and-controls-confirmation-required');
  controller.review('orientation', { explicitUserAction: true });
  assert.equal(controller.completeOrientation({ explicitUserAction: true, controlsReviewed: true }).ok, true);
  const orientation = controller.refresh().missions.find((entry) => entry.id === 'orientation');
  assert.equal(orientation.state, 'completed');
  assert.equal(orientation.outcome.kind, 'orientation-receipt');
});

test('W624G product surfaces write only after real user-triggered outcomes', () => {
  assert.match(read('assets/js/projects/eon-projects-page.js'), /project-shell/);
  assert.match(read('assets/js/local-ai/local-ai-page.js'), /if \(result\.ok\) recordEonCoreOutcome/);
  assert.match(read('assets/js/vault/eon-vault-page.js'), /byok-provider-verification/);
  assert.match(read('assets/js/create/eon-create-hub.js'), /proposal-only/);
  assert.match(read('assets/js/eon-automations-page.js'), /automation-proposal/);
  assert.match(read('assets/js/local-first/eon-workspace-capsule-page.js'), /backup-readiness-receipt/);
  assert.doesNotMatch(read('assets/js/contracts/city/eon-city-productive-rpg-loop.js'), /fetch\(|XMLHttpRequest|WebSocket/);
});

test('W624G source gate preserves prior City systems and visible review controls', () => {
  const gate = validateW624gProductiveRpgContract();
  assert.equal(gate.ok, true, gate.checks.filter((entry) => !entry.pass).map((entry) => entry.id).join(', '));
  assert.equal(gate.total, 31);
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /bindProductiveRpgLoop/);
  assert.match(station, /data-eon-play-rpg-toggle/);
  assert.match(station, /data-eon-play-rpg-review/);
  assert.match(station, /data-eon-play-rpg-cancel/);
  assert.match(station, /bindCommandDistrictNpcSystem/);
  assert.match(station, /bindEonbotOrbitCompanion/);
});
