import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w795/eon-expanse-w795b-storm-sector-interaction-presenter.js', import.meta.url), 'utf8');

test('W795B mounts bounded mission markers and an explicit return terminal', () => {
  assert.match(source, /EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS/);
  assert.match(source, /action: 'return-signal-frontier'/);
  assert.match(source, /storm-sector-mission-anchor/);
  assert.match(source, /storm-sector-return-gateway/);
  assert.match(source, /developmentHeroProxyCount: 0/);
});

test('W795B exposes canonical click, keyboard and touch candidates with stale-target protection', () => {
  assert.match(source, /getInteractionCandidates/);
  assert.match(source, /interactNearest/);
  assert.match(source, /PointerEventTypes\.POINTERPICK/);
  assert.match(source, /storm-sector-interaction-target-changed/);
  assert.match(source, /explicit-user-action-required/);
});

test('W795B never owns XP, automatic travel or another runtime', () => {
  assert.match(source, /grantsXp: false/);
  assert.match(source, /automaticProgression: false/);
  assert.match(source, /automaticTravel: false/);
  assert.doesNotMatch(source, /new Engine\s*\(/);
  assert.doesNotMatch(source, /new Scene\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
});
