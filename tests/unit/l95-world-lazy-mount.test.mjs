import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 My Frontier renderer is lazy-mounted only after explicit Build-world entry', () => {
  assert.match(source, /const ensureMyFrontierRenderer = \(\) =>/);
  assert.match(source, /trigger: 'first-explicit-entry'/);
  assert.match(source, /sameSessionReuse: true/);
  assert.match(source, /myFrontierRenderer = ensureMyFrontierRenderer\(\);[^]*mounted-inactive[^]*myFrontierRenderer\.activate/);
  assert.match(source, /previousRegionPreserved: true/);
  assert.doesNotMatch(source, /const mounted = expanseGateway\.activate\(\);\s*expanseMyFrontierRenderer\?\.activate/);
});

test('L95 lazy renderer remains reusable and is disposed with the canonical scene', () => {
  assert.match(source, /if \(expanseMyFrontierRenderer\?\.ok\) return expanseMyFrontierRenderer/);
  assert.match(source, /expanseMyFrontierRenderer\?\.deactivate\?\.\(\)/);
  assert.match(source, /expanseMyFrontierRenderer\?\.dispose\?\.\(\)/);
});
