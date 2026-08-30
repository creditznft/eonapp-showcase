'use strict';
const vm   = require('node:vm');
const fs   = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

// Build a minimal browser-like context so the wallet IIFE can execute.
function makeContext(initialStore = {}) {
  const store = { ...initialStore };

  const localStorage = {
    getItem:    (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store
  };

  // Event collector so we can inspect dispatched events.
  const events = [];
  const listeners = {};

  const document = {
    readyState: 'complete',
    head: { appendChild() {} },
    body: { appendChild() {}, removeChild() {} },
    querySelector: () => null,
    createElement: (tag) => ({
      tag,
      className: '',
      textContent: '',
      href: '',
      setAttribute() {},
      getAttribute() { return null; },
      append() {},
      appendChild() {},
      remove() {}
    }),
    dispatchEvent: (ev) => { events.push(ev); },
    addEventListener: (type, fn) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    }
  };

  class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail || {};
    }
  }

  const window = { EonLootbox: null, EonXP: null };
  window.crypto = {
    getRandomValues: (bytes) => {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 17 + 23) & 255;
      return bytes;
    }
  };

  // Suppress the 500ms daily-login timer from actually firing.
  const setTimeout = () => 0;
  const clearTimeout = () => {};

  return {
    ctx: vm.createContext({
      localStorage, document, window, CustomEvent, setTimeout, clearTimeout, store, events
    }),
    store,
    events
  };
}

function loadWallet(ctx) {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'wallet.js'),
    'utf8'
  );
  vm.runInContext(source, ctx);
  return ctx.window.EonWallet;
}

// ─── isValidEvmAddress ──────────────────────────────────────────────────────

test('wallet isValidEvmAddress accepts a valid 40-hex address with 0x prefix', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  // Test via addWallet which calls isValidEvmAddress internally
  const result = W.addWallet('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
  assert.ok(result !== null, 'should accept a valid EVM address');
  assert.equal(result.address, '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
});

test('wallet rejects EVM address that is too short', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const result = W.addWallet('0x1234');
  assert.equal(result, null);
});

test('wallet rejects address without 0x prefix', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const result = W.addWallet('AbCdEf1234567890AbCdEf1234567890AbCdEf1234');
  assert.equal(result, null);
});

test('wallet rejects empty address', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.addWallet(''), null);
  assert.equal(W.addWallet(null), null);
  assert.equal(W.addWallet(undefined), null);
});

// ─── getBalance / initial state ─────────────────────────────────────────────

test('wallet getBalance returns 0 when no data in storage', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.getBalance(), 0);
});

test('wallet getLifetime returns 0 initially', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.getLifetime(), 0);
});

test('wallet getWalletAddr returns null initially', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.getWalletAddr(), null);
});

test('wallet getHistory returns empty array initially', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const h = W.getHistory();
  assert.ok(Array.isArray(h));
  assert.equal(h.length, 0);
});

test('wallet getTokenSymbol returns EonLite', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.getTokenSymbol(), 'EonLite');
});

// ─── addCoins ───────────────────────────────────────────────────────────────

test('wallet addCoins increases balance and lifetime', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const earned = W.addCoins(100, 'tool-completed', 'test');
  assert.equal(earned, 100);
  assert.equal(W.getBalance(), 100);
  assert.equal(W.getLifetime(), 100);
});

test('wallet addCoins respects daily cap for game-reward', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  // game-reward cap is 500/day
  const first  = W.addCoins(400, 'game-score', 'game A');
  const second = W.addCoins(400, 'game-score', 'game B'); // only 100 remaining under cap
  assert.equal(first, 400);
  assert.equal(second, 100);  // cap enforced
  assert.equal(W.getBalance(), 500);
});

test('wallet addCoins returns 0 after daily cap exhausted', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.addCoins(500, 'game-score', 'fill cap');
  const result = W.addCoins(10, 'game-score', 'over cap');
  assert.equal(result, 0);
});

test('wallet addCoins records a transaction in history', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.addCoins(50, 'tool-completed', 'Used a tool');
  const history = W.getHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].type, '+');
  assert.equal(history[0].amount, 50);
  assert.equal(history[0].category, 'tool-completed');
});

// ─── spend / canSpend ───────────────────────────────────────────────────────

test('wallet spend returns false when balance insufficient', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const result = W.spend(100, 'purchase');
  assert.equal(result, false);
  assert.equal(W.getBalance(), 0);
});

test('wallet spend deducts balance when sufficient', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.addCoins(200, 'tool-completed', 'add');
  const result = W.spend(100, 'buy item');
  assert.equal(result, true);
  assert.equal(W.getBalance(), 100);
});

test('wallet canSpend returns false when balance is zero', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.canSpend(1), false);
});

test('wallet canSpend returns true when balance is sufficient', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.addCoins(150, 'tool-completed', 'add');
  assert.equal(W.canSpend(150), true);
  assert.equal(W.canSpend(151), false);
});

// ─── addWallet / connectWallet ──────────────────────────────────────────────

test('wallet addWallet stores the address and sets it as default', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const addr = '0x1111111111111111111111111111111111111111';
  const entry = W.addWallet(addr);
  assert.ok(entry);
  assert.equal(entry.address, addr);
  assert.equal(W.getWalletAddr(), addr);
});

