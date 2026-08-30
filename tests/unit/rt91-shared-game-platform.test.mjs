import assert from 'node:assert/strict';
import test from 'node:test';

import { createEonCityRt91ObjectiveGraph, deriveEonCityRt91ObjectiveGraphView, validateEonCityRt91ObjectiveGraph } from '../../assets/js/city/rt91/eon-city-rt91-objective-graph.js';
import { appendEonCityRt91ActivityHistory, scoreEonCityRt91ActivityCandidate } from '../../assets/js/city/rt91/eon-city-rt91-anti-repetition.js';
import { createEonCityRt91ActivityCell, deriveEonCityRt91ActivityCellFromWorldGrammar, placeEonCityRt91MissionObjectives } from '../../assets/js/city/rt91/eon-city-rt91-world-cell-activity.js';
import { generateEonCityRt91DeterministicContract } from '../../assets/js/city/rt91/eon-city-rt91-deterministic-contract-generator.js';

test('RT91 objective graph exposes only dependency-satisfied next objectives', () => {
  const graph = createEonCityRt91ObjectiveGraph({ missionId: 'mission-alpha', objectives: [
    { id: 'reach-site', verb: 'reach', action: 'reach-site', cellRole: 'route', label: 'Reach site' },
    { id: 'inspect-site', verb: 'inspect', action: 'inspect-site', cellRole: 'maintenance', label: 'Inspect site' },
    { id: 'repair-site', verb: 'repair', action: 'repair-site', cellRole: 'maintenance', label: 'Repair site' }
  ] });
  assert.equal(validateEonCityRt91ObjectiveGraph(graph).ok, true);
  assert.deepEqual(deriveEonCityRt91ObjectiveGraphView(graph).activeObjectiveIds, ['reach-site']);
  assert.deepEqual(deriveEonCityRt91ObjectiveGraphView(graph, { completedObjectiveIds: ['reach-site'] }).activeObjectiveIds, ['inspect-site']);
  assert.equal(deriveEonCityRt91ObjectiveGraphView(graph, { completedObjectiveIds: ['reach-site', 'inspect-site', 'repair-site'] }).complete, true);
});

test('RT91 objective graph rejects cycles and owns no XP/progression', () => {
  const graph = createEonCityRt91ObjectiveGraph({ missionId: 'mission-cycle', objectives: [
    { id: 'a-node', verb: 'reach', action: 'reach-a', cellRole: 'route', dependsOn: ['b-node'] },
    { id: 'b-node', verb: 'inspect', action: 'inspect-b', cellRole: 'route', dependsOn: ['a-node'] }
  ] });
  const result = validateEonCityRt91ObjectiveGraph(graph);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('cycle'));
  assert.equal(graph.awardsXp, false);
  assert.equal(graph.writesProgression, false);
});

test('RT91 anti-repetition strongly down-weights the immediately repeated family', () => {
  let history = [];
  history = appendEonCityRt91ActivityHistory(history, { familyId: 'relay-repair-contract', regionId: 'region-a', objectiveSignature: 'reach-repair-return' });
  const repeated = scoreEonCityRt91ActivityCandidate({ familyId: 'relay-repair-contract', regionId: 'region-a', objectiveSignature: 'reach-repair-return' }, history);
  const fresh = scoreEonCityRt91ActivityCandidate({ familyId: 'storm-rescue-contract', regionId: 'region-b', objectiveSignature: 'reach-rescue-return' }, history);
  assert.ok(fresh.score > repeated.score, `${fresh.score} <= ${repeated.score}`);
});

test('RT91 generated world cells are deterministic semantic activity candidates', () => {
  const first = deriveEonCityRt91ActivityCellFromWorldGrammar({ worldId: 'my-frontier', x: 17, z: -22, seed: 'owner-city-a' });
  const again = deriveEonCityRt91ActivityCellFromWorldGrammar({ worldId: 'my-frontier', x: 17, z: -22, seed: 'owner-city-a' });
  assert.deepEqual(first, again);
  assert.equal(first.rawCoordinateAuthority, false);
  assert.ok(first.roles.includes('public-space'));
  assert.ok(first.roles.includes('civic-support'));
});

test('RT91 mission placement fails closed instead of inventing an invalid location', () => {
  const cell = createEonCityRt91ActivityCell({ worldId: 'signal-frontier', cellId: 'signal-route-a', roles: ['route'], position: { x: 1, z: 2 } });
  const result = placeEonCityRt91MissionObjectives({ missionId: 'repair-a', seed: 'seed-a', candidateCells: [cell], objectives: [
    { id: 'reach-a', action: 'reach-a', cellRole: 'route' },
    { id: 'repair-a', action: 'repair-a', cellRole: 'maintenance' }
  ] });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no-valid-cell:maintenance');
});

test('RT91 deterministic contract generation produces the same contract for the same seed and cells', () => {
  const cells = [];
  for (let x = -3; x <= 3; x += 1) for (let z = -3; z <= 3; z += 1) cells.push(deriveEonCityRt91ActivityCellFromWorldGrammar({ worldId: 'my-frontier', x, z, seed: 'city-a' }));
  const input = { worldId: 'my-frontier', worldSeed: 'city-a', cycleKey: '2026-W33', contractIndex: 2, candidateCells: cells };
  const first = generateEonCityRt91DeterministicContract(input);
  const again = generateEonCityRt91DeterministicContract(input);
  assert.equal(first.ok, true, first.reason || '');
  assert.deepEqual(first, again);
  assert.equal(first.awardsXp, false);
  assert.equal(first.writesProgression, false);
  assert.equal(first.placement.allObjectivesPlaced, true);
});

test('RT91 generated contracts vary across seeds without moving reward authority into the generator', () => {
  const cells = [];
  for (let x = -5; x <= 5; x += 1) for (let z = -5; z <= 5; z += 1) cells.push(deriveEonCityRt91ActivityCellFromWorldGrammar({ worldId: 'storm-sector', x, z, seed: 'storm-cell-world' }));
  const signatures = new Set();
  for (let index = 0; index < 64; index += 1) {
    const result = generateEonCityRt91DeterministicContract({ worldId: 'storm-sector', worldSeed: `storm-${index}`, cycleKey: 'cycle-a', contractIndex: index, candidateCells: cells });
    assert.equal(result.ok, true, `seed ${index}: ${result.reason}`);
    signatures.add(`${result.familyId}:${result.seedSignature}:${result.template.objectives.map((row) => row.verb).join(',')}`);
    assert.equal(result.template.grantsXp, false);
    assert.equal(result.template.rewardAuthority, false);
    assert.equal(result.runtimeAiRequired, false);
  }
  assert.ok(signatures.size > 50, `signatures=${signatures.size}`);
});
