import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_CANONICAL_PATH, canonicalizeCityLocation, getCanonicalCityUrl } from '../../assets/js/city/eon-city-route-canonicalizer.js';

test('CITY-ROUTE strips legacy City fragment while preserving supported query parameters', () => {
  const result = getCanonicalCityUrl('https://eonapp.ch/realm?mission=arrival#my-realm-3d');
  assert.equal(result.url.pathname, EON_CITY_CANONICAL_PATH);
  assert.equal(result.url.search, '?mission=arrival');
  assert.equal(result.url.hash, '');
  assert.equal(result.changed, true);
});

test('CITY-ROUTE makes a clean replaceState update only when City URL is stale', () => {
  const writes = [];
  const location = { href: 'https://eonapp.ch/eoncity#legacy-city', origin: 'https://eonapp.ch' };
  const history = { state: { safe: true }, replaceState: (...args) => writes.push(args) };
  const result = canonicalizeCityLocation(location, history);
  assert.equal(result.changed, true);
  assert.equal(result.target, '/eoncity');
  assert.deepEqual(writes, [[{ safe: true }, '', '/eoncity']]);
});

test('CITY-ROUTE leaves unrelated pages untouched', () => {
  const result = getCanonicalCityUrl('https://eonapp.ch/chat#draft');
  assert.equal(result.changed, false);
  assert.equal(result.url.pathname, '/chat');
  assert.equal(result.url.hash, '#draft');
});


test('CITY-ROUTE repairs physical City and Realm document aliases without dropping a supported query', () => {
  for (const href of ['https://eonapp.ch/eoncity.html?mission=arrival#old', 'https://eonapp.ch/realm.html?mission=arrival#my-realm-3d']) {
    const result = getCanonicalCityUrl(href);
    assert.equal(result.url.pathname, EON_CITY_CANONICAL_PATH);
    assert.equal(result.url.search, '?mission=arrival');
    assert.equal(result.url.hash, '');
    assert.equal(result.changed, true);
  }
});
