import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityLivingNexusExpanse } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import {
  buildEonCityW682ExpansePopulationPlan,
  getEonCityW682ExpansePopulationTruth,
  validateEonCityW682ExpansePopulationPlan
} from '../../assets/js/city/w682/eon-city-w682-expanse-population.js';

const expanse = buildEonCityLivingNexusExpanse({ position: { x: 0, z: 0 }, seed: 'w682-cells' });

test('W682 balanced density adds population, discoveries and street activity', () => {
  const plan = buildEonCityW682ExpansePopulationPlan({ cells: expanse.cells, seed: 'w682-test', quality: 'balanced' });
  assert.equal(validateEonCityW682ExpansePopulationPlan(plan).ok, true);
  assert.equal(plan.populationCount, 30);
  assert.equal(plan.discoveryCount, 12);
  assert.equal(plan.streetActivityCount, 16);
});

test('W682 reduces repetition with varied archetypes, activities and schedules', () => {
  const plan = buildEonCityW682ExpansePopulationPlan({ cells: expanse.cells, seed: 'w682-variety', quality: 'cinematic' });
  assert.ok(plan.archetypeVariety >= 7);
  assert.ok(plan.activityVariety >= 6);
  assert.equal(plan.uniqueScheduleCount, plan.populationCount);
  assert.equal(plan.adjacentArchetypeRepeats, 0);
  assert.ok(plan.repetitionScore >= 0.95);
});

test('W682 remains deterministic and reduced motion stops ambient routes', () => {
  const first = buildEonCityW682ExpansePopulationPlan({ cells: expanse.cells, seed: 'w682-repeat', quality: 'lite', reducedMotion: true });
  const second = buildEonCityW682ExpansePopulationPlan({ cells: expanse.cells, seed: 'w682-repeat', quality: 'lite', reducedMotion: true });
  assert.deepEqual(first.population, second.population);
  assert.ok(first.population.every((entry) => entry.speed === 0));
  assert.ok(first.discoveries.every((entry) => entry.reviewFirst && !entry.automaticOpen));
});

test('W682 discoveries are real review-first picks in the canonical renderer', () => {
  const runtime = fs.readFileSync('assets/js/city/eon-city-living-nexus-babylon-runtime.js', 'utf8');
  const product = fs.readFileSync('assets/js/city/w659n/eon-city-w659n-product-layer.js', 'utf8');
  assert.match(runtime, /buildEonCityW682ExpansePopulationPlan/);
  assert.match(runtime, /interactionKind: 'expanse-landmark'/);
  assert.match(runtime, /w682-expanse-ambient-population/);
  assert.match(product, /metadata\.interactionKind === 'expanse-landmark'/);
  const truth = getEonCityW682ExpansePopulationTruth();
  assert.equal(truth.autonomousAgents, false);
  assert.equal(truth.ownsRenderLoop, false);
});
