import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS,
  EON_EXPANSE_W766_ZONES
} from '../../assets/js/city/w766/eon-expanse-w766-region-contract.js';
import { getEonCityW649WorldAsset } from '../../assets/js/city/w649/eon-city-w649-world-manifest.js';

const heroSource = fs.readFileSync('assets/js/city/w766/eon-expanse-w766b-hero-assets.js', 'utf8');

test('W766I gives every authored Signal Frontier zone a verified W649 hero landmark', () => {
  const authoredZoneIds = EON_EXPANSE_W766_ZONES.map((zone) => zone.id);
  for (const zoneId of authoredZoneIds) {
    const placements = EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS.filter((placement) => placement.zoneId === zoneId);
    assert.ok(placements.length >= 2, `${zoneId} should have a hero plus authored supporting architecture`);
    for (const placement of placements) {
      const asset = getEonCityW649WorldAsset(placement.assetId);
      assert.ok(asset, `${placement.assetId} should exist in W649`);
      assert.match(asset.variants.primary.path, /^\/assets\/city\/w649\/primary\/world\/.+\.[a-f0-9]{12}\.glb$/i);
      assert.match(asset.variants.fallback.path, /^\/assets\/city\/w649\/fallback\/world\/.+\.[a-f0-9]{12}\.glb$/i);
    }
  }
  assert.ok(EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS.some((placement) => placement.zoneId === 'beacon-fields' && placement.assetId === 'eoncity-ai-tower-core'));
  for (const zoneId of authoredZoneIds) {
    const zonePlacements = EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS.filter((placement) => placement.zoneId === zoneId);
    assert.equal(zonePlacements.filter((placement) => placement.presentationRole === 'hero').length, 1, `${zoneId} should keep one primary hero owner`);
    assert.ok(zonePlacements.some((placement) => ['secondary-architecture', 'functional-landmark'].includes(placement.presentationRole)), `${zoneId} should have authored support`);
  }
});

test('W766I preserves route-light quality while limiting Balanced duplicate geometry', () => {
  assert.match(heroSource, /const lampStride = resolvedQuality === 'cinematic' \? 2 : 3/);
  assert.match(heroSource, /zoneId: 'signal-frontier-route'/);
  assert.match(heroSource, /zoneId: entry\.zoneId/);
});
