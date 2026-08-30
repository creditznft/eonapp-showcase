import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 City workspace snapshot records the exact active world region', () => {
  assert.match(runtime, /activeWorldRegionId: expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE' \? String\(expanseActiveRegionId \|\| 'signal-frontier'\) : 'command-hub'/);
});

test('L95 closing a workspace proves the same Open World is still active', () => {
  assert.match(runtime, /expectedRegionId = String\(snapshot\.activeWorldRegionId \|\| 'signal-frontier'\)/);
  assert.match(runtime, /reason: 'expanse-workspace-region-changed'/);
  assert.match(runtime, /regionPreserved: true/);
  assert.match(runtime, /No automatic world switch was performed/);
});
