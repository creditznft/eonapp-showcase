import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function installBrowserGlobals() {
  const store = new Map();
  const previousStorage = globalThis.localStorage;
  const previousWindow = globalThis.window;
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index) => Array.from(store.keys())[index] || null,
    get length() { return store.size; }
  };
  globalThis.window = globalThis;
  return {
    store,
    restore() {
      if (previousStorage === undefined) delete globalThis.localStorage;
      else globalThis.localStorage = previousStorage;
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
  };
}

test('W138 private local preview save writes a visible local Vault v3 copy and receipt', async () => {
  const env = installBrowserGlobals();
  try {
    const mod = await import(`../../assets/js/market/market-private-drop.js?w138=${Date.now()}`);
    const drop = mod.getPrivateMarketDrop({ regenerate: true, count: 4 });
    const target = drop.items[0];
    const saved = mod.savePrivateMarketDropItemToVault(target.id);
    assert.equal(saved.ok, true);
    assert.equal(saved.receipt.schema, 'eon.market.private-drop-vault-receipt.v3');
    assert.equal(saved.receipt.state, 'Saved Local Preview');
    assert.equal(saved.receipt.vaultRoute, '/vault#nft-collection');

    const v3 = JSON.parse(env.store.get('eon:nft-collection:v3'));
    assert.ok(Array.isArray(v3[target.id]));
    assert.equal(v3[target.id][0].id, target.id);
    assert.equal(v3[target.id][0].nftId, target.id);
    assert.equal(v3[target.id][0].name, target.title);
    assert.equal(v3[target.id][0].title, target.title);
    assert.equal(v3[target.id][0].source, 'market-private-drop-v3');
    assert.equal(v3[target.id][0].userFacingState, 'Saved Local Preview');
    assert.equal(v3[target.id][0].mintState, 'not-minted');
  } finally {
    env.restore();
  }
});

test('W138 local preview save is visible through the Vault collection normalizer', async () => {
  const env = installBrowserGlobals();
  try {
    const market = await import(`../../assets/js/market/market-private-drop.js?w138vault=${Date.now()}`);
    const target = market.getPrivateMarketDrop({ regenerate: true, count: 4 }).items[0];
    market.savePrivateMarketDropItemToVault(target.id);
    const collection = await import(`../../assets/js/utils/nft-collection.js?w138=${Date.now()}`);
    const visible = collection.getCollection().find((item) => item.nftId === target.id);
    assert.ok(visible, 'local preview should be visible through getCollection()');
    assert.equal(visible.id, target.id);
    assert.equal(visible.name, target.title);
    assert.equal(visible.source, 'market-private-drop-v3');
  } finally {
    env.restore();
  }
});

test('W138 public Market keeps official commerce disabled and no prefilled starter cards', () => {
  const marketHtml = read('market.html');
  const marketPage = read('assets/js/market/eon-market-page.js');
  assert.equal((marketHtml.match(/data-w131-prehydrated-starter=/g) || []).length, 0);
  assert.match(marketPage, /Official commerce is not active/);
  assert.match(marketPage, /no user marketplace, purchase path, commission, payout, token, or trading surface/);
  assert.match(marketPage, /href="\/vault#nft-collection"/);
  assert.doesNotMatch(marketHtml, /market-page-bootstrap\.js|assets\/js\/market-page\.js/);
});

test('W138 quality gate reports the current local-preview proof', () => {
  const statsPath = path.join(root, 'tmp', 'w138-market-nft-generation-proof-stats.json');
  execFileSync(process.execPath, [path.join(root, 'scripts', 'w138-market-nft-generation-proof-gate.mjs')], { cwd: root, stdio: 'ignore' });
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, 'eonapp.w138.market-local-preview-proof.v2');
  assert.equal(stats.supersededBy, 'W220 explicit local generation vertical slice');
  assert.equal(stats.score, 100);
  assert.equal(stats.ok, true);
  assert.equal(stats.prehydratedCards, 0);
});
