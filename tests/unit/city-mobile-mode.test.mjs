import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_MOBILE_MODE_SCHEMA, getCityMobileMode, subscribeCityMobileMode } from '../../assets/js/city/eon-city-mobile-mode.js';

test('CITY-MOBILE keeps portrait phones in the canonical playable Babylon City', () => {
  const mode = getCityMobileMode({ isMobile: true, width: 390, height: 844 });
  assert.equal(mode.schema, EON_CITY_MOBILE_MODE_SCHEMA);
  assert.equal(mode.mode, 'portrait-explore');
  assert.equal(mode.startsBabylonAutomatically, true);
  assert.equal(mode.label, 'Portrait Explore');
});

test('CITY-MOBILE keeps landscape exploration and desktop City distinct', () => {
  assert.equal(getCityMobileMode({ isMobile: true, width: 844, height: 390 }).mode, 'landscape-explore');
  assert.equal(getCityMobileMode({ isMobile: false, width: 390, height: 844 }).mode, 'desktop');
});

test('CITY-MOBILE observer reports a real orientation change and cleans up listeners', () => {
  const listeners = new Map();
  const environment = {
    innerWidth: 390,
    innerHeight: 844,
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name)
  };
  const seen = [];
  const dispose = subscribeCityMobileMode({ environment, isMobile: true, onChange: (mode) => seen.push(mode.mode) });
  environment.innerWidth = 844;
  environment.innerHeight = 390;
  listeners.get('resize')();
  assert.deepEqual(seen, ['landscape-explore']);
  dispose();
  assert.equal(listeners.size, 0);
});
