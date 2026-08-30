import test from 'node:test';
import assert from 'node:assert/strict';
import { EON_EXPANSE_W766D_ROUTE_GRAPHS, sampleEonExpanseW766DRoutePosition, validateEonExpanseW766DRouteGraph, validateEonExpanseW766DRouteRegistry } from '../../assets/js/city/w766/eon-expanse-w766d-route-validator.js';

test('all named NPC route graphs pass bounded validation', () => {
  const result = validateEonExpanseW766DRouteRegistry();
  assert.equal(result.ok, true);
  assert.equal(result.routeCount, 3);
});

test('route validation rejects blocked points and unsafe jumps', () => {
  const result = validateEonExpanseW766DRouteGraph({ id: 'bad', npcId: 'bad-npc', loop: false, points: [{ x: 0, z: 0 }, { x: 100, z: 0 }] }, { blockers: [{ id: 'tower', x: 0, z: 0, radius: 2 }] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('inside-blocker')));
  assert.ok(result.errors.some((error) => error.includes('too-long')));
});

test('route sampling is deterministic and finite', () => {
  const route = EON_EXPANSE_W766D_ROUTE_GRAPHS[0];
  assert.deepEqual(sampleEonExpanseW766DRoutePosition(route, 9.5), sampleEonExpanseW766DRoutePosition(route, 9.5));
  assert.equal(Number.isFinite(sampleEonExpanseW766DRoutePosition(route, 9.5).heading), true);
});
