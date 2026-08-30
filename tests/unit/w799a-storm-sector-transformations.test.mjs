import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW799AStormTransformations } from '../../assets/js/city/w799/eon-expanse-w799a-storm-sector-transformations.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS, createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

const stateWithActions = (actions = []) => ({ ...createEonExpanseW795AInitialStormMissionState(), completedObjectiveActions: actions });

test('W799A derives three damaged transformations from initial mission truth', () => {
  const view = deriveEonExpanseW799AStormTransformations(stateWithActions());
  assert.equal(view.rows.length, 3);
  assert.equal(view.damagedCount, 3);
  assert.equal(view.restoredCount, 0);
  assert.equal(view.regionRestored, false);
  assert.ok(view.rows.every((row) => row.interactive === false));
});

test('W799A shows an active weather transformation from partial ordered progress', () => {
  const first = EON_EXPANSE_W795A_STORM_MISSIONS[0].objectives[0].action;
  const view = deriveEonExpanseW799AStormTransformations(stateWithActions([first]));
  const weather = view.rows.find((row) => row.familyId === 'weather-restoration');
  assert.equal(weather.stage, 'active');
  assert.equal(weather.completedObjectives, 1);
  assert.match(weather.stageLabel, /review/i);
});

test('W799A marks each family restored only from all canonical objective actions', () => {
  const actions = EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((mission) => mission.objectives.map((objective) => objective.action));
  const view = deriveEonExpanseW799AStormTransformations(stateWithActions(actions));
  assert.equal(view.restoredCount, 3);
  assert.equal(view.regionRestored, true);
  assert.ok(view.rows.every((row) => row.stage === 'restored'));
});

test('W799A is visual projection only', () => {
  const view = deriveEonExpanseW799AStormTransformations();
  assert.equal(view.grantsXp, false);
  assert.equal(view.mutatesMissionState, false);
  assert.equal(view.automaticProgression, false);
  assert.equal(view.privateContentStored, false);
});
