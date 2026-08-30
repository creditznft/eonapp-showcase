import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE,
  createEonCityL95MyFrontierPublicInfrastructurePlan,
  validateEonCityL95MyFrontierPublicInfrastructurePlan
} from '../../assets/js/city/l95/eon-city-l95-my-frontier-public-infrastructure-contract.js';

const rendererSource = await readFile(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
const presenterSource = await readFile(new URL('../../assets/js/city/l95/eon-city-l95-my-frontier-public-infrastructure.js', import.meta.url), 'utf8');
const contractSource = await readFile(new URL('../../assets/js/city/l95/eon-city-l95-my-frontier-public-infrastructure-contract.js', import.meta.url), 'utf8');

test('L95 My Frontier starts with authored public infrastructure without fabricating user buildings', () => {
  const balanced = createEonCityL95MyFrontierPublicInfrastructurePlan({ quality: 'balanced' });
  const validation = validateEonCityL95MyFrontierPublicInfrastructurePlan(balanced);
  assert.equal(validation.ok, true);
  assert.equal(balanced.authoredPlacementCount, 7);
  assert.equal(new Set(balanced.entries.map((entry) => entry.district)).size, 7);
  assert.equal(balanced.userBuildingCount, 0);
  assert.equal(balanced.automaticConstruction, false);
  assert.equal(balanced.grantsXp, false);
  assert.equal(balanced.mutatesMissionState, false);
});

test('L95 public infrastructure is maintained authored art and never interactive ownership state', () => {
  for (const entry of EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE) {
    assert.match(entry.assetId, /^[a-z0-9-]+$/);
    assert.equal(entry.ownership, 'public-infrastructure');
    assert.equal(entry.interactive, false);
    assert.equal(entry.userBuilding, false);
    assert.equal(entry.grantsConstruction, false);
    assert.equal(entry.rawCoordinatesAccepted, false);
  }
  assert.match(presenterSource, /SceneLoader\.LoadAssetContainerAsync/);
  assert.match(presenterSource, /buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(presenterSource, /optionalConcurrencyLimit/);
  assert.match(presenterSource, /queued-public-infrastructure/);
  assert.match(presenterSource, /wrapper\.freezeWorldMatrix/);
  assert.match(presenterSource, /mesh\.freezeWorldMatrix/);
  assert.match(presenterSource, /staticWorldMatrices:\s*true/);
  assert.match(contractSource, /\[a-f0-9\]\{12\}/i);
  assert.doesNotMatch(presenterSource, /new Engine\s*\(/);
  assert.doesNotMatch(presenterSource, /new Scene\s*\(/);
});

test('L95 My Frontier canonical renderer mounts and disposes the public infrastructure with the world', () => {
  assert.match(rendererSource, /mountEonCityL95MyFrontierPublicInfrastructure/);
  assert.match(rendererSource, /parent: root/);
  assert.match(rendererSource, /publicInfrastructure: publicInfrastructurePresenter\?\.getSummary/);
  assert.match(rendererSource, /setOptionalAssetAdmission/);
  assert.match(rendererSource, /publicInfrastructurePresenter\?\.setOptionalAssetAdmission/);
  assert.match(rendererSource, /publicInfrastructurePresenter\?\.dispose/);
});
