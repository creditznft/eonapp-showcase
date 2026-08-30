import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_EXPANSE_W768A_BUILDING_CATALOG,
  createEonExpanseW768AMyFrontierLayoutContract,
  validateEonExpanseW768AMyFrontierLayoutContract,
  getEonExpanseW768AMyFrontierLayoutTruth
} from '../../assets/js/city/w768/eon-expanse-w768a-my-frontier-layout-contract.js';

test('W768A defines seven authored collision-safe plots and six fixed resident slots', () => {
  const contract = createEonExpanseW768AMyFrontierLayoutContract();
  const validation = validateEonExpanseW768AMyFrontierLayoutContract(contract);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(validation.plotCount, 7);
  assert.equal(validation.residentSlotCount, 6);
  assert.equal(contract.plots[0].requiredBuildingId, 'command-core');
  assert.equal(contract.rawCoordinatePlacementAllowed, false);
  assert.equal(contract.oneCanonicalScene, true);
});

test('W768A constrains every choice to its authored district and footprint', () => {
  const contract = createEonExpanseW768AMyFrontierLayoutContract();
  for (const plot of contract.plots) {
    for (const buildingId of plot.allowedBuildingIds) {
      const building = EON_EXPANSE_W768A_BUILDING_CATALOG[buildingId];
      assert.ok(building);
      assert.equal(building.district, plot.district);
      assert.ok(building.footprint.width <= plot.maxFootprint.width);
      assert.ok(building.footprint.depth <= plot.maxFootprint.depth);
      assert.ok(building.footprint.height <= plot.maxFootprint.height);
      assert.equal(building.reviewFirst, true);
      assert.equal(building.automaticExecution, false);
    }
  }
});

test('W768A validator rejects overlapping plots and cross-district building injection', () => {
  const contract = structuredClone(createEonExpanseW768AMyFrontierLayoutContract());
  contract.plots[1].collisionEnvelope = { ...contract.plots[0].collisionEnvelope };
  contract.plots[2].allowedBuildingIds = ['creator-workshop'];
  const validation = validateEonExpanseW768AMyFrontierLayoutContract(contract);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((entry) => entry.startsWith('plot-collision:')));
  assert.ok(validation.errors.includes('building-district-invalid:plot-knowledge:creator-workshop'));
});

test('W768A remains a data contract and cannot create another Babylon authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768a-my-frontier-layout-contract.js', import.meta.url), 'utf8');
  const truth = getEonExpanseW768AMyFrontierLayoutTruth();
  assert.equal(truth.fixedAuthoredPlots, true);
  assert.equal(truth.userChoosesApprovedBuildingIdsOnly, true);
  assert.equal(truth.publicLandCreated, false);
  assert.equal(truth.tradablePropertyCreated, false);
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
  assert.doesNotMatch(source, /localStorage|fetch\s*\(/);
});
