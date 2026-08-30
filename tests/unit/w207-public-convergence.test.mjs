import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('W207 root is a Chat-first entry without legacy product identities', () => {
  const html = read('index.html');
  assert.match(html, /data-eon-app-shell="1"/);
  assert.match(html, /Ask EONBOT/);
  assert.doesNotMatch(html, /AI Cockpit|NFT Exchange|Pool Points|RealmWorld|EON Team Store/);
});

test('W207 Chat advertises the clean canonical route and removes duplicate raw navigation', () => {
  const html = read('chat.html');
  assert.match(html, /href="https:\/\/eonapp\.ch\/chat"/);
  assert.doesNotMatch(html, /NFT Exchange|AI Cockpit/);
  assert.doesNotMatch(html, /<header class="site-header">/);
  assert.doesNotMatch(html, /<footer class="site-footer">/);
});

test('W207 deploy redirects have one identical source and no legacy 200 override', () => {
  const redirects = read('_redirects');
  assert.equal(read('public/_redirects'), redirects);
  for (const [from, to] of [
    ['/workbench.html', '/workspace'],
    ['/marketplace.html', '/create'],
    ['/realmworld.html', '/eoncity'],
    ['/signal.html', '/insights']
  ]) {
    assert.match(redirects, new RegExp(`${from.replace('.', '\\.') } ${to.replace('/', '\\/')} 301`));
    assert.doesNotMatch(redirects, new RegExp(`${from.replace('.', '\\.') } ${from.replace('/', '\\/')} 200`));
  }
});


test('W207 static audit understands canonical clean routes and profile has no missing advanced pages', () => {
  const audit = read('scripts/site-audit.mjs');
  const profile = read('profile.html');
  assert.match(audit, /createStaticRouteFileMap/);
  assert.match(audit, /ROUTE_ALIASES = createStaticRouteFileMap\(\)/);
  assert.match(audit, /publicTarget = path\.join\(ROOT, 'public', rootRelative\)/);
  assert.doesNotMatch(profile, /vault-identity\.html|vault-backup\.html/);
});
