import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 first-session world copy makes Signal recommended rather than mandatory', () => {
  assert.match(source, /Recommended first · guided restoration story/);
  assert.match(source, /My Frontier is already available if you want to build first/);
  assert.doesNotMatch(source, /build toward My Frontier/);
});

test('L95 My Frontier copy promises immediate exploration but not free advanced progression', () => {
  assert.match(source, /Available now · personal build world/);
  assert.match(source, /Start building immediately in fixed safe plots/);
  assert.match(source, /Advanced construction\/rewards remain receipt-protected/);
});
