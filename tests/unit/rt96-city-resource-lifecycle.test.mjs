import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('RT96 W731 surface shelf listener has named ownership and balanced teardown', () => {
  assert.match(source, /const onSurfaceShelfClick = \(event\) =>/);
  assert.match(source, /surfaceShelf\?\.addEventListener\?\.\('click', onSurfaceShelfClick\)/);
  assert.match(source, /surfaceShelf\?\.removeEventListener\?\.\('click', onSurfaceShelfClick\)/);
  assert.doesNotMatch(source, /surfaceShelf\?\.addEventListener\?\.\('click', \(event\) =>/);
});
