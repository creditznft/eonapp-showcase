import assert from 'node:assert/strict';
import test from 'node:test';

import { createEonExpanseW766EInitialLedger } from '../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js';
import { createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { resolveEonCityRt91DynamicEvent, validateEonCityRt91DynamicEventFamilies } from '../../assets/js/city/rt91/eon-city-rt91-dynamic-event-director.js';
import { projectEonCityRt91WorldTransformation, validateEonCityRt91WorldTransformationProjection } from '../../assets/js/city/rt91/eon-city-rt91-world-transformation-projection.js';
import { projectEonCityRt91Progression, validateEonCityRt91ProgressionProjection } from '../../assets/js/city/rt91/eon-city-rt91-progression-projection.js';
import { buildEonCityRt91MissionBoard } from '../../assets/js/city/rt91/eon-city-rt91-mission-board.js';
import { resolveEonCityRt91NextAction } from '../../assets/js/city/rt91/eon-city-rt91-next-action.js';
import { generateEonCityRt91DeterministicContract } from '../../assets/js/city/rt91/eon-city-rt91-deterministic-contract-generator.js';
import { deriveEonCityRt91ActivityCellFromWorldGrammar } from '../../assets/js/city/rt91/eon-city-rt91-world-cell-activity.js';

test('RT91 event families cover all worlds without FOMO, irreversible failure or blocked Hub return', () => {
  const validation = validateEonCityRt91DynamicEventFamilies();
  assert.equal(validation.ok, true, validation.errors.join(', '));
  for (const worldId of ['signal-frontier', 'storm-sector', 'my-frontier']) {
    const first = resolveEonCityRt91DynamicEvent({ worldId, worldSeed: 'world-a', at: 1_800_000 });
    const again = resolveEonCityRt91DynamicEvent({ worldId, worldSeed: 'world-a', at: 1_800_000 });
    assert.deepEqual(first, again);
    assert.equal(first.blocksHubReturn, false);
    assert.equal(first.missedEventPenalty, false);
    assert.equal(first.grantsProgressionAutomatically, false);
  }
});

test('RT91 persistent visual transformations prefer state changes over unbounded new geometry', () => {
  const projection = projectEonCityRt91WorldTransformation({ worldId: 'storm-sector', units: [
    { id: 'weather-restoration', label: 'Weather', progressRatio: 0 },
    { id: 'relay-repair', label: 'Relay', progressRatio: 0.55 },
    { id: 'storm-rescue', label: 'Rescue', progressRatio: 1 }
  ] });
  assert.equal(validateEonCityRt91WorldTransformationProjection(projection).ok, true);
  assert.equal(projection.units[0].stageId, 'damaged');
  assert.equal(projection.units[1].stageId, 'operational');
  assert.equal(projection.units[2].stageId, 'signature');
  assert.equal(projection.materialLightAudioStatePreferredOverNewGeometry, true);
  assert.equal(projection.writesPersistence, false);
});

test('RT91 progression projection reads existing authorities without becoming a writer', () => {
  const projection = projectEonCityRt91Progression({
    signalState: createEonExpanseW766EInitialLedger(),
    stormState: createEonExpanseW795AInitialStormMissionState(),
    myFrontierState: { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop' }, residents: {} },
    generatedContractStats: { offered: 5, completed: 2 }
  });
  const validation = validateEonCityRt91ProgressionProjection(projection);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(projection.worlds['signal-frontier'].campaignTotal, 7);
  assert.equal(projection.worlds['storm-sector'].campaignTotal, 3);
  assert.equal(projection.worlds['my-frontier'].constructedPlotCount, 2);
  assert.equal(projection.awardsXp, false);
  assert.equal(projection.writesProgression, false);
});

test('RT91 unified mission board combines authored, generated, productive and build opportunities as projections', () => {
  const cells = [];
  for (let x = -4; x <= 4; x += 1) for (let z = -4; z <= 4; z += 1) cells.push(deriveEonCityRt91ActivityCellFromWorldGrammar({ worldId: 'my-frontier', x, z, seed: 'board-world' }));
  const contract = generateEonCityRt91DeterministicContract({ worldId: 'my-frontier', worldSeed: 'board-world', cycleKey: 'today', candidateCells: cells });
  assert.equal(contract.ok, true, contract.reason || '');
  const board = buildEonCityRt91MissionBoard({
    signalState: createEonExpanseW766EInitialLedger(),
    stormState: createEonExpanseW795AInitialStormMissionState(),
    myFrontierState: { unlocked: true },
    generatedContracts: [contract],
    productiveMissions: [{ id: 'create-something-useful', label: 'Create something useful', worldId: 'my-frontier' }]
  });
  assert.ok(board.counts.story >= 2);
  assert.equal(board.counts.contracts, 1);
  assert.equal(board.counts.productive, 1);
  assert.equal(board.counts.build, 1);
  assert.equal(board.projectionOnly, true);
  assert.equal(board.writesProgression, false);
});

test('RT91 next-action resolver can never return a blank playable state', () => {
  const emptyBoard = buildEonCityRt91MissionBoard({ signalState: createEonExpanseW766EInitialLedger(), stormState: createEonExpanseW795AInitialStormMissionState() });
  const signalAction = resolveEonCityRt91NextAction({ board: emptyBoard, currentWorldId: 'signal-frontier' });
  assert.equal(signalAction.blankState, false);
  assert.ok(signalAction.action.id);
  const absoluteFallback = resolveEonCityRt91NextAction({ board: { sections: {} }, currentWorldId: 'my-frontier' });
  assert.equal(absoluteFallback.blankState, false);
  assert.equal(absoluteFallback.action.id, 'open-mission-board');
  assert.equal(absoluteFallback.startsWorkAutomatically, false);
});
