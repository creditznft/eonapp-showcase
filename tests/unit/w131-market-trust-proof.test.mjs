import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function installStorage() {
  const store = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); }
  };
  return () => {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  };
}

test('W131 Market trust starts empty and makes generation explicitly local', () => {
  const market = read('market.html');
  const page = read('assets/js/market/eon-market-page.js');
  const css = read('assets/css/eon-market-v2.css');
  assert.equal((market.match(/data-w131-prehydrated-starter=/g) || []).length, 0);
  assert.match(market, /Opening the private Market/);
  assert.match(page, /Create 4 original local previews/);
  assert.match(page, /Generate 4 originals/);
  assert.match(page, /Official commerce is not active/);
  assert.match(page, /function runProgressiveReveal/);
  assert.match(css, /\.eon-market-empty/);
  assert.match(css, /\.eon-market-card\.is-revealing/);
  assert.doesNotMatch(market, /market-page-bootstrap\.js|assets\/js\/market-page\.js/);
  assert.doesNotMatch(page, /ensureMarketStarterDrop/);
});

test('W131 generated local previews remain local-only and can create a truthful Vault record', async () => {
  const restore = installStorage();
  try {
    const mod = await import(`../../assets/js/market/market-private-drop.js?w131=${Date.now()}`);
    assert.equal(mod.readPrivateMarketDrop(), null);
    const drop = mod.getPrivateMarketDrop({ regenerate: true, count: 4 });
    assert.equal(drop.items.length, 4);
    assert.equal(drop.policy.localOnly, true);
    assert.equal(drop.policy.notFinancialProduct, true);
    assert.equal(drop.policy.publicListingAvailable, false);
    const saved = mod.savePrivateMarketDropItemToVault(drop.items[0].id);
    assert.equal(saved.ok, true);
    assert.equal(saved.receipt.state, 'Saved Local Preview');
  } finally {
    restore();
  }
});

test('W131 quality gate reports the current explicit-generation contract', () => {
  const statsPath = path.join(root, 'tmp', 'w131-market-trust-proof-stats.json');
  execFileSync(process.execPath, [path.join(root, 'scripts', 'w131-market-trust-proof-gate.mjs')], { cwd: root, stdio: 'ignore' });
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, 'eonapp.w131.market-trust-proof.v2');
  assert.equal(stats.supersededBy, 'W220 explicit local generation vertical slice');
  assert.equal(stats.score, 100);
  assert.equal(stats.ok, true);
  assert.equal(stats.prehydratedCards, 0);
});
