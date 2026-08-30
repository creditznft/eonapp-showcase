import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const gateway = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
const frontier = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766b-signal-frontier.js', import.meta.url), 'utf8');

test('W766B/C remain inside the canonical runtime lifecycle', () => {
  assert.match(gateway, /mountEonExpanseW766BSignalFrontier/);
  assert.match(frontier, /createEonExpanseW766CSectorStreamer/);
  assert.match(runtime, /expanseGateway\?\.update\?\.\(playerAnchor\.position\)/);
  assert.match(runtime, /const expanseActive = expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'/);
  assert.doesNotMatch(frontier, /new Engine\s*\(/);
  assert.doesNotMatch(frontier, /new Scene\s*\(/);
  assert.doesNotMatch(frontier, /runRenderLoop\s*\(/);
});
