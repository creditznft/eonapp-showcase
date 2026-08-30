'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function makeContext(initialStore = {}) {
  const store = { ...initialStore };
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store
  };
  const listeners = {};
  const document = {
    querySelector: () => null,
    querySelectorAll: () => ({ forEach: () => {} }),
    createElement: () => ({
      href: '',
      className: '',
      textContent: '',
      title: '',
      setAttribute: () => {},
      classList: { remove: () => {}, add: () => {} },
      appendChild: () => {},
      closest: () => null,
      append: () => {},
      offsetWidth: 0,
      style: {}
    }),
    addEventListener: (event, cb) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    },
    dispatchEvent: (e) => {
      const handlers = listeners[e.type] || [];
      handlers.forEach((h) => h(e));
    },
    readyState: 'complete'
  };
  const CustomEvent = class {
    constructor(type, opts = {}) { this.type = type; this.detail = opts.detail || {}; }
  };
  const URLSearchParams = class {
    constructor() { this.map = {}; }
    get() { return null; }
  };
  const window = {
    location: { search: '', href: 'https://eonapp.ch/', origin: 'https://eonapp.ch' },
    EonCredits: null
  };
  const atob = (s) => Buffer.from(s, 'base64').toString('utf8');
  const btoa = (s) => Buffer.from(s, 'utf8').toString('base64');
  return vm.createContext({
    localStorage, document, window, CustomEvent, URLSearchParams, atob, btoa, store,
    parseInt, parseFloat, JSON, Date, Math, String, Array, Object, Boolean, Number
  });
}

function loadCredits(ctx) {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'credits.js'),
    'utf8'
  );
  const compat = source.replace(/^export \{\};?$/gm, '');
  vm.runInContext(compat, ctx);
  return ctx.window.EonCredits;
}

// ─── get / add ──────────────────────────────────────────────────────────────

test('Credits.get returns 0 initially', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  assert.equal(Credits.get(), 0);
});

test('Credits.add increases balance', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  const result = Credits.add(5, 'test');
  assert.equal(result, 5);
  assert.equal(Credits.get(), 5);
});

test('Credits.add accumulates across calls', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  Credits.add(3, 'a');
  Credits.add(2, 'b');
  assert.equal(Credits.get(), 5);
});

test('Credits.add does not go below 0 for negative input', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  Credits.add(-100, 'test');
  assert.equal(Credits.get(), 0);
});

// ─── spend / canSpend ────────────────────────────────────────────────────────

test('Credits.spend returns false when balance is insufficient', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  assert.equal(Credits.spend(1), false);
});

test('Credits.spend returns true and deducts balance when sufficient', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  Credits.add(10, 'setup');
  assert.equal(Credits.spend(3), true);
  assert.equal(Credits.get(), 7);
});

test('Credits.canSpend returns false when balance is 0', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  assert.equal(Credits.canSpend(1), false);
});

test('Credits.canSpend returns true when balance is sufficient', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  Credits.add(5, 'setup');
  assert.equal(Credits.canSpend(5), true);
  assert.equal(Credits.canSpend(6), false);
});

// ─── awardToolCredit ─────────────────────────────────────────────────────────

test('awardToolCredit adds 1 credit first time', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  const result = Credits.awardToolCredit('rarerank');
  assert.equal(result, true);
  assert.equal(Credits.get(), 1);
});

test('awardToolCredit returns false on second call for same tool', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  Credits.awardToolCredit('rarerank');
  const second = Credits.awardToolCredit('rarerank');
  assert.equal(second, false);
  assert.equal(Credits.get(), 1);
});

test('awardToolCredit is independent per tool', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  Credits.awardToolCredit('tool-a');
  Credits.awardToolCredit('tool-b');
  assert.equal(Credits.get(), 2);
});

// ─── awardSponsor ────────────────────────────────────────────────────────────

test('awardSponsor returns true and adds 2 credits first time', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  const result = Credits.awardSponsor('sponsor-xyz');
  assert.equal(result, true);
  assert.equal(Credits.get(), 2);
});

test('awardSponsor returns false within 24h cooldown', () => {
  const now = Date.now();
  const ctx = makeContext({
    'eon:sponsor:sponsor-xyz:ts': String(now - 3600000) // 1h ago
  });
  const Credits = loadCredits(ctx);
  assert.equal(Credits.awardSponsor('sponsor-xyz'), false);
});

test('awardSponsor re-awards after 24h window', () => {
  const twentyFiveHoursAgo = Date.now() - 90000000;
  const ctx = makeContext({
    'eon:sponsor:sponsor-xyz:ts': String(twentyFiveHoursAgo)
  });
  const Credits = loadCredits(ctx);
  assert.equal(Credits.awardSponsor('sponsor-xyz'), true);
});

// ─── checkDailyBonus ─────────────────────────────────────────────────────────

test('checkDailyBonus: fresh store → no credit awarded on very first visit', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  // init() already called checkDailyBonus once; last was null → no credit
  assert.equal(Credits.get(), 0);
});

test('checkDailyBonus: calling again same day does not add more credits', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  const before = Credits.get();
  Credits.checkDailyBonus();
  assert.equal(Credits.get(), before);
});

test('checkDailyBonus: previous visit from a different day awards 0.5 credit', () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const ctx = makeContext({ 'eon:last-visit': yesterday });
  const Credits = loadCredits(ctx);
  // init called checkDailyBonus: last=yesterday (truthy, != today) → adds 0.5
  assert.equal(Credits.get(), 0.5);
});

// ─── logReferral ─────────────────────────────────────────────────────────────

test('logReferral: first call returns true and adds 1 credit', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  const before = Credits.get();
  const result = Credits.logReferral('alice');
  assert.equal(result, true);
  assert.equal(Credits.get(), before + 1);
});

test('logReferral: second call with same name returns false and does not add credit', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  Credits.logReferral('alice');
  const afterFirst = Credits.get();
  const result = Credits.logReferral('alice');
  assert.equal(result, false);
  assert.equal(Credits.get(), afterFirst);
});

test('logReferral: different referral names are tracked independently', () => {
  const ctx = makeContext();
  const Credits = loadCredits(ctx);
  const before = Credits.get();
  Credits.logReferral('alice');
  Credits.logReferral('bob');
  assert.equal(Credits.get(), before + 2);
});
