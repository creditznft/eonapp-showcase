import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW780BFutureRegionProgramme } from '../../assets/js/city/w780/eon-expanse-w780b-future-region-programme.js';

test('W780B remains hidden before canonical post-campaign visibility', () => {
  const projection = deriveEonExpanseW780BFutureRegionProgramme({ postCampaign: { visible: false } });
  assert.equal(projection.visible, false);
  assert.equal(projection.reviewAvailable, false);
});

test('W780B shows all authored programmes as locked until maintained pillars are complete', () => {
  const projection = deriveEonExpanseW780BFutureRegionProgramme({
    postCampaign: { visible: true, futureRegionReady: false, completedPillars: 3, totalPillars: 5 },
    worldSeed: 'frontier-a'
  });
  assert.equal(projection.rows.length, 8);
  assert.equal(projection.status, 'maintained-frontier-pillars-required');
  assert.equal(projection.reviewAvailable, false);
  assert.ok(projection.rows.every((row) => row.status === 'locked-authored-programme'));
});

test('W780B excludes an already activated public region from future-region planning', () => {
  const projection = deriveEonExpanseW780BFutureRegionProgramme({
    postCampaign: { visible: true, futureRegionReady: false, completedPillars: 3, totalPillars: 5 },
    releasedRegionIds: ['storm-sector']
  });
  assert.equal(projection.rows.length, 7);
  assert.equal(projection.rows.some((row) => row.id === 'storm-sector'), false);
  assert.deepEqual(projection.excludedReleasedRegionIds, ['storm-sector']);
});

test('W780B deterministically recommends one authored programme only after readiness', () => {
  const input = { postCampaign: { visible: true, futureRegionReady: true, completedPillars: 5, totalPillars: 5 }, worldSeed: 'frontier-seed' };
  const first = deriveEonExpanseW780BFutureRegionProgramme(input);
  const second = deriveEonExpanseW780BFutureRegionProgramme(input);
  assert.equal(first.reviewAvailable, true);
  assert.equal(first.recommendedRegion.id, second.recommendedRegion.id);
  assert.equal(first.rows.filter((row) => row.status === 'recommended-for-programme-review').length, 1);
});

test('W780B never unlocks, renders, rewards or persists a future region', () => {
  const projection = deriveEonExpanseW780BFutureRegionProgramme({ postCampaign: { visible: true, futureRegionReady: true } });
  assert.equal(projection.automaticUnlock, false);
  assert.equal(projection.gatewayActivated, false);
  assert.equal(projection.createsRegion, false);
  assert.equal(projection.rendersRegion, false);
  assert.equal(projection.grantsXp, false);
  assert.equal(projection.mutatesProgression, false);
  assert.equal(projection.selectionPersisted, false);
  assert.equal(projection.privateContentStored, false);
});
