import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W799C mounts transformations under the canonical Storm Sector root', () => {
  assert.match(source, /mountEonExpanseW799BStormTransformationPresenter/);
  assert.match(source, /parent: expanseStormSectorPresenter\.root/);
  assert.match(source, /w799b-storm-sector-transformation-presenter-mount-failed/);
});

test('W799C applies the same canonical mission state on entry and progress', () => {
  assert.match(source, /expanseStormSectorTransformations\?\.apply\?\.\(\{ regionActive: true, missionState: result\.state/);
  assert.match(source, /missionState: expanseStormSectorMissions\.getState\(\), expectedActivationId: transition\.activationId/);
  assert.match(source, /expanseStormSectorTransformations\?\.apply\?\.\(\{ regionActive: false \}\)/);
});

test('W799C updates and disposes through the existing host lifecycle', () => {
  assert.match(source, /expanseStormSectorTransformations\?\.update\?\.\(seconds\)/);
  assert.match(source, /getExpanseStormSectorTransformations\(\)/);
  assert.match(source, /expanseStormSectorTransformations\?\.dispose/);
  assert.equal((source.match(/new Engine\(/g) || []).length, 1);
  assert.equal((source.match(/new Scene\(/g) || []).length, 1);
  assert.equal((source.match(/runRenderLoop\(/g) || []).length, 1);
});
