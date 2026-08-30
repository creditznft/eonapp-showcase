import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 Storm presenters do not tax Command Hub boot and mount on first certified entry', () => {
  assert.match(source, /const ensureStormSectorPresenters = \(\) =>/);
  assert.match(source, /trigger: 'first-certified-entry'/);
  assert.match(source, /eagerBootMount: false/);
  assert.match(source, /transition\.type === 'enter-storm-sector'[^]*ensureStormSectorPresenters\(\);[^]*expanseStormSectorPresenter\?\.apply/);
});

test('L95 Storm region reuses one canonical-scene presenter set after first mount', () => {
  assert.match(source, /if \(expanseStormSectorPresenter\?\.ok[^]*return freeze\(\{ ok: true, reused: true \}\)/);
  assert.equal((source.match(/mountEonExpanseW792CStormSectorPresenter\(\{/g) || []).length, 1);
  assert.match(source, /expanseStormSectorPresenter\?\.dispose\?\.\(\)/);
});
