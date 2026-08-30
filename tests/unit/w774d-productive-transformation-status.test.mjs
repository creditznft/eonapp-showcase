import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlaySource = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W774D reads productive transformation truth from the canonical Gateway summary', () => {
  assert.match(runtimeSource, /productiveTransformationStatus = expanseGateway\?\.getSummary\?\.\(\)\?\.productiveTransformations/);
  assert.match(runtimeSource, /productiveTransformationStatus,/);
});

test('W774D shows verified signal count beside productive completion without new actions', () => {
  assert.match(overlaySource, /productiveTransformationStatus: lastBoard\.productiveTransformationStatus/);
  assert.match(overlaySource, /signals online/);
  assert.doesNotMatch(overlaySource, /productiveTransformationStatus[^\n]*addEventListener/);
});

test('W774D adds no progression or runtime authority', () => {
  assert.doesNotMatch(runtimeSource, /productiveTransformationStatus\.(?:award|complete|recordReceipt)/);
  assert.equal((runtimeSource.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/runRenderLoop\(/g) || []).length, 1);
});
