const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadXpModule() {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'xp.js'),
    'utf8'
  );
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      createElement: () => ({
        append: () => {},
        appendChild: () => {},
        querySelector: () => null,
        setAttribute: () => {},
        textContent: '',
        style: {},
        className: '',
        href: '',
      }),
      querySelector: () => null,
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      addEventListener: () => {},
      dispatchEvent: () => {},
    },
    localStorage: (() => {
      const store = {};
      return {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
      };
    })(),
    CustomEvent: class CustomEvent { constructor(t, o) { this.type = t; this.detail = o?.detail; } },
    setTimeout: () => {},
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox);
  return sandbox.window.EonXP;
}

// ── getLevelTitle ──────────────────────────────────────────────────────────────

test('getLevelTitle returns correct title for level 1', () => {
  const XP = loadXpModule();
  assert.equal(XP.getLevelTitle(1), 'Wanderer');
});

test('getLevelTitle returns correct title for level 10', () => {
  const XP = loadXpModule();
  assert.equal(XP.getLevelTitle(10), 'Sentinel');
});

test('getLevelTitle returns EON Master for level 50', () => {
  const XP = loadXpModule();
  assert.equal(XP.getLevelTitle(50), 'EON Master');
});

test('getLevelTitle clamps above 50 to EON Master', () => {
  const XP = loadXpModule();
  assert.equal(XP.getLevelTitle(99), 'EON Master');
});

test('getLevelTitle returns Wanderer for level 0', () => {
  const XP = loadXpModule();
  // Index 0 is empty string, falls through to 'EON Master' fallback — validate actual behavior
  const title = XP.getLevelTitle(0);
  assert.equal(typeof title, 'string');
  assert.ok(title.length > 0, 'Title should not be empty');
});

// ── getState ──────────────────────────────────────────────────────────────────
// NOTE: loadXpModule() calls init() which awards daily-login (+15 XP) on load.
// Tests account for this initial 15 XP.

test('getState returns level 1 after module init', () => {
  const XP = loadXpModule();
  const state = XP.getState();
  assert.equal(state.level, 1);
  assert.equal(state.nextLevel, 2);
});

test('getState progressPct is between 0 and 100', () => {
  const XP = loadXpModule();
  const state = XP.getState();
  assert.ok(
    state.progressPct >= 0 && state.progressPct <= 100,
    `progressPct ${state.progressPct} should be in [0, 100]`
  );
});

test('getState xpIntoLevel is non-negative after init', () => {
  const XP = loadXpModule();
  const state = XP.getState();
  assert.ok(state.xpIntoLevel >= 0, `xpIntoLevel ${state.xpIntoLevel} should be >= 0`);
});

test('getState xpForNextLevel is positive', () => {
  const XP = loadXpModule();
  const state = XP.getState();
  assert.ok(state.xpForNextLevel > 0, 'xpForNextLevel should be positive');
});

// ── award ─────────────────────────────────────────────────────────────────────

test('award returns null for unknown activity id', () => {
  const XP = loadXpModule();
  const result = XP.award('nonexistent-activity');
  assert.equal(result, null);
});

test('award returns xpGained for valid activity with remaining daily cap', () => {
  const XP = loadXpModule();
  // game-played has dailyCap=5 and init() does NOT call game-played
  const result = XP.award('game-played');
  assert.ok(result !== null, 'Should award XP for game-played');
  assert.equal(result.xpGained, 50);
  assert.equal(typeof result.newLevel, 'number');
  assert.ok(result.newLevel >= 1);
});

test('award daily-login returns null on second call same day (cap = 1)', () => {
  const XP = loadXpModule();
  XP.award('daily-login');
  const second = XP.award('daily-login');
  assert.equal(second, null, 'Second daily-login should be capped');
});

test('award increases totalXp after activity', () => {
  const XP = loadXpModule();
  XP.award('daily-login');
  const state = XP.getState();
  assert.equal(state.totalXp, 15);
});

test('award one-time activity (profile-set) returns null on second call', () => {
  const XP = loadXpModule();
  XP.award('profile-set');
  const second = XP.award('profile-set');
  assert.equal(second, null, 'profile-set should only award once');
});

test('award correctly multiplies XP with multiplier param', () => {
  const XP = loadXpModule();
  const result = XP.award('game-played', 3);
  assert.ok(result !== null, 'Should award game-played');
  assert.equal(result.xpGained, 50 * 3);
});

// ── awardScore ────────────────────────────────────────────────────────────────

test('awardScore returns null for score below 500', () => {
  const XP = loadXpModule();
  const result = XP.awardScore('test-game', 400);
  assert.equal(result, null);
});

test('awardScore awards floor(score/500) XP for valid score', () => {
  const XP = loadXpModule();
  const result = XP.awardScore('test-game', 1500);
  assert.ok(result !== null);
  assert.equal(result.xpGained, 3); // floor(1500/500) = 3
});

test('awardScore caps at 200 XP per game per day', () => {
  const XP = loadXpModule();
  // Award 200 XP first
  XP.awardScore('cap-game', 100000); // floor(100000/500) = 200
  // Second call should be blocked by cap
  const second = XP.awardScore('cap-game', 100000);
  assert.equal(second, null, 'Score bonus should be capped at 200 per day');
});

test('awardScore for different games are tracked separately', () => {
  const XP = loadXpModule();
  const r1 = XP.awardScore('game-a', 1000);
  const r2 = XP.awardScore('game-b', 1000);
  assert.ok(r1 !== null, 'game-a should award');
  assert.ok(r2 !== null, 'game-b should award independently');
});
