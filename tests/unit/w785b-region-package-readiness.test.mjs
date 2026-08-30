import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW785BRegionPackageReadiness } from '../../assets/js/city/w785/eon-expanse-w785b-region-package-readiness.js';

test('W785B remains hidden until a future-region programme is explicitly reviewed', () => {
  const readiness = deriveEonExpanseW785BRegionPackageReadiness({ reviewView: { reviewedRegion: null } });
  assert.equal(readiness.visible, false);
  assert.equal(readiness.status, 'programme-review-required');
});

test('W785B exposes seven exact evidence families for a reviewed region', () => {
  const readiness = deriveEonExpanseW785BRegionPackageReadiness({ reviewView: { reviewedRegion: { regionId: 'storm-sector', gatewayId: 'future-gateway-storm-sector' } } });
  assert.equal(readiness.visible, true);
  assert.equal(readiness.rows.length, 7);
  assert.equal(readiness.completedRequirements, 0);
  assert.equal(readiness.status, 'authored-region-package-evidence-required');
  assert.match(readiness.rows.map((row) => row.label).join(','), /Authored hero assets/);
  assert.match(readiness.rows.map((row) => row.label).join(','), /Authenticated browser proofs/);
});

test('W785B cannot activate or render a region even after package certification', () => {
  const readiness = deriveEonExpanseW785BRegionPackageReadiness({ reviewView: { reviewedRegion: { regionId: 'archive-noir', gatewayId: 'future-gateway-archive-noir' } } });
  assert.equal(readiness.activatesGateway, false);
  assert.equal(readiness.rendersRegion, false);
  assert.equal(readiness.automaticCertification, false);
  assert.equal(readiness.grantsXp, false);
  assert.equal(readiness.privateContentStored, false);
});
