import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { A15_BUILD_HTML_ENTRY_FILES } from '../../config/a15-current-product-authority.mjs';
import { EON_CITY_W731_STATIONS, EON_CITY_W737_DISCOVERIES } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { EON_CITY_W763_MENU_ORDER } from '../../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js';

const runtime = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const accessibility = readFileSync(new URL('../../assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js', import.meta.url), 'utf8');

function featuredHandlerSource() {
  return runtime.match(/const openWorld = event\.target\.closest\('\[data-eon-city-menu-open-world\]'\);\s*if \(openWorld\) \{([\s\S]*?)\n\s*\}/)?.[1] || '';
}

test('A15 C03 presents Signal Frontier as the first flagship City destination', () => {
  const signal = runtime.indexOf('data-eon-city-featured="signal-frontier"');
  const storm = runtime.indexOf('data-eon-city-featured="storm-sector"');
  assert.equal(signal >= 0, true);
  assert.equal(signal < storm, true);
  assert.match(runtime, /<strong>Signal Frontier<\/strong>/);
  assert.match(runtime, /data-eon-city-menu-open-world>Open Signal Frontier/);
  assert.match(runtime, /eonCityRuntimeLauncher = 'l95'/);
  assert.deepEqual(EON_CITY_W763_MENU_ORDER, ['Living Nexus', 'Mission Board', 'Live Monitors', 'Share Command Center', 'Creator Capture', 'Plans & Access', 'Accessible Map']);
});

test('A15 C03 flagship action cannot bypass explicit entry review', () => {
  const handler = featuredHandlerSource();
  assert.match(handler, /openExpanseReview\(trigger\)/);
  assert.doesNotMatch(handler, /enterExpanseFromReview|onEnterExpanse/);
  assert.match(runtime, /Enter Open World — Signal Frontier\?/);
  assert.match(runtime, /data-eon-city-expanse-enter>Enter Signal Frontier/);
  assert.match(runtime, /data-eon-city-expanse-cancel>Cancel/);
  assert.match(runtime, /Nothing opens until you explicitly confirm/);
});

test('A15 C03 preserves one physical Expanse Gate and creates no second route', () => {
  const gates = EON_CITY_W737_DISCOVERIES.filter((record) => record.id === 'expanse-gate' && record.label === 'Expanse Gate');
  assert.equal(gates.length, 1);
  assert.equal(EON_CITY_W731_STATIONS.some((record) => record.id === 'expanse-gate'), false);
  assert.deepEqual(A15_BUILD_HTML_ENTRY_FILES.filter((file) => /expanse|signal-frontier|open-world/i.test(file)), []);
  assert.match(accessibility, /Open World — Signal Frontier is entered through the physical Expanse Gate/);
});
