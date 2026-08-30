import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { PRIMARY_APP_ROUTES } from '../../config/route-contract.mjs';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('W385 gives Apps a real local EON Forge quick-build destination', () => {
  assert.equal(existsSync(new URL('../../forge.html', import.meta.url)), true);
  const route = PRIMARY_APP_ROUTES.find((entry) => entry.from === '/forge');
  assert.equal(route?.file, 'forge.html');
  assert.equal(route?.lifecycle, 'local-first-builder');

  const html = read('forge.html');
  const forge = read('assets/js/forge/eon-forge-quick-build.js');
  const css = read('assets/css/eon-forge.css');
  const apps = read('assets/js/apps/eon-apps-hub.js');
  assert.match(html, /data-eon-forge="w(?:38[5-7]|648)"/);
  assert.match(html, /eon-forge-quick-build\.js/);
  assert.match(html, /eon-forge\.css/);
  assert.match(apps, /href: '\/forge'/);
  assert.match(forge, /eon:forge:projects:v1/);
  assert.match(forge, /sandbox="allow-scripts"/);
  assert.match(forge, /local-browser-only/);
  assert.match(forge, /delivery: 'manual export only'/);
  assert.match(forge, /containsLikelySecret/);
  assert.doesNotMatch(forge, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon/);
  assert.match(css, /var\(--clr-text\)/);
  assert.match(css, /@media \(max-width:(620|650)px\)/);
});
