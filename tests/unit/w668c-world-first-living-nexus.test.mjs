import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { getEonCityLivingNexusSnapshot } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';

function source(path) { return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'); }

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)) };
}

test('W668C keeps the world choice simple while retaining the infinite Expanse truth', () => {
  const snapshot = getEonCityLivingNexusSnapshot({ storage: memoryStorage(), position: { x: 25, z: -17 }, seed: 'owner-world' });
  assert.equal(snapshot.destinations.length, 3);
  assert.equal(snapshot.expanse.visibleCellCount, 25);
  assert.equal(snapshot.expanse.interactiveCellCount, 9);
  assert.equal(snapshot.expanse.horizonCellCount, 16);
  assert.equal(snapshot.expanse.practicallyInfinite, true);
  assert.equal(snapshot.autoNavigation, false);
  assert.equal(snapshot.automaticExecution, false);
});

test('W668C panel presents one world-first journey and moves technical controls behind optional details', () => {
  const panel = source('assets/js/city/eon-city-living-nexus-panel.js');
  assert.match(panel, /ONE WORLD · ONE CLEAR CHOICE/);
  assert.match(panel, /effectively endless seeded world/);
  assert.match(panel, /eon-play-living-nexus-portal/);
  assert.match(panel, /World map, Atlas and advanced controls/);
  assert.match(panel, /<details class="eon-play-living-nexus-advanced">/);
  assert.match(panel, /filter\(\(entry\) => entry\.interactive !== false\)/);
  assert.match(panel, /data-eon-living-enter-destination/);
  assert.match(panel, /Selection and travel are separate visible actions/);
  assert.doesNotMatch(panel, /W660P–W661E · Living Nexus/);
});

test('W668C CSS makes the portal and primary choice dominant while preserving reduced motion', () => {
  const css = source('assets/css/eon-city-play.css');
  const section = css.split('/* W668C')[1] || '';
  assert.match(section, /eon-play-living-nexus-journey/);
  assert.match(section, /eon-play-living-nexus-portal/);
  assert.match(section, /eon-play-living-nexus-advanced/);
  assert.match(section, /prefers-reduced-motion/);
  assert.match(section, /grid-column: 1 \/ -1/);
});
