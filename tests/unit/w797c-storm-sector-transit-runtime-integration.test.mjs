import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W797C mounts Storm Transit under the canonical Storm Sector presenter', () => {
  assert.match(source, /createEonExpanseW797AStormTransitController/);
  assert.match(source, /mountEonExpanseW797BStormTransitPresenter/);
  assert.match(source, /parent: expanseStormSectorPresenter\.root/);
  assert.match(source, /w797b-storm-sector-transit-presenter-mount-failed/);
});

test('W797C routes Transit through the same bounded nearest interaction arbitration', () => {
  assert.match(source, /expanseStormSectorTransitPresenter\?\.getInteractionCandidates/);
  assert.match(source, /candidate\.metadata\?\.kind === 'storm-sector-transit-node'/);
  assert.match(source, /storm-sector-transit-interaction-unavailable/);
  assert.match(source, /storm-sector-transit-active/);
});

test('W797C moves Pathfinder and EONBOT only after explicit Transit start', () => {
  assert.match(source, /expanseStormSectorTransit\.start\(\{ destinationNodeId: event\.nodeId/);
  assert.match(source, /explicitUserAction: event\.explicitUserAction === true/);
  assert.match(source, /playerAnchor\.position\.set\(stormTransitState\.pose\.x/);
  assert.match(source, /eonbotAnchor\.position\.set\(stormTransitState\.pose\.x/);
  assert.match(source, /w797c-storm-sector-transit-complete/);
  assert.match(source, /grantsXp: false/);
  assert.match(source, /automaticTravel: false/);
});

test('W797C refreshes mission-gated nodes and disposes without another runtime', () => {
  assert.match(source, /missionState: result\.state/);
  assert.match(source, /getExpanseStormSectorTransit\(\)/);
  assert.match(source, /expanseStormSectorTransitPresenter\?\.dispose/);
  assert.equal((source.match(/new Engine\(/g) || []).length, 1);
  assert.equal((source.match(/new Scene\(/g) || []).length, 1);
  assert.equal((source.match(/runRenderLoop\(/g) || []).length, 1);
});
