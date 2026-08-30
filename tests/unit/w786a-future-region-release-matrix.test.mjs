import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW786AFutureRegionReleaseMatrix } from '../../assets/js/city/w786/eon-expanse-w786a-future-region-release-matrix.js';

const completeInputs = () => ({
  postCampaign: { visible: true, futureRegionReady: true, futureRegionStatus: 'foundation-ready-for-authored-region-programme' },
  programmeReview: { reviewedRegion: { regionId: 'storm-sector' }, status: 'programme-reviewed-not-unlocked' },
  openWorldArtAudit: { releaseReady: true, blockingProxyCount: 0 },
  packageReadiness: { visible: true, certificationReady: true, completedRequirements: 7, totalRequirements: 7 },
  performanceReadiness: { certificationReady: true, status: 'performance-certification-ready' },
  releaseGate: { releaseReady: true, status: 'future-region-release-ready', recommendedRegionId: 'storm-sector' }
});

test('W786A stays hidden before the maintained post-campaign frontier exists', () => {
  const matrix = deriveEonExpanseW786AFutureRegionReleaseMatrix();
  assert.equal(matrix.visible, false);
  assert.equal(matrix.releaseReviewReady, false);
});

test('W786A exposes six independent release gates', () => {
  const matrix = deriveEonExpanseW786AFutureRegionReleaseMatrix({
    postCampaign: { visible: true, futureRegionReady: true },
    programmeReview: { reviewedRegion: { regionId: 'storm-sector' } },
    openWorldArtAudit: { releaseReady: false, blockingProxyCount: 12 },
    packageReadiness: { visible: true, certificationReady: false, completedRequirements: 0, totalRequirements: 7 },
    performanceReadiness: { certificationReady: false, status: 'foreground-browser-measurement-required' },
    releaseGate: { releaseReady: false, status: 'development-proxy-replacement-required' }
  });
  assert.equal(matrix.rows.length, 6);
  assert.equal(matrix.completedGates, 2);
  assert.equal(matrix.releaseReviewReady, false);
  assert.match(matrix.rows.find((row) => row.id === 'release-art').status, /12 authored replacements/);
});

test('W786A becomes ready only when all maintained evidence gates are complete', () => {
  const matrix = deriveEonExpanseW786AFutureRegionReleaseMatrix(completeInputs());
  assert.equal(matrix.completedGates, 6);
  assert.equal(matrix.releaseReviewReady, true);
  assert.equal(matrix.status, 'future-region-ready-for-explicit-release-review');
});

test('W786A never activates, renders or releases a region automatically', () => {
  const matrix = deriveEonExpanseW786AFutureRegionReleaseMatrix(completeInputs());
  assert.equal(matrix.gatewayActivated, false);
  assert.equal(matrix.rendersRegion, false);
  assert.equal(matrix.automaticRelease, false);
  assert.equal(matrix.grantsXp, false);
  assert.equal(matrix.privateContentStored, false);
});
