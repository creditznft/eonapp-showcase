import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 My Frontier and Storm do not recompute hidden Signal restoration every frame', () => {
  assert.match(source, /const signalFrontierActiveForFrame = expanseActiveRegionId === 'signal-frontier'/);
  assert.match(source, /if \(signalFrontierActiveForFrame\) \{[\s\S]*projectEonExpanseW766GRestoration[\s\S]*expanseAudio\.applyPresentation[\s\S]*expanseVisuals\.apply\(expansePresentation\)[\s\S]*expanseGateway\?\.updateDynamicEvent/);
  assert.match(source, /else \{[\s\S]*const rt91Guidance = expanseGuidance\?\.rt91[\s\S]*expanseObjectiveMarker\.update\(rt91Guidance\?\.rt91 === true \? rt91Guidance : null/);
  assert.match(source, /const expanseUpdate = signalFrontierActiveForFrame \? expanseGateway\?\.update/);
  assert.doesNotMatch(source, /else \{[\s\S]{0,900}projectEonExpanseW766GRestoration/);
});

test('L95 active My Frontier still receives its own world update outside Signal projection', () => {
  assert.match(source, /if \(expanseActiveRegionId === 'my-frontier'\) expanseMyFrontierRenderer\?\.update\?\.\(timeMs, playerAnchor\.position\)/);
  assert.match(source, /const expanseUpdate = signalFrontierActiveForFrame \? expanseGateway\?\.update/);
});
