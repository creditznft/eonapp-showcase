import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonExpanseW773CMyFrontierCaptureDirector } from '../../assets/js/city/w773/eon-expanse-w773c-my-frontier-capture-director.js';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W774E exposes a privacy-safe capture moment for an explicitly verified productive result', () => {
  const director = createEonExpanseW773CMyFrontierCaptureDirector({ now: () => 7000 });
  const recorded = director.record({ type: 'productive', missionId: 'knowledge-recovery', workspaceId: 'library', label: 'Knowledge Recovery' }, { explicitUserAction: true });
  assert.equal(recorded.ok, true);
  const view = director.derive({ expanseActive: true, at: 7000 });
  assert.equal(view.source, 'productive-result');
  assert.equal(view.context.includesPrivateContent, false);
  assert.equal(view.publishesAutomatically, false);
});

test('W774E records capture opportunities only after productive or Daily Signal completion succeeds', () => {
  assert.match(runtimeSource, /if \(completed\.ok\) \{\s*expanseMyFrontierCapture\.record\(\{ type: 'productive', missionId: currentItem\.activityId/);
  assert.match(runtimeSource, /if \(completed\.ok\) \{ expanseMyFrontierCapture\.record\(\{ type: 'productive', missionId: recommendation\.missionId/);
});

test('W774E does not make capture, posting or progression automatic', () => {
  assert.doesNotMatch(runtimeSource, /productive-result[^\n]*(?:publish|upload|startRecording)/);
  assert.equal((runtimeSource.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/runRenderLoop\(/g) || []).length, 1);
});
