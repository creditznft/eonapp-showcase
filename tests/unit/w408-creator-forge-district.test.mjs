import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT, getCreatorForgeDistrictDestinations, validateCreatorForgeDistrictBlueprint } from '../../assets/js/city/eon-city-creator-forge-district.js';
import { getCityCreatorAtriumCards } from '../../assets/js/city/eon-city-creator-atrium.js';
import { getCityArtIntakeSummary } from '../../assets/js/city/eon-city-art-intake.js';
import { inspectW408CreatorForgeDistrict } from '../../scripts/w408-creator-forge-district-gate.mjs';

test('W408 keeps Creator Atrium and Forge Bay as two authored local City districts', () => {
  const result = validateCreatorForgeDistrictBlueprint();
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.deepEqual(EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.districts.map((district) => district.id), ['creator-atrium', 'forge-bay']);
  assert.equal(EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.foregroundUserGestureOnly, true);
  assert.equal(EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.visibleReviewRequired, true);
  assert.equal(EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.automaticNavigation, false);
  assert.equal(EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.automaticExecution, false);
});

test('W408 reuses the existing W404 launch allowlist without a hidden new route', () => {
  const routes = getCreatorForgeDistrictDestinations().map((entry) => entry.route).sort();
  const cards = getCityCreatorAtriumCards().map((entry) => entry.route).sort();
  assert.deepEqual(routes, cards);
  assert.equal(new Set(routes).size, 4);
});

test('W408 retains local candidate truth while its own buildings remain planned/fallback-only', () => {
  const art = getCityArtIntakeSummary({ quality: 'balanced' });
  assert.ok(art.shippedBinaryCount >= 8);
  assert.equal(art.loadableCount, 5);
  assert.equal(art.plannedCount, 3);
  assert.equal(art.releaseReady, false);
});

test('W408 rejects automatic navigation and forbidden remote values', () => {
  const invalid = JSON.parse(JSON.stringify(EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT));
  invalid.handoff.automaticNavigation = true;
  invalid.districts[0].remoteUrl = 'https://example.invalid/atrium.glb';
  const result = validateCreatorForgeDistrictBlueprint(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /handoff boundary|forbidden remote URL/i.test(message)));
});

test('W408 source gate remains source-only and Babylon-canonical', () => {
  const report = inspectW408CreatorForgeDistrict({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 13);
});
