import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W772F derives objective feedback only from the canonical campaign board', () => {
  assert.match(runtimeSource, /createEonExpanseW772EObjectiveCompletionDirector\(\)/);
  assert.match(runtimeSource, /expanseObjectiveFeedback\.update\(campaignBoard, \{ expanseActive:/);
  assert.match(runtimeSource, /if \(objectiveFeedback\.ok\) expanseUiOverlay\?\.showArrival\?\.\(objectiveFeedback\.card\)/);
});

test('W772F seeds feedback after entry signals and resets it on Hub return', () => {
  const entrySignal = runtimeSource.indexOf("recordSignal('companion-signal-detected'");
  const seed = runtimeSource.indexOf("expanseObjectiveFeedback.reset(buildEonExpanseW766EMissionBoard", entrySignal);
  assert.ok(entrySignal >= 0 && seed > entrySignal);
  assert.match(runtimeSource, /expanseObjectiveFeedback\.reset\(null, 'return-to-command-hub'\)/);
});

test('W772F feedback adds no progression, engine, scene or render-loop authority', () => {
  assert.doesNotMatch(runtimeSource, /objectiveFeedback\.(?:award|complete|recordSignal|addXp)/);
  assert.equal((runtimeSource.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/runRenderLoop\(/g) || []).length, 1);
});
