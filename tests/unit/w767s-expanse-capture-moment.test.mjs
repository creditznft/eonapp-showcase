import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767SCaptureMoment, validateEonExpanseW767SCaptureRequest } from '../../assets/js/city/w766/eon-expanse-w767s-capture-moment.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const restoration = { currentStageId: 'beacon-one', currentLabel: 'Beacon One restored', onlinePercent: 42 };

test('W767S offers a capture only for a meaningful active Expanse moment', () => {
  assert.equal(deriveEonExpanseW767SCaptureMoment({ expanseActive: true, restorationStatus: { currentStageId: 'arrival' } }).available, false);
  const moment = deriveEonExpanseW767SCaptureMoment({ expanseActive: true, restorationStatus: restoration });
  assert.equal(moment.available, true);
  assert.equal(moment.momentId, 'restoration:beacon-one');
  assert.equal(moment.context.localCaptureOnly, true);
  assert.equal(moment.context.publicPostingRequired, false);
  assert.equal(moment.recordsAutomatically, false);
  assert.equal(moment.publishesAutomatically, false);
});

test('W767S prefers a current dynamic event and strips private fields', () => {
  const moment = deriveEonExpanseW767SCaptureMoment({ expanseActive: true, restorationStatus: restoration, dynamicEvent: { active: true, id: 'ignored', eventId: 'signal-storm', windowId: '7:2', label: '<b>Signal</b>\nStorm', zoneId: 'beacon-fields', privatePrompt: 'secret' } });
  assert.equal(moment.source, 'dynamic-event');
  assert.equal(moment.label.includes('<'), false);
  assert.equal(JSON.stringify(moment).includes('secret'), false);
  assert.equal(moment.context.includesPrivateContent, false);
});

test('W767S requires explicit current-moment confirmation', () => {
  const moment = deriveEonExpanseW767SCaptureMoment({ expanseActive: true, restorationStatus: restoration });
  assert.equal(validateEonExpanseW767SCaptureRequest(moment).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW767SCaptureRequest(moment, { explicitUserAction: true, expectedMomentId: 'old' }).reason, 'capture-moment-changed');
  const accepted = validateEonExpanseW767SCaptureRequest(moment, { explicitUserAction: true, expectedMomentId: moment.momentId });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.recordsAutomatically, false);
  assert.equal(accepted.publishesAutomatically, false);
  assert.equal(accepted.mutatesProgression, false);
});

test('W767S workspace bridge preserves Expanse world state and never focuses a hidden Hub station', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /worldMode: expanseWorldMode\.getState\(\)\.mode/);
  assert.match(runtime, /expanse-workspace-background-preserved/);
  assert.match(runtime, /expanse-workspace-return/);
  assert.match(runtime, /expanse-capture-moment/);
  assert.match(overlay, /data-eon-expanse-ui=['"]capture-moment['"]/);
  assert.match(overlay, /onOpenCaptureMoment/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
