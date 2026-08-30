import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { EON_CITY_NPC_ASSET_BRIEFS, EON_CITY_BUILDING_ASSET_BRIEFS, getCityAssetDesignKitSummary, getCityAssetDesignTruth, validateCityAssetDesignKit } from '../../assets/js/city/eon-city-asset-design-kit.js';
import { CITY_VISUAL_TIERS, getCityDistrictVisualPreview, getCityVisualProgressionPlan, getCityVisualProgressionTruth, validateCityVisualProgressionPlan } from '../../assets/js/city/eon-city-visual-progression.js';
import { inspectW426CityMotionProgression } from '../../scripts/w426-city-motion-progression-gate.mjs';

test('W426 supplies original-art NPC and building briefs without pretending binary hero assets are shipped', () => {
  assert.equal(validateCityAssetDesignKit().ok, true);
  assert.ok(EON_CITY_NPC_ASSET_BRIEFS.length >= 6);
  assert.ok(EON_CITY_BUILDING_ASSET_BRIEFS.length >= 4);
  assert.ok(EON_CITY_NPC_ASSET_BRIEFS.every((entry) => entry.animationLoops.length >= 3 && entry.provenance.finalBinaryArt === false));
  assert.equal(getCityAssetDesignKitSummary().finalBinaryArt, false);
  assert.equal(getCityAssetDesignTruth().finalArtShipped, false);
});

test('W426 keeps City building and character upgrades as future visual previews with no entitlement reads', () => {
  assert.equal(validateCityVisualProgressionPlan().ok, true);
  assert.equal(CITY_VISUAL_TIERS[0].id, 'foundation');
  const plan = getCityVisualProgressionPlan({ quality: 'cinematic', requestedTier: 'skyline' });
  assert.equal(plan.activeTier, 'foundation');
  assert.equal(plan.requestedTier, 'skyline');
  assert.equal(plan.activationBlocked, true);
  assert.equal(plan.motion.enabled, true);
  const reduced = getCityVisualProgressionPlan({ quality: 'balanced', reducedMotion: true });
  assert.equal(reduced.motion.enabled, false);
  const preview = getCityDistrictVisualPreview('forge-bay', { requestedTier: 'studio' });
  assert.ok(preview.tiers.some((tier) => tier.id === 'studio' && tier.previewOnly));
  const truth = getCityVisualProgressionTruth();
  assert.equal(truth.subscriptionRead, false);
  assert.equal(truth.collectionGrantRead, false);
  assert.equal(truth.rewardRead, false);
});

test('W426 connects texture drift only to local Babylon visual surfaces and honors pause/reduced effects', () => {
  const runtime = readFileSync(new URL('../../assets/js/city/eon-city-vector-art-runtime.js', import.meta.url), 'utf8');
  const renderer = readFileSync(new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url), 'utf8');
  assert.match(runtime, /attachSubtleMotion/);
  assert.match(runtime, /texture\.vOffset/);
  assert.match(runtime, /texture\.uOffset/);
  assert.match(runtime, /playPaused|playReducedEffects/);
  assert.match(renderer, /vectorArtRuntime\.attachSubtleMotion/);
  assert.match(renderer, /getCityVisualProgressionPlan/);
  assert.doesNotMatch(runtime, /fetch\(|WebSocket|sendBeacon/);
});

test('W426 source gate passes and remains source-only', () => {
  const report = inspectW426CityMotionProgression({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /final 3D NPC\/building art/i);
});
