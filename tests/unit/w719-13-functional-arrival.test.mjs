import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_W659F_DESTINATIONS } from '../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';
import { EON_CITY_W660I_TERMINALS, getNearestEonCityW660iTerminal } from '../../assets/js/city/w660i/eon-city-w660i-terminal-registry.js';
import { resolveEonCityW719FunctionalArrival } from '../../assets/js/city/w719/eon-city-w719-functional-arrival.js';
import { buildEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';
import { projectEonCityW719CoreWorldAuthority } from '../../assets/js/city/w719/eon-city-w719-core-world-authority.js';

test('W719.13 every reviewed district arrival lands inside a functional terminal radius', () => {
  for (const destination of EON_CITY_W659F_DESTINATIONS) {
    const result = resolveEonCityW719FunctionalArrival({ destination, terminals: EON_CITY_W660I_TERMINALS });
    assert.equal(result.ok, true, destination.id);
    assert.equal(result.interactionReady, true, destination.id);
    const nearest = getNearestEonCityW660iTerminal(result.destination, destination.id);
    assert.ok(nearest, destination.id);
    assert.ok(nearest.distance <= nearest.entry.interactionRadius, `${destination.id}: ${nearest.distance} > ${nearest.entry.interactionRadius}`);
  }
});

test('W719.13 first Orientation Hall arrival is immediately usable at Start Here', () => {
  const authority = projectEonCityW719CoreWorldAuthority(buildEonCityConnectedCorePlan({ quality: 'balanced' }));
  const nearest = getNearestEonCityW660iTerminal(authority.arrival, 'orientation-hall');
  assert.equal(nearest.entry.id, 'start-here-terminal');
  assert.ok(nearest.distance <= nearest.entry.interactionRadius);
});
