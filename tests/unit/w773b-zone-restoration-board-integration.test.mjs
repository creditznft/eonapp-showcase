import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlaySource = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W773B derives zone restoration from canonical world progress', () => {
  assert.match(runtimeSource, /deriveEonExpanseW773AZoneRestorationBoard\(getExpanseWorldProgress\(\)\)/);
  assert.match(runtimeSource, /zoneRestorationBoard,/);
});

test('W773B renders all zone stages inside the existing restoration card', () => {
  assert.match(overlaySource, /const restorationZones = el/);
  assert.match(overlaySource, /lastBoard\.zoneRestorationBoard\?\.rows/);
  assert.match(overlaySource, /zone\.statusLabel/);
  assert.match(overlaySource, /zone\.restorationPercent/);
});

test('W773B adds no action, progression or runtime owner', () => {
  assert.doesNotMatch(overlaySource, /restorationZones\.addEventListener/);
  assert.equal((runtimeSource.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/runRenderLoop\(/g) || []).length, 1);
});
