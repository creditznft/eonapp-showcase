import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W775B validates the active moment before building the Creator Capture handoff', () => {
  assert.match(source, /validateEonExpanseW767SCaptureRequest\(activeExpanseCaptureMoment/);
  assert.match(source, /buildEonExpanseW775ACaptureHandoff\(validated\.context\)/);
  assert.match(source, /validateEonExpanseW775ACaptureHandoff\(handoff, \{ expectedMomentId: validated\.context\.momentId \}\)/);
});

test('W775B passes only the reviewed safe handoff to the maintained Creator Capture station', () => {
  assert.match(source, /openSurfaceForStation\('share-capture',[\s\S]*expanseContext: handoffValidation\.handoff/);
  assert.match(source, /'creator-capture'/);
});

test('W775B does not record, upload, publish or create referral links automatically', () => {
  const handler = source.slice(source.indexOf('onOpenCaptureMoment:'), source.indexOf('onUnlockMyFrontier:'));
  assert.doesNotMatch(handler, /(?:startRecording|upload|publish|createReferral)/);
  assert.equal((source.match(/new Engine\(/g) || []).length, 1);
  assert.equal((source.match(/new Scene\(/g) || []).length, 1);
  assert.equal((source.match(/runRenderLoop\(/g) || []).length, 1);
});
