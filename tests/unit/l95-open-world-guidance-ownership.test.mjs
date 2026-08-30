import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 Signal-only assistance/audio/restoration are owned by Signal rather than generic Expanse mode', () => {
  assert.match(runtime, /const signalFrontierActive = expanseActive && expanseActiveRegionId === 'signal-frontier'/);
  assert.match(runtime, /expanseLostAssistance\.update\(\{\s*expanseActive: signalFrontierActive/);
  assert.match(runtime, /if \(signalFrontierActive\) \{[\s\S]*expanseAudio\.applyWorldState/);
  assert.match(runtime, /updateRestorationStatus\?\.\(signalFrontierActive \? restorationStatus/);
  assert.match(runtime, /expanseOnboarding\.update\(\{ companion: expanseCompanionState, guidance: expanseGuidance, expanseActive: signalFrontierActive/);
});

test('L95 My Frontier owns a clear build-first HUD objective instead of inheriting Signal zone copy', () => {
  assert.match(runtime, /const myFrontierActive = expanseActive && expanseActiveRegionId === 'my-frontier'/);
  assert.match(runtime, /const myFrontierGuidancePresentation = myFrontierActive \? freeze\(\{/);
  assert.match(runtime, /zoneLabel: 'My Frontier'/);
  assert.match(runtime, /Choose a plot and plan your first building/);
  assert.match(runtime, /Walk to any authored plot and interact to open its planner/);
});