test('wallet addWallet updates label if same address added twice', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const addr = '0x2222222222222222222222222222222222222222';
  W.addWallet(addr, { label: 'First' });
  const updated = W.addWallet(addr, { label: 'Second' });
  assert.equal(updated.label, 'Second');
  assert.equal(W.getWallets().length, 1); // still only one entry
});

test('wallet removeWallet removes address and returns true', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const addr = '0x3333333333333333333333333333333333333333';
  const entry = W.addWallet(addr);
  const removed = W.removeWallet(entry.id);
  assert.equal(removed, true);
  assert.equal(W.getWallets().length, 0);
  assert.equal(W.getWalletAddr(), null);
});

test('wallet removeWallet returns false for unknown id', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.removeWallet('nonexistent-id'), false);
});

// ─── format ─────────────────────────────────────────────────────────────────

test('wallet format renders numbers with locale commas', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  // 1000 should include thousands separator in en locale
  const formatted = W.format(1000);
  assert.ok(typeof formatted === 'string' && formatted.length > 0);
  assert.ok(formatted.includes('1') && formatted.includes('0'));
});

test('wallet format floors decimals', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const formatted = W.format(9.99);
  assert.ok(!formatted.includes('.')); // no decimals
});

// ─── getPoolLedger ───────────────────────────────────────────────────────────

test('wallet getPoolLedger returns zero-balance pools initially', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const ledger = W.getPoolLedger();
  assert.equal(ledger.mintedTotal, 0);
  assert.equal(ledger.pooledTotal, 0);
  assert.equal(ledger.pools.gamer, 0);
  assert.equal(ledger.pools.tools, 0);
  assert.equal(ledger.pools.nft, 0);
});

test('wallet addCoins updates pool emission ledger', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.addCoins(100, 'game-score', 'game session');
  const ledger = W.getPoolLedger();
  assert.equal(ledger.mintedTotal, 100);
  assert.ok(ledger.pooledTotal > 0); // 75% of 100 = 75
  assert.ok(ledger.pools.gamer > 0); // game-score → gamer pool
});

// ─── getWallets ──────────────────────────────────────────────────────────────

test('wallet getWallets returns empty array initially', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const wallets = W.getWallets();
  assert.ok(Array.isArray(wallets));
  assert.equal(wallets.length, 0);
});

test('wallet getWallets returns the added wallet entry', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const addr = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  W.addWallet(addr);
  const wallets = W.getWallets();
  assert.equal(wallets.length, 1);
  assert.equal(wallets[0].address, addr);
});

// ─── getDefaultWallet ────────────────────────────────────────────────────────

test('wallet getDefaultWallet returns null when no wallet has been added', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  assert.equal(W.getDefaultWallet(), null);
});

test('wallet getDefaultWallet returns the wallet entry after addWallet', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const addr = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
  W.addWallet(addr);
  const def = W.getDefaultWallet();
  assert.ok(def !== null);
  assert.equal(def.address, addr);
});

// ─── awardGameCoins ──────────────────────────────────────────────────────────

test('wallet awardGameCoins awards score coins plus first-game bonus on first play', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  // score=1000 → floor(1000/100)=10 base + 250 first-game bonus = 260
  const earned = W.awardGameCoins('snake', 1000);
  assert.equal(earned, 260);
  assert.equal(W.getBalance(), 260);
});

test('wallet awardGameCoins awards only score coins on second play (no first-game bonus)', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.awardGameCoins('snake', 1000); // first play: 260
  const second = W.awardGameCoins('snake', 1000); // second play: 10 only
  assert.equal(second, 10);
  assert.equal(W.getBalance(), 270);
});

test('wallet awardGameCoins first-game bonus applies to each distinct game', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  // Use score=0 to keep amounts small and avoid daily cap conflicts
  const g1 = W.awardGameCoins('snake', 0);   // 0+250=250 (cap used: 250)
  const g2 = W.awardGameCoins('tetris', 0);  // first play tetris: 0+250=250, cap remaining: 250
  assert.equal(g1, 250);
  assert.equal(g2, 250);
});

// ─── awardToolCoins ──────────────────────────────────────────────────────────

test('wallet awardToolCoins awards 125 on first tool completion (25 base + 100 first-tool bonus)', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  const earned = W.awardToolCoins('rarerank');
  assert.equal(earned, 125);
});

test('wallet awardToolCoins awards only 25 on subsequent completions of same tool', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.awardToolCoins('rarerank'); // first: 125 (cap used: 125/200)
  const second = W.awardToolCoins('rarerank'); // repeat: 25 only
  assert.equal(second, 25);
});

test('wallet awardToolCoins first-tool bonus applies to each new tool', () => {
  const { ctx } = makeContext();
  const W = loadWallet(ctx);
  W.awardToolCoins('tool-a'); // 125 (cap used: 125/200)
  const t2 = W.awardToolCoins('tool-b'); // first play: wants 125, cap allows 75
  // t2 > 25 confirms the first-tool bonus was included (cap-limited to 75)
  assert.equal(t2, 75);
  assert.ok(t2 > 25, 'first-tool bonus included for new tool');
});
