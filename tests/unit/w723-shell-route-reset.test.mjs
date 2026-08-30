import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EONAPP_COMPACT_PRIMARY_NAVIGATION, EONAPP_COMPACT_MORE_TOOLS, resolveEonShellPage } from '../../assets/js/shell/eon-shell-navigation.js';
import { getRouteRow } from '../../config/route-contract.mjs';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W723 exposes the approved beginner-first sidebar and useful utilities', () => {
  assert.deepEqual(EONAPP_COMPACT_PRIMARY_NAVIGATION.map((entry) => entry.label), ['EONBOT', 'Create', 'Projects', 'Library', 'EON City']);
  assert.deepEqual(EONAPP_COMPACT_MORE_TOOLS.map((entry) => entry.label), ['Search', 'Automations', 'Local AI', 'Research']);
  assert.equal(resolveEonShellPage({ pathname: '/automations' }), 'automations');
  assert.equal(resolveEonShellPage({ pathname: '/local-ai' }), 'local-ai');
  assert.equal(resolveEonShellPage({ pathname: '/insights' }), 'insights');
});

test('W723 removes Realm from main navigation and consolidates profile utilities', () => {
  const navigation = read('assets/js/shell/eon-shell-navigation.js');
  const shell = read('assets/js/eon-app-shell.js');
  const primaryBlock = navigation.slice(navigation.indexOf('EONAPP_COMPACT_PRIMARY_NAVIGATION'), navigation.indexOf('EONAPP_COMPACT_MORE_TOOLS'));
  assert.doesNotMatch(primaryBlock, /Realm/);
  for (const label of ['Account', 'Settings', 'Appearance', 'Providers', 'Data &amp; backup', 'Billing &amp; plan', 'Help', 'Sign out']) assert.match(shell, new RegExp(label.replace('&amp;', '&amp;')));
  assert.doesNotMatch(shell, /More EONAPP destinations/);
});

test('W723 converges Support onto Help and places Billing in the app shell', () => {
  assert.deepEqual(getRouteRow('/support'), { id: 'support-compatibility', from: '/support', to: '/help', status: 301, file: 'support.html', lifecycle: 'compatibility' });
  const support = read('support.html');
  const help = read('help.html');
  const billing = read('billing.html');
  assert.match(support, /location\.replace\('\/help'/);
  assert.doesNotMatch(help, /href="\/support"/);
  assert.match(billing, /data-eon-app-shell="1"/);
  assert.match(billing, /\/assets\/js\/eon-app-shell\.js/);
  assert.doesNotMatch(billing, /eon-nexus-page-bootstrap/);
});
