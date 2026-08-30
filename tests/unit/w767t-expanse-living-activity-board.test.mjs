import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767TLivingActivityBoard } from '../../assets/js/city/w766/eon-expanse-w767t-living-activity-board.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const at = Date.UTC(2026, 7, 4, 3, 0, 0);

test('W767T ranks an in-progress physical mission before available and productive work', () => {
  const board = deriveEonExpanseW767TLivingActivityBoard({ activityProgress: { cycleKey: '2026-08-04', signalFragments: ['a','b'] } }, { at });
  assert.equal(board.items[0].activityId, 'signal-salvage');
  assert.equal(board.items[0].status, 'in-progress');
  assert.equal(board.items[0].progress, '2/3');
  assert.equal(board.inProgressCount, 1);
  assert.equal(board.automaticCompletion, false);
});

test('W767T distinguishes daily repeatable completion from persistent side completion', () => {
  const board = deriveEonExpanseW767TLivingActivityBoard({
    completedSideMissions: ['lost-worker','signal-salvage'],
    processedReceipts: ['side:signal-salvage:2026-08-03'],
    dailyCompletions: ['2026-08-04'],
    activityProgress: { cycleKey: '2026-08-04', lostWorkerLocated: true, routeTerminalActivated: true }
  }, { at, maxItems: 20 });
  const worker = board.items.find((item) => item.activityId === 'lost-worker');
  const salvage = board.items.find((item) => item.activityId === 'signal-salvage');
  const daily = board.items.find((item) => item.activityId === 'daily-signal');
  assert.equal(worker.status, 'completed');
  assert.equal(salvage.status, 'available');
  assert.equal(daily.status, 'completed');
  assert.equal(board.hasStreakPenalty, false);
});

test('W767T productive missions remain review and receipt gated without leaking workspace content', () => {
  const board = deriveEonExpanseW767TLivingActivityBoard({ completedProductiveMissions: ['status-review'], privatePrompt: 'secret', documentName: 'private.pdf' }, { at, maxItems: 20 });
  const create = board.items.find((item) => item.activityId === 'create-expedition');
  const status = board.items.find((item) => item.activityId === 'status-review');
  assert.equal(create.status, 'review-required');
  assert.equal(create.receiptRequired, true);
  assert.equal(create.automaticCompletion, false);
  assert.equal(status.status, 'completed');
  assert.equal(JSON.stringify(board).includes('secret'), false);
  assert.equal(JSON.stringify(board).includes('private.pdf'), false);
  assert.equal(board.exposesPrivateWorkspaceContent, false);
});

test('W767T feeds the existing mission board and runtime without another Babylon authority', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /deriveEonExpanseW767TLivingActivityBoard/);
  assert.match(runtime, /livingActivities/);
  assert.match(overlay, /Living frontier activities/);
  assert.match(overlay, /living-activity-list/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
