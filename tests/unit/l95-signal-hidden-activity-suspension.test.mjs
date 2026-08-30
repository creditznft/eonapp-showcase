import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = await Promise.all([
  '../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js',
  '../../assets/js/city/w774/eon-expanse-w774b-productive-transformation-presenter.js',
  '../../assets/js/city/w778/eon-expanse-w778b-side-transformation-presenter.js',
  '../../assets/js/city/w794/eon-expanse-w794b-storm-sector-gateway-presenter.js'
].map((url) => readFile(new URL(url, import.meta.url), 'utf8')));
const gateway = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');

test('L95 Signal supporting presenters own no autonomous browser loop or timer', () => {
  for (const source of files) {
    assert.doesNotMatch(source, /requestAnimationFrame\s*\(/);
    assert.doesNotMatch(source, /setInterval\s*\(/);
    assert.doesNotMatch(source, /registerBeforeRender\s*\(/);
  }
});

test('L95 Signal gateway returns before all supporting update work when its region root is inactive', () => {
  assert.match(gateway, /update\(position = \{\}\) \{\s*if \(signalRoot\.isEnabled\?\.\(\) !== true\) return freeze\(\{ currentZone: '', signalRegionActive: false, suspended: true \}\)/);
  assert.match(gateway, /npcRuntime\?\.update\?\.\(deltaSeconds\)/);
});
