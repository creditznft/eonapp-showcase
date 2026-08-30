import assert from 'node:assert/strict';
import test from 'node:test';
import { CITY_ASSET_CATALOG } from '../../assets/js/city/eon-city-asset-catalog.js';
import { getCityAssetReleasePreflightSummary, getCityAssetReleaseTruth, validateCityAssetReleaseManifest } from '../../assets/js/city/eon-city-asset-release-preflight.js';
import { inspectW417CityAssetReleasePreflight } from '../../scripts/w417-city-asset-release-preflight-gate.mjs';

test('W417 distinguishes local engineering candidates from final visual-release approval', () => {
  const summary = getCityAssetReleasePreflightSummary();
  assert.equal(summary.ready, false);
  assert.ok(summary.catalog.shipped >= 8);
  assert.match(summary.currentState, /Local engineering-candidate City binaries/i);
  assert.ok(CITY_ASSET_CATALOG.some((entry) => entry.status === 'shipped'));
});

test('W417 manifest validation fails closed before provenance, hash, LOD and proof evidence exist', () => {
  const report = validateCityAssetReleaseManifest({ schema: 'wrong', releaseId: 'bad', quality: 'cinematic', entries: [] });
  assert.equal(report.ok, false);
  assert.ok(report.errors.some((error) => /Manifest schema/i.test(error)));
  assert.ok(report.errors.some((error) => /mandatory human\/device proof/i.test(error)));
  const truth = getCityAssetReleaseTruth();
  assert.equal(truth.binaryLoadEnabled, true);
  assert.equal(truth.engineeringCandidateLoadEnabled, true);
  assert.equal(truth.finalVisualCertification, false);
  assert.equal(truth.finalVisualReleaseApproved, false);
});

test('W417 release-preflight gate preserves the final-art boundary', () => {
  const report = inspectW417CityAssetReleasePreflight();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.checkCount, 8);
});
