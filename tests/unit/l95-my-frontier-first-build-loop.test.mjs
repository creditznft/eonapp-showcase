import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 physical My Frontier plot interaction opens the real planner on that plot', () => {
  assert.match(overlay, /openMyFrontierPlanner\(plotId=''\)/);
  assert.match(overlay, /myFrontierPlotSelect\.value=requestedPlotId/);
  assert.match(overlay, /populateMyFrontierBuildingChoices\(\)/);
  assert.match(overlay, /myFrontierBuildingSelect\.focus\?\.\(\{preventScroll:true\}\)/);
  assert.match(runtime, /expanseUiOverlay\.openMyFrontierPlanner\?\.\(inspection\.plotId\)/);
});

test('L95 first build interaction remains explicit and grants no construction or progression authority', () => {
  assert.match(overlay, /buildingSelectionRequired:true, automaticPlanning:false, automaticConstruction:false, grantsXp:false, mutatesProgression:false/);
  assert.match(runtime, /Construction remains separately receipt-protected/);
  assert.match(runtime, /return freeze\(\{ \.\.\.result, planner, grantsXp:false, mutatesProgression:false \}\)/);
});
