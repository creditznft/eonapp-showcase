import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767MActivityAssetPresentation } from '../../assets/js/city/w766/eon-expanse-w767m-activity-presentation.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767M hides the authored lost worker after location while productive stations remain available', () => {
  const before = deriveEonExpanseW767MActivityAssetPresentation({ assetKey: 'lost-worker', state: { activityProgress: {} } });
  const after = deriveEonExpanseW767MActivityAssetPresentation({ assetKey: 'lost-worker', state: { activityProgress: { lostWorkerLocated: true } } });
  const productive = deriveEonExpanseW767MActivityAssetPresentation({ assetKey: 'productive:create-expedition', state: { productiveCompleted: ['create-expedition'] } });
  assert.equal(before.visible, true);
  assert.equal(after.visible, false);
  assert.equal(after.interactive, false);
  assert.equal(productive.visible, true);
  assert.equal(productive.reason, 'productive-surface-remains-available');
});

test('W767M repeatable presentation resets with the daily cycle and never mutates progression', () => {
  const at = Date.parse('2026-08-04T10:00:00Z');
  const completed = deriveEonExpanseW767MActivityAssetPresentation({
    assetKey: 'repeatable:signal-fragment-a',
    state: { activityProgress: { cycleKey: '2026-08-04', signalFragments: ['signal-fragment-a'] } },
    at
  });
  const reset = deriveEonExpanseW767MActivityAssetPresentation({
    assetKey: 'repeatable:signal-fragment-a',
    state: { activityProgress: { cycleKey: '2026-08-03', signalFragments: ['signal-fragment-a'] } },
    at
  });
  assert.equal(completed.visible, false);
  assert.equal(reset.visible, true);
  assert.equal(completed.mutatesMissionState, false);
  assert.equal(completed.storesPrivateContent, false);
});

test('W767M synchronizes fallback and authored wrappers through one state projection', async () => {
  const source = await read('../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js');
  assert.match(source, /deriveEonExpanseW767MActivityAssetPresentation/);
  assert.match(source, /syncAuthoredPresentation/);
  assert.match(source, /entry\.wrapper\?\.setEnabled\?\.\(presentation\.visible\)/);
  assert.match(source, /mesh\.isPickable = presentation\.interactive/);
  assert.match(source, /for \(const key of authoredFallbacks\.keys\(\)\) syncAuthoredPresentation\(key\)/);
  assert.match(source, /presentationVisible/);
});
