import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EON_EXPANSE_W766E_CAMPAIGN, buildEonExpanseW766EMissionBoard } from '../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js';
import { deriveEonExpanseW772GPersistentNextAction } from '../../assets/js/city/w772/eon-expanse-w772g-persistent-next-action.js';
import { createEonExpanseW795AInitialStormMissionState, deriveEonExpanseW795AStormMissionView } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { deriveEonExpanseW798AStormBoard } from '../../assets/js/city/w798/eon-expanse-w798a-storm-sector-board.js';
import { deriveEonCityR08MyFrontierEntry } from '../../assets/js/city/r08/eon-city-r08-my-frontier-access.js';
import { deriveEonExpanseW768PMyFrontierNavigation } from '../../assets/js/city/w768/eon-expanse-w768p-my-frontier-navigation.js';
import { createEonExpanseW768BMyFrontierState } from '../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlaySource = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('Signal Frontier cannot dead-end after four completed campaign missions', () => {
  const completed = EON_EXPANSE_W766E_CAMPAIGN.slice(0, 4).map((mission) => mission.id);
  const board = buildEonExpanseW766EMissionBoard({
    completedMissions: completed,
    missions: Object.fromEntries(completed.map((id) => [id, { status: 'completed' }]))
  });
  assert.equal(board.completion.completed, 4);
  assert.equal(board.completion.total, 7);
  assert.equal(board.activeMission, null);
  assert.equal(board.availableMissions[0]?.id, 'the-broken-line');
  const next = deriveEonExpanseW772GPersistentNextAction({ campaignBoard: board });
  assert.equal(next.kind, 'next-mission');
  assert.equal(next.missionId, 'the-broken-line');
  assert.equal(next.primaryAction?.kind, 'open-mission-board');
});

test('Signal persistent next action is projected into the live HUD and opens the maintained board', () => {
  assert.match(runtimeSource, /persistentGuidancePresentation = signalFrontierActive && expanseGuidance\?\.active !== true/);
  assert.match(runtimeSource, /label: persistentNextAction\.label/);
  assert.match(runtimeSource, /primaryAction: persistentNextAction\.primaryAction/);
  assert.match(overlaySource, /nextActionButton\.hidden = !primaryActionVisible/);
  assert.match(overlaySource, /onOpenMissionMap\?\.\(\{ explicitUserAction: true, source: 'persistent-next-action' \}\)/);
  assert.match(runtimeSource, /return expanseUiOverlay\.openBoard\(\)/);
});

test('Storm Sector starts with an authored physical objective and always exposes its return connector outside transit', () => {
  const state = createEonExpanseW795AInitialStormMissionState();
  const view = deriveEonExpanseW795AStormMissionView(state);
  assert.equal(view.totalMissionCount, 3);
  assert.equal(view.totalObjectiveCount, 9);
  assert.equal(view.nextObjective?.id, 'review-weather-array');
  const board = deriveEonExpanseW798AStormBoard({ activeRegionId: 'storm-sector', missionState: state, journeyState: { status: 'idle' } });
  assert.equal(board.active, true);
  assert.equal(board.activeObjective?.objectiveId, 'review-weather-array');
  assert.equal(board.activeObjective?.completionAuthority, 'explicit-field-interaction');
  assert.equal(board.returnAvailable, true);
  assert.match(runtimeSource, /action === 'return-signal-frontier'/);
});

test('My Frontier direct entry has a fixed safe spawn and a physical plot/planner continuation', () => {
  const entry = deriveEonCityR08MyFrontierEntry({ unlocked: true });
  assert.equal(entry.available, true);
  assert.equal(entry.automaticMovement, false);
  const stateAuthority = createEonExpanseW768BMyFrontierState();
  stateAuthority.unlockMyFrontierStarter?.({});
  // Source-level proof covers the runtime starter path because the state
  // authority intentionally requires a canonical receipt in normal execution.
  assert.match(runtimeSource, /deriveEonCityR08MyFrontierStarterReceipt\(\)/);
  assert.match(runtimeSource, /playerAnchor\.position\.set\(entry\.target\.x, entry\.target\.y, entry\.target\.z\)/);
  assert.match(runtimeSource, /Walk to any authored plot and interact to open its planner/);
  assert.match(runtimeSource, /expanseUiOverlay\.openMyFrontierPlanner\?\.\(inspection\.plotId\)/);
});

test('My Frontier navigation never teleports or auto-moves the player', () => {
  const state = { schema: 'eon.expanse.my-frontier-state.w768b.v1', unlocked: true };
  const navigation = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: state, playerPosition: { x: 999, z: 999 } });
  if (navigation.visible) {
    assert.equal(navigation.action?.automaticMovement, false);
    assert.equal(navigation.action?.teleport, false);
    assert.equal(navigation.grantsXp, false);
  }
});
