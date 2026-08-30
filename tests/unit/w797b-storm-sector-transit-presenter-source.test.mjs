import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w797/eon-expanse-w797b-storm-sector-transit-presenter.js', import.meta.url), 'utf8');

test('W797B mounts four bounded Transit interaction symbols under a supplied parent', () => {
  assert.match(source, /EON_EXPANSE_W797A_STORM_TRANSIT_NODES/);
  assert.match(source, /storm-sector-transit-node/);
  assert.match(source, /interactionSymbol: true/);
  assert.match(source, /developmentHeroProxyCount: 0/);
  assert.match(source, /if \(parent\) root\.parent = parent/);
});

test('W797B exposes click keyboard and touch candidates with stale identity protection', () => {
  assert.match(source, /PointerEventTypes\.POINTERPICK/);
  assert.match(source, /getInteractionCandidates/);
  assert.match(source, /interactNearest/);
  assert.match(source, /storm-transit-target-changed/);
  assert.match(source, /storm-transit-node-identity-stale/);
  assert.match(source, /explicit-user-action-required/);
});

test('W797B never owns progression or another runtime', () => {
  assert.match(source, /grantsXp: false/);
  assert.match(source, /automaticTravel: false/);
  assert.match(source, /ownsEngine: false/);
  assert.match(source, /ownsScene: false/);
  assert.match(source, /ownsRenderLoop: false/);
  assert.doesNotMatch(source, /new Engine\s*\(/);
  assert.doesNotMatch(source, /new Scene\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
});
