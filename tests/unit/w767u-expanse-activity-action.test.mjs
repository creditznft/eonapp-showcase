import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767UActivityAction, validateEonExpanseW767UActivityAction } from '../../assets/js/city/w766/eon-expanse-w767u-activity-action.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const zones = [{ id: 'beacon-fields', label: 'Beacon Fields', x: -42, z: -28 }];

test('W767U routes a physical side mission to its authored zone without completing it', () => {
  const action = deriveEonExpanseW767UActivityAction({ activityId: 'signal-salvage', family: 'side-mission', label: 'Signal Salvage', zoneId: 'beacon-fields', status: 'in-progress', receiptRequired: true }, zones);
  assert.equal(action.available, true);
  assert.equal(action.type, 'guide-zone');
  assert.deepEqual(action.target, { x: -42, y: 0.2, z: -28 });
  assert.equal(action.automaticCompletion, false);
});

test('W767U routes productive work to its maintained workspace and keeps receipt authority', () => {
  const action = deriveEonExpanseW767UActivityAction({ activityId: 'create-expedition', family: 'productive-mission', label: 'Create Expedition', workspaceId: 'create', status: 'review-required' }, zones);
  assert.equal(action.type, 'open-workspace');
  assert.equal(action.workspaceId, 'create');
  assert.equal(action.receiptRequired, true);
  assert.equal(action.automaticCompletion, false);
});

test('W767U rejects completed, missing, stale and implicit actions', () => {
  assert.equal(deriveEonExpanseW767UActivityAction(null, zones).reason, 'activity-required');
  const completed = deriveEonExpanseW767UActivityAction({ activityId: 'done', family: 'side-mission', zoneId: 'beacon-fields', status: 'completed' }, zones);
  assert.equal(completed.available, false);
  const active = deriveEonExpanseW767UActivityAction({ activityId: 'signal-salvage', family: 'side-mission', zoneId: 'beacon-fields', status: 'available' }, zones);
  assert.equal(validateEonExpanseW767UActivityAction(active).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW767UActivityAction(active, { explicitUserAction: true, expectedActivityId: 'old' }).reason, 'activity-selection-changed');
});

test('W767U runtime and overlay use one shared activity action without another Babylon authority', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /deriveEonExpanseW767UActivityAction/);
  assert.match(runtime, /expanseActivityGuidance/);
  assert.match(runtime, /expanse-productive-mission-board/);
  assert.match(overlay, /onSelectLivingActivity/);
  assert.match(overlay, /living-activity-action/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
