import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_W731_LAUNCH_ASSET_MANIFEST } from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';
import {
  auditEonCityL95LocalAssetSourceResidency,
  validateEonCityL95LocalAssetSourceResidency
} from '../../assets/js/city/l95/eon-city-l95-local-asset-source-residency.js';

test('balanced/cinematic launch manifest exposes same-source decode reuse opportunities without weakening cache truth', () => {
  for (const quality of ['balanced', 'cinematic']) {
    const report = auditEonCityL95LocalAssetSourceResidency(EON_CITY_W731_LAUNCH_ASSET_MANIFEST, { quality });
    assert.equal(validateEonCityL95LocalAssetSourceResidency(report).ok, true);
    assert.equal(report.logicalEntryCount, 44);
    assert.equal(report.uniqueSourceCount, 29);
    assert.equal(report.duplicateSourceCount, 11);
    assert.equal(report.duplicateLogicalReferenceCount, 15);
    assert.equal(report.variantReferenceCount, 88);
    assert.equal(report.uniqueVariantPathCount, 58);
    assert.equal(report.duplicateVariantPathCount, 22);
    assert.equal(report.duplicateVariantReferenceCount, 30);
    assert.equal(report.staticPoolCandidateCount, 6);
    assert.equal(report.animatedOrCharacterReuseCount, 5);
    assert.equal(report.contentAddressed, true);
    assert.equal(report.sameOrigin, true);
  }
});

test('static world reuse and animated-character reuse stay explicitly separated', () => {
  const report = auditEonCityL95LocalAssetSourceResidency(EON_CITY_W731_LAUNCH_ASSET_MANIFEST, { quality: 'balanced' });
  const districtInfo = report.duplicateSources.find((family) => family.sourceId === 'eoncity-district-info');
  const citizen = report.duplicateSources.find((family) => family.sourceId === 'citizen-variant-6clips');
  assert.equal(districtInfo?.logicalReferences, 4);
  assert.equal(districtInfo?.staticPoolCandidate, true);
  assert.equal(districtInfo?.animatedOrCharacterReuse, false);
  assert.equal(citizen?.logicalReferences, 2);
  assert.equal(citizen?.staticPoolCandidate, false);
  assert.equal(citizen?.animatedOrCharacterReuse, true);
});

test('W731 loader serializes duplicate source families before Babylon decode', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-local-assets.js', import.meta.url), 'utf8');
  assert.match(source, /getEonCityL95LocalAssetSourceKey/);
  assert.match(source, /activeSourceKeys = new Set\(\)/);
  assert.match(source, /!activeSourceKeys\.has\(candidate\.sourceKey\)/);
  assert.match(source, /activeSourceKeys\.add\(task\.sourceKey\)/);
  assert.match(source, /activeSourceKeys\.delete\(task\.sourceKey\)/);
  assert.match(source, /sourceResidency/);
});
