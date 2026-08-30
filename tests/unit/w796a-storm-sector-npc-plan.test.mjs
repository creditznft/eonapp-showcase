import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW796AStormNpcPlan, validateEonExpanseW796AStormNpcPlan } from '../../assets/js/city/w796/eon-expanse-w796a-storm-sector-npc-plan.js';

test('W796A defines three authored animated patrols with fixed routes', () => {
  const plan = createEonExpanseW796AStormNpcPlan();
  assert.equal(validateEonExpanseW796AStormNpcPlan(plan).ok, true);
  assert.deepEqual(plan.patrols.map((row) => row.id), ['storm-warden', 'atmospheric-engineer', 'rescue-scout']);
  assert.equal(plan.patrols.every((row) => row.route.length === 4), true);
  assert.equal(plan.patrols.every((row) => row.primaryAsset.animationNames.length > 0), true);
});

test('W796A uses same-origin hashed W649 primary and fallback assets', () => {
  const plan = createEonExpanseW796AStormNpcPlan();
  for (const patrol of plan.patrols) {
    assert.match(patrol.primaryAsset.primary.path, /^\/assets\/city\/w649\/primary\/characters\/.+\.[a-f0-9]{12}\.glb$/i);
    assert.match(patrol.primaryAsset.fallback.path, /^\/assets\/city\/w649\/fallback\/characters\/.+\.[a-f0-9]{12}\.glb$/i);
  }
});

test('W796A patrol briefings cannot grant XP or mutate mission state', () => {
  const plan = createEonExpanseW796AStormNpcPlan();
  assert.equal(plan.developmentCharacterProxyCount, 0);
  assert.equal(plan.rawCoordinatesAccepted, false);
  assert.equal(plan.patrols.some((row) => row.grantsXp || row.mutatesMissionState || row.automaticDialogue), false);
});
