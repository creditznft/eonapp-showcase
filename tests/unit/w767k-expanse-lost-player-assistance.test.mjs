import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonExpanseW767KLostPlayerAssistanceDirector } from '../../assets/js/city/w766/eon-expanse-w767k-lost-player-assistance.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const active = (overrides = {}) => ({
  expanseActive: true,
  bonded: true,
  transitActive: false,
  guideActive: false,
  boardOpen: false,
  objective: 'restore-beacon-one',
  position: { x: 0, z: 0 },
  distance: 60,
  nearTarget: false,
  ...overrides
});

test('W767K offers bounded EONBOT route help only after sustained lack of movement or progress', () => {
  const director = createEonExpanseW767KLostPlayerAssistanceDirector({ now: () => 0, idleThresholdMs: 15000 });
  assert.equal(director.update(active({ at: 1000 })).active, false);
  assert.equal(director.update(active({ at: 14999 })).active, false);
  const offered = director.update(active({ at: 17000 }));
  assert.equal(offered.active, true);
  assert.equal(offered.reason, 'assistance-available');
  assert.match(offered.prompt, /EONBOT can lead/);
});

test('W767K movement, objective progress, interaction, Transit and active guidance suppress the prompt', () => {
  const director = createEonExpanseW767KLostPlayerAssistanceDirector({ now: () => 0, idleThresholdMs: 15000 });
  director.update(active({ at: 1000 }));
  assert.equal(director.update(active({ position: { x: 2, z: 0 }, at: 17000 })).reason, 'tracking');
  assert.equal(director.update(active({ position: { x: 2, z: 0 }, distance: 54, at: 34000 })).reason, 'tracking');
  assert.equal(director.update(active({ transitActive: true, at: 51000 })).reason, 'transit-active');
  assert.equal(director.update(active({ guideActive: true, at: 68000 })).reason, 'guidance-active');
  director.recordInteraction({ at: 69000 });
  assert.equal(director.update(active({ at: 70000 })).active, false);
});

test('W767K guide acceptance and dismissal are explicit and never move or progress the player automatically', () => {
  const director = createEonExpanseW767KLostPlayerAssistanceDirector({ now: () => 20000, idleThresholdMs: 15000 });
  director.update(active({ at: 1000 }));
  director.update(active({ at: 20000 }));
  assert.equal(director.acceptGuide().reason, 'explicit-user-action-required');
  const accepted = director.acceptGuide({ explicitUserAction: true, at: 21000 });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.delegatesToCanonicalGuideController, true);
  const certification = director.certify();
  assert.equal(certification.automaticMovement, false);
  assert.equal(certification.automaticMissionProgress, false);
  assert.equal(certification.automaticSpeech, false);
});

test('W767K runtime strengthens the existing guidance surface and delegates to the canonical guide controller', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /createEonExpanseW767KLostPlayerAssistanceDirector/);
  assert.match(runtime, /expanseLostAssistance\.update/);
  assert.match(runtime, /expanseLostAssistance\.acceptGuide/);
  assert.match(runtime, /onDismissAssistance/);
  assert.match(runtime, /expanseGuideController\.request/);
  assert.match(runtime, /certifyExpanseLostPlayerAssistance/);
  assert.match(overlay, /guidance\.dataset\.assistance/);
  assert.match(overlay, /Dismiss EONBOT route assistance/);
  assert.match(overlay, /onDismissAssistanceAction/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
