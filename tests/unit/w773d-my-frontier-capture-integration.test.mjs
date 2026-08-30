import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W773D prioritizes recent verified My Frontier moments over the maintained fallback', () => {
  assert.match(runtimeSource, /createEonExpanseW773CMyFrontierCaptureDirector\(\{ now: Date\.now \}\)/);
  assert.match(runtimeSource, /const fallbackCaptureMoment = signalFrontierActive \? deriveEonExpanseW767SCaptureMoment[\s\S]*?\) : null;/);
  assert.match(runtimeSource, /expanseMyFrontierCapture\.derive\(\{ expanseActive, fallback: fallbackCaptureMoment/);
});

test('W773D records moments only after successful construction, upgrade or invitation', () => {
  const records = runtimeSource.match(/expanseMyFrontierCapture\.record\(\{ type: '(?:construction|upgrade|resident)'/g) || [];
  assert.equal(records.length, 3);
  assert.match(runtimeSource, /if \(result\.ok\) \{ expanseMyFrontierCapture\.record\(\{ type: 'resident'/);
  assert.match(runtimeSource, /if \(result\.ok\) \{[\s\S]*?type: 'upgrade'/);
  assert.match(runtimeSource, /if \(result\.ok\) \{[\s\S]*?type: 'construction'/);
});

test('W773D clears the local capture opportunity on Hub return and adds no auto recording', () => {
  assert.match(runtimeSource, /expanseMyFrontierCapture\.reset\('return-to-command-hub'\)/);
  assert.doesNotMatch(runtimeSource, /expanseMyFrontierCapture\.(?:recording|publish|upload|startCapture)/);
  assert.equal((runtimeSource.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/runRenderLoop\(/g) || []).length, 1);
});
