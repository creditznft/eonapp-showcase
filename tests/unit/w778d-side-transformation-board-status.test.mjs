import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W778D reads side transformation truth from the canonical Gateway summary', () => {
  assert.match(runtime, /const sideTransformationStatus = expanseGateway\?\.getSummary\?\.\(\)\?\.sideTransformations \|\| null/);
  assert.match(runtime, /sideTransformationStatus,/);
});

test('W778D surfaces side-mission memories beside the existing side mission total', () => {
  assert.match(overlay, /sideTransformationStatus: lastBoard\.sideTransformationStatus/);
  assert.match(overlay, /memories active/);
  assert.match(overlay, /sideTransformationStatus\?\.activeCount/);
  assert.match(overlay, /sideTransformationStatus\?\.total/);
});

test('W778D adds no action, XP or runtime owner', () => {
  assert.doesNotMatch(overlay, /onSideTransformation/);
  assert.doesNotMatch(runtime, /sideTransformationStatus[^\n]*award/);
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
});
