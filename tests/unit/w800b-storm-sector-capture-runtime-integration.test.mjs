import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W800B records Storm capture moments only after canonical mission success', () => {
  assert.match(source, /createEonExpanseW800AStormCaptureDirector/);
  assert.match(source, /const captureType = result\.regionCompleted \? 'region' : result\.missionCompleted \? 'mission' : 'objective'/);
  assert.match(source, /expanseStormSectorCapture\.record\(\{ type: captureType/);
  assert.match(source, /if \(result\.ok\) \{/);
});

test('W800B prioritizes Storm capture only while Storm Sector is active', () => {
  assert.match(source, /expanseStormSectorCapture\.derive\(\{ regionActive: stormSector\.active/);
  assert.match(source, /activeExpanseCaptureMoment = stormSector\.active \? stormCaptureMoment/);
  assert.match(source, /getExpanseStormSectorCaptureMoment\(\)/);
});

test('W800B clears Storm moments on both return paths and keeps Creator Capture explicit', () => {
  assert.match(source, /expanseStormSectorCapture\.reset\('return-signal-frontier'\)/);
  assert.match(source, /expanseStormSectorCapture\.reset\('return-to-command-hub'\)/);
  assert.match(source, /validateEonExpanseW767SCaptureRequest/);
  assert.match(source, /buildEonExpanseW775ACaptureHandoff/);
  assert.doesNotMatch(source, /expanseStormSectorCapture\.(?:startRecording|upload|publish)/);
});

test('W800B adds no runtime or XP authority', () => {
  assert.equal((source.match(/new Engine\(/g) || []).length, 1);
  assert.equal((source.match(/new Scene\(/g) || []).length, 1);
  assert.equal((source.match(/runRenderLoop\(/g) || []).length, 1);
  assert.doesNotMatch(source, /expanseStormSectorCapture[^\n]*awardsXp:\s*true/);
});
