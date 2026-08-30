import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 Open Worlds stop hidden Command Hub animation/weather/monitor work', () => {
  assert.match(source, /const expanseActiveForFrame = expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'/);
  assert.match(source, /if \(!expanseActiveForFrame\) \{[\s\S]*updateAnimatedWorld\(frameAt\)[\s\S]*livingNexus\.update\?\.\(frameAt\)[\s\S]*commandCentre\.update\?\.\(frameAt\)[\s\S]*stationMonitors\.values\(\)/);
  assert.match(source, /if \(expanseActiveForFrame\) \{/);
});

test('L95 EONBOT remains outside the hidden-Hub gate for cross-world companion continuity', () => {
  const eonbotIndex = source.indexOf('updateEonbot(frameAt, deltaSeconds);');
  const gateIndex = source.indexOf("const expanseActiveForFrame = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';", eonbotIndex);
  assert.ok(eonbotIndex >= 0 && gateIndex > eonbotIndex);
});
