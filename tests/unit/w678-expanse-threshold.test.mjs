import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildEonCityW678ExpanseThresholdPlan,
  getEonCityW678ExpanseThresholdTruth,
  projectEonCityW678AtlasModel
} from '../../assets/js/city/w678/eon-city-w678-expanse-threshold.js';

test('W678 makes the world visibly continue beyond the Orientation gateway', () => {
  const plan = buildEonCityW678ExpanseThresholdPlan({ quality: 'balanced' });
  assert.equal(plan.corridor.length, 4);
  assert.ok(plan.skyline.length >= 9);
  assert.equal(plan.previewOnlyUntilConfirmedEntry, true);
  assert.equal(plan.automaticEntry, false);
});

test('W678 Atlas exposes a truthful guide-only Expanse node', () => {
  const projected = projectEonCityW678AtlasModel({ nodes: [{ id: 'orientation-hall' }], links: [] });
  assert.equal(projected.nodes.at(-1).id, 'expanse-gateway');
  assert.equal(projected.nodes.at(-1).guideOnly, true);
  assert.equal(projected.links.at(-1).gateway, true);
  assert.equal(projected.automaticEntry, false);
});

test('W678 renderer and product Atlas consume the same threshold authority', () => {
  const renderer = fs.readFileSync('assets/js/city/w674/eon-city-w674-orientation-district-belt-babylon.js', 'utf8');
  const product = fs.readFileSync('assets/js/city/w659n/eon-city-w659n-product-layer.js', 'utf8');
  assert.match(renderer, /buildEonCityW678ExpanseThresholdPlan/);
  assert.match(renderer, /expansePreviewNodeCount/);
  assert.match(product, /projectEonCityW678AtlasModel/);
  assert.match(product, /data-eon-w678-guide-expanse/);
});

test('W678 does not turn the preview into automatic entry or runtime AI geometry', () => {
  const truth = getEonCityW678ExpanseThresholdTruth();
  assert.equal(truth.visibleWorldContinuationBeyondGate, true);
  assert.equal(truth.separateEntryConfirmationRequired, true);
  assert.equal(truth.automaticEntry, false);
  assert.equal(truth.runtimeAiGeometry, false);
});
