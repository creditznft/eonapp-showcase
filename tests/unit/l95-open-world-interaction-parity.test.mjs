import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const gateway = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('L95 keyboard E and touch Use share one active-world interaction dispatcher', () => {
  assert.match(runtime, /interactNearestExpanseAction = \(\{ explicitUserAction = false, expectedTargetId = '', source = 'expanse-proximity' \} = \{\}\) =>/);
  assert.match(runtime, /expanseActiveRegionId === 'storm-sector'[\s\S]*interactNearestStormSector[\s\S]*expanseGateway\?\.interactNearest/);
  assert.match(runtime, /interactNearestExpanseAction\(\{ explicitUserAction: true, source: 'keyboard-e' \}\)/);
  assert.match(runtime, /onInteractNearest: \(options = \{\}\) => interactNearestExpanseAction\(options\)/);
  assert.match(overlay, /onInteractNearest\?\.\(\{ explicitUserAction: true, expectedTargetId, source: 'touch-hud' \}\)/);
});

test('L95 My Frontier plot and terminal interactions are owned by the canonical Expanse gateway dispatcher', () => {
  assert.match(gateway, /metadata\.kind === 'expanse-my-frontier-plot'/);
  assert.match(gateway, /action === 'inspect-my-frontier-plot'/);
  assert.match(gateway, /action === 'open-my-frontier-building-terminal'/);
  assert.match(runtime, /action === 'inspect-my-frontier-plot'[\s\S]*openMyFrontierPlanner/);
});

test('L95 Storm E interaction routes to Storm mission, NPC, or transit ownership without Command Hub fallthrough', () => {
  assert.match(runtime, /metadata\?\.kind === 'storm-sector-authored-npc'/);
  assert.match(runtime, /metadata\?\.kind === 'storm-sector-transit-node'/);
  assert.match(runtime, /storm-sector-mission-interaction-unavailable/);
  assert.match(runtime, /if \(expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'\)[\s\S]*expanse-owned:/);
});
