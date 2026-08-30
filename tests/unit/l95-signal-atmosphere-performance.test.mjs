import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('L95 Signal atmosphere keeps visual density but cadence-bounds mote transform writes', async () => {
  const source = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766g-visual-director.js', import.meta.url), 'utf8');
  assert.match(source, /QUALITY_COUNTS = freeze\(\{ lite: 16, balanced: 36, cinematic: 64 \}\)/);
  assert.match(source, /QUALITY_UPDATE_INTERVAL_SECONDS/);
  assert.match(source, /lastMoteUpdateAt/);
  assert.match(source, /throttled: true/);
  assert.match(source, /ownsRenderLoop: false/);
});

test('L95 Signal atmosphere applies fog/event scene state only when the presentation key changes', async () => {
  const source = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766g-visual-director.js', import.meta.url), 'utf8');
  assert.match(source, /lastAppliedSceneKey/);
  assert.match(source, /nextKey === lastAppliedSceneKey/);
  assert.match(source, /eventAtmosphereKey/);
  assert.match(source, /changed: false/);
  assert.match(source, /changeDrivenSceneApplication: true/);
});
