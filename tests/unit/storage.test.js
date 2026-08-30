'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

// Build a minimal localStorage mock + DOM stubs so the storage IIFE can run.
function makeContext(initialStore = {}) {
  const store = { ...initialStore };
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store
  };
  const document = { documentElement: { setAttribute() {}, getAttribute() { return 'dark'; } } };
  const window = { matchMedia: () => ({ matches: false }) };
  return vm.createContext({ localStorage, document, window, store });
}

// Convert the ESM storage.js into a CJS-compatible chunk by stripping export keywords
// and wrapping in a function, then extracting the symbols we need.
function loadStorage(ctx) {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'storage.js'),
    'utf8'
  );
  // Remove ES module export keywords to make it runnable in vm.
  const compat = source
    .replace(/^export function /gm, 'function ')
    .replace(/^export const /gm, 'const ')
    .replace(/^export \{ initTheme as applyTheme, initTheme as initThemeToggle \};?$/gm, '');
  vm.runInContext(compat, ctx);
  return {
    getStreak: ctx.getStreak,
    getBadges: ctx.getBadges,
    awardBadge: ctx.awardBadge,
    getToolRuns: ctx.getToolRuns,
    saveScore: ctx.saveScore
  };
}

// ─── getStreak ──────────────────────────────────────────────────────────────

test('getStreak starts at 1 on first call', () => {
  const ctx = makeContext();
  const { getStreak } = loadStorage(ctx);
  const result = getStreak('test-tool');
  assert.equal(result.count, 1);
  assert.equal(result.lastDate, new Date().toDateString());
});

test('getStreak returns same count when called twice on same day', () => {
  const ctx = makeContext();
  const { getStreak } = loadStorage(ctx);
  getStreak('daily');
  const second = getStreak('daily');
  assert.equal(second.count, 1);
});

test('getStreak increments count when called the next day', () => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const ctx = makeContext({
    'eon:streak:daily': JSON.stringify({ count: 3, lastDate: yesterday })
  });
  const { getStreak } = loadStorage(ctx);
  const result = getStreak('daily');
  assert.equal(result.count, 4);
  assert.equal(result.lastDate, today);
});

test('getStreak resets to 1 when gap is more than one day', () => {
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toDateString();
  const ctx = makeContext({
    'eon:streak:daily': JSON.stringify({ count: 10, lastDate: twoDaysAgo })
  });
  const { getStreak } = loadStorage(ctx);
  const result = getStreak('daily');
  assert.equal(result.count, 1);
});

test('getStreak isolates different keys', () => {
  const ctx = makeContext();
  const { getStreak } = loadStorage(ctx);
  getStreak('tool-a');
  const b = getStreak('tool-b');
  assert.equal(b.count, 1);
});

// ─── getBadges / awardBadge ─────────────────────────────────────────────────

test('getBadges returns empty array when no badges stored', () => {
  const ctx = makeContext();
  const { getBadges } = loadStorage(ctx);
  assert.equal(getBadges().length, 0);
});

test('awardBadge adds badge and returns true', () => {
  const ctx = makeContext();
  const { awardBadge, getBadges } = loadStorage(ctx);
  const result = awardBadge('first-blood');
  assert.equal(result, true);
  assert.ok(getBadges().includes('first-blood'));
});

test('awardBadge returns false when badge already present', () => {
  const ctx = makeContext({
    'eon:badges': JSON.stringify(['first-blood'])
  });
  const { awardBadge } = loadStorage(ctx);
  assert.equal(awardBadge('first-blood'), false);
});

test('getBadges ignores non-string entries', () => {
  const ctx = makeContext({
    'eon:badges': JSON.stringify(['ok', 42, null, 'fine'])
  });
  const { getBadges } = loadStorage(ctx);
  const result = getBadges();
  assert.equal(result.length, 2);
  assert.equal(result[0], 'ok');
  assert.equal(result[1], 'fine');
});

test('getBadges caps at 128 entries', () => {
  const many = Array.from({ length: 200 }, (_, i) => `badge-${i}`);
  const ctx = makeContext({ 'eon:badges': JSON.stringify(many) });
  const { getBadges } = loadStorage(ctx);
  assert.equal(getBadges().length, 128);
});

// ─── getToolRuns ─────────────────────────────────────────────────────────────

test('getToolRuns returns 0 for unknown tool', () => {
  const ctx = makeContext();
  const { getToolRuns } = loadStorage(ctx);
  assert.equal(getToolRuns('no-such-tool'), 0);
});

test('getToolRuns returns stored count', () => {
  const ctx = makeContext({ 'eon:runs:rarerank': '7' });
  const { getToolRuns } = loadStorage(ctx);
  assert.equal(getToolRuns('rarerank'), 7);
});

// ─── saveScore ───────────────────────────────────────────────────────────────

test('saveScore stores score when no prior best', () => {
  const ctx = makeContext();
  const { saveScore, getToolRuns: _unused } = loadStorage(ctx);
  const saved = saveScore('neon-dash', 1000);
  assert.equal(saved, true);
  assert.equal(ctx.store['eon:score:neon-dash'], '1000');
});

test('saveScore returns true and updates when new score beats best', () => {
  const ctx = makeContext({ 'eon:score:neon-dash': '500' });
  const { saveScore } = loadStorage(ctx);
  assert.equal(saveScore('neon-dash', 600), true);
  assert.equal(ctx.store['eon:score:neon-dash'], '600');
});

test('saveScore returns false when new score does not beat best', () => {
  const ctx = makeContext({ 'eon:score:neon-dash': '500' });
  const { saveScore } = loadStorage(ctx);
  assert.equal(saveScore('neon-dash', 400), false);
  assert.equal(ctx.store['eon:score:neon-dash'], '500');
});

test('saveScore isolates different games', () => {
  const ctx = makeContext();
  const { saveScore } = loadStorage(ctx);
  saveScore('game-a', 100);
  saveScore('game-b', 200);
  assert.equal(ctx.store['eon:score:game-a'], '100');
  assert.equal(ctx.store['eon:score:game-b'], '200');
});
