import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW798AStormBoard } from '../../assets/js/city/w798/eon-expanse-w798a-storm-sector-board.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS, createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

const stateThrough = (missionIds = []) => ({
  ...createEonExpanseW795AInitialStormMissionState(),
  completedObjectiveActions: EON_EXPANSE_W795A_STORM_MISSIONS.filter((mission) => missionIds.includes(mission.id)).flatMap((mission) => mission.objectives.map((objective) => objective.action))
});

test('W798A stays hidden outside Storm Sector and owns no progression', () => {
  const view = deriveEonExpanseW798AStormBoard({ activeRegionId: 'signal-frontier' });
  assert.equal(view.visible, false);
  assert.equal(view.grantsXp, false);
  assert.equal(view.mutatesMissionState, false);
  assert.equal(view.automaticTravel, false);
  assert.equal(view.privateContentStored, false);
});

test('W798A projects the active ordered objective and three mission rows', () => {
  const view = deriveEonExpanseW798AStormBoard({ activeRegionId: 'storm-sector', missionState: stateThrough([]) });
  assert.equal(view.visible, true);
  assert.equal(view.title, 'STORM SECTOR MISSIONS');
  assert.equal(view.missionRows.length, 3);
  assert.equal(view.activeObjective.action, 'storm-weather-array-reviewed');
  assert.equal(view.activeObjective.completionAuthority, 'explicit-field-interaction');
});

test('W798A reports mission-gated Transit and authored NPC presentation truth', () => {
  const view = deriveEonExpanseW798AStormBoard({
    activeRegionId: 'storm-sector',
    missionState: stateThrough(['weather-restoration']),
    playerPosition: { x: 990, y: 0.45, z: -158 },
    npcSummary: { requestedNpcCount: 3, presentedNpcCount: 2 },
    presentationSummary: { presentedHeroCount: 3 },
    journeyState: { status: 'storm-active' }
  });
  assert.equal(view.unlockedTransitCount, 3);
  assert.equal(view.transitRows.find((row) => row.id === 'relay-basin').status, 'Current area');
  assert.equal(view.transitRows.find((row) => row.id === 'storm-eye').status, 'Locked');
  assert.equal(view.presentedNpcCount, 2);
  assert.equal(view.authoredHeroCount, 3);
});

test('W798A reports completion without inventing a reward', () => {
  const view = deriveEonExpanseW798AStormBoard({ activeRegionId: 'storm-sector', missionState: stateThrough(['weather-restoration', 'relay-repair', 'storm-rescue']) });
  assert.equal(view.complete, true);
  assert.equal(view.activeObjective, null);
  assert.equal(view.completionLabel, 'Storm Sector mission chain complete');
  assert.equal('reward' in view, false);
});
