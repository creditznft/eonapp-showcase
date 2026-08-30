import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767VGuidanceControl, shouldClearEonExpanseW767VActivityGuidance } from '../../assets/js/city/w766/eon-expanse-w767v-guidance-lifecycle.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767V switches the same explicit guide control between request and stop', () => {
  const request = deriveEonExpanseW767VGuidanceControl({ expanseActive: true, guidanceActive: true, guideState: { active: false } });
  assert.equal(request.visible, true);
  assert.equal(request.mode, 'request');
  assert.equal(request.label, 'EONBOT, guide me');
  const cancel = deriveEonExpanseW767VGuidanceControl({ expanseActive: true, guidanceActive: true, guideState: { active: true } });
  assert.equal(cancel.mode, 'cancel');
  assert.equal(cancel.label, 'Stop guiding');
  assert.equal(cancel.disabled, false);
  assert.equal(cancel.automaticMovement, false);
  assert.equal(cancel.mutatesProgression, false);
});

test('W767V hides guidance control outside Expanse and at the target', () => {
  assert.equal(deriveEonExpanseW767VGuidanceControl({ guidanceActive: true }).visible, false);
  assert.equal(deriveEonExpanseW767VGuidanceControl({ expanseActive: true, guidanceActive: true, nearTarget: true }).visible, false);
});

test('W767V clears only matching activity guidance on explicit lifecycle boundaries', () => {
  assert.equal(shouldClearEonExpanseW767VActivityGuidance({ reason: 'explicit-user-cancel', activityObjective: 'activity:signal-salvage' }), true);
  assert.equal(shouldClearEonExpanseW767VActivityGuidance({ reason: 'return-to-command-hub', activityObjective: 'activity:signal-salvage' }), true);
  assert.equal(shouldClearEonExpanseW767VActivityGuidance({ activityObjective: 'activity:signal-salvage', completedMissionId: 'signal-salvage' }), true);
  assert.equal(shouldClearEonExpanseW767VActivityGuidance({ activityObjective: 'activity:signal-salvage', completedMissionId: 'lost-worker' }), false);
  assert.equal(shouldClearEonExpanseW767VActivityGuidance({ reason: 'explicit-user-cancel', activityObjective: 'campaign:first-light' }), false);
});

test('W767V runtime and overlay clear custom routes and expose explicit stop guidance', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /shouldClearEonExpanseW767VActivityGuidance/);
  assert.match(runtime, /onCancelGuide/);
  assert.match(runtime, /explicit-user-cancel/);
  assert.match(runtime, /completedMissionId: detail\.missionId/);
  assert.match(overlay, /deriveEonExpanseW767VGuidanceControl/);
  assert.match(overlay, /Stop guiding/);
  assert.match(overlay, /data-mode|dataset\.mode/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
