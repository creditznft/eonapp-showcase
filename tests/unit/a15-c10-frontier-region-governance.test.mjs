import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST } from '../../assets/js/city/w792/eon-expanse-w792a-storm-sector-authored-package.js';
import { buildEonCityC10FrontierRegionGovernance, validateEonCityC10FrontierRegionGovernance, getEonCityC10FrontierRegionTruth } from '../../assets/js/city/c10/eon-city-c10-frontier-region-governance.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const governanceSource = fs.readFileSync(path.join(ROOT, 'assets/js/city/c10/eon-city-c10-frontier-region-governance.js'), 'utf8');

const state = buildEonCityC10FrontierRegionGovernance();

test('C10 certifies My Frontier authored source boundaries', () => {
  assert.equal(state.myFrontier.sourceValid, true);
  assert.equal(state.myFrontier.authoredPlotCount, 7);
  assert.equal(state.myFrontier.residentSlotCount, 6);
  assert.equal(state.myFrontier.rawCoordinatePlacementAllowed, false);
  assert.equal(state.myFrontier.publicLandCreated, false);
  assert.equal(state.myFrontier.tradablePropertyCreated, false);
});

test('C10 binds Storm Sector to the exact W792 package digest', () => {
  assert.equal(state.stormSector.packageDigest, EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST);
  assert.equal(state.stormSector.exactPackageValid, true);
  assert.equal(state.stormSector.sourceProgrammeComplete, true);
});

test('C10 keeps Storm locked without all external and owner evidence', () => {
  assert.equal(state.stormSector.externalGateCount, 8);
  assert.equal(state.stormSector.externalGatePassedCount, 0);
  assert.equal(state.stormSector.ownerCaseCount, 35);
  assert.equal(state.stormSector.ownerCasePassedCount, 0);
  assert.equal(state.stormSector.releaseReady, false);
  assert.equal(state.stormSector.gatewayVisible, false);
  assert.equal(state.stormSector.regionRendered, false);
});

test('C10 never equates source completeness with certification', () => {
  const validation = validateEonCityC10FrontierRegionGovernance(state);
  assert.equal(validation.ok, true, validation.errors.join(','));
  const truth = getEonCityC10FrontierRegionTruth();
  assert.equal(truth.stormSourceProgrammeComplete, true);
  assert.equal(truth.stormExternallyCertified, false);
  assert.equal(truth.stormGatewayLocked, true);
  assert.equal(truth.productionReady, false);
});

test('C10 consumes the canonical W792 validation result without duplicating package bindings', () => {
  assert.match(governanceSource, /validateEonExpanseW792AStormSectorPackage\(\)/);
  assert.match(governanceSource, /packageDigest:\s*packageValidation\.packageDigest/);
  assert.doesNotMatch(governanceSource, /EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE(?:_DIGEST)?/);
  assert.equal(state.stormSector.packageDigest, EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST);
  assert.equal(state.stormSector.exactPackageValid, true);
});

test('C10 separates Storm release certification from player Signal completion', () => {
  assert.equal(state.stormSector.signalCampaignCompletionRequired, false);
  assert.equal(state.stormSector.directPlayerEntryAfterCertifiedActivation, true);
  assert.equal(state.stormSector.releaseReady, false);
});
