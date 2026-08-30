import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEonCityRt91MyFrontierContractCells } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-contract-cells.js';
import { generateEonCityRt91DeterministicContract } from '../../assets/js/city/rt91/eon-city-rt91-deterministic-contract-generator.js';

const DISTRICTS = ['central','creator','knowledge','systems','signal','transit','personal'];
const REQUIRED_FAMILIES = ['district-development-contract','city-maintenance-contract','resident-assistance-contract','productive-rpg-contract'];

test('RT91 My Frontier generator survives 1,400 deterministic district contracts with unique compatible placements', () => {
  const cells = buildEonCityRt91MyFrontierContractCells().cells;
  const familyCounts = new Map();
  let total = 0;
  for (const district of DISTRICTS) {
    const candidateCells = cells.filter((cell) => cell.zoneId === district);
    assert.equal(candidateCells.length, 6);
    for (let index = 0; index < 200; index += 1) {
      const args = {
        worldId: 'my-frontier',
        worldSeed: `mf-${district}-${index}`,
        cycleKey: `cycle-${index % 31}`,
        contractIndex: index % 3,
        history: [],
        candidateCells
      };
      const a = generateEonCityRt91DeterministicContract(args);
      const b = generateEonCityRt91DeterministicContract(args);
      assert.deepEqual(a, b, `non-deterministic:${district}:${index}`);
      assert.equal(a.ok, true, `${district}:${index}:${a.reason || 'failed'}`);
      assert.equal(a.placement?.ok, true, `${district}:${index}:placement`);
      const used = new Set();
      for (const placement of a.placement.placements) {
        assert.equal(used.has(placement.cellId), false, `${district}:${index}:duplicate:${placement.cellId}`);
        used.add(placement.cellId);
        const cell = candidateCells.find((row) => row.cellId === placement.cellId);
        const objective = a.template.objectives.find((row) => row.id === placement.objectiveId);
        assert.ok(cell, `${district}:${index}:unknown-cell`);
        assert.ok(objective, `${district}:${index}:unknown-objective`);
        assert.ok(cell.roles.includes(objective.cellRole), `${district}:${index}:incompatible:${objective.cellRole}:${cell.cellId}`);
      }
      familyCounts.set(a.familyId, (familyCounts.get(a.familyId) || 0) + 1);
      total += 1;
    }
  }
  assert.equal(total, 1400);
  for (const familyId of REQUIRED_FAMILIES) assert.ok(familyCounts.has(familyId), `family-not-observed:${familyId}`);
});
