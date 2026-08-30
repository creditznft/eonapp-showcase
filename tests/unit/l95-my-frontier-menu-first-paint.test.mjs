import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('L95 City menu first paint presents My Frontier as starter-accessible without weakening construction authority', async () => {
  const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /data-eon-city-featured="my-frontier" data-eon-city-world-status="available-from-start"/);
  assert.match(source, /Available now · personal build world/);
  assert.match(source, /data-eon-city-menu-open-my-frontier>Open My Frontier<\/button>/);
  assert.match(source, /Advanced construction\/rewards remain receipt-protected/);
  assert.doesNotMatch(source, /Unlock through first restoration/);
  assert.doesNotMatch(source, /Early progression unlock replaces full-campaign gating/);
});
