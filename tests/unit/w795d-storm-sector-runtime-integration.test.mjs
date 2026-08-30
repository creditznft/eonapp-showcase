import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const journey = await readFile(new URL('../../assets/js/city/w794/eon-expanse-w794a-storm-sector-journey.js', import.meta.url), 'utf8');
const interactions = await readFile(new URL('../../assets/js/city/w795/eon-expanse-w795b-storm-sector-interaction-presenter.js', import.meta.url), 'utf8');

test('W795D integrates persisted Storm missions and authored interaction presenter', () => {
  assert.match(runtime, /createEonExpanseW795AStormMissionRuntime/);
  assert.match(runtime, /initialState: expanseState\.stormSectorMissions/);
  assert.match(runtime, /mountEonExpanseW795BStormSectorInteractionPresenter/);
  assert.match(runtime, /parent: expanseStormSectorPresenter\.root/);
  assert.match(runtime, /stormSectorMissions: result\.state/);
  assert.match(runtime, /expansePersistence\.write\(expanseState\)/);
});

test('W795D routes keyboard and touch to the active region only', () => {
  assert.match(runtime, /expanseActiveRegionId === 'storm-sector'\s*\? interactNearestStormSector/);
  assert.match(runtime, /kind\.startsWith\('storm-sector-'\)/);
  assert.match(interactions, /storm-sector-interaction-target-changed/);
  assert.match(runtime, /storm-sector-journey-active/);
});

test('W795D performs explicit return and restores Signal Frontier safely', () => {
  assert.match(runtime, /action === 'return-signal-frontier'/);
  assert.match(runtime, /expanseStormSectorJourney\.startReturn/);
  assert.match(runtime, /expanseStormSectorPresenter\?\.suspend/);
  assert.match(runtime, /expanseActiveRegionId = 'signal-frontier'/);
  assert.match(runtime, /expanseGateway\?\.activate/);
  assert.match(journey, /EON_EXPANSE_W794A_SIGNAL_FRONTIER_RETURN/);
  assert.match(journey, /x: 43, y: 0\.45, z: -142/);
});

test('W795D preserves one canonical engine, scene and render loop', () => {
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
  assert.match(runtime, /getExpanseStormSectorMissions/);
  assert.match(runtime, /expanseStormSectorInteractions\?\.dispose/);
});
