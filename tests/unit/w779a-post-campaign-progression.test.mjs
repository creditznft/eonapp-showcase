import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW779APostCampaignProgression } from '../../assets/js/city/w779/eon-expanse-w779a-post-campaign-progression.js';

const completeCampaign = { campaign: { complete: true } };

test('W779A remains hidden until the canonical Signal Frontier campaign is complete', () => {
  const projection = deriveEonExpanseW779APostCampaignProgression({ campaignBoard: { campaign: { complete: false } } });
  assert.equal(projection.visible, false);
  assert.equal(projection.futureRegionStatus, 'signal-frontier-certification-required');
});

test('W779A summarizes five maintained post-campaign pillars without inventing progress', () => {
  const projection = deriveEonExpanseW779APostCampaignProgression({
    campaignBoard: completeCampaign,
    zoneRestorationBoard: { restoredZoneCount: 5 },
    myFrontierState: { unlocked: true },
    constructionProjection: { constructedCount: 2 },
    productiveTransformationStatus: { activeCount: 3 },
    sideTransformationStatus: { activeCount: 1 },
    livingContentState: { discoveries: ['a', 'b'], completedFrontierContracts: [], activeFrontierContract: null }
  });
  assert.equal(projection.visible, true);
  assert.equal(projection.rows.length, 5);
  assert.equal(projection.completedPillars, 0);
  assert.match(projection.nextLabel, /construct/i);
  assert.equal(projection.futureRegionReady, false);
});

test('W779A never reframes My Frontier starter entry as a Signal-gated unlock', () => {
  const projection = deriveEonExpanseW779APostCampaignProgression({ campaignBoard: completeCampaign, myFrontierState: { unlocked: false } });
  assert.match(projection.nextLabel, /Enter My Frontier to activate starter planning/);
  assert.doesNotMatch(projection.nextLabel, /unlock My Frontier|campaign receipt/i);
  assert.doesNotMatch(projection.rows.find((row) => row.id === 'my-frontier').status, /unlock required/i);
});

test('W779A marks future-region foundation ready only after every maintained pillar and restoration are complete', () => {
  const projection = deriveEonExpanseW779APostCampaignProgression({
    campaignBoard: completeCampaign,
    zoneRestorationBoard: { restoredZoneCount: 5 },
    myFrontierState: { unlocked: true },
    constructionProjection: { constructedCount: 7 },
    productiveTransformationStatus: { activeCount: 5 },
    sideTransformationStatus: { activeCount: 5 },
    livingContentState: { discoveries: ['a', 'b', 'c', 'd', 'e'], completedFrontierContracts: ['one'], activeFrontierContract: null }
  });
  assert.equal(projection.completedPillars, 5);
  assert.equal(projection.futureRegionReady, true);
  assert.equal(projection.futureRegionStatus, 'foundation-ready-for-authored-region-programme');
  assert.equal(projection.createsRegion, false);
  assert.equal(projection.automaticUnlock, false);
});

test('W779A is projection-only and stores no private or progression authority', () => {
  const projection = deriveEonExpanseW779APostCampaignProgression({ campaignBoard: completeCampaign });
  assert.equal(projection.grantsXp, false);
  assert.equal(projection.mutatesProgression, false);
  assert.equal(projection.privateContentStored, false);
});
