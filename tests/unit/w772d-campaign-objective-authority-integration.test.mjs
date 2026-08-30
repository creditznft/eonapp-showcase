import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimePath = new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url);
const overlayPath = new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url);

const runtimeSource = await readFile(runtimePath, 'utf8');
const overlaySource = await readFile(overlayPath, 'utf8');

test('W772D derives campaign objective authority from the canonical mission board', () => {
  assert.match(runtimeSource, /deriveEonExpanseW772CCurrentObjectiveAuthority\(campaignBoard\)/);
  assert.match(runtimeSource, /campaignObjectiveAuthority,/);
  assert.match(runtimeSource, /buildEonExpanseW766GMissionBoardView\(\{ campaignBoard,/);
});

test('W772D renders the exact authority detail beside the active objective', () => {
  assert.match(overlaySource, /campaignObjectiveAuthority: lastBoard\.campaignObjectiveAuthority/);
  assert.match(overlaySource, /lastBoard\.campaignObjectiveAuthority\?\.active === true/);
  assert.match(overlaySource, /\[objectiveDetail, authorityDetail\]\.filter\(Boolean\)\.join\(' '\)/);
});

test('W772D does not create another engine, scene or render loop', () => {
  assert.equal((runtimeSource.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtimeSource.match(/runRenderLoop\(/g) || []).length, 1);
  assert.doesNotMatch(overlaySource, /new (?:BABYLON\.)?(?:Engine|Scene)\(/);
  assert.doesNotMatch(overlaySource, /runRenderLoop\(/);
});
